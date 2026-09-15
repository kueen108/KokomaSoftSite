import { describe, expect, it } from 'vitest';

import {
  WALK_AMPLITUDE_PX,
  WALK_STRIDE_PX,
  advanceWalk,
  isWalking,
  restingWalk,
  walkOffsetOf,
  walkOffsetY,
} from '../../src/systems/MotionSystem';

describe('walkOffsetY', () => {
  // AC-007 ① — the phase starts flat, so a unit that has never moved sits on
  // the lane rather than a fraction of a pixel above it.
  it('is exactly zero at distance zero', () => {
    expect(walkOffsetY(0)).toBe(0);
  });

  // AC-007 ① — `toBe` compares with Object.is, so a negative zero would fail
  // here. Stating it separately records that the normalisation is deliberate.
  it('returns a positive zero rather than a negative zero at distance zero', () => {
    expect(Object.is(walkOffsetY(0), 0)).toBe(true);
  });

  // AC-007 ② — REQ-009's 3 px ceiling, measured across a whole stride at the
  // 1 px resolution the criterion names.
  it('stays within the amplitude across a full stride', () => {
    for (let d = 0; d <= WALK_STRIDE_PX; d += 1) {
      expect(Math.abs(walkOffsetY(d))).toBeLessThanOrEqual(WALK_AMPLITUDE_PX);
    }
  });

  it('keeps the amplitude at or under the 3 px ceiling REQ-009 sets', () => {
    expect(WALK_AMPLITUDE_PX).toBeLessThanOrEqual(3);
  });

  // AC-007 ③ — one stride is one full step, whatever the waveform. The
  // criterion deliberately does not fix sine, triangle or sawtooth.
  it('repeats one stride later, at several arbitrary distances', () => {
    for (const d of [0, 3.5, 11, 19.25, 27, 64, 133.75]) {
      expect(walkOffsetY(d + WALK_STRIDE_PX)).toBeCloseTo(walkOffsetY(d), 10);
    }
  });

  it('actually leaves the lane somewhere inside the stride', () => {
    const seen: number[] = [];
    for (let d = 0; d <= WALK_STRIDE_PX; d += 1) {
      seen.push(Math.abs(walkOffsetY(d)));
    }
    expect(Math.max(...seen)).toBeGreaterThan(0);
  });

  // AC-007 ⑤ — REQ-008's "distance, not time" as a claim about the shape of
  // the function rather than about a value. One argument, and it is a
  // distance: there is no clock to depend on.
  it('takes exactly one argument, so it cannot depend on a clock', () => {
    expect(walkOffsetY.length).toBe(1);
  });
});

describe('advanceWalk', () => {
  // AC-007 ④ — walking left is walking. A signed sum would return a unit that
  // paced back and forth to phase zero and stop its bob mid-walk.
  it('accumulates the same distance for a leftward step as a rightward one', () => {
    const right = advanceWalk(restingWalk(), 7);
    const left = advanceWalk(restingWalk(), -7);
    expect(right.distance).toBe(left.distance);
    expect(right.distance).toBe(7);
  });

  it('accumulates across steps regardless of direction', () => {
    let phase = restingWalk();
    for (const dx of [5, -3, 4, -8]) {
      phase = advanceWalk(phase, dx);
    }
    expect(phase.distance).toBe(20);
  });

  it('marks a moving unit as moving and a still one as still', () => {
    expect(advanceWalk(restingWalk(), 4).moving).toBe(true);
    expect(advanceWalk(restingWalk(), -4).moving).toBe(true);
    expect(advanceWalk(restingWalk(), 0).moving).toBe(false);
  });

  it('keeps the accumulated distance when a unit stops', () => {
    const walking = advanceWalk(restingWalk(), 9);
    const stopped = advanceWalk(walking, 0);
    expect(stopped.distance).toBe(9);
  });

  it('does not mutate the phase it is given', () => {
    const before = restingWalk();
    advanceWalk(before, 11);
    expect(before.distance).toBe(0);
    expect(before.moving).toBe(false);
  });

  it('starts a resting phase at distance zero and not moving', () => {
    expect(restingWalk()).toEqual({ distance: 0, moving: false });
  });
});

describe('walkOffsetOf', () => {
  // REQ-009's "exactly" — a unit stopped mid-stride is put back on the lane,
  // not left 0.3 px above it where the body carries it into the next overlap.
  it('is exactly zero for a unit that has stopped mid-stride', () => {
    const stopped = advanceWalk(advanceWalk(restingWalk(), WALK_STRIDE_PX / 4), 0);
    expect(stopped.distance).toBeGreaterThan(0);
    expect(walkOffsetOf(stopped)).toBe(0);
  });

  it('is exactly zero for a unit that has never moved', () => {
    expect(walkOffsetOf(restingWalk())).toBe(0);
  });

  it('follows the waveform while the unit is moving', () => {
    const walking = advanceWalk(restingWalk(), WALK_STRIDE_PX / 4);
    expect(walkOffsetOf(walking)).toBe(walkOffsetY(WALK_STRIDE_PX / 4));
    expect(Math.abs(walkOffsetOf(walking))).toBeGreaterThan(0);
  });

  // REQ-008 again, from the caller's side: ten frames of standing still leave
  // the phase where it was, so nothing advances without travel.
  it('does not advance while a stopped unit is ticked repeatedly', () => {
    let phase = advanceWalk(restingWalk(), 13);
    const walkingOffset = walkOffsetOf(phase);
    for (let i = 0; i < 10; i += 1) {
      phase = advanceWalk(phase, 0);
    }
    expect(phase.distance).toBe(13);
    expect(walkOffsetOf(phase)).toBe(0);
    expect(walkOffsetOf(advanceWalk(phase, 0.0))).toBe(0);
    expect(walkingOffset).not.toBe(0);
  });
});

describe('isWalking', () => {
  // The game moves things two ways, and each way is held by a different
  // acceptance criterion. Both clauses of the disjunction are load-bearing:
  // drop either one and a named criterion fails. That is why these four cases
  // are pinned here rather than left to a browser run.

  // AC-008 ② — physics paused, ten idle frames, `y2 === y1`. The unit has not
  // displaced this frame but is still under orders to; calling it still would
  // snap it to the lane and discard a stride it has not finished.
  it('counts a unit with velocity but no displacement as walking', () => {
    expect(isWalking(0, -60)).toBe(true);
  });

  // AC-009 — a unit stopped at the ally base sits on the lane exactly. Both
  // signals are zero here, and this is the only case that may be false.
  it('counts a unit with neither displacement nor velocity as still', () => {
    expect(isWalking(0, 0)).toBe(false);
  });

  // The Paladog. `Paladog.move` drives it with `this.x += …`, so its body
  // velocity is permanently zero — a velocity-only test would leave the most
  // watched unit in the game sliding forever (REQ-008).
  it('counts a unit displaced without velocity as walking', () => {
    expect(isWalking(3.33, 0)).toBe(true);
  });

  // The ordinary case: an enemy under `setVelocityX`, actually advancing.
  it('counts a unit both displaced and driven as walking', () => {
    expect(isWalking(-1, -60)).toBe(true);
  });

  it('does not care which way either signal points', () => {
    expect(isWalking(-0.5, 0)).toBe(true);
    expect(isWalking(0, 35)).toBe(true);
  });

  // AC-009 — the defect this threshold exists for, reproduced with the values
  // observed in the browser. `UnitMotion` derives the walk displacement by
  // subtracting the lunge's contribution from the frame's total x change; that
  // subtraction is algebraically exact and bitwise is not, so a unit standing
  // perfectly still after an attack reports a displacement of one or two ulps.
  // Read as movement, it left a stopped enemy floating 1.5637 px off the lane —
  // five times the 0.3 px REQ-009's footnote names as the harm, and it stays in
  // the physics body for the next overlap test.
  it('does not count floating-point residue from a lunge as walking', () => {
    expect(isWalking(5.995204332975845e-15, 0)).toBe(false);
    expect(isWalking(Number.EPSILON, 0)).toBe(false);
    expect(isWalking(-2.220446049250313e-16, 0)).toBe(false);
  });

  // The other side of the threshold: it must not swallow a real step. The
  // slowest enemy (brute, 35 px/s) advances 0.583 px per frame and the Paladog
  // 3.33 px; even a 1 ms frame of the Paladog is 0.2 px. The residue is ~6e-15,
  // so the two are about fourteen orders of magnitude apart and the threshold
  // has room to sit anywhere between.
  it('still counts the smallest real step as walking', () => {
    expect(isWalking(0.583, 0)).toBe(true);
    expect(isWalking(-0.2, 0)).toBe(true);
    expect(isWalking(1e-6, 0)).toBe(true);
  });

  it('places the threshold well above the residue and well below a real step', () => {
    expect(isWalking(1e-9, 0)).toBe(false);
    expect(isWalking(1e-8, 0)).toBe(true);
  });

  // Deliberate asymmetry, not an oversight. Velocity is assigned outright by
  // the physics engine rather than accumulated, so it is exactly zero or a set
  // value — there is no residue for a threshold to filter, and adding one would
  // be guarding against something that cannot happen here.
  it('applies no threshold to velocity, which is assigned rather than accumulated', () => {
    expect(isWalking(0, Number.EPSILON)).toBe(true);
  });

  it('takes exactly the two signals and nothing else', () => {
    expect(isWalking.length).toBe(2);
  });
});
