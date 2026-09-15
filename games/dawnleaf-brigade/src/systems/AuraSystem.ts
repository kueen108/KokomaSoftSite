// @MX:ANCHOR: [AUTO] The aura rule module — membership judgement and the
// buffed stats every ally unit fights with.
// @MX:REASON: The design axis this SPEC exists to introduce, and the highest
// fan-in module it adds: BattleScene calls it every frame for every ally unit,
// and it is the only place the "inside the radius" question is answered. It is
// engine-independent by contract (REQ-007, REQ-023) so the radius judgement
// stays testable without a browser — nothing in this file may import the
// rendering engine or touch a browser global (verified by AC-010).
import type { AuraBuff, UnitStats } from '../types/unit';

// @MX:NOTE: [AUTO] Distance is one-dimensional, and that is a property of the
// game rather than a shortcut: every entity sits on the single lane at
// LANE_Y, so the y term of a Euclidean distance is always zero. Computing it
// would add a square root that never changes the answer and force every test
// to pass a meaningless y. If lanes ever become plural — nothing on the
// roadmap says they will — this is the line that has to change first.
//
// The comparison is `<=`, not `<`. A unit drawn touching the circle reads as
// inside to the player, and a judgement that disagrees with the drawing is
// experienced as a bug rather than as a rule (design.md §2.2). Note that this
// is deliberately unlike SpawnSystem's half-open [prev, now) window: that one
// decides whether an *event* fires exactly once, while this one answers a
// *state* query recomputed from scratch every frame, so there is no double
// count to guard against.
/** True while `unitX` lies within `radius` of the Paladog (REQ-007). */
export function isWithinAura(paladogX: number, unitX: number, radius: number): boolean {
  return radius > 0 && Math.abs(paladogX - unitX) <= radius;
}

/** Membership for a whole lane of units, in the order they were given. */
export function auraMembership(
  paladogX: number,
  unitXs: readonly number[],
  radius: number,
): boolean[] {
  return unitXs.map((unitX) => isWithinAura(paladogX, unitX, radius));
}

// @MX:NOTE: [AUTO] This takes stats that are ALREADY upgrade-adjusted and
// applies the aura on top — upgrade first, aura second (design.md §2.4). The
// order is a game rule, not an implementation convenience: upgrades are fixed
// for a whole battle while aura membership flips as the Paladog walks, so
// applying the fixed layer once at battle start and the moving layer per frame
// is what REQ-008 and REQ-019 need to hold together. Reversing it would mean
// "the aura amplifies upgrades" instead of "upgrades amplify the aura" — a
// different rule that also changes the numbers, quietly, at the rounding step.
//
// Allies and enemies both derive effective stats from their immutable baseline.
// Incoming damage modifiers are applied separately, without changing health ceilings.
/** The stats a unit fights with this frame, given its membership (REQ-008). */
export function effectiveStats(base: UnitStats, buff: AuraBuff, inside: boolean): UnitStats {
  if (!inside) {
    return base;
  }

  return {
    ...base,
    attackDamage: Math.round(base.attackDamage * buff.attackDamageMultiplier),
    speed: Math.round(base.speed * buff.speedMultiplier),
  };
}

/** Overlapping friendly auras take each strongest benefit, never multiply or weaken it. */
export function strongestAuraBuff(first: AuraBuff, second: AuraBuff): AuraBuff {
  return {
    attackDamageMultiplier: Math.max(first.attackDamageMultiplier, second.attackDamageMultiplier),
    speedMultiplier: Math.max(first.speedMultiplier, second.speedMultiplier),
  };
}

// --- SPEC-UNIT-ROSTER-001 ---
// @MX:NOTE: [AUTO] Appended rather than interleaved with the Phase-2 exports
// above: `isWithinAura` and `effectiveStats` keep their exact signatures and
// behaviour (REQ-014, C-10) — nothing above this line changes.

/**
 * One aura source: a lane position paired with its own radius
 * (SPEC-UNIT-ROSTER-001 REQ-014). The Paladog is not expressed as one of
 * these — its membership test is `isWithinAura` above, unchanged — this shape
 * exists for the *additional* sources (a bannerman, an overseer) design.md §4
 * introduces.
 */
export interface AuraSource {
  readonly x: number;
  readonly radius: number;
}

// @MX:NOTE: [AUTO] Membership only, not composition (design.md §4). Two
// overlapping sources do not stack or multiply — this answers "does at least
// one source cover this unit", and it is the caller's job to decide which
// source's buff numbers apply when more than one does (BattleScene picks the
// more favourable multiplier; see design.md §4 for why that is safe with
// today's numbers).
/** True while `unitX` lies within the radius of at least one source. */
export function isWithinAnyAura(sources: readonly AuraSource[], unitX: number): boolean {
  return sources.some((source) => isWithinAura(source.x, unitX, source.radius));
}
