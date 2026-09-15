import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_10: StageConfig = {
  id: 'stage-10',
  displayName: translate('별이 잠든 회랑'),
  order: 10,
  allyBaseHp: 240,
  enemyBaseHp: 955,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'wraith', count: 10 },
    { spawnAtMs: 10500, enemyKind: 'sentinel', count: 8 },
    { spawnAtMs: 19000, enemyKind: 'bomber', count: 10 },
    { spawnAtMs: 27500, enemyKind: 'overseer', count: 6 },
    { spawnAtMs: 36000, enemyKind: 'wraith', count: 12 },
    { spawnAtMs: 44500, enemyKind: 'sentinel', count: 8 },
    { spawnAtMs: 53000, enemyKind: 'bomber', count: 12 },
  ],
};
