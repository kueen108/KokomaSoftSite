import { translate } from '../../i18n/index';
import type { EnemyDefinition } from '../../types/stage';
export const WRAITH: EnemyDefinition = {
  kind: 'wraith',
  displayName: translate('서리 망령'),
  baseStats: { maxHp: 48, attackDamage: 8, attackIntervalMs: 1800, speed: 62 },
  attackRange: 280,
  damageReductionPercent: 0,
  textureKey: 'tex-enemy-wraith',
  tintColor: 0x85def4,
  width: 42,
  height: 54,
};
