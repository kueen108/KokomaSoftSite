import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_9: StageConfig = {
  id: 'stage-9',
  displayName: translate('용광로의 문'),
  order: 9,
  allyBaseHp: 240,
  enemyBaseHp: 890,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'sentinel', count: 8 },
    { spawnAtMs: 10500, enemyKind: 'bomber', count: 10 },
    { spawnAtMs: 19000, enemyKind: 'wraith', count: 8 },
    { spawnAtMs: 27500, enemyKind: 'juggernaut', count: 10 },
    { spawnAtMs: 36000, enemyKind: 'bomber', count: 12 },
    { spawnAtMs: 44500, enemyKind: 'overseer', count: 5 },
    { spawnAtMs: 53000, enemyKind: 'sentinel', count: 8 },
    { spawnAtMs: 61500, enemyKind: 'bomber', count: 12 },
  ],
};
