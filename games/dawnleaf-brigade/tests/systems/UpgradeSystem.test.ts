import { describe, expect, it } from 'vitest';

import {
  applyUnlock,
  applyUpgrade,
  canUnlock,
  canUpgrade,
  isUnlocked,
  statsAtLevel,
  upgradeCost,
  upgradeLevel,
} from '../../src/systems/UpgradeSystem';
import type { PersistedState } from '../../src/types/save';
import type { UnitDefinition } from '../../src/types/unit';

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

const dealer: UnitDefinition = {
  type: 'dealer',
  displayName: 'Dealer',
  baseStats: { maxHp: 40, attackDamage: 14, attackIntervalMs: 900, speed: 75 },
  attackRange: 0,
  damageReductionPercent: 0,
  summonCost: 35,
  summonCooldownMs: 4000,
  unlockCost: 150,
  upgradeBaseCost: 80,
  textureKey: 'tex-ally-dealer',
  tintColor: 0xd8a13f,
  width: 34,
  height: 46,
};

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
    // Present because `PersistedState` requires them, and left empty on purpose:
    // these tests are about the unit axis, and neither a ring, campaign
    // progress, nor a survival or boss record may move any number they read
    // (REQ-008).
    ringsUnlocked: [],
    ringLevels: { mana: 0, rupture: 0 },
    equippedRing: null,
    clearedStages: [],
    survivalBestWave: 0,
    bossesCleared: [],
    ...overrides,
  };
}

describe('upgradeCost', () => {
  // AC-023 — cost is a pure function of the current level
  it('returns the same cost for the same level every time', () => {
    expect(upgradeCost(tanker, 2)).toBe(upgradeCost(tanker, 2));
  });

  it('charges more for a higher level than a lower one', () => {
    expect(upgradeCost(tanker, 3)).toBeGreaterThan(upgradeCost(tanker, 1));
  });

  it('charges the base cost for the very first upgrade', () => {
    expect(upgradeCost(tanker, 0)).toBe(tanker.upgradeBaseCost);
  });
});

describe('statsAtLevel', () => {
  // AC-023 — stats are a pure function of level and the base definition
  it('returns the base stats at level zero', () => {
    expect(statsAtLevel(tanker, 0)).toEqual(tanker.baseStats);
  });

  it('returns the same stats for the same level every time', () => {
    expect(statsAtLevel(dealer, 3)).toEqual(statsAtLevel(dealer, 3));
  });

  // AC-001 is verified in a browser by reading these numbers off the HUD, so
  // "an upgrade raises them" has to hold here first.
  it('raises hit points and attack damage as the level climbs', () => {
    const low = statsAtLevel(dealer, 1);
    const high = statsAtLevel(dealer, 4);

    expect(high.maxHp).toBeGreaterThan(low.maxHp);
    expect(high.attackDamage).toBeGreaterThan(low.attackDamage);
  });

  // Every level must be felt. A formula that rounds two adjacent levels to the
  // same number would make an upgrade cost gold and change nothing.
  it('raises hit points and damage on every single level step', () => {
    for (let level = 0; level < 5; level += 1) {
      const current = statsAtLevel(dealer, level);
      const next = statsAtLevel(dealer, level + 1);

      expect(next.maxHp).toBeGreaterThan(current.maxHp);
      expect(next.attackDamage).toBeGreaterThan(current.attackDamage);
    }
  });

  // Movement and attack rhythm stay put: upgrades are a power axis, the aura
  // is the positioning axis, and letting upgrades move speed too would blur
  // what the player is being taught to read.
  it('leaves speed and attack interval at their base values', () => {
    const upgraded = statsAtLevel(dealer, 5);

    expect(upgraded.speed).toBe(dealer.baseStats.speed);
    expect(upgraded.attackIntervalMs).toBe(dealer.baseStats.attackIntervalMs);
  });

  it('does not mutate the definition it was given', () => {
    statsAtLevel(tanker, 4);

    expect(tanker.baseStats).toEqual({
      maxHp: 90,
      attackDamage: 5,
      attackIntervalMs: 1200,
      speed: 55,
    });
  });
});

describe('canUpgrade', () => {
  it('allows an upgrade when the gold covers the cost', () => {
    expect(canUpgrade(stateWith(60), tanker)).toBe(true);
  });

  it('allows an upgrade when the gold exactly equals the cost', () => {
    expect(canUpgrade(stateWith(upgradeCost(tanker, 0)), tanker)).toBe(true);
  });

  it('refuses an upgrade one gold short of the cost', () => {
    expect(canUpgrade(stateWith(upgradeCost(tanker, 0) - 1), tanker)).toBe(false);
  });
});

describe('applyUpgrade', () => {
  // AC-021 — no probability anywhere: the same call succeeds every time
  it('succeeds on every one of many identical calls', () => {
    const state = stateWith(1000);

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const result = applyUpgrade(state, tanker);

      expect(result.succeeded).toBe(true);
      expect(upgradeLevel(result.state, 'tanker')).toBe(1);
      expect(result.state.settlementGold).toBe(1000 - upgradeCost(tanker, 0));
    }
  });

  // AC-021 — the level rises by exactly one, never by zero or two
  it('raises the level by exactly one', () => {
    const state = stateWith(1000, {
      upgradeLevels: {
        tanker: 3,
        dealer: 0,
        archer: 0,
        guardian: 0,
        bannerman: 0,
        mage: 0,
        cleric: 0,
        lancer: 0,
      },
    });

    expect(upgradeLevel(applyUpgrade(state, tanker).state, 'tanker')).toBe(4);
  });

  it('leaves the other unit types alone', () => {
    const result = applyUpgrade(stateWith(1000), tanker);

    expect(upgradeLevel(result.state, 'dealer')).toBe(0);
  });

  it('reports failure and changes nothing when the gold is short', () => {
    const state = stateWith(10);
    const result = applyUpgrade(state, tanker);

    expect(result.succeeded).toBe(false);
    expect(result.state).toEqual(state);
  });

  // AC-021 / REQ-023 — the caller's state object survives the call
  it('does not mutate the state it was given', () => {
    const state = stateWith(1000);

    applyUpgrade(state, tanker);

    expect(state.settlementGold).toBe(1000);
    expect(state.upgradeLevels.tanker).toBe(0);
  });
});

describe('isUnlocked', () => {
  it('reports a listed type as unlocked', () => {
    expect(isUnlocked(stateWith(0), 'tanker')).toBe(true);
  });

  it('reports an unlisted type as locked', () => {
    expect(isUnlocked(stateWith(0), 'dealer')).toBe(false);
  });
});

describe('canUnlock', () => {
  it('allows an unlock when the gold covers the cost', () => {
    expect(canUnlock(stateWith(150), dealer)).toBe(true);
  });

  it('refuses an unlock one gold short', () => {
    expect(canUnlock(stateWith(149), dealer)).toBe(false);
  });

  it('refuses to unlock a type that is already unlocked', () => {
    expect(canUnlock(stateWith(1000), tanker)).toBe(false);
  });
});

describe('applyUnlock', () => {
  // AC-024 — deducts the cost and marks the type unlocked
  it('unlocks the type and charges the cost', () => {
    const result = applyUnlock(stateWith(200), dealer);

    expect(result.succeeded).toBe(true);
    expect(isUnlocked(result.state, 'dealer')).toBe(true);
    expect(result.state.settlementGold).toBe(50);
  });

  it('keeps previously unlocked types unlocked', () => {
    const result = applyUnlock(stateWith(200), dealer);

    expect(isUnlocked(result.state, 'tanker')).toBe(true);
  });

  it('reports failure and changes nothing when the gold is short', () => {
    const state = stateWith(10);
    const result = applyUnlock(state, dealer);

    expect(result.succeeded).toBe(false);
    expect(result.state).toEqual(state);
  });

  // AC-024 / REQ-023 — the caller's state object survives the call
  it('does not mutate the state it was given', () => {
    const state = stateWith(200);

    applyUnlock(state, dealer);

    expect(state.settlementGold).toBe(200);
    expect(state.unlocked).toEqual(['tanker']);
  });
});
