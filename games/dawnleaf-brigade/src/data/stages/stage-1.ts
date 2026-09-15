import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
/** Larger marching groups meet the player across the extended battlefield. */
export const STAGE_ONE: StageConfig = {
  id: 'stage-1',
  displayName: translate('새벽의 숲길'),
  order: 1,
  allyBaseHp: 160,
  enemyBaseHp: 260,
  waves: [
    { spawnAtMs: 3000, enemyKind: 'grunt', count: 4 },
    { spawnAtMs: 10000, enemyKind: 'grunt', count: 6 },
    { spawnAtMs: 18000, enemyKind: 'brute', count: 2 },
    { spawnAtMs: 21000, enemyKind: 'grunt', count: 6 },
    { spawnAtMs: 31000, enemyKind: 'skirmisher', count: 4 },
    { spawnAtMs: 34000, enemyKind: 'grunt', count: 6 },
    { spawnAtMs: 43000, enemyKind: 'brute', count: 4 },
    { spawnAtMs: 46000, enemyKind: 'grunt', count: 6 },
  ],
};
