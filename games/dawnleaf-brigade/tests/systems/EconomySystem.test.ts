import { describe, expect, it } from 'vitest';

import {
  applySummon,
  awardBounty,
  canSummon,
  computeSettlement,
  initialBattleEconomy,
  releasePopulationSlot,
  summonCooldownFillFraction,
  tickSummonCooldowns,
} from '../../src/systems/EconomySystem';
import type { BattleEconomy } from '../../src/systems/EconomySystem';
import type { AllyUnitType, UnitDefinition } from '../../src/types/unit';

const tanker: UnitDefinition = {
  type: 'tanker',
  displayName: 'Tanker',
  baseStats: { maxHp: 90, attackDamage: 5, attackIntervalMs: 1200, speed: 55 },
  attackRange: 0,
  damageReductionPercent: 0,
  summonCost: 25,
  summonCooldownMs: 3000,
  unlockCost: 0,
  upgradeBaseCost: 60,
  textureKey: 'tex-ally-tanker',
  tintColor: 0x4f8fd0,
  width: 34,
  height: 46,
};

const unlocked: readonly AllyUnitType[] = ['tanker', 'dealer'];

function economy(overrides: Partial<BattleEconomy> = {}): BattleEconomy {
  return {
    gold: 100,
    cooldownRemainingMs: {
      tanker: 0,
      dealer: 0,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    },
    liveUnitCount: 0,
    populationLimit: 6,
    ...overrides,
  };
}

describe('initialBattleEconomy', () => {
  // AC-014 — a battle always opens on the configured starting amount, never on
  // whatever the previous battle happened to end with (REQ-011 start boundary)
  it('opens on the configured starting gold', () => {
    expect(initialBattleEconomy(50, 6).gold).toBe(50);
  });

  it('opens with no units alive and every cooldown clear', () => {
    const opened = initialBattleEconomy(50, 6);

    expect(opened.liveUnitCount).toBe(0);
    expect(opened.cooldownRemainingMs).toEqual({
      tanker: 0,
      dealer: 0,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    });
  });

  it('returns a fresh object on each call', () => {
    expect(initialBattleEconomy(50, 6)).not.toBe(initialBattleEconomy(50, 6));
  });
});

describe('canSummon', () => {
  // AC-002 — all four gates open
  it('allows a summon when every gate is open', () => {
    expect(canSummon(economy(), tanker, unlocked)).toBe(true);
  });

  it('allows a summon when the gold exactly equals the cost', () => {
    expect(canSummon(economy({ gold: 25 }), tanker, unlocked)).toBe(true);
  });

  // AC-003 — gold short, cooldown running, population full: one gate each
  it('refuses a summon one gold short of the cost', () => {
    expect(canSummon(economy({ gold: 24 }), tanker, unlocked)).toBe(false);
  });

  it('refuses a summon while the cooldown is still running', () => {
    const running = economy({
      cooldownRemainingMs: {
        tanker: 1,
        dealer: 0,
        archer: 0,
        guardian: 0,
        bannerman: 0,
        mage: 0,
        cleric: 0,
        lancer: 0,
      },
    });

    expect(canSummon(running, tanker, unlocked)).toBe(false);
  });

  it('refuses a summon at the population limit', () => {
    expect(canSummon(economy({ liveUnitCount: 6 }), tanker, unlocked)).toBe(false);
  });

  // REQ-001 — the unlock gate, which lives in the save rather than the battle
  it('refuses a summon of a type that is not unlocked', () => {
    expect(canSummon(economy(), tanker, ['dealer'])).toBe(false);
  });

  // Each unit type carries its own cooldown, so summoning one must not lock
  // the other out.
  it('judges each type on its own cooldown', () => {
    const dealerCooling = economy({
      cooldownRemainingMs: {
        tanker: 0,
        dealer: 2000,
        archer: 0,
        guardian: 0,
        bannerman: 0,
        mage: 0,
        cleric: 0,
        lancer: 0,
      },
    });

    expect(canSummon(dealerCooling, tanker, unlocked)).toBe(true);
  });
});

describe('applySummon', () => {
  // AC-002 — cost deducted and cooldown started, in one step
  it('deducts the cost and starts that type at the full cooldown', () => {
    const after = applySummon(economy(), tanker);

    expect(after.gold).toBe(75);
    expect(after.cooldownRemainingMs.tanker).toBe(3000);
  });

  it('counts the summoned unit against the population', () => {
    expect(applySummon(economy(), tanker).liveUnitCount).toBe(1);
  });

  it('leaves the other type cooldown alone', () => {
    expect(applySummon(economy(), tanker).cooldownRemainingMs.dealer).toBe(0);
  });

  // AC-002 / REQ-023 — the caller's state object survives the call
  it('does not mutate the economy it was given', () => {
    const before = economy();

    applySummon(before, tanker);

    expect(before.gold).toBe(100);
    expect(before.cooldownRemainingMs.tanker).toBe(0);
    expect(before.liveUnitCount).toBe(0);
  });
});

describe('tickSummonCooldowns', () => {
  it('counts every cooldown down by the elapsed time', () => {
    const running = economy({
      cooldownRemainingMs: {
        tanker: 3000,
        dealer: 1000,
        archer: 0,
        guardian: 0,
        bannerman: 0,
        mage: 0,
        cleric: 0,
        lancer: 0,
      },
    });

    expect(tickSummonCooldowns(running, 500).cooldownRemainingMs).toEqual({
      tanker: 2500,
      dealer: 500,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    });
  });

  // A cooldown that went negative would let the next summon start from a debt
  // and read as "ready" a frame early.
  it('never counts a cooldown below zero', () => {
    const nearlyDone = economy({
      cooldownRemainingMs: {
        tanker: 100,
        dealer: 0,
        archer: 0,
        guardian: 0,
        bannerman: 0,
        mage: 0,
        cleric: 0,
        lancer: 0,
      },
    });

    expect(tickSummonCooldowns(nearlyDone, 5000).cooldownRemainingMs.tanker).toBe(0);
  });

  it('does not mutate the economy it was given', () => {
    const before = economy({
      cooldownRemainingMs: {
        tanker: 3000,
        dealer: 0,
        archer: 0,
        guardian: 0,
        bannerman: 0,
        mage: 0,
        cleric: 0,
        lancer: 0,
      },
    });

    tickSummonCooldowns(before, 500);

    expect(before.cooldownRemainingMs.tanker).toBe(3000);
  });
});

describe('releasePopulationSlot', () => {
  // REQ-005 — a dead unit hands its slot back. Without this the limit quietly
  // becomes "units ever summoned" rather than "units alive", and the game
  // seizes up a few minutes in with no error to point at.
  it('frees one population slot', () => {
    expect(releasePopulationSlot(economy({ liveUnitCount: 3 })).liveUnitCount).toBe(2);
  });

  it('never drives the live count below zero', () => {
    expect(releasePopulationSlot(economy({ liveUnitCount: 0 })).liveUnitCount).toBe(0);
  });

  it('reopens the summon gate that the population limit had shut', () => {
    const full = economy({ liveUnitCount: 6 });

    expect(canSummon(full, tanker, unlocked)).toBe(false);
    expect(canSummon(releasePopulationSlot(full), tanker, unlocked)).toBe(true);
  });

  it('does not mutate the economy it was given', () => {
    const before = economy({ liveUnitCount: 3 });

    releasePopulationSlot(before);

    expect(before.liveUnitCount).toBe(3);
  });
});

describe('awardBounty', () => {
  // AC-015 — a kill adds the bounty to the battle pool
  it('adds the bounty to the battle gold', () => {
    expect(awardBounty(economy({ gold: 40 }), 15).gold).toBe(55);
  });

  // AC-015 / REQ-023 — the caller's state object survives the call
  it('does not mutate the economy it was given', () => {
    const before = economy({ gold: 40 });

    awardBounty(before, 15);

    expect(before.gold).toBe(40);
  });
});

describe('computeSettlement', () => {
  // AC-020 — the decisive test of REQ-011's end boundary. "The balance is
  // discarded" asserts an absence and cannot be observed directly; showing
  // that the balance does not reach the result proves the same thing and can.
  // Any carry-over, full or partial, separates these two numbers.
  it('returns the same settlement no matter what the battle balance is', () => {
    const spent = economy({ gold: 0 });
    const hoarded = economy({ gold: 5000 });

    expect(computeSettlement(hoarded, 'victory')).toBe(computeSettlement(spent, 'victory'));
    expect(computeSettlement(hoarded, 'defeat')).toBe(computeSettlement(spent, 'defeat'));
  });

  // If hoarding paid, the optimal play would be to summon nothing — a system
  // built to encourage summoning would be discouraging it (design.md §3).
  it('does not pay more for hoarding than for spending', () => {
    expect(computeSettlement(economy({ gold: 5000 }), 'victory')).toBe(
      computeSettlement(economy({ gold: 1 }), 'victory'),
    );
  });

  it('pays more for a victory than for a defeat', () => {
    expect(computeSettlement(economy(), 'victory')).toBeGreaterThan(
      computeSettlement(economy(), 'defeat'),
    );
  });

  // A defeat still has to pay something, or a player who cannot yet win can
  // never accumulate the gold that would let them.
  it('pays something for a defeat', () => {
    expect(computeSettlement(economy(), 'defeat')).toBeGreaterThan(0);
  });

  // An unfinished battle has no settlement to pay out.
  it('pays nothing for a battle that has not ended', () => {
    expect(computeSettlement(economy(), 'ongoing')).toBe(0);
  });
});

// Appended, and every test above is untouched (C-5: tests may be added, and an
// existing test may never be edited into passing).
describe('summonCooldownFillFraction', () => {
  // AC-001's first three. One midpoint would not pin the relationship down —
  // 0.5 at the halfway mark is true of 1 − remaining / total and of several
  // other curves too. Requiring both ends as well fixes three points, and three
  // points admit exactly one linear relationship.
  it('runs from empty at the moment of summoning to full at ready', () => {
    expect(summonCooldownFillFraction(3000, 3000)).toBe(0);
    expect(summonCooldownFillFraction(1500, 3000)).toBe(0.5);
    expect(summonCooldownFillFraction(0, 3000)).toBe(1);
  });

  // AC-001's second three, and they are half of what this function is for.
  // Without them an Infinity or a NaN reaches the drawing step and disappears
  // there without raising anything (REQ-002's clamp).
  it('holds inside [0, 1] at every boundary', () => {
    // Remaining below zero: whether tickSummonCooldowns can produce it is
    // beside the point — the clamp is asked for either way.
    expect(summonCooldownFillFraction(-50, 3000)).toBe(1);
    // Remaining above the whole cooldown: the frame where a definition changed.
    expect(summonCooldownFillFraction(4000, 3000)).toBe(0);
    // A division by zero. REQ-002's second clause reads a cooldown length of
    // zero as "always ready", so the answer is 1 and not the 0 the clamp alone
    // would give from negative infinity — a slot that can always be summoned
    // must not draw as permanently empty.
    expect(summonCooldownFillFraction(1000, 0)).toBe(1);
  });

  // The zero-length branch cannot be reached from today's data (both units
  // declare 3000 and 4000 ms), so this pins down the reason it exists: not that
  // it will be hit, but that hitting it raises nothing.
  it('reads a non-positive cooldown length as always ready', () => {
    expect(summonCooldownFillFraction(0, 0)).toBe(1);
    expect(summonCooldownFillFraction(500, -1)).toBe(1);
  });
});
