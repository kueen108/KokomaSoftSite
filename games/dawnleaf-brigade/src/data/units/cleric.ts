import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';
export const CLERIC: UnitDefinition = {
  type: 'cleric',
  displayName: translate('사슴 치유사'),
  baseStats: { maxHp: 65, attackDamage: 5, attackIntervalMs: 1700, speed: 52 },
  attackRange: 230,
  damageReductionPercent: 10,
  summonCost: 60,
  summonCooldownMs: 6500,
  unlockCost: 120,
  upgradeBaseCost: 100,
  textureKey: 'tex-ally-cleric',
  tintColor: 0x80e6af,
  width: 44,
  height: 54,
};
