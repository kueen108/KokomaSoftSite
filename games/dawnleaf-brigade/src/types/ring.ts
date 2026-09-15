/**
 * Ring contracts shared by `systems/`, `scenes/` and `data/`.
 *
 * Every field is `readonly`, following `types/unit.ts` and `types/combat.ts`:
 * `src/systems/` derives new state from its arguments instead of mutating them
 * (REQ-015), and the compiler is what makes that hold rather than reviewer
 * attention.
 */

/**
 * The rings this build knows about.
 *
 * Two, and deliberately so: the mana ring changes what an attack costs and the
 * rupture ring changes what it does, which is the smallest pair that makes the
 * choice between them mean something (spec.md §2).
 */
export type RingType = 'mana' | 'rupture';

/** Every ring type, in the order the upgrade screen and the save list them. */
export const RING_TYPES: readonly RingType[] = ['mana', 'rupture'];

/**
 * The attack number a ring moves. One ring touches exactly one.
 *
 * A ring able to move both would blur the two rings into one "makes attacks
 * better" effect, and AC-005's check that the untouched number stays at its
 * base value would become accidentally rather than structurally true.
 */
export type RingAxis = 'attackCost' | 'projectileDamage';

/**
 * One ring's immutable definition.
 *
 * Costs live here rather than in `balance.ts`, matching `UnitDefinition`: a
 * ring is described in exactly one file (C-5).
 */
export interface RingDefinition {
  readonly type: RingType;
  readonly displayName: string;
  readonly axis: RingAxis;
  /** Multiplier applied to `axis` at upgrade level zero. */
  readonly baseMultiplier: number;
  /** Added to the multiplier per level. Signed — negative on a falling axis. */
  readonly multiplierStepPerLevel: number;
  /**
   * Highest reachable upgrade level.
   *
   * A ceiling rather than a floor on the value, because the mana ring falls:
   * clamping the cost at some minimum would leave upgrades that charge gold and
   * change nothing, whereas refusing the upgrade at the ceiling says so
   * (REQ-011).
   */
  readonly maxLevel: number;
  readonly unlockCost: number;
  readonly upgradeBaseCost: number;
}

/** The Paladog's attack numbers after the equipped ring has been applied. */
export interface AttackParams {
  readonly attackCost: number;
  readonly projectileDamage: number;
}
