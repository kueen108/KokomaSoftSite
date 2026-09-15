import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';
export const MAGE: UnitDefinition = {
  type: 'mage',
  displayName: translate('올빼미 화염술사'),
  baseStats: { maxHp: 44, attackDamage: 18, attackIntervalMs: 1900, speed: 48 },
  attackRange: 290,
  damageReductionPercent: 0,
  summonCost: 65,
  summonCooldownMs: 6000,
  unlockCost: 140,
  upgradeBaseCost: 105,
  textureKey: 'tex-ally-mage',
  tintColor: 0xee8c55,
  width: 42,
  height: 52,
};
