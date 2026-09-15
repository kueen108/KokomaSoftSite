import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_7: StageConfig = {
  id: 'stage-7',
  displayName: translate('재가 내리는 나루'),
  order: 7,
  allyBaseHp: 220,
  enemyBaseHp: 760,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'bomber', count: 6 },
    { spawnAtMs: 10500, enemyKind: 'grunt', count: 12 },
    { spawnAtMs: 19000, enemyKind: 'brute', count: 8 },
    { spawnAtMs: 27500, enemyKind: 'bomber', count: 10 },
    { spawnAtMs: 36000, enemyKind: 'juggernaut', count: 8 },
    { spawnAtMs: 44500, enemyKind: 'bomber', count: 12 },
  ],
};
