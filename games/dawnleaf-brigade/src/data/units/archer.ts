import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';

/**
 * The archer: the first ranged ally (SPEC-UNIT-ROSTER-001 REQ-005/REQ-007).
 *
 * Low health on purpose — a unit that can hit without being hit needs a
 * countervailing weakness, or "summon this instead" stops being a trade-off
 * (design.md §5). Its attack range (260) sits a little past the Paladog's
 * aura radius (`AURA_RADIUS` = 220, `balance.ts`), so standing inside the aura
 * for the buff and standing at maximum range are two different positions to
 * choose between rather than the same square.
 */
export const ARCHER: UnitDefinition = {
  type: 'archer',
  displayName: translate('토끼 궁수'),
  baseStats: {
    maxHp: 28,
    attackDamage: 11,
    attackIntervalMs: 1100,
    speed: 60,
  },
  attackRange: 260,
  damageReductionPercent: 0,
  summonCost: 45,
  summonCooldownMs: 4500,
  unlockCost: 0,
  upgradeBaseCost: 95,
  textureKey: 'tex-ally-archer',
  tintColor: 0x5cb85c,
  // Provisional (design.md §5) — a value the roster runs on, not one measured
  // by play. Declared here so the compiler enforces one declaration site
  // (REQ-002 precedent, `SPEC-CAMPAIGN-STAGE-001`), the same rule tanker and
  // dealer already follow.
  width: 32,
  height: 44,
};
