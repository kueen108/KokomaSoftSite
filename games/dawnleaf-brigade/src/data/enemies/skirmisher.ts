import { translate } from '../../i18n';
import type { EnemyDefinition } from '../../types/stage';

/**
 * The skirmisher: the first ranged enemy (SPEC-UNIT-ROSTER-001
 * REQ-005/REQ-007/REQ-011), mirroring the archer on the ally side. Fragile,
 * like its ally-side counterpart — a ranged threat that also tanked well
 * would leave no reason to summon a guardian instead of trading hits with it.
 */
export const SKIRMISHER: EnemyDefinition = {
  kind: 'skirmisher',
  displayName: translate('척후병'),
  baseStats: {
    maxHp: 22,
    attackDamage: 6,
    attackIntervalMs: 1300,
    speed: 65,
  },
  attackRange: 240,
  damageReductionPercent: 0,
  textureKey: 'tex-enemy-skirmisher',
  tintColor: 0xd9843c,
  // Provisional (design.md §5) — a value the roster runs on, not one measured
  // by play. Distinct from every other enemy's pair, same reasoning as
  // `enemy-grunt`/`enemy-brute` (REQ-002 precedent).
  width: 34,
  height: 44,
};
