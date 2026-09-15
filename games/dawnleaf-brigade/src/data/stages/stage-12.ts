import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_12: StageConfig = {
  id: 'stage-12',
  displayName: translate('새벽을 여는 왕좌'),
  order: 12,
  allyBaseHp: 260,
  enemyBaseHp: 1085,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'sentinel', count: 7 },
    { spawnAtMs: 10500, enemyKind: 'bomber', count: 12 },
    { spawnAtMs: 19000, enemyKind: 'wraith', count: 12 },
    { spawnAtMs: 27500, enemyKind: 'overseer', count: 6 },
    { spawnAtMs: 36000, enemyKind: 'juggernaut', count: 9 },
    { spawnAtMs: 44500, enemyKind: 'sentinel', count: 7 },
    { spawnAtMs: 53000, enemyKind: 'bomber', count: 14 },
    { spawnAtMs: 61500, enemyKind: 'wraith', count: 14 },
    { spawnAtMs: 70000, enemyKind: 'overseer', count: 6 },
    { spawnAtMs: 78500, enemyKind: 'sentinel', count: 8 },
  ],
};
