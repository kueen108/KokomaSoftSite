import { describe, expect, it } from 'vitest';

import { ENEMY_DEFINITIONS } from '../../src/data/enemies';
import { CAMPAIGN_STAGES } from '../../src/data/stages';
import {
  difficultyMetric,
  isStageUnlocked,
  recordStageResult,
} from '../../src/systems/StageSystem';
import type { PersistedState } from '../../src/types/save';
import { ENEMY_KINDS } from '../../src/types/stage';
import type { StageId } from '../../src/types/stage';

/**
 * The registry in campaign order, read once. The tests below index into it
 * rather than naming stages by literal, so inserting a stage changes what the
 * tests exercise instead of silently leaving them on the old three.
 */
const [first, second, third] = CAMPAIGN_STAGES;

function stateWith(clearedStages: readonly StageId[]): PersistedState {
  return {
    schemaVersion: 3,
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
    clearedStages,
    // Present because `PersistedState` requires them, and empty on purpose:
    // these tests are about campaign progression, which neither a survival nor
    // a boss record takes any part in.
    survivalBestWave: 0,
    bossesCleared: [],
  };
}

describe('isStageUnlocked', () => {
  // AC-010 / REQ-009 — the entry point has to exist on a save that records
  // nothing, or a new player has nowhere to go and the game never starts.
  it('unlocks the first stage in campaign order on an empty record', () => {
    expect(isStageUnlocked(CAMPAIGN_STAGES, first.id, [])).toBe(true);
  });

  it('keeps the first stage unlocked whatever the record holds', () => {
    expect(isStageUnlocked(CAMPAIGN_STAGES, first.id, [third.id])).toBe(true);
  });

  // AC-011 / REQ-010 — with nothing cleared, everything past the first is shut
  it('locks every later stage while the record is empty', () => {
    expect(isStageUnlocked(CAMPAIGN_STAGES, second.id, [])).toBe(false);
    expect(isStageUnlocked(CAMPAIGN_STAGES, third.id, [])).toBe(false);
  });

  // AC-011 / REQ-010 — clearing one stage opens exactly the next one, not the
  // rest of the campaign. Both halves are asserted together because opening too
  // much and opening too little are different faults with the same shape.
  it('opens only the stage immediately after the one that was cleared', () => {
    const cleared = [first.id];

    expect(isStageUnlocked(CAMPAIGN_STAGES, second.id, cleared)).toBe(true);
    expect(isStageUnlocked(CAMPAIGN_STAGES, third.id, cleared)).toBe(false);
  });

  // REQ-010 is written about the immediately preceding stage, so a record that
  // skipped one must not open the later stage — otherwise a hand-edited save
  // walks past the campaign.
  it('leaves a stage locked when its immediate predecessor is missing', () => {
    expect(isStageUnlocked(CAMPAIGN_STAGES, third.id, [first.id])).toBe(false);
  });

  it('unlocks a stage whose predecessor is cleared even out of order', () => {
    expect(isStageUnlocked(CAMPAIGN_STAGES, third.id, [second.id])).toBe(true);
  });

  // The answer is relative to the ordering it was asked about. A stage the
  // ordering does not contain has no predecessor to check, and treating that as
  // "no predecessor required" would make it open — the first-stage rule
  // applying to a stage that is not the first.
  it('locks a stage absent from the ordering it is judged against', () => {
    expect(isStageUnlocked([], first.id, [first.id])).toBe(false);
  });
});

describe('recordStageResult', () => {
  // AC-012 / REQ-011 — a win is what writes progress
  it('adds the stage identifier on a victory', () => {
    const result = recordStageResult(stateWith([]), first.id, 'victory');

    expect(result.clearedStages).toEqual([first.id]);
  });

  // AC-012 / REQ-011 — a cleared stage stays replayable, so this path is normal
  // rather than exceptional. Appending blindly would stack the same identifier
  // once per playthrough: no error, nothing visible, and a save document that
  // grows with the number of times the player enjoyed a stage.
  it('holds an identifier once however often the stage is cleared', () => {
    const once = recordStageResult(stateWith([]), first.id, 'victory');
    const twice = recordStageResult(once, first.id, 'victory');

    expect(twice.clearedStages).toEqual([first.id]);
  });

  // AC-013 / REQ-012
  it('records nothing on a defeat', () => {
    const result = recordStageResult(stateWith([]), first.id, 'defeat');

    expect(result.clearedStages).toEqual([]);
  });

  it('leaves an existing record untouched on a defeat', () => {
    const result = recordStageResult(stateWith([first.id]), second.id, 'defeat');

    expect(result.clearedStages).toEqual([first.id]);
  });

  // The rule lives here rather than behind an `if (victory)` at the call site.
  // In a scene that condition is unmeasurable — REQ-012 would become "did the
  // scene remember the branch", which no unit test can ask (design.md §5).
  it('records nothing while the battle is still ongoing', () => {
    const result = recordStageResult(stateWith([]), first.id, 'ongoing');

    expect(result.clearedStages).toEqual([]);
  });

  // AC-012 / AC-013 / REQ-020 — the argument is derived from, never written to
  it('does not modify the state it was given on a victory', () => {
    const before = stateWith([]);

    recordStageResult(before, first.id, 'victory');

    expect(before.clearedStages).toEqual([]);
  });

  it('does not modify the state it was given on a defeat', () => {
    const before = stateWith([first.id]);

    recordStageResult(before, second.id, 'defeat');

    expect(before.clearedStages).toEqual([first.id]);
  });

  it('carries every other field across unchanged', () => {
    const before = { ...stateWith([]), settlementGold: 250 };

    expect(recordStageResult(before, first.id, 'victory').settlementGold).toBe(250);
  });
});

describe('difficultyMetric', () => {
  // Total health pressure: base plus scheduled enemies. Hand checked for the
  // three encounter-based schedules (grunt 30, brute 90, ranger 22,
  // juggernaut 130, overseer 40), independent of the implementation.
  it('retains the original forest trilogy health metrics', () => {
    const metrics = CAMPAIGN_STAGES.slice(0, 3).map((stage) =>
      difficultyMetric(stage, ENEMY_DEFINITIONS),
    );

    expect(metrics).toEqual([1728, 4500, 8144]);
  });

  // AC-017 / REQ-016 — strictly, so that two identically-weighted stages do not
  // read as a curve. This is what catches a later edit that makes a stage
  // easier than the one before it.
  it('increases strictly within the original forest chapter', () => {
    const metrics = CAMPAIGN_STAGES.slice(0, 3).map((stage) =>
      difficultyMetric(stage, ENEMY_DEFINITIONS),
    );

    for (let index = 1; index < metrics.length; index += 1) {
      expect(metrics[index]).toBeGreaterThan(metrics[index - 1]);
    }
  });

  // REQ-016 closes the input set to two terms. Removing the enemy base from a
  // stage must move the figure by exactly that base's hit points — if it does
  // not, the metric is reading something the requirement did not name.
  it('counts the enemy base hit points as one whole term', () => {
    const withoutBase = difficultyMetric({ ...first, enemyBaseHp: 0 }, ENEMY_DEFINITIONS);

    expect(difficultyMetric(first, ENEMY_DEFINITIONS) - withoutBase).toBe(first.enemyBaseHp);
  });

  // The other term, isolated the same way: an empty schedule leaves only the
  // base, so any excess would be a third term REQ-016 does not allow.
  it('counts nothing but the enemy base when the schedule is empty', () => {
    expect(difficultyMetric({ ...second, waves: [] }, ENEMY_DEFINITIONS)).toBe(second.enemyBaseHp);
  });

  // Each wave entry contributes its count multiplied by its kind's hit points,
  // so a wave of three is worth three of the same enemy arriving separately.
  it('multiplies a wave entry by its count', () => {
    const stage = {
      ...first,
      enemyBaseHp: 0,
      waves: [{ spawnAtMs: 0, enemyKind: 'brute' as const, count: 4 }],
    };

    expect(difficultyMetric(stage, ENEMY_DEFINITIONS)).toBe(
      4 * ENEMY_DEFINITIONS.brute.baseStats.maxHp,
    );
  });
});

/**
 * AC-022 clause (a): the placeholder dimensions two enemy kinds carry must
 * differ from one another.
 *
 * Housed in this file rather than under a `tests/data/` of its own, because
 * C-10 draws the line at where a test *lives*, not at what it reads: a systems
 * test consulting the content registries is the established practice here — the
 * difficulty-metric block above already reads `ENEMY_DEFINITIONS` and
 * `CAMPAIGN_STAGES` — whereas a test file dedicated to a data module is the
 * thing C-10 prohibits. The two agree, so this belongs beside the other
 * assertions that read the same registry.
 *
 * REQ-002 states the distinctness as part of the requirement, so what is
 * asserted is the clause itself and not a stricter rule of the test's own
 * invention — two kinds declaring the same size would satisfy a fields-only
 * requirement while leaving the problem the 0.3.0 amendment exists to fix
 * exactly as it was.
 *
 * The literals from design.md §4.1 (40x48 and 56x66) are deliberately NOT
 * asserted. REQ-002 requires the sizes to differ, not to be any particular
 * pair, and pinning them here would make a legitimate readability adjustment
 * fail a criterion that never asked for them. `difficultyMetric` pins its three
 * figures because REQ-016 closes its formula; this requirement closes nothing
 * of the sort.
 *
 * Clause (b) — that a kind's declared size is the size actually generated —
 * cannot be answered here. It needs a running renderer, so it lives on the
 * manual axis (tech.md @NAV:DEC-VERIFY-DUAL); the whole reason that clause
 * exists is that a declared value can sit inert while every unit test passes.
 */
describe('enemy placeholder dimensions (AC-022)', () => {
  it('gives every kind a positive width and height', () => {
    for (const kind of ENEMY_KINDS) {
      const definition = ENEMY_DEFINITIONS[kind];

      expect(typeof definition.width, `${kind}.width`).toBe('number');
      expect(typeof definition.height, `${kind}.height`).toBe('number');
      expect(definition.width, `${kind}.width`).toBeGreaterThan(0);
      expect(definition.height, `${kind}.height`).toBeGreaterThan(0);
    }
  });

  // Every pair rather than the two kinds that exist today: adding a third kind
  // that duplicates an existing size is the same defect, and this way it fails
  // when that happens instead of when someone remembers to extend the test.
  it('carries a different width and height for every pair of kinds', () => {
    for (const [index, kind] of ENEMY_KINDS.entries()) {
      for (const other of ENEMY_KINDS.slice(index + 1)) {
        const left = ENEMY_DEFINITIONS[kind];
        const right = ENEMY_DEFINITIONS[other];

        expect(left.width, `${kind} vs ${other} width`).not.toBe(right.width);
        expect(left.height, `${kind} vs ${other} height`).not.toBe(right.height);
      }
    }
  });
});
