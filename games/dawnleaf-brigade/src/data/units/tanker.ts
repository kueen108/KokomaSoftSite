import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';

/**
 * The tanker: health-weighted melee ally, unlocked from the first battle.
 *
 * One type has to be available before any settlement gold exists, or a new
 * player has nothing to summon and REQ-001 can never be exercised — hence
 * `unlockCost: 0` here and a real cost on the dealer.
 *
 * Deliberately no `TEXTURE` import: the texture key lives beside the unit it
 * belongs to (C-11), and pulling `config/gameConfig` in here would drag Phaser
 * into a module the node-environment unit tests import.
 */
export const TANKER: UnitDefinition = {
  type: 'tanker',
  displayName: translate('곰 수호병'),
  baseStats: {
    maxHp: 90,
    attackDamage: 5,
    attackIntervalMs: 1200,
    speed: 55,
  },
  // Melee, unchanged from today (SPEC-UNIT-ROSTER-001 REQ-003).
  attackRange: 0,
  damageReductionPercent: 0,
  summonCost: 25,
  summonCooldownMs: 3000,
  unlockCost: 0,
  upgradeBaseCost: 60,
  textureKey: 'tex-ally-tanker',
  tintColor: 0x4f8fd0,
  // The size the ally units have had since Phase 2, declared here instead of
  // written as a literal in BattleScene. Unchanged on purpose: this SPEC moves
  // where the number lives, it does not change the number.
  width: 34,
  height: 46,
};
