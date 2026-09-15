import { translate } from '../../i18n/index';
import type { StageConfig } from '../../types/stage';
export const STAGE_5: StageConfig = {
  id: 'stage-5',
  displayName: translate('얼어붙은 순례길'),
  order: 5,
  allyBaseHp: 200,
  enemyBaseHp: 630,
  waves: [
    { spawnAtMs: 2000, enemyKind: 'grunt', count: 10 },
    { spawnAtMs: 10500, enemyKind: 'wraith', count: 8 },
    { spawnAtMs: 19000, enemyKind: 'juggernaut', count: 6 },
    { spawnAtMs: 27500, enemyKind: 'wraith', count: 10 },
    { spawnAtMs: 36000, enemyKind: 'brute', count: 8 },
    { spawnAtMs: 44500, enemyKind: 'wraith', count: 10 },
    { spawnAtMs: 53000, enemyKind: 'overseer', count: 4 },
  ],
};
