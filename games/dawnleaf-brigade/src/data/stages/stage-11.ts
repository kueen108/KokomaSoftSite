import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_11: StageConfig = {
  id: 'stage-11',
  displayName: translate('세 개의 마지막 봉인'),
  order: 11,
  allyBaseHp: 240,
  enemyBaseHp: 1020,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'sentinel', count: 8 },
    { spawnAtMs: 10500, enemyKind: 'wraith', count: 12 },
    { spawnAtMs: 19000, enemyKind: 'bomber', count: 12 },
    { spawnAtMs: 27500, enemyKind: 'juggernaut', count: 12 },
    { spawnAtMs: 36000, enemyKind: 'overseer', count: 6 },
    { spawnAtMs: 44500, enemyKind: 'sentinel', count: 10 },
    { spawnAtMs: 53000, enemyKind: 'wraith', count: 14 },
    { spawnAtMs: 61500, enemyKind: 'bomber', count: 14 },
  ],
};
