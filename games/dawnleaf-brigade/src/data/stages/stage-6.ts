import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_6: StageConfig = {
  id: 'stage-6',
  displayName: translate('빙결의 종탑'),
  order: 6,
  allyBaseHp: 220,
  enemyBaseHp: 695,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'sentinel', count: 4 },
    { spawnAtMs: 10500, enemyKind: 'wraith', count: 8 },
    { spawnAtMs: 19000, enemyKind: 'skirmisher', count: 8 },
    { spawnAtMs: 27500, enemyKind: 'sentinel', count: 5 },
    { spawnAtMs: 36000, enemyKind: 'overseer', count: 4 },
    { spawnAtMs: 44500, enemyKind: 'wraith', count: 10 },
    { spawnAtMs: 53000, enemyKind: 'brute', count: 10 },
    { spawnAtMs: 61500, enemyKind: 'sentinel', count: 6 },
  ],
};
