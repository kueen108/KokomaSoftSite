import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_8: StageConfig = {
  id: 'stage-8',
  displayName: translate('불씨를 품은 대장간'),
  order: 8,
  allyBaseHp: 220,
  enemyBaseHp: 825,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'bomber', count: 8 },
    { spawnAtMs: 10500, enemyKind: 'sentinel', count: 6 },
    { spawnAtMs: 19000, enemyKind: 'overseer', count: 4 },
    { spawnAtMs: 27500, enemyKind: 'bomber', count: 12 },
    { spawnAtMs: 36000, enemyKind: 'brute', count: 12 },
    { spawnAtMs: 44500, enemyKind: 'sentinel', count: 6 },
    { spawnAtMs: 53000, enemyKind: 'bomber', count: 12 },
  ],
};
