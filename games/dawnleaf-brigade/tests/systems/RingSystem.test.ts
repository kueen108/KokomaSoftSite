import { describe, expect, it } from 'vitest';

import { RING_DEFINITIONS } from '../../src/data/rings';
import {
  applyRingUnlock,
  applyRingUpgrade,
  canUnlockRing,
  canUpgradeRing,
  effectiveAttackParams,
  equipRing,
  isRingUnlocked,
  ringLevel,
  ringMultiplier,
  ringUpgradeCost,
  unequipRing,
} from '../../src/systems/RingSystem';
import { RING_TYPES } from '../../src/types/ring';
import type { AttackParams, RingDefinition } from '../../src/types/ring';
import type { PersistedState } from '../../src/types/save';

/**
 * Local fixtures rather than the shipped definitions, following
 * `UpgradeSystem.test.ts`: these tests are about the rules, and a rule that
 * only holds for today's balance numbers is not a rule. The shipped numbers get
 * their own block at the bottom, which is where §D's table is actually guarded.
 */
const manaRing: RingDefinition = {
  type: 'mana',
  displayName: 'Ring of Mana',
  axis: 'attackCost',
  baseMultiplier: 0.8,
  multiplierStepPerLevel: -0.05,
  maxLevel: 5,
  unlockCost: 120,
  upgradeBaseCost: 80,
};

const ruptureRing: RingDefinition = {
  type: 'rupture',
  displayName: 'Ring of Rupture',
  axis: 'projectileDamage',
  baseMultiplier: 1.5,
  multiplierStepPerLevel: 0.1,
  maxLevel: 5,
  unlockCost: 200,
  upgradeBaseCost: 100,
};

/** The configured base numbers this SPEC modifies: `ATTACK_COST`, `PROJECTILE_DAMAGE`. */
const baseAttack: AttackParams = { attackCost: 20, projectileDamage: 20 };

function stateWith(gold: number, overrides: Partial<PersistedState> = {}): PersistedState {
  return {
    schemaVersion: 3,
    settlementGold: gold,
    unlocked: ['tanker'],
    upgradeLevels: {
      tanker: 0,
      dealer: 0,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    },
    ringsUnlocked: [],
    ringLevels: { mana: 0, rupture: 0 },
    equippedRing: null,
    // Present because `PersistedState` requires them, and empty on purpose:
    // these tests are about the ring axis, and neither campaign progress nor a
    // survival or boss record moves any number they read.
    clearedStages: [],
    survivalBestWave: 0,
    bossesCleared: [],
    ...overrides,
  };
}

describe('ringLevel and isRingUnlocked', () => {
  it('reads the stored level for a ring', () => {
    expect(ringLevel(stateWith(0, { ringLevels: { mana: 3, rupture: 1 } }), 'mana')).toBe(3);
  });

  it('reports a listed ring as unlocked', () => {
    expect(isRingUnlocked(stateWith(0, { ringsUnlocked: ['mana'] }), 'mana')).toBe(true);
  });

  it('reports an unlisted ring as locked', () => {
    expect(isRingUnlocked(stateWith(0, { ringsUnlocked: ['mana'] }), 'rupture')).toBe(false);
  });
});

describe('ringUpgradeCost', () => {
  // AC-002 — cost is a pure function of the current level
  it('returns the same cost for the same level every time', () => {
    expect(ringUpgradeCost(manaRing, 2)).toBe(ringUpgradeCost(manaRing, 2));
  });

  it('charges the base cost for the very first upgrade', () => {
    expect(ringUpgradeCost(manaRing, 0)).toBe(manaRing.upgradeBaseCost);
  });

  it('charges more for a higher level than a lower one', () => {
    expect(ringUpgradeCost(manaRing, 3)).toBeGreaterThan(ringUpgradeCost(manaRing, 1));
  });

  // AC-002 — no two adjacent levels may cost the same
  it('charges a strictly different amount at every level step', () => {
    for (const definition of [manaRing, ruptureRing]) {
      for (let level = 0; level < definition.maxLevel; level += 1) {
        expect(ringUpgradeCost(definition, level + 1)).not.toBe(ringUpgradeCost(definition, level));
      }
    }
  });
});

describe('ringMultiplier', () => {
  // AC-002 — the effect size is a pure function of level and definition
  it('returns the same multiplier for the same level every time', () => {
    expect(ringMultiplier(ruptureRing, 3)).toBe(ringMultiplier(ruptureRing, 3));
  });

  it('returns the base multiplier at level zero', () => {
    expect(ringMultiplier(manaRing, 0)).toBe(manaRing.baseMultiplier);
  });

  it('falls further per level on a lowering ring', () => {
    expect(ringMultiplier(manaRing, 4)).toBeLessThan(ringMultiplier(manaRing, 1));
  });

  it('rises further per level on a raising ring', () => {
    expect(ringMultiplier(ruptureRing, 4)).toBeGreaterThan(ringMultiplier(ruptureRing, 1));
  });

  // AC-002 — no two adjacent levels may imply the same effect
  it('produces a strictly different multiplier at every level step', () => {
    for (const definition of [manaRing, ruptureRing]) {
      for (let level = 0; level < definition.maxLevel; level += 1) {
        expect(ringMultiplier(definition, level + 1)).not.toBe(ringMultiplier(definition, level));
      }
    }
  });
});

describe('effectiveAttackParams', () => {
  // AC-005 — the mana ring lowers the cost and leaves the damage alone
  it('lowers only the mana cost for the mana ring', () => {
    const result = effectiveAttackParams(baseAttack, manaRing, 0);

    expect(result.attackCost).toBeLessThan(baseAttack.attackCost);
    expect(result.projectileDamage).toBe(baseAttack.projectileDamage);
  });

  // AC-005 — the rupture ring raises the damage and leaves the cost alone
  it('raises only the projectile damage for the rupture ring', () => {
    const result = effectiveAttackParams(baseAttack, ruptureRing, 0);

    expect(result.projectileDamage).toBeGreaterThan(baseAttack.projectileDamage);
    expect(result.attackCost).toBe(baseAttack.attackCost);
  });

  // AC-005 / REQ-007 — no ring means the configured values, untouched. Without
  // this branch a removed ring keeps acting, and nothing on screen says so.
  it('returns the base numbers unchanged when no ring is equipped', () => {
    expect(effectiveAttackParams(baseAttack, null, 0)).toEqual(baseAttack);
  });

  it('ignores the level when no ring is equipped', () => {
    expect(effectiveAttackParams(baseAttack, null, 5)).toEqual(baseAttack);
  });

  // AC-005 / REQ-015 — the caller's base numbers survive the call
  it('does not mutate the base parameters it was given', () => {
    effectiveAttackParams(baseAttack, manaRing, 3);
    effectiveAttackParams(baseAttack, ruptureRing, 3);

    expect(baseAttack).toEqual({ attackCost: 20, projectileDamage: 20 });
  });

  it('returns a whole number on both axes', () => {
    const lowered = effectiveAttackParams(baseAttack, manaRing, 3);
    const raised = effectiveAttackParams(baseAttack, ruptureRing, 3);

    expect(Number.isInteger(lowered.attackCost)).toBe(true);
    expect(Number.isInteger(raised.projectileDamage)).toBe(true);
  });

  // AC-002's real hazard lands here rather than on the multiplier: rounding is
  // what can pull level N+1 back onto level N's value, producing an upgrade
  // that charges gold and changes nothing a player can read.
  it('produces a strictly different attack number at every level step', () => {
    for (let level = 0; level < manaRing.maxLevel; level += 1) {
      expect(effectiveAttackParams(baseAttack, manaRing, level + 1).attackCost).not.toBe(
        effectiveAttackParams(baseAttack, manaRing, level).attackCost,
      );
      expect(effectiveAttackParams(baseAttack, ruptureRing, level + 1).projectileDamage).not.toBe(
        effectiveAttackParams(baseAttack, ruptureRing, level).projectileDamage,
      );
    }
  });
});

describe('canUnlockRing', () => {
  it('allows an unlock when the gold covers the cost', () => {
    expect(canUnlockRing(stateWith(120), manaRing)).toBe(true);
  });

  it('allows an unlock when the gold exactly equals the cost', () => {
    expect(canUnlockRing(stateWith(manaRing.unlockCost), manaRing)).toBe(true);
  });

  it('refuses an unlock one gold short of the cost', () => {
    expect(canUnlockRing(stateWith(manaRing.unlockCost - 1), manaRing)).toBe(false);
  });

  it('refuses to unlock a ring that is already unlocked', () => {
    expect(canUnlockRing(stateWith(1000, { ringsUnlocked: ['mana'] }), manaRing)).toBe(false);
  });
});

describe('applyRingUnlock', () => {
  // AC-009 — affordable: succeeds, charges the cost, marks the ring unlocked
  it('unlocks the ring and charges the cost', () => {
    const result = applyRingUnlock(stateWith(200), manaRing);

    expect(result.succeeded).toBe(true);
    expect(result.state.settlementGold).toBe(80);
    expect(isRingUnlocked(result.state, 'mana')).toBe(true);
  });

  // AC-009 — short: reports failure and leaves gold and unlock state alone
  it('reports failure and changes nothing when the gold is short', () => {
    const state = stateWith(10);
    const result = applyRingUnlock(state, manaRing);

    expect(result.succeeded).toBe(false);
    expect(result.state.settlementGold).toBe(10);
    expect(isRingUnlocked(result.state, 'mana')).toBe(false);
  });

  it('leaves the other ring alone', () => {
    const result = applyRingUnlock(stateWith(1000), manaRing);

    expect(isRingUnlocked(result.state, 'rupture')).toBe(false);
  });

  // Unlocking is buying, not wearing. Auto-equipping here would silently change
  // the numbers of the next battle without the player choosing it (REQ-003).
  it('does not equip the ring it just unlocked', () => {
    expect(applyRingUnlock(stateWith(1000), manaRing).state.equippedRing).toBeNull();
  });

  // AC-009 / REQ-015 — the caller's state object survives the call
  it('does not mutate the state it was given', () => {
    const state = stateWith(1000);

    applyRingUnlock(state, manaRing);

    expect(state.settlementGold).toBe(1000);
    expect(state.ringsUnlocked).toEqual([]);
  });
});

describe('canUpgradeRing', () => {
  const unlocked = { ringsUnlocked: ['mana'] as const };

  it('allows an upgrade when the gold covers the cost and the level is below the ceiling', () => {
    expect(canUpgradeRing(stateWith(1000, { ...unlocked }), manaRing)).toBe(true);
  });

  it('refuses an upgrade one gold short of the cost', () => {
    const state = stateWith(ringUpgradeCost(manaRing, 0) - 1, { ...unlocked });

    expect(canUpgradeRing(state, manaRing)).toBe(false);
  });

  // REQ-011 — the ceiling refuses rather than silently doing nothing. A falling
  // number cannot be extended forever: at cost zero the mana economy is gone.
  it('refuses an upgrade at the level ceiling however much gold is held', () => {
    const state = stateWith(100000, { ...unlocked, ringLevels: { mana: 5, rupture: 0 } });

    expect(canUpgradeRing(state, manaRing)).toBe(false);
  });

  it('allows an upgrade one level below the ceiling', () => {
    const state = stateWith(100000, { ...unlocked, ringLevels: { mana: 4, rupture: 0 } });

    expect(canUpgradeRing(state, manaRing)).toBe(true);
  });
});

describe('applyRingUpgrade', () => {
  const unlocked = { ringsUnlocked: ['mana'] as const };

  // AC-010 — affordable and below the ceiling: charges and raises by one
  it('raises the level by exactly one and charges the cost', () => {
    const state = stateWith(1000, { ...unlocked, ringLevels: { mana: 2, rupture: 0 } });
    const result = applyRingUpgrade(state, manaRing);

    expect(result.succeeded).toBe(true);
    expect(ringLevel(result.state, 'mana')).toBe(3);
    expect(result.state.settlementGold).toBe(1000 - ringUpgradeCost(manaRing, 2));
  });

  // AC-010 — short gold: failure, nothing moves
  it('reports failure and changes nothing when the gold is short', () => {
    const state = stateWith(10, { ...unlocked });
    const result = applyRingUpgrade(state, manaRing);

    expect(result.succeeded).toBe(false);
    expect(result.state.settlementGold).toBe(10);
    expect(ringLevel(result.state, 'mana')).toBe(0);
  });

  // AC-010 — at the ceiling: failure, nothing moves. Gold must not be taken.
  it('reports failure and takes no gold at the level ceiling', () => {
    const state = stateWith(100000, { ...unlocked, ringLevels: { mana: 5, rupture: 0 } });
    const result = applyRingUpgrade(state, manaRing);

    expect(result.succeeded).toBe(false);
    expect(result.state.settlementGold).toBe(100000);
    expect(ringLevel(result.state, 'mana')).toBe(5);
  });

  // AC-011 — no probability anywhere: the same call resolves the same way
  it('succeeds on every one of many identical calls', () => {
    const state = stateWith(1000, { ...unlocked });

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const result = applyRingUpgrade(state, manaRing);

      expect(result.succeeded).toBe(true);
      expect(result.state).toEqual(applyRingUpgrade(state, manaRing).state);
    }
  });

  it('leaves the other ring level alone', () => {
    const state = stateWith(1000, { ...unlocked });

    expect(ringLevel(applyRingUpgrade(state, manaRing).state, 'rupture')).toBe(0);
  });

  // AC-010 / REQ-015 — the caller's state object survives the call
  it('does not mutate the state it was given', () => {
    const state = stateWith(1000, { ...unlocked });

    applyRingUpgrade(state, manaRing);

    expect(state.settlementGold).toBe(1000);
    expect(state.ringLevels.mana).toBe(0);
  });
});

describe('equipRing', () => {
  // AC-003 — a locked ring cannot be worn, and the previous one stays on
  it('refuses a ring that is not unlocked and leaves the worn ring in place', () => {
    const state = stateWith(0, { ringsUnlocked: ['mana'], equippedRing: 'mana' });
    const result = equipRing(state, ruptureRing);

    expect(result.succeeded).toBe(false);
    expect(result.state.equippedRing).toBe('mana');
  });

  // AC-003 — once unlocked, it displaces whatever was worn before
  it('displaces the ring that was worn before', () => {
    const state = stateWith(0, {
      ringsUnlocked: ['mana', 'rupture'],
      equippedRing: 'mana',
    });
    const result = equipRing(state, ruptureRing);

    expect(result.succeeded).toBe(true);
    expect(result.state.equippedRing).toBe('rupture');
  });

  it('wears a ring when nothing was worn before', () => {
    const state = stateWith(0, { ringsUnlocked: ['mana'] });

    expect(equipRing(state, manaRing).state.equippedRing).toBe('mana');
  });

  // REQ-005 — the worn ring is one value, so "more than one" is not a state the
  // type can express. This asserts the shape rather than a count.
  it('records the worn ring as a single value rather than a collection', () => {
    const state = stateWith(0, { ringsUnlocked: ['mana', 'rupture'], equippedRing: 'mana' });

    expect(Array.isArray(equipRing(state, ruptureRing).state.equippedRing)).toBe(false);
  });

  it('leaves unlock state and levels untouched', () => {
    const state = stateWith(0, {
      ringsUnlocked: ['mana', 'rupture'],
      ringLevels: { mana: 2, rupture: 3 },
      equippedRing: 'mana',
    });
    const result = equipRing(state, ruptureRing);

    expect(result.state.ringsUnlocked).toEqual(['mana', 'rupture']);
    expect(result.state.ringLevels).toEqual({ mana: 2, rupture: 3 });
  });

  // AC-003 / REQ-015 — neither call may touch the caller's state
  it('does not mutate the state it was given, on either branch', () => {
    const locked = stateWith(0, { ringsUnlocked: ['mana'], equippedRing: 'mana' });
    const unlocked = stateWith(0, {
      ringsUnlocked: ['mana', 'rupture'],
      equippedRing: 'mana',
    });

    equipRing(locked, ruptureRing);
    equipRing(unlocked, ruptureRing);

    expect(locked.equippedRing).toBe('mana');
    expect(unlocked.equippedRing).toBe('mana');
  });
});

describe('unequipRing', () => {
  // AC-004 — the ring comes off; what was bought stays bought
  it('leaves no ring worn while keeping the unlock and the level', () => {
    const state = stateWith(0, {
      ringsUnlocked: ['mana'],
      ringLevels: { mana: 4, rupture: 0 },
      equippedRing: 'mana',
    });
    const result = unequipRing(state);

    expect(result.state.equippedRing).toBeNull();
    expect(result.state.ringsUnlocked).toEqual(['mana']);
    expect(result.state.ringLevels).toEqual({ mana: 4, rupture: 0 });
  });

  it('reports success when a ring was worn', () => {
    const state = stateWith(0, { ringsUnlocked: ['mana'], equippedRing: 'mana' });

    expect(unequipRing(state).succeeded).toBe(true);
  });

  // Nothing to take off is not an error, but it is not a change either — the
  // screen has to be able to tell the player which of the two happened.
  it('reports no change when nothing was worn', () => {
    const result = unequipRing(stateWith(0, { ringsUnlocked: ['mana'] }));

    expect(result.succeeded).toBe(false);
    expect(result.state.equippedRing).toBeNull();
  });

  // AC-004 / REQ-015 — the caller's state object survives the call
  it('does not mutate the state it was given', () => {
    const state = stateWith(0, { ringsUnlocked: ['mana'], equippedRing: 'mana' });

    unequipRing(state);

    expect(state.equippedRing).toBe('mana');
  });
});

describe('AC-011 — unlock and upgrade resolve identically on repeated calls', () => {
  it('returns the same outcome and the same state from every unlock call', () => {
    const state = stateWith(1000);
    const first = applyRingUnlock(state, manaRing);

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const again = applyRingUnlock(state, manaRing);

      expect(again.succeeded).toBe(first.succeeded);
      expect(again.state).toEqual(first.state);
    }
  });

  it('returns the same outcome and the same state from every upgrade call', () => {
    const state = stateWith(1000, { ringsUnlocked: ['mana'] });
    const first = applyRingUpgrade(state, manaRing);

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const again = applyRingUpgrade(state, manaRing);

      expect(again.succeeded).toBe(first.succeeded);
      expect(again.state).toEqual(first.state);
    }
  });
});

/**
 * The shipped numbers, not the fixtures.
 *
 * The blocks above prove the rules hold; this one proves today's balance table
 * obeys them. Without it the §D numbers could drift into a level step that
 * rounds flat and every test above would still pass.
 */
describe('the shipped ring definitions obey the level rules', () => {
  const base: AttackParams = { attackCost: 20, projectileDamage: 20 };

  it('ships one definition per declared ring type', () => {
    for (const type of RING_TYPES) {
      expect(RING_DEFINITIONS[type].type).toBe(type);
    }
  });

  it('changes its attack number on every level step, for every ring', () => {
    for (const type of RING_TYPES) {
      const definition = RING_DEFINITIONS[type];

      for (let level = 0; level < definition.maxLevel; level += 1) {
        const current = effectiveAttackParams(base, definition, level);
        const next = effectiveAttackParams(base, definition, level + 1);

        expect(next[definition.axis]).not.toBe(current[definition.axis]);
      }
    }
  });

  it('charges a strictly different upgrade cost on every level step, for every ring', () => {
    for (const type of RING_TYPES) {
      const definition = RING_DEFINITIONS[type];

      for (let level = 0; level < definition.maxLevel; level += 1) {
        expect(ringUpgradeCost(definition, level + 1)).not.toBe(ringUpgradeCost(definition, level));
      }
    }
  });

  // The mana cost must never reach zero: at zero the mana economy stops
  // existing and the ring stops being a trade (spec.md §5).
  it('never lowers the mana cost to zero or below at any reachable level', () => {
    const definition = RING_DEFINITIONS.mana;

    for (let level = 0; level <= definition.maxLevel; level += 1) {
      expect(effectiveAttackParams(base, definition, level).attackCost).toBeGreaterThan(0);
    }
  });

  // §D's observability claim: at level 0 the rupture ring must already turn the
  // two hits an enemy takes into one. `ENEMY_HP` is 30, so this is what makes
  // AC-007's manual reading a yes/no rather than a feeling.
  it('kills a 30-hit-point enemy in one rupture-ring projectile at level zero', () => {
    expect(
      effectiveAttackParams(base, RING_DEFINITIONS.rupture, 0).projectileDamage,
    ).toBeGreaterThanOrEqual(30);
  });
});
