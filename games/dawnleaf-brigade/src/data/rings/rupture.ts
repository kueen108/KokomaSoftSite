import { translate } from '../../i18n/index';
import type { RingDefinition } from '../../types/ring';

/**
 * The rupture ring: raises what one mace projectile does (spec.md §2).
 *
 * Chosen because it is observed as a whole number rather than as a feeling. At
 * level 0 the damage is 30 and `ENEMY_HP` is also 30, so the two hits an enemy
 * used to take become one. "It seems stronger" is not something a manual check
 * can pass or fail; "two became one" is. That reading depends on 30 >= 30, so
 * raising `ENEMY_HP` breaks the check as surely as lowering this multiplier —
 * the two numbers have to be read together.
 */
export const RUPTURE_RING: RingDefinition = {
  type: 'rupture',
  displayName: translate('파열의 반지'),
  axis: 'projectileDamage',
  baseMultiplier: 1.5,
  multiplierStepPerLevel: 0.1,
  maxLevel: 5,
  unlockCost: 200,
  upgradeBaseCost: 100,
};
