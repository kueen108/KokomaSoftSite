// @MX:ANCHOR: [AUTO] The walk-cycle rule module — how far a unit has walked and
// how far off the lane that puts it this frame.
// @MX:REASON: `src/fx/UnitMotion.ts` calls both exported functions once per
// managed unit per frame (paladog, allies, enemies, boss), so fan-in is every
// moving entity in the battle. It is engine-independent by contract (C-4):
// nothing here may import Phaser or touch a browser global, which is what keeps
// the walk cycle testable without a browser.

/**
 * How far a unit travels for one complete rise-and-fall (REQ-009).
 *
 * `plan.md` D-7 is explicit that this number is an estimate, not a measurement:
 * 28 px is 0.6x the shortest ally sprite (46 px), which puts an enemy at
 * 60 px/s on 2.1 steps a second and the Paladog at 200 px/s on 7.1. Whether 7.1
 * reads as walking or as scurrying is a §E observation for M4, and this is the
 * single tuning point that answers it — no per-unit table, no height-derived
 * formula, so the answer is one number rather than a decision about which
 * number to change.
 */
export const WALK_STRIDE_PX = 28;

/**
 * How far off the lane the rise-and-fall carries a unit (REQ-009's 3 px cap).
 *
 * Unlike the stride this one is calculated. The thinnest vertical overlap pair
 * in the game is a projectile (16 px body) against an enemy (48 px), leaving
 * 16 px of slack on each side; 2 px is an eighth of that. The calculation is
 * why the amplitude is safe on paper — AC-010 is what decides whether it is
 * safe in fact, by measuring where contact actually starts.
 */
export const WALK_AMPLITUDE_PX = 2;

/** One turn, in radians. */
const TAU = Math.PI * 2;

/**
 * A unit's place in its walk cycle: how far it has travelled in total, and
 * whether it moved on the frame that produced this phase.
 *
 * `moving` is carried alongside the distance rather than derived from it
 * because REQ-009 asks for two different things — the phase must survive a
 * stop (so the unit resumes its step rather than restarting it) while the
 * drawn offset must be exactly zero during that stop.
 */
export interface WalkPhase {
  /** Total distance travelled, always non-negative. */
  readonly distance: number;
  /** True when the frame that produced this phase moved the unit. */
  readonly moving: boolean;
}

/** The phase a unit that has never moved is in. */
export function restingWalk(): WalkPhase {
  return { distance: 0, moving: false };
}

// @MX:NOTE: [AUTO] The accumulation is an absolute sum, and that is a game rule
// rather than a convenience (REQ-008, AC-007 ④). Walking left is walking. A
// signed sum would let a unit that paced right and then left arrive back at
// phase zero, so its bob would fade out mid-walk — with no error, and only for
// units that happened to reverse.
// @MX:NOTE: [AUTO] This `moving` and `isWalking` are two different judgements
// of the same word, and only one of them is live. `UnitMotion` computes its own
// `moving` (it has the velocity, which this function does not) and overwrites
// this field, so the value set here reaches nothing in production — it is read
// only by this module's own tests. Left exact rather than thresholded on
// purpose: unifying them would be a change nothing currently exercises, which
// is the worst kind to make. If a caller ever starts trusting this field,
// that is the moment to fold it into `isWalking`.
/** The phase one frame later, given how far the unit's x moved (REQ-008). */
export function advanceWalk(phase: WalkPhase, dx: number): WalkPhase {
  return {
    distance: phase.distance + Math.abs(dx),
    moving: dx !== 0,
  };
}

// @MX:ANCHOR: [AUTO] The waveform itself: travelled distance in, vertical
// offset out.
// @MX:REASON: This is the one function REQ-008's "distance, not time" is a
// claim about, and AC-007 ⑤ reads its arity to check that claim structurally —
// one argument, and it is a distance, so there is no clock to depend on. Adding
// a parameter here breaks that criterion by construction, which is the point.
/**
 * How far above the lane the walk cycle puts a unit that has travelled
 * `distance` (REQ-008, REQ-009).
 *
 * Negative is up, matching the canvas y axis, so a unit rises on the first half
 * of the stride. The waveform is a sine only because it reads smoothly; nothing
 * in the SPEC or the criteria fixes it, and a triangle would pass the same
 * tests.
 */
export function walkOffsetY(distance: number): number {
  const raw = -WALK_AMPLITUDE_PX * Math.sin(TAU * (distance / WALK_STRIDE_PX));

  // `-0` is not `0` under Object.is, and the difference reaches the physics
  // body: REQ-009 asks for the resting unit to be on the lane exactly, and a
  // criterion that compares strictly would fail on a negative zero that no one
  // can see. Normalise it here rather than at every call site.
  return raw === 0 ? 0 : raw;
}

// @MX:NOTE: [AUTO] Walking is displacement OR the intent to displace, and both
// clauses are load-bearing because the game moves things two ways. The Paladog
// is driven by `this.x += …` and its body velocity is permanently zero, so a
// velocity-only rule would leave it sliding. Units are driven by the physics
// engine instead, and a world with paused physics leaves them a velocity they
// are not currently acting on — a displacement-only rule would call them still
// and snap them to the lane, discarding a stride they have not finished.
//
// This lives here rather than beside the Phaser code that reads the velocity
// because it is a rule, and rules in this project are measured
// (`vitest.config.ts` scopes coverage to `src/systems/**`). Where it sat
// before, nothing would have caught someone turning the `||` into an `&&`.
/**
 * The smallest displacement that counts as a step.
 *
 * A unit's walk displacement is not read directly — `UnitMotion` derives it by
 * subtracting the attack lunge's contribution from the frame's total x change.
 * That subtraction is exact in algebra and not in binary, so a unit standing
 * perfectly still after an attack reports one or two ulps of movement. Read as
 * a step, it holds the unit at whatever offset its phase had reached: a stopped
 * enemy was measured floating 1.5637 px off the lane, five times the 0.3 px
 * REQ-009's footnote names, and carrying it into the next overlap test.
 *
 * The two quantities being separated are about fourteen orders of magnitude
 * apart — residue around 6e-15 against a slowest real step of 0.583 px (brute
 * at 35 px/s) — so the threshold is not a close call. 1e-9 sits roughly four
 * orders above the residue and six below the smallest step a pathological
 * frame could produce, which leaves it insensitive to both the exact residue
 * and the frame rate.
 */
const WALK_EPSILON_PX = 1e-9;

/**
 * Whether a unit counts as walking this frame, given how far it moved and what
 * velocity it carries (REQ-008, REQ-009).
 *
 * AC-008 ② and AC-009 each hold one clause: the first pauses physics and
 * requires the walk offset to survive ten idle frames, the second requires a
 * genuinely stopped unit to sit on the lane exactly.
 *
 * The threshold applies to displacement only. Velocity is assigned outright by
 * the physics engine rather than accumulated, so it is exactly zero or a value
 * someone set — there is no residue for a threshold to filter, and adding one
 * would guard against something that cannot arise on that side. The asymmetry
 * is deliberate.
 */
export function isWalking(dx: number, velocityX: number): boolean {
  return Math.abs(dx) > WALK_EPSILON_PX || velocityX !== 0;
}

/**
 * The offset to draw a unit at, given its phase.
 *
 * A stopped unit is put back on the lane exactly, whatever its accumulated
 * phase (REQ-009). That "exactly" is not fussiness: a unit left 0.3 px above
 * the lane looks identical but carries those 0.3 px in its physics body into
 * the next overlap test.
 */
export function walkOffsetOf(phase: WalkPhase): number {
  return phase.moving ? walkOffsetY(phase.distance) : 0;
}
