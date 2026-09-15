/**
 * Ally-unit contracts shared by `systems/`, `entities/`, `scenes/` and `data/`.
 *
 * Every field is `readonly`, following `types/combat.ts`: `src/systems/`
 * derives new state from its arguments instead of mutating them (REQ-023), and
 * the compiler is what makes that hold rather than reviewer attention.
 */
import type { DamageResult } from './combat';

/**
 * Ally roster. Two melee kinds (Phase 2) plus a ranged, a defense-specialized
 * and a support kind (SPEC-UNIT-ROSTER-001) — five in total. The role split is
 * still expressed purely as a stat distribution: no new entity class exists
 * for any of the three, only two new fields (`attackRange`,
 * `damageReductionPercent`) below.
 */
export type AllyUnitType =
  'tanker' | 'dealer' | 'archer' | 'guardian' | 'bannerman' | 'mage' | 'cleric' | 'lancer';

/** Every ally type, in the order the HUD and the upgrade screen list them. */
export const ALLY_UNIT_TYPES: readonly AllyUnitType[] = [
  'tanker',
  'dealer',
  'archer',
  'guardian',
  'bannerman',
  'mage',
  'cleric',
  'lancer',
];

/** Combat numbers an ally unit actually fights with. */
export interface UnitStats {
  readonly maxHp: number;
  readonly attackDamage: number;
  readonly attackIntervalMs: number;
  readonly speed: number;
}

/**
 * One ally type's immutable definition. Costs live here rather than in
 * `balance.ts` so a unit is described in exactly one place (C-11).
 */
export interface UnitDefinition {
  readonly type: AllyUnitType;
  readonly displayName: string;
  readonly baseStats: UnitStats;
  /**
   * How far this unit can attack without contact, in the same lane-distance
   * units `TargetingSystem` compares. Zero means melee (contact-only) — the
   * behaviour every unit had before this field existed.
   *
   * A sibling of `baseStats` rather than a member of `UnitStats`: the aura
   * multiplies every field of `UnitStats` every frame (REQ-008,
   * `SPEC-UNIT-AURA-001`), and neither range nor damage reduction is a number
   * should alter directly. Aura defense uses a separate incoming-damage multiplier.
   */
  readonly attackRange: number;
  /**
   * Percentage of incoming raw damage this unit shaves off before
   * `CombatSystem.applyDamage` sees it (REQ-012). Zero means no reduction —
   * innate armor. Aura damage scaling composes with this value without mutating it.
   */
  readonly damageReductionPercent: number;
  readonly summonCost: number;
  readonly summonCooldownMs: number;
  /** Zero means the type is available from the very first battle. */
  readonly unlockCost: number;
  readonly upgradeBaseCost: number;
  readonly textureKey: string;
  readonly tintColor: number;
  /**
   * The size the unit's texture is declared at, and the only place it is
   * declared (REQ-002). Enemies and bosses have carried their own size since
   * SPEC-CAMPAIGN-STAGE-001; allies were the one kind left reading a literal at
   * the point of generation, which leaves a declared size inert — correct in
   * data, invisible in play, and passing every unit test.
   *
   * Required rather than optional on purpose: an optional size would mean a
   * size that need not be declared at all, weakening "exactly one declaration
   * site" into "possibly none" (plan.md D-2).
   */
  readonly width: number;
  readonly height: number;
}

/**
 * What the aura multiplies while a unit stands inside the radius (REQ-008).
 *
 * Deliberately limited to offence and movement. Scaling `maxHp` mid-battle
 * would raise a live unit's ceiling without saying what happens to its current
 * hit points, and a unit that heals by walking toward the Paladog is a
 * different game rule than the one REQ-008 describes.
 */
export interface AuraBuff {
  readonly attackDamageMultiplier: number;
  readonly speedMultiplier: number;
}

/**
 * What a melee unit needs from the thing it has stopped to hit.
 *
 * Structural on purpose: `EnemyUnit` engages ally units and `AllyUnit` engages
 * enemy units, so naming the concrete classes would make the two entity
 * modules import each other. Both classes and `Base` satisfy this shape
 * already, so neither import is needed.
 */
export interface EngagedTarget {
  readonly active: boolean;
  takeDamage(amount: number): DamageResult;
}
