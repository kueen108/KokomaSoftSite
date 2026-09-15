import { describe, expect, it } from 'vitest';
import {
  formationStops,
  validGold,
  validLevel,
  FORMATION_GAP,
} from '../../src/systems/PolishSystem';
import {
  readExperience,
  writeExperience,
  EXPERIENCE_KEY,
} from '../../src/systems/ExperienceSystem';
import { defaultPersistedState, loadState, saveState } from '../../src/systems/SaveSystem';
import { applyUpgrade, statsAtLevel } from '../../src/systems/UpgradeSystem';
import { unitDefinition } from '../../src/data/units';
import { SAVE_STORAGE_KEY } from '../../src/types/save';

const memory = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};
describe('formation queues', () => {
  it.each([1, -1] as const)('holds followers in either marching direction (%s)', (direction) => {
    expect([
      ...formationStops(
        [
          { x: 100 * direction, lane: 0, moving: false },
          { x: 80 * direction, lane: 0, moving: true },
          { x: 70 * direction, lane: 1, moving: true },
          { x: 20 * direction, lane: 0, moving: true },
        ],
        direction,
      ),
    ]).toEqual([1]);
  });
  it('allows the exact spacing boundary and does not teleport crowded arrivals', () => {
    const units = [
      { x: 100, lane: 0, moving: true },
      { x: 100 - FORMATION_GAP, lane: 0, moving: true },
    ];
    expect(formationStops(units, 1).size).toBe(0);
    expect(formationStops([], 1).size).toBe(0);
    expect(units[1].x).toBe(100 - FORMATION_GAP);
    expect([
      ...formationStops(
        [
          { x: 0, lane: 0, moving: false },
          { x: 0, lane: 0, moving: true },
        ],
        1,
      ),
    ]).toEqual([1]);
  });
});
describe('bounded progression', () => {
  it('rejects non-finite data and clamps negative, fractional and oversized values', () => {
    for (const value of [NaN, Infinity, -Infinity, '3', null, undefined]) {
      expect(validLevel(value)).toBe(0);
      expect(validGold(value)).toBe(0);
    }
    expect(validLevel(-2)).toBe(0);
    expect(validLevel(3.9)).toBe(3);
    expect(validLevel(999)).toBe(5);
    expect(validGold(1e12)).toBe(999999);
    expect(validGold(-1)).toBe(0);
    expect(validGold(4.7)).toBe(4);
  });
  it('never charges gold at maximum level or for a locked companion', () => {
    const state = { ...defaultPersistedState(), settlementGold: 9999 };
    state.upgradeLevels = { ...state.upgradeLevels, tanker: 5 };
    expect(applyUpgrade(state, unitDefinition('tanker'))).toEqual({ succeeded: false, state });
    expect(applyUpgrade(state, unitDefinition('mage'))).toEqual({ succeeded: false, state });
    expect(statsAtLevel(unitDefinition('tanker'), 100)).toEqual(
      statsAtLevel(unitDefinition('tanker'), 5),
    );
  });
  it('repairs individual numeric fields while retaining campaign progress', () => {
    const storage = memory(),
      state = defaultPersistedState();
    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        ...state,
        settlementGold: -10,
        upgradeLevels: { ...state.upgradeLevels, tanker: 100, dealer: -2 },
        ringLevels: { mana: 50, rupture: -5 },
        survivalBestWave: 2.7,
        clearedStages: ['stage-1'],
      }),
    );
    const loaded = loadState(storage);
    expect(loaded.settlementGold).toBe(0);
    expect(loaded.upgradeLevels.tanker).toBe(5);
    expect(loaded.upgradeLevels.dealer).toBe(0);
    expect(loaded.ringLevels).toEqual({ mana: 5, rupture: 0 });
    expect(loaded.survivalBestWave).toBe(2);
    expect(loaded.clearedStages).toEqual(['stage-1']);
  });
  it('reports a refused save so the result screen can tell the player', () => {
    expect(saveState(null, defaultPersistedState())).toBe(false);
    expect(
      saveState(
        {
          getItem: () => null,
          setItem: () => {
            throw Error('quota');
          },
        },
        defaultPersistedState(),
      ),
    ).toBe(false);
    expect(saveState(memory(), defaultPersistedState())).toBe(true);
  });
});
describe('independent experience settings', () => {
  it('round trips preferences without changing progress', () => {
    const storage = memory();
    saveState(storage, defaultPersistedState());
    const before = storage.getItem(SAVE_STORAGE_KEY);
    for (const difficulty of ['story', 'normal', 'veteran'] as const) {
      writeExperience(storage, { difficulty, effects: 'light' });
      expect(readExperience(storage)).toEqual({ difficulty, effects: 'light' });
    }
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(before);
  });
  it('defaults safely for absent, malformed, unknown and unavailable storage', () => {
    const storage = memory(),
      defaults = { difficulty: 'normal', effects: 'full' };
    expect(readExperience(null)).toEqual(defaults);
    for (const raw of ['null', 'false', '{', '{"difficulty":"impossible","effects":"broken"}']) {
      storage.setItem(EXPERIENCE_KEY, raw);
      expect(readExperience(storage)).toEqual(defaults);
    }
    const blocked = {
      getItem: () => {
        throw Error('blocked');
      },
      setItem: () => {
        throw Error('blocked');
      },
    };
    expect(readExperience(blocked)).toEqual(defaults);
    expect(() => writeExperience(blocked, { difficulty: 'story', effects: 'light' })).not.toThrow();
    expect(() =>
      writeExperience(null, defaults as { difficulty: 'normal'; effects: 'full' }),
    ).not.toThrow();
  });
});
