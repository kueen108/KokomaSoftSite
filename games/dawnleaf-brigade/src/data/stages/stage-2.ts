import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_TWO: StageConfig = {
  id: 'stage-2',
  displayName: translate('무너진 관문'),
  order: 2,
  allyBaseHp: 160,
  enemyBaseHp: 380,
  waves: [
    { spawnAtMs: 2500, enemyKind: 'grunt', count: 6 },
    { spawnAtMs: 7000, enemyKind: 'skirmisher', count: 4 },
    { spawnAtMs: 15000, enemyKind: 'brute', count: 6 },
    { spawnAtMs: 19000, enemyKind: 'grunt', count: 8 },
    { spawnAtMs: 28000, enemyKind: 'juggernaut', count: 4 },
    { spawnAtMs: 32000, enemyKind: 'skirmisher', count: 6 },
    { spawnAtMs: 41000, enemyKind: 'overseer', count: 2 },
    { spawnAtMs: 43000, enemyKind: 'brute', count: 6 },
    { spawnAtMs: 49000, enemyKind: 'grunt', count: 10 },
    { spawnAtMs: 52000, enemyKind: 'brute', count: 8 },
    { spawnAtMs: 56000, enemyKind: 'juggernaut', count: 6 },
  ],
};
