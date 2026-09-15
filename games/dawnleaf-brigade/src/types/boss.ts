/**
 * Boss contracts.
 *
 * Boss content lives under `src/data/bosses/`, one entry per file
 * (structure.md @NAV:DEC-DATA-ONE-FILE-PER-ENTRY). This file declares only the
 * shapes those files fill in, so `src/systems/` can reason about a boss without
 * importing any content — the same arrangement `types/stage.ts` has for stages
 * (REQ-023, C-1).
 */

/**
 * Boss roster.
 *
 * A union rather than a bare string for the reason `AllyUnitType`, `RingType`
 * and `StageId` are unions: the cleared-boss record carries these into the save
 * (REQ-020), so as a string a typo would store fine and unlock nothing, whereas
 * a union makes it a compile error.
 *
 * One entry, and that is the whole roster this SPEC ships (spec.md §5). The
 * union is not premature for a single boss — it exists because the value is
 * persisted, not because there are several.
 */
export type BossId = 'grave-warden';

/**
 * Every boss identifier this build knows, used to filter a stored cleared
 * record against reality (REQ-022) — the same role `STAGE_IDS` plays for
 * `clearedStages`.
 */
export const BOSS_IDS: readonly BossId[] = ['grave-warden'];

/**
 * What a phase changes, and nothing else.
 *
 * `UnitStats` is deliberately NOT reused here even though three of its four
 * fields match. It carries `maxHp`, and a boss's maximum hit points do not
 * change between phases — phases are segments of one health bar, not separate
 * healths. Reusing it would put a `maxHp` on every phase and so invite the
 * unanswerable question of what happens to the bar on entering phase three.
 * `EnemyDefinition` keeps size out of `UnitStats` for the same kind of reason
 * (types/stage.ts, design.md §4.1).
 */
export interface BossPhaseStats {
  readonly attackDamage: number;
  readonly attackIntervalMs: number;
  readonly speed: number;
}

/** One segment of a boss's health bar, and how it fights inside that segment. */
export interface BossPhase {
  /**
   * Shown on the battle HUD while this phase is active (REQ-016).
   *
   * A name rather than a colour. A screen that distinguishes phases by colour
   * alone does not distinguish them for a colour-blind player, and a phase the
   * player cannot perceive is a rule that never reaches the game — the lesson
   * SPEC-CAMPAIGN-STAGE-001 0.3.0 was written to fix.
   */
  readonly displayName: string;
  /**
   * Percentage of maximum hit points at or above which this phase applies
   * (REQ-013).
   *
   * A whole-number percentage, not a 0..1 ratio, and that choice is what makes
   * `bossPhaseAt` exact: the comparison multiplies both sides instead of
   * dividing, so every term stays an integer and no boundary is decided by a
   * floating-point comparison (design.md §4.2).
   *
   * Across a boss's phase list these start at 100 and strictly decrease. Both
   * halves are load-bearing: without the 100 a full-health boss matches no
   * phase, and without the decrease one health value matches two.
   */
  readonly enterAtPercent: number;
  readonly stats: BossPhaseStats;
}

/**
 * One boss's immutable definition.
 *
 * No optional fields, and that is load-bearing in the same way `StageConfig`'s
 * absence of them is: a boss file missing any one of these is a type error
 * rather than a boss that fights with nothing or renders at a default size.
 * AC-013 leans on exactly that — `npm run typecheck` is what checks REQ-012's
 * field list, so an optional field here would quietly remove a criterion.
 */
export interface BossDefinition {
  readonly id: BossId;
  readonly displayName: string;
  readonly maxHp: number;
  readonly textureKey: string;
  /** Colour of the runtime-generated placeholder rectangle (C-8). */
  readonly tintColor: number;
  /**
   * Size of that placeholder rectangle, in pixels (REQ-012).
   *
   * Both dimensions exceed every enemy kind's, and the requirement says so
   * rather than leaving the values open. A boss drawn at the grunt's 40x48
   * would satisfy a field-presence check while being indistinguishable on a
   * moving screen from an ordinary enemy with a lot of health — which is to say
   * "boss battle" would exist in the data and not in the game.
   */
  readonly width: number;
  readonly height: number;
  /** Ordered by entry percentage, highest first (REQ-013). */
  readonly phases: readonly BossPhase[];
}
