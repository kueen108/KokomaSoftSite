import { describe, expect, it } from 'vitest';
import {
  AURA_LEVELS,
  heroProgress,
  normalizeHero,
  upgradeAura,
  chooseWeapon,
  chooseArmor,
  auraAt,
  heroStats,
  growthRank,
} from '../../src/systems/HeroProgressSystem';
import { defaultPersistedState, loadState, saveState } from '../../src/systems/SaveSystem';
import { CAMPAIGN_STAGES, nextStage } from '../../src/data/stages';
import { CAMPAIGN_STORY } from '../../src/data/expedition';
import { isStageUnlocked } from '../../src/systems/StageSystem';
import { ENEMY_KINDS } from '../../src/types/stage';
import { ALLY_UNIT_TYPES } from '../../src/types/unit';
describe('expedition progression', () => {
  it('grants story companions already earned by an older save', () => {
    const saved = { ...defaultPersistedState(), clearedStages: ['stage-3', 'stage-4', 'stage-6'] };
    const loaded = loadState({ getItem: () => JSON.stringify(saved), setItem: () => {} });
    expect(loaded.unlocked).toEqual(expect.arrayContaining(['cleric', 'mage', 'lancer']));
  });
  it('preserves old saves and normalizes malformed optional hero data', () => {
    expect(normalizeHero(null)).toEqual(heroProgress(defaultPersistedState()));
    expect(
      normalizeHero({
        auraLevel: 99,
        weapon: 'storm',
        armor: 'bulwark',
        ownedWeapons: 'storm',
        ownedArmors: null,
      }),
    ).toMatchObject({ auraLevel: 5, weapon: 'sun', armor: 'leather' });
    expect(normalizeHero({ auraLevel: -2 }).auraLevel).toBe(0);
    expect(normalizeHero({ auraLevel: NaN }).auraLevel).toBe(0);
    const saved = {
      ...defaultPersistedState(),
      settlementGold: 456,
      clearedStages: ['stage-1'] as const,
    };
    delete saved.hero;
    expect(loadState({ getItem: () => JSON.stringify(saved), setItem: () => {} })).toMatchObject({
      settlementGold: 456,
      clearedStages: ['stage-1'],
      hero: normalizeHero(null),
    });
  });
  it('gates six growth levels by campaign milestones and funds, charging exactly once', () => {
    let s = { ...defaultPersistedState(), settlementGold: 2000 };
    expect(upgradeAura(s)).toBe(s);
    s = { ...s, clearedStages: ['stage-1', 'stage-3', 'stage-5', 'stage-8', 'stage-10'] };
    for (let i = 1; i < 6; i++) {
      const before = s.settlementGold;
      s = upgradeAura(s);
      expect(heroProgress(s).auraLevel).toBe(i);
      expect(s.settlementGold).toBe(before - AURA_LEVELS[i].cost);
    }
    expect(upgradeAura(s)).toBe(s);
    const poor = { ...defaultPersistedState(), clearedStages: ['stage-3'] as const };
    expect(upgradeAura(poor)).toBe(poor);
  });
  it('starts with no aura and grows health, attack and aura across all six levels', () => {
    expect(auraAt(0)).toMatchObject({
      radius: 0,
      attack: 1,
      speed: 1,
      incoming: 1,
      enemyAttack: 1,
      enemySpeed: 1,
      enemyIncoming: 1,
      heal: 0,
      mana: 0,
    });
    expect(heroStats(0)).toEqual({ maxHp: 200, attackMultiplier: 1 });
    for (let level = 1; level <= 5; level++) {
      expect(auraAt(level).radius).toBeGreaterThan(auraAt(level - 1).radius);
      expect(auraAt(level).attack).toBeGreaterThan(auraAt(level - 1).attack);
      for (const armor of ['leather', 'bulwark', 'renewal'] as const) {
        expect(heroStats(level, armor).maxHp).toBeGreaterThan(heroStats(level - 1, armor).maxHp);
        expect(heroStats(level, armor).attackMultiplier).toBeGreaterThan(
          heroStats(level - 1, armor).attackMultiplier,
        );
      }
    }
    expect([0, 1, 2, 3, 4, 5].map(growthRank)).toEqual([
      'novice',
      'novice',
      'trained',
      'trained',
      'elite',
      'elite',
    ]);
    for (const invalid of [NaN, Infinity, -Infinity, -1]) {
      expect(auraAt(invalid)).toBe(auraAt(0));
      expect(heroStats(invalid)).toEqual(heroStats(0));
    }
  });
  it('retains earned legacy aura ranks and survives save/reload at the new maximum', () => {
    for (let level = 0; level <= 5; level++) {
      const saved = { ...defaultPersistedState(), hero: normalizeHero({ auraLevel: level }) };
      expect(
        heroProgress(loadState({ getItem: () => JSON.stringify(saved), setItem: () => {} }))
          .auraLevel,
      ).toBe(level);
    }
  });
  it('purchases, equips and reloads weapons and armor without charging owned items twice', () => {
    let s = { ...defaultPersistedState(), settlementGold: 500 };
    s = chooseWeapon(s, 'frost');
    expect(s.settlementGold).toBe(380);
    s = chooseArmor(s, 'bulwark');
    expect(s.settlementGold).toBe(240);
    s = chooseWeapon(chooseWeapon(s, 'sun'), 'frost');
    s = chooseArmor(chooseArmor(s, 'leather'), 'bulwark');
    expect(s.settlementGold).toBe(240);
    let raw = '';
    const storage = {
      getItem: () => raw,
      setItem: (_k: string, v: string) => {
        raw = v;
      },
    };
    saveState(storage, s);
    expect(loadState(storage)).toEqual(s);
    const poor = defaultPersistedState();
    expect(chooseWeapon(poor, 'storm')).toBe(poor);
    expect(chooseArmor(poor, 'renewal')).toBe(poor);
  });
  it('has twelve reachable authored stages across four regions and three mission rules', () => {
    expect(CAMPAIGN_STAGES).toHaveLength(12);
    expect(ALLY_UNIT_TYPES).toHaveLength(8);
    expect(ENEMY_KINDS).toHaveLength(8);
    expect(new Set(Object.values(CAMPAIGN_STORY).map((s) => s.mission)).size).toBe(3);
    expect(new Set(Object.values(CAMPAIGN_STORY).map((s) => s.region)).size).toBe(4);
    for (const [i, s] of CAMPAIGN_STAGES.entries()) {
      expect(s.order).toBe(i + 1);
      expect(CAMPAIGN_STORY[s.id].intro.length).toBeGreaterThan(30);
      expect(CAMPAIGN_STORY[s.id].ending.length).toBeGreaterThan(20);
      expect(
        isStageUnlocked(
          CAMPAIGN_STAGES,
          s.id,
          CAMPAIGN_STAGES.slice(0, i).map((s) => s.id),
        ),
      ).toBe(true);
      if (i > 0) expect(isStageUnlocked(CAMPAIGN_STAGES, s.id, [])).toBe(false);
      expect(
        s.waves.every(
          (w, j) =>
            w.count > 0 &&
            ENEMY_KINDS.includes(w.enemyKind) &&
            (j === 0 || w.spawnAtMs > s.waves[j - 1].spawnAtMs),
        ),
      ).toBe(true);
    }
    expect(nextStage('stage-3')?.id).toBe('stage-4');
    expect(nextStage('stage-12')).toBe(null);
  });
});
