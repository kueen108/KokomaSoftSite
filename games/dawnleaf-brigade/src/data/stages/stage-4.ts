import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_4: StageConfig = {
  id: 'stage-4',
  displayName: translate('흰 숨의 고개'),
  order: 4,
  allyBaseHp: 200,
  enemyBaseHp: 565,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'wraith', count: 6 },
    { spawnAtMs: 10500, enemyKind: 'grunt', count: 10 },
    { spawnAtMs: 19000, enemyKind: 'brute', count: 6 },
    { spawnAtMs: 27500, enemyKind: 'wraith', count: 8 },
    { spawnAtMs: 36000, enemyKind: 'skirmisher', count: 8 },
    { spawnAtMs: 44500, enemyKind: 'wraith', count: 10 },
  ],
};
