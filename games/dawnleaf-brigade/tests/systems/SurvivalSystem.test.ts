import { describe, expect, it } from 'vitest';

import { ENEMY_DEFINITIONS } from '../../src/data/enemies';
import { SURVIVAL_CONFIG } from '../../src/data/modes/survival';
import {
  recordSurvivalRun,
  survivalWave,
  survivalStats,
  survivalWaveWeight,
  survivalWavesDue,
} from '../../src/systems/SurvivalSystem';
import type { SurvivalSpawn } from '../../src/types/mode';
import type { PersistedState } from '../../src/types/save';
import type { EnemyKind } from '../../src/types/stage';

/**
 * The wave numbers design.md §3.2 worked out by hand, and the counts it
 * arrived at.
 *
 * Written as literals rather than recomputed from the rule. A test that
 * reimplements `floor(n / 3)` and compares the two agrees with the
 * implementation whenever both are wrong in the same way, which is exactly the
 * case worth catching. SPEC-CAMPAIGN-STAGE-001 AC-017 fixed its expectations
 * the same way and for the same reason.
 */
const WAVE_EXPECTATIONS = [
  { index: 1, total: 4, grunt: 3, brute: 1, weight: 180 },
  { index: 2, total: 5, grunt: 4, brute: 1, weight: 210 },
  { index: 3, total: 6, grunt: 4, brute: 2, weight: 300 },
  { index: 4, total: 7, grunt: 5, brute: 2, weight: 330 },
  { index: 5, total: 8, grunt: 6, brute: 2, weight: 360 },
  { index: 6, total: 9, grunt: 6, brute: 3, weight: 450 },
  { index: 7, total: 10, grunt: 7, brute: 3, weight: 480 },
  { index: 8, total: 11, grunt: 8, brute: 3, weight: 510 },
  { index: 9, total: 12, grunt: 8, brute: 4, weight: 600 },
] as const;

/** How many of one kind a generated wave sends, counting every group. */
function countOf(wave: readonly SurvivalSpawn[], kind: EnemyKind): number {
  return wave
    .filter((spawn) => spawn.enemyKind === kind)
    .reduce((total, spawn) => total + spawn.count, 0);
}

function totalOf(wave: readonly SurvivalSpawn[]): number {
  return wave.reduce((total, spawn) => total + spawn.count, 0);
}

function stateWith(survivalBestWave: number): PersistedState {
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
    survivalBestWave,
    bossesCleared: [],
  };
}

describe('survivalWave', () => {
  // AC-007 — every count in design.md §3.2, checked as one run over all nine
  // numbers. The whole table rather than a sample: the brute count only starts
  // moving at 3 and only reaches 3 at 9, so a rule that is wrong about the step
  // pattern can agree with any two or three rows picked out of it.
  it.each(WAVE_EXPECTATIONS)(
    'sends $total enemies at wave $index, $brute of them brutes',
    ({ index, total, grunt, brute }) => {
      const wave = survivalWave(index, SURVIVAL_CONFIG);

      expect(totalOf(wave)).toBe(total);
      expect(countOf(wave, 'brute')).toBe(brute);
      expect(countOf(wave, 'grunt')).toBe(grunt);
    },
  );

  // REQ-006 — the remainder are grunts, so no third kind may appear. Asserted
  // separately because the counts above would still pass if a wave also carried
  // some other kind alongside the right number of grunts and brutes.
  it('sends nothing but grunts and brutes', () => {
    for (const { index } of WAVE_EXPECTATIONS) {
      for (const spawn of survivalWave(index, SURVIVAL_CONFIG)) {
        expect(['grunt', 'brute']).toContain(spawn.enemyKind);
      }
    }
  });

  // REQ-006 — a pure function of the index and the configuration, so the same
  // wave number is the same wave every time. This is what makes a record
  // comparable between runs: a random wave would leave two scores differing for
  // reasons that are not the player's (C-9).
  it('generates the same wave for the same number every time', () => {
    expect(survivalWave(7, SURVIVAL_CONFIG)).toEqual(survivalWave(7, SURVIVAL_CONFIG));
  });

  // The brute period is read from the configuration rather than hardcoded, so
  // the rule can be asked about a different ratio than the one shipped. Every
  // second enemy a brute at wave 4 is two brutes, not one.
  it('takes the brute period from the configuration it is given', () => {
    const wave = survivalWave(4, { ...SURVIVAL_CONFIG, brutePeriod: 2 });

    expect(countOf(wave, 'brute')).toBe(3);
    expect(countOf(wave, 'grunt')).toBe(4);
  });
});

describe('survivalWaveWeight', () => {
  // AC-008 — the exact figures, not merely an increase. An increase check alone
  // passes for any rising function, including one weighted by attack damage or
  // speed, and REQ-007 closed its inputs precisely so that the measuring device
  // could not drift onto some other quantity unnoticed. These nine numbers come
  // out of that formula and no other.
  it.each(WAVE_EXPECTATIONS)('weighs wave $index at $weight', ({ index, weight }) => {
    expect(survivalWaveWeight(index, SURVIVAL_CONFIG, ENEMY_DEFINITIONS)).toBe(weight);
  });

  // AC-008 / REQ-007 — strictly increasing, which is the property standing in
  // for a difficulty judgement no command can make (spec.md §1).
  it('rises strictly from each wave to the next', () => {
    const weights = WAVE_EXPECTATIONS.map(({ index }) =>
      survivalWaveWeight(index, SURVIVAL_CONFIG, ENEMY_DEFINITIONS),
    );

    for (let i = 1; i < weights.length; i += 1) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
    }
  });

  // REQ-007 — hit points and nothing else. Handed a roster whose brute is worth
  // a different number, the weight has to move by exactly that difference: at
  // wave 9 three brutes at 100 instead of 90 is 30 more. A formula that also
  // read speed or damage would not track it.
  it('reads hit points from the roster it is given and nothing else', () => {
    const heavier = {
      ...ENEMY_DEFINITIONS,
      brute: {
        ...ENEMY_DEFINITIONS.brute,
        baseStats: { ...ENEMY_DEFINITIONS.brute.baseStats, maxHp: 100 },
      },
    };

    expect(survivalWaveWeight(9, SURVIVAL_CONFIG, heavier)).toBe(640);
  });
});

describe('survivalWavesDue', () => {
  const { waveIntervalMs } = SURVIVAL_CONFIG;

  // The first wave is due at once, or the run opens on an empty screen for a
  // whole interval and the player has nothing to read as "it started".
  it('makes the first wave due on the opening frame', () => {
    expect(survivalWavesDue(SURVIVAL_CONFIG, 0, 16)).toEqual([1]);
  });

  // The same half-open window `dueSpawns` uses, and for the same reason: frame
  // deltas wobble, so an entry compared against a single timestamp is either
  // missed when a frame steps over it or reported twice on the next one.
  it('reports each wave in exactly one frame window', () => {
    expect(survivalWavesDue(SURVIVAL_CONFIG, 0, waveIntervalMs)).toEqual([1]);
    expect(survivalWavesDue(SURVIVAL_CONFIG, waveIntervalMs, waveIntervalMs + 16)).toEqual([2]);
  });

  // A frame long enough to step over two spawn times must report both. Dropping
  // one raises no error — the run simply gets quieter than it should, which is
  // indistinguishable from the wave rule being wrong.
  it('reports every wave a long frame stepped over', () => {
    expect(survivalWavesDue(SURVIVAL_CONFIG, waveIntervalMs, waveIntervalMs * 3 + 1)).toEqual([
      2, 3, 4,
    ]);
  });

  it('reports nothing between two spawn times', () => {
    expect(survivalWavesDue(SURVIVAL_CONFIG, 100, 200)).toEqual([]);
  });
});

describe('recordSurvivalRun', () => {
  // AC-011 — a run that beat the stored best replaces it.
  it('replaces the stored best with a higher run record', () => {
    expect(recordSurvivalRun(stateWith(5), 7).survivalBestWave).toBe(7);
  });

  // AC-011 — REQ-010 says "only when greater", so an equal run changes nothing.
  // The stored number looks identical either way, which is why this case is
  // worth its own test: `>=` would write the save again for no change, and the
  // difference between the two rules would never show on screen.
  it('leaves the stored best untouched when the run only equalled it', () => {
    expect(recordSurvivalRun(stateWith(5), 5).survivalBestWave).toBe(5);
  });

  // AC-011 — the case that matters most. Overwriting unconditionally would let
  // one poor run erase a record built over many, with no error and nothing to
  // show the player but a smaller number.
  it('leaves the stored best untouched when the run fell short', () => {
    expect(recordSurvivalRun(stateWith(5), 3).survivalBestWave).toBe(5);
  });

  // REQ-023 — derives a new state rather than editing the one it was handed.
  it('does not modify the state it was given', () => {
    const before = stateWith(5);

    recordSurvivalRun(before, 9);

    expect(before.survivalBestWave).toBe(5);
  });

  // The rest of the save has to come through untouched: this function is called
  // at settlement, right after the gold was added, so dropping a field here
  // would lose that battle's earnings.
  it('carries every other field through unchanged', () => {
    const before: PersistedState = {
      ...stateWith(5),
      settlementGold: 250,
      clearedStages: ['stage-1'],
    };
    const after = recordSurvivalRun(before, 9);

    expect(after.settlementGold).toBe(250);
    expect(after.clearedStages).toEqual(['stage-1']);
  });
});

describe('late survival pressure', () => {
  it('bounds each wave while adding ranged, armored and support threats', () => {
    for (const index of [12, 20, 100]) {
      const wave = survivalWave(index, SURVIVAL_CONFIG);
      expect(totalOf(wave)).toBeLessThanOrEqual(30);
      expect(countOf(wave, 'skirmisher')).toBeGreaterThan(0);
      expect(countOf(wave, 'juggernaut')).toBeGreaterThan(0);
      expect(countOf(wave, 'overseer')).toBeGreaterThan(0);
      expect(countOf(wave, 'bomber')).toBeGreaterThan(0);
      expect(countOf(wave, 'wraith')).toBeGreaterThan(0);
    }
  });
  it('increases pressure after the sprite count cap, preserving early waves', () => {
    const base = ENEMY_DEFINITIONS.brute.baseStats;
    expect(survivalStats(base, 9)).toEqual(base);
    expect(survivalStats(base, 20).maxHp).toBeGreaterThan(survivalStats(base, 12).maxHp);
    expect(survivalWaveWeight(30, SURVIVAL_CONFIG, ENEMY_DEFINITIONS)).toBeGreaterThan(
      survivalWaveWeight(20, SURVIVAL_CONFIG, ENEMY_DEFINITIONS),
    );
  });
});
