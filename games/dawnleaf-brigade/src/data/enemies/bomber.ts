import { translate } from '../../i18n/index';
import type { EnemyDefinition } from '../../types/stage';
export const BOMBER: EnemyDefinition = {
  kind: 'bomber',
  displayName: translate('잿불 폭탄병'),
  baseStats: { maxHp: 40, attackDamage: 16, attackIntervalMs: 2300, speed: 52 },
  attackRange: 260,
  damageReductionPercent: 0,
  textureKey: 'tex-enemy-bomber',
  tintColor: 0xea8554,
  width: 38,
  height: 50,
};
