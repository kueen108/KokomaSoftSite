import { describe, expect, it } from 'vitest';

import { BOSSES, bossDefinition } from '../../src/data/bosses';
import { ENEMY_DEFINITIONS } from '../../src/data/enemies';
import { bossPhaseAt, recordBossResult } from '../../src/systems/BossSystem';
import { BOSS_IDS } from '../../src/types/boss';
import type { PersistedState } from '../../src/types/save';
import { ENEMY_KINDS } from '../../src/types/stage';

/**
 * The shipped boss, read from the registry rather than named by literal, so
 * these checks follow the roster instead of silently staying on one entry when
 * a second boss is added.
 */
const warden = bossDefinition(BOSS_IDS[0]);

function stateWith(bossesCleared: PersistedState['bossesCleared']): PersistedState {
  return {
    schemaVersion: 4,
    settlementGold: 0,
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
    clearedStages: [],
    survivalBestWave: 0,
    bossesCleared,
  };
}

describe('boss definitions (SPEC-GAME-MODE-001)', () => {
  // AC-013 — a boss must be bigger than every enemy on both axes (REQ-012).
  // Size is checked because the type system cannot: a boss drawn at the grunt's
  // 40x48 satisfies every field requirement while being indistinguishable on a
  // moving screen from an ordinary enemy that happens to have a lot of health,
  // which is the failure SPEC-CAMPAIGN-STAGE-001 0.3.0 was written to fix.
  it('draws every boss larger than every enemy kind on both axes', () => {
    for (const boss of BOSSES) {
      for (const kind of ENEMY_KINDS) {
        const enemy = ENEMY_DEFINITIONS[kind];

        expect(boss.width).toBeGreaterThan(enemy.width);
        expect(boss.height).toBeGreaterThan(enemy.height);
      }
    }
  });

  // AC-014 — the two properties that make `bossPhaseAt` total and
  // single-valued (REQ-013). Without the 100 a full-health boss matches no
  // phase and fights with whatever the fallback is; without the strict decrease
  // one health value matches two phases and the answer depends on list order.
  // Neither failure raises anything — the boss just fights oddly.
  it('starts every phase list at one hundred percent', () => {
    for (const boss of BOSSES) {
      expect(boss.phases[0].enterAtPercent).toBe(100);
    }
  });

  it('decreases the entry percentage strictly down every phase list', () => {
    for (const boss of BOSSES) {
      for (let i = 1; i < boss.phases.length; i += 1) {
        expect(boss.phases[i].enterAtPercent).toBeLessThan(boss.phases[i - 1].enterAtPercent);
      }
    }
  });

  // REQ-013 — a phase whose display name were empty would satisfy the type and
  // leave REQ-016's HUD line blank, so the rule would exist in the data and not
  // on the screen. Same reasoning as REQ-003's non-empty mode description.
  it('names every phase', () => {
    for (const boss of BOSSES) {
      for (const phase of boss.phases) {
        expect(phase.displayName.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('bossPhaseAt', () => {
  // Exact and adjacent boundaries for the 1400 HP boss, at 66% and 33%.
  it.each([
    { hp: 1400, phase: 0 },
    { hp: 925, phase: 0 },
    { hp: 924, phase: 1 },
    { hp: 463, phase: 1 },
    { hp: 462, phase: 2 },
    { hp: 0, phase: 2 },
  ])('puts $hp hit points in phase $phase', ({ hp, phase }) => {
    expect(bossPhaseAt(warden, hp)).toBe(warden.phases[phase]);
  });

  // REQ-014 — determined by the current hit points alone, so the same health
  // always gives the same phase however it was arrived at. This is what makes a
  // transition impossible to miss: one large hit crossing two thresholds lands
  // in the right phase, and so would a heal going back the other way. An
  // event-driven implementation would have to notice each crossing as it
  // happened, and a crossing skipped raises nothing.
  it('answers the same for a health value however it was reached', () => {
    expect(bossPhaseAt(warden, 150)).toBe(bossPhaseAt(warden, 150));
  });

  // Overkill drives health below zero (`applyDamage` clamps, but the resolver
  // is handed raw values elsewhere and this function must not be the one that
  // decides). A boss with no phase at the moment it dies would read stats off
  // `undefined` on the frame the battle ends.
  it('still answers for health driven below zero', () => {
    expect(bossPhaseAt(warden, -50)).toBe(warden.phases[warden.phases.length - 1]);
  });

  // REQ-014 names maximum hit points as an input, so the boundaries have to
  // move with it rather than staying pinned to the shipped 600. On a 200-point
  // boss the same 66 and 33 percentages fall at 132 and 66 hit points: 140 is
  // still above the first, 132 is exactly on it, and 100 is past it.
  it('scales the boundaries with the definition maximum', () => {
    const smaller = { ...warden, maxHp: 200 };

    expect(bossPhaseAt(smaller, 140)).toBe(smaller.phases[0]);
    expect(bossPhaseAt(smaller, 132)).toBe(smaller.phases[1]);
    expect(bossPhaseAt(smaller, 100)).toBe(smaller.phases[1]);
  });
});

describe('recordBossResult', () => {
  // AC-019 — a win writes the identifier down.
  it('records the boss identifier on a victory', () => {
    expect(recordBossResult(stateWith([]), warden.id, 'victory').bossesCleared).toEqual([
      warden.id,
    ]);
  });

  // AC-019 — beating the same boss again is ordinary play rather than an edge
  // case, so the record must not grow. Appending regardless raises no error and
  // shows nothing on screen; the save document simply gains a string every time
  // the player enjoys the fight twice.
  it('holds the identifier once however often the boss is beaten', () => {
    const once = recordBossResult(stateWith([]), warden.id, 'victory');
    const twice = recordBossResult(once, warden.id, 'victory');

    expect(twice.bossesCleared).toEqual([warden.id]);
  });

  // AC-020 — REQ-019. A defeat adds nothing.
  it('records nothing on a defeat', () => {
    expect(recordBossResult(stateWith([]), warden.id, 'defeat').bossesCleared).toEqual([]);
  });

  // The outcome is an argument rather than a condition at the call site, so an
  // in-between state has to be handled here too — and handled as "not a win",
  // since only a win clears a boss (REQ-018).
  it('records nothing while the battle is still running', () => {
    expect(recordBossResult(stateWith([]), warden.id, 'ongoing').bossesCleared).toEqual([]);
  });

  // AC-019 / AC-020 — REQ-023: derives a new state rather than editing the one
  // it was handed.
  it('does not modify the state it was given', () => {
    const before = stateWith([]);

    recordBossResult(before, warden.id, 'victory');

    expect(before.bossesCleared).toEqual([]);
  });

  // Called at settlement, immediately after the battle's gold was added, so a
  // field dropped here loses what the player just earned.
  it('carries every other field through unchanged', () => {
    const before: PersistedState = { ...stateWith([]), settlementGold: 250, survivalBestWave: 4 };
    const after = recordBossResult(before, warden.id, 'victory');

    expect(after.settlementGold).toBe(250);
    expect(after.survivalBestWave).toBe(4);
  });
});
