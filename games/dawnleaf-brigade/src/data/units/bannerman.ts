import { translate } from '../../i18n/index';
import type { UnitDefinition } from '../../types/unit';

/**
 * The bannerman: the first support ally, and the second aura source on the
 * ally side (SPEC-UNIT-ROSTER-001 REQ-014/REQ-015).
 *
 * Its own aura constants — radius and both multipliers — live in
 * `balance.ts`, appended after the Paladog's, and are deliberately smaller
 * across the board (radius 160 vs `AURA_RADIUS` 220; 1.30/1.15 vs 1.5/1.25):
 * the bannerman is a secondary source that fills in while the Paladog is
 * elsewhere, not a stronger alternative to summon instead of standing near
 * the Paladog (design.md §4).
 */
export const BANNERMAN: UnitDefinition = {
  type: 'bannerman',
  displayName: translate('너구리 기수'),
  baseStats: {
    maxHp: 55,
    attackDamage: 6,
    attackIntervalMs: 1300,
    speed: 55,
  },
  attackRange: 0,
  damageReductionPercent: 0,
  summonCost: 55,
  summonCooldownMs: 6000,
  unlockCost: 380,
  upgradeBaseCost: 120,
  textureKey: 'tex-ally-bannerman',
  tintColor: 0xb08d57,
  // Provisional (design.md §5) — see `archer.ts` for the same note.
  width: 34,
  height: 46,
};
