import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_THREE: StageConfig = {
  id: 'stage-3',
  displayName: translate('황혼의 묘지'),
  order: 3,
  allyBaseHp: 160,
  enemyBaseHp: 500,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'brute', count: 6 },
    { spawnAtMs: 5500, enemyKind: 'skirmisher', count: 6 },
    { spawnAtMs: 13000, enemyKind: 'juggernaut', count: 4 },
    { spawnAtMs: 16000, enemyKind: 'grunt', count: 10 },
    { spawnAtMs: 25000, enemyKind: 'overseer', count: 4 },
    { spawnAtMs: 27000, enemyKind: 'brute', count: 8 },
    { spawnAtMs: 37000, enemyKind: 'skirmisher', count: 8 },
    { spawnAtMs: 41000, enemyKind: 'juggernaut', count: 6 },
    { spawnAtMs: 50000, enemyKind: 'overseer', count: 4 },
    { spawnAtMs: 51000, enemyKind: 'brute', count: 10 },
    { spawnAtMs: 53000, enemyKind: 'skirmisher', count: 8 },
    { spawnAtMs: 55000, enemyKind: 'juggernaut', count: 8 },
    { spawnAtMs: 57000, enemyKind: 'grunt', count: 12 },
    { spawnAtMs: 60000, enemyKind: 'brute', count: 10 },
    { spawnAtMs: 63000, enemyKind: 'juggernaut', count: 6 },
  ],
};
