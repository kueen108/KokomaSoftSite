import { translate } from '../../i18n/index';
import type { RingDefinition } from '../../types/ring';

/**
 * The mana ring: lowers what one mace attack costs (spec.md §2).
 *
 * Aimed at the constraint `balance.ts` already named. Sustained firepower is
 * bounded by mana, not by the cooldown — 30 regen against a cost of 20 is 1.5
 * shots per second, under a cooldown ceiling of 2.0 — so lowering the cost is
 * the one change the player actually feels. At level 0 the cost falls to 16,
 * which is 1.875 shots per second: still mana-bound, so the ring is still doing
 * the work. At level 5 it is 11, or 2.7 shots per second, where the cooldown
 * takes over as the binding constraint. That is why `maxLevel` is 5 — past it
 * the ring would charge gold for a number nothing reads.
 */
export const MANA_RING: RingDefinition = {
  type: 'mana',
  displayName: translate('마나의 반지'),
  axis: 'attackCost',
  baseMultiplier: 0.8,
  multiplierStepPerLevel: -0.05,
  maxLevel: 5,
  unlockCost: 120,
  upgradeBaseCost: 80,
};
