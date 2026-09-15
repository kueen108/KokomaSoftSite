import type { UnitStats } from '../types/unit';
import type { SurvivalConfig, SurvivalSpawn } from '../types/mode';
import type { PersistedState } from '../types/save';
import type { EnemyDefinition, EnemyKind } from '../types/stage';

/** Four enemies open the run; later waves add mixed roles and cap at 30. */
export function survivalWave(waveIndex: number, config: SurvivalConfig): readonly SurvivalSpawn[] {
  const total = Math.min(30, Math.max(1, waveIndex) + 3);
  const brutes = Math.floor(total / config.brutePeriod);
  const skirmishers = waveIndex >= 10 ? Math.min(4, Math.floor(waveIndex / 6)) : 0;
  const juggernauts = waveIndex >= 12 ? Math.min(4, Math.floor((waveIndex - 8) / 4)) : 0;
  const overseers = waveIndex >= 12 ? 1 : 0;
  const bombers = waveIndex >= 10 ? Math.min(4, Math.floor((waveIndex - 6) / 4)) : 0;
  const wraiths = waveIndex >= 12 ? Math.min(4, Math.floor((waveIndex - 8) / 4)) : 0;
  const sentinels = waveIndex >= 16 ? Math.min(3, Math.floor((waveIndex - 12) / 4)) : 0;
  const grunts = Math.max(
    0,
    total - brutes - skirmishers - juggernauts - overseers - bombers - wraiths - sentinels,
  );
  const groups: readonly SurvivalSpawn[] = [
    { enemyKind: 'grunt', count: grunts },
    { enemyKind: 'brute', count: brutes },
    { enemyKind: 'skirmisher', count: skirmishers },
    { enemyKind: 'juggernaut', count: juggernauts },
    { enemyKind: 'overseer', count: overseers },
    { enemyKind: 'bomber', count: bombers },
    { enemyKind: 'wraith', count: wraiths },
    { enemyKind: 'sentinel', count: sentinels },
  ];
  return groups.filter((spawn) => spawn.count > 0);
}

export function survivalWaveWeight(
  waveIndex: number,
  config: SurvivalConfig,
  enemies: Readonly<Record<EnemyKind, EnemyDefinition>>,
): number {
  return survivalWave(waveIndex, config).reduce(
    (total, spawn) =>
      total + spawn.count * survivalStats(enemies[spawn.enemyKind].baseStats, waveIndex).maxHp,
    0,
  );
}

export function survivalWavesDue(
  config: SurvivalConfig,
  prevElapsedMs: number,
  nowElapsedMs: number,
): number[] {
  const due: number[] = [];
  const first = Math.ceil(prevElapsedMs / config.waveIntervalMs) + 1;

  for (let index = first; (index - 1) * config.waveIntervalMs < nowElapsedMs; index += 1) {
    due.push(index);
  }

  return due;
}

export function recordSurvivalRun(state: PersistedState, runRecord: number): PersistedState {
  if (runRecord <= state.survivalBestWave) {
    return state;
  }

  return { ...state, survivalBestWave: runRecord };
}

/** Beyond wave 9, health and attack keep rising without unbounded sprite counts. */
export function survivalStats(base: UnitStats, waveIndex: number): UnitStats {
  const scale = 1 + Math.max(0, waveIndex - 9) * 0.14;
  return {
    ...base,
    maxHp: Math.round(base.maxHp * scale),
    attackDamage: Math.round(base.attackDamage * scale),
  };
}
