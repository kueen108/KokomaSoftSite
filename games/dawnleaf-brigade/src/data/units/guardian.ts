import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';

/**
 * The guardian: the first defense-specialized ally (SPEC-UNIT-ROSTER-001
 * REQ-012). High health and a real damage-reduction percentage, both at the
 * cost of the lowest attack and speed in the roster.
 *
 * Real knockback immunity is deliberately not this unit's job — it is still
 * expressed purely as a stat distribution, exactly like `tanker`/`dealer`
 * (spec.md §5 "Out of Scope — 넉백 메커닉 자체"). `SPEC-UNIT-KNOCKBACK-001`
 * adds a `knockbackImmune` field on top of this one later; this file does not
 * anticipate it.
 */
export const GUARDIAN: UnitDefinition = {
  type: 'guardian',
  displayName: translate('오소리 철벽병'),
  baseStats: {
    maxHp: 170,
    attackDamage: 4,
    attackIntervalMs: 1500,
    speed: 38,
  },
  attackRange: 0,
  damageReductionPercent: 35,
  summonCost: 50,
  summonCooldownMs: 5000,
  unlockCost: 320,
  upgradeBaseCost: 110,
  textureKey: 'tex-ally-guardian',
  tintColor: 0x6b7c93,
  // Provisional (design.md §5) — see `archer.ts` for the same note.
  width: 42,
  height: 50,
};
