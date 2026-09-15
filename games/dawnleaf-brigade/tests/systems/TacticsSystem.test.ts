import { describe, expect, it } from 'vitest';
import {
  incomeAfter,
  canCastNova,
  novaHits,
  NOVA_COST,
  NOVA_RADIUS,
} from '../../src/systems/TacticsSystem';
import { defaultPersistedState, loadState, saveState } from '../../src/systems/SaveSystem';
import { CAMPAIGN_STAGES } from '../../src/data/stages';

describe('recovery and emergency spell', () => {
  it('recovers enough gold to rebuild even without a kill, independent of frame partition', () => {
    const lump = incomeAfter(0, 10000);
    let stepped = 0;
    for (let i = 0; i < 100; i++) stepped = incomeAfter(stepped, 100);
    expect(lump).toBe(30);
    expect(stepped).toBeCloseTo(lump);
    expect(incomeAfter(998, 1000)).toBe(999);
    expect(incomeAfter(20, -100)).toBe(20);
  });
  it('requires both mana and cooldown, including exact boundaries', () => {
    expect(canCastNova(NOVA_COST, 0)).toBe(true);
    expect(canCastNova(NOVA_COST - 1, 0)).toBe(false);
    expect(canCastNova(100, 1)).toBe(false);
  });
  it('rescues a broken frontline by hitting on either side of the hero', () => {
    expect(novaHits(500, 500 - NOVA_RADIUS)).toBe(true);
    expect(novaHits(500, 500 + NOVA_RADIUS)).toBe(true);
    expect(novaHits(500, 500 - NOVA_RADIUS - 1)).toBe(false);
  });
});
describe('campaign onboarding', () => {
  it('grants starter roles to an existing save without losing progress or purchases', () => {
    let raw = '';
    const storage = {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        raw = value;
      },
    };
    const state = {
      ...defaultPersistedState(),
      settlementGold: 731,
      unlocked: ['tanker', 'guardian'] as const,
      upgradeLevels: { ...defaultPersistedState().upgradeLevels, tanker: 4 },
    };
    saveState(storage, state);
    const result = loadState(storage);
    expect(result.unlocked).toEqual(['tanker', 'dealer', 'archer', 'guardian']);
    expect(result.settlementGold).toBe(731);
    expect(result.upgradeLevels.tanker).toBe(4);
  });
  it('introduces ranged enemies, then armor and support, with increasing pressure', () => {
    expect(CAMPAIGN_STAGES[0].waves.some((w) => w.enemyKind === 'skirmisher')).toBe(true);
    expect(CAMPAIGN_STAGES[1].waves.some((w) => w.enemyKind === 'overseer')).toBe(true);
    expect(CAMPAIGN_STAGES[2].waves.some((w) => w.enemyKind === 'juggernaut')).toBe(true);
    const counts = CAMPAIGN_STAGES.map((s) => s.waves.reduce((n, w) => n + w.count, 0));
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[2]).toBeGreaterThan(counts[1]);
    for (const s of CAMPAIGN_STAGES) {
      expect(s.waves[0].spawnAtMs).toBeGreaterThan(0);
      for (let i = 1; i < s.waves.length; i++)
        expect(s.waves[i].spawnAtMs).toBeGreaterThan(s.waves[i - 1].spawnAtMs);
    }
  });
});
