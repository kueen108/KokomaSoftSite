import { describe, expect, it } from 'vitest';

import {
  auraMembership,
  effectiveStats,
  isWithinAura,
  strongestAuraBuff,
} from '../../src/systems/AuraSystem';
import type { AuraBuff, UnitStats } from '../../src/types/unit';

const baseStats: UnitStats = {
  maxHp: 40,
  attackDamage: 14,
  attackIntervalMs: 900,
  speed: 75,
};

const buff: AuraBuff = {
  attackDamageMultiplier: 1.5,
  speedMultiplier: 1.2,
};

describe('isWithinAura', () => {
  it('never weakens a banner when a low-level hero aura overlaps it', () => {
    expect(
      strongestAuraBuff(
        { attackDamageMultiplier: 1.1, speedMultiplier: 1.04 },
        { attackDamageMultiplier: 1.3, speedMultiplier: 1.15 },
      ),
    ).toEqual({ attackDamageMultiplier: 1.3, speedMultiplier: 1.15 });
    expect(
      strongestAuraBuff(
        { attackDamageMultiplier: 1.42, speedMultiplier: 1.2 },
        { attackDamageMultiplier: 1.3, speedMultiplier: 1.15 },
      ),
    ).toEqual({ attackDamageMultiplier: 1.42, speedMultiplier: 1.2 });
  });
  it('has no members when the aura is locked, even at exact overlap', () => {
    expect(isWithinAura(500, 500, 0)).toBe(false);
    expect(auraMembership(500, [499, 500, 501], 0)).toEqual([false, false, false]);
  });
  // AC-009 — a unit closer than the radius belongs to the aura
  it('counts a unit inside the radius as a member', () => {
    expect(isWithinAura(500, 620, 200)).toBe(true);
  });

  // AC-009 — the decisive case. `design.md` §2.3 fixes distance <= radius as
  // inside, because a unit drawn touching the circle reads as inside to the
  // player and a judgement that disagrees with the drawing is felt as a bug.
  it('counts a unit exactly on the radius as a member', () => {
    expect(isWithinAura(500, 700, 200)).toBe(true);
  });

  it('counts a unit exactly on the radius as a member on the left side too', () => {
    expect(isWithinAura(500, 300, 200)).toBe(true);
  });

  // AC-009 — one pixel past the edge is out, so the boundary is a real edge
  it('excludes a unit one pixel beyond the radius', () => {
    expect(isWithinAura(500, 701, 200)).toBe(false);
  });

  // design.md §2.3 — distance is one-dimensional along the single lane, so a
  // unit to the left of the Paladog is judged on the same footing as one to
  // the right rather than on a signed offset.
  it('measures distance without regard to which side the unit is on', () => {
    expect(isWithinAura(500, 350, 200)).toBe(true);
    expect(isWithinAura(500, 250, 200)).toBe(false);
  });

  it('counts a unit standing on the Paladog as a member', () => {
    expect(isWithinAura(500, 500, 200)).toBe(true);
  });
});

describe('auraMembership', () => {
  it('reports membership for each unit position in order', () => {
    expect(auraMembership(500, [520, 700, 701, 250], 200)).toEqual([true, true, false, false]);
  });

  it('returns an empty result when there are no units', () => {
    expect(auraMembership(500, [], 200)).toEqual([]);
  });

  // REQ-023 — pure function, argument is not mutated
  it('does not mutate the position list it was given', () => {
    const positions = [520, 700];

    auraMembership(500, positions, 200);

    expect(positions).toEqual([520, 700]);
  });
});

describe('effectiveStats', () => {
  // AC-011 — a member fights with the buffed numbers
  it('applies the buff to a unit inside the radius', () => {
    expect(effectiveStats(baseStats, buff, true)).toEqual({
      maxHp: 40,
      attackDamage: 21,
      attackIntervalMs: 900,
      speed: 90,
    });
  });

  // AC-011 — a non-member fights with its plain numbers
  it('returns the base stats unchanged for a unit outside the radius', () => {
    expect(effectiveStats(baseStats, buff, false)).toEqual(baseStats);
  });

  // REQ-009 read from the other side: the aura changes offence and movement
  // and nothing else. Scaling maxHp mid-battle would leave current hit points
  // undefined, so it is left alone deliberately (types/unit.ts AuraBuff).
  it('leaves hit points and attack interval untouched when buffing', () => {
    const buffed = effectiveStats(baseStats, buff, true);

    expect(buffed.maxHp).toBe(baseStats.maxHp);
    expect(buffed.attackIntervalMs).toBe(baseStats.attackIntervalMs);
  });

  it('rounds a fractional buffed value to a whole number', () => {
    const odd: UnitStats = { maxHp: 10, attackDamage: 5, attackIntervalMs: 1000, speed: 55 };

    // 5 * 1.5 = 7.5 and 55 * 1.2 = 66 — the damage is the one that must round.
    expect(effectiveStats(odd, buff, true).attackDamage).toBe(8);
  });

  // AC-011 — the caller's stats object survives the call untouched (REQ-023)
  it('does not mutate the stats it was given', () => {
    const original: UnitStats = { ...baseStats };

    effectiveStats(original, buff, true);

    expect(original).toEqual(baseStats);
  });

  // A buff of 1.0 is the identity, so a stage with no aura strength configured
  // cannot silently drift a unit's numbers.
  it('leaves stats unchanged under a neutral buff', () => {
    const neutral: AuraBuff = { attackDamageMultiplier: 1, speedMultiplier: 1 };

    expect(effectiveStats(baseStats, neutral, true)).toEqual(baseStats);
  });
});
