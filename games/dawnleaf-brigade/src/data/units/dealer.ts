import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';

/**
 * The dealer: damage-weighted melee ally, locked until bought (REQ-020).
 *
 * Fragile on purpose. The tanker survives inside or outside the aura, so the
 * aura only makes it faster; the dealer is where the radius actually decides
 * fights, which is the trade the aura exists to create.
 */
export const DEALER: UnitDefinition = {
  type: 'dealer',
  displayName: translate('여우 검사'),
  baseStats: {
    maxHp: 40,
    attackDamage: 14,
    attackIntervalMs: 900,
    speed: 75,
  },
  // Melee, unchanged from today (SPEC-UNIT-ROSTER-001 REQ-003).
  attackRange: 0,
  damageReductionPercent: 0,
  summonCost: 35,
  summonCooldownMs: 4000,
  unlockCost: 0,
  upgradeBaseCost: 80,
  textureKey: 'tex-ally-dealer',
  tintColor: 0xd8a13f,
  // Same size as the tanker, and declared here rather than shared: the two
  // sizes agreeing today is a fact about the artwork, not a rule, and a shared
  // constant would make a later divergence a code change instead of a data one.
  width: 34,
  height: 46,
};
