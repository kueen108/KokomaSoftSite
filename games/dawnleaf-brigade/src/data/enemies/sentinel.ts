import { translate } from '../../i18n/index';
import type { EnemyDefinition } from '../../types/stage';
export const SENTINEL: EnemyDefinition = {
  kind: 'sentinel',
  displayName: translate('멧돼지 파수병'),
  baseStats: { maxHp: 190, attackDamage: 14, attackIntervalMs: 1900, speed: 32 },
  attackRange: 0,
  damageReductionPercent: 45,
  textureKey: 'tex-enemy-sentinel',
  tintColor: 0xb392cb,
  width: 64,
  height: 72,
};
