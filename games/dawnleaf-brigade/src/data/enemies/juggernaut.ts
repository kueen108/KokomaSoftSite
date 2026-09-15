import { translate } from '../../i18n';
import type { EnemyDefinition } from '../../types/stage';

/**
 * The juggernaut: the first defense-specialized enemy (SPEC-UNIT-ROSTER-001
 * REQ-012), mirroring the guardian on the ally side. High health and a real
 * damage-reduction percentage, at the cost of the lowest speed in the enemy
 * roster.
 *
 * Same knockback note as `guardian.ts`: this unit's defense is entirely a
 * stat distribution here. `SPEC-UNIT-KNOCKBACK-001` adds real immunity later.
 */
export const JUGGERNAUT: EnemyDefinition = {
  kind: 'juggernaut',
  displayName: translate('돌격병'),
  baseStats: {
    maxHp: 130,
    attackDamage: 9,
    attackIntervalMs: 1700,
    speed: 28,
  },
  attackRange: 0,
  damageReductionPercent: 30,
  textureKey: 'tex-enemy-juggernaut',
  tintColor: 0x5c4a3c,
  // Provisional (design.md §5) — see `skirmisher.ts` for the same note.
  width: 58,
  height: 64,
};
