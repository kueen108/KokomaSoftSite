import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';
export const LANCER: UnitDefinition = {
  type: 'lancer',
  displayName: translate('늑대 창기사'),
  baseStats: { maxHp: 110, attackDamage: 15, attackIntervalMs: 1300, speed: 76 },
  attackRange: 100,
  damageReductionPercent: 20,
  summonCost: 55,
  summonCooldownMs: 5200,
  unlockCost: 100,
  upgradeBaseCost: 95,
  textureKey: 'tex-ally-lancer',
  tintColor: 0xa8cfed,
  width: 46,
  height: 56,
};
