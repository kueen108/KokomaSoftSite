/**
 * Stage and wave contracts.
 *
 * Stage and enemy content lives under `src/data/stages/` and
 * `src/data/enemies/`, one entry per file (structure.md
 * @NAV:DEC-DATA-ONE-FILE-PER-ENTRY). This file declares only the shapes those
 * files fill in, so `src/systems/` can reason about a stage without importing
 * any content — which is what keeps stage rules testable without a browser
 * (REQ-020, C-1).
 */
import type { UnitStats } from './unit';

/**
 * Enemy roster.
 *
 * Two melee kinds (Phase 2), deliberately opposed rather than graded — one
 * fast and fragile, the other slow and durable (spec.md §2) — plus a ranged,
 * a defense-specialized and a support kind (SPEC-UNIT-ROSTER-001), five in
 * total. The new three still differ by stat distribution alone; see
 * `EnemyDefinition.attackRange`/`damageReductionPercent` below.
 */
export type EnemyKind =
  'grunt' | 'brute' | 'skirmisher' | 'juggernaut' | 'overseer' | 'bomber' | 'wraith' | 'sentinel';

/** Every enemy kind, in the order the enemy registry lists them. */
export const ENEMY_KINDS: readonly EnemyKind[] = [
  'grunt',
  'brute',
  'skirmisher',
  'juggernaut',
  'overseer',
  'bomber',
  'wraith',
  'sentinel',
];

/**
 * Campaign stage identifiers.
 *
 * Narrowed from `string` because the cleared-stage record carries these into
 * the save (REQ-013): as a bare string a typo is a value that stores fine and
 * unlocks nothing, whereas a union makes it a compile error.
 * `AllyUnitType` and `RingType` are unions for the same reason.
 */
export type StageId =
  | 'stage-1'
  | 'stage-2'
  | 'stage-3'
  | 'stage-4'
  | 'stage-5'
  | 'stage-6'
  | 'stage-7'
  | 'stage-8'
  | 'stage-9'
  | 'stage-10'
  | 'stage-11'
  | 'stage-12';

/**
 * Every stage identifier this build knows, used to filter a stored cleared
 * record against reality (REQ-015) — the same role `ALLY_UNIT_TYPES` and
 * `RING_TYPES` play for their own save fields.
 *
 * This is a roster, NOT the campaign order. Order is defined solely by the
 * stage registry (REQ-004), which sorts on `StageConfig.order`; nothing should
 * read progression order from the sequence below.
 */
export const STAGE_IDS: readonly StageId[] = [
  'stage-1',
  'stage-2',
  'stage-3',
  'stage-4',
  'stage-5',
  'stage-6',
  'stage-7',
  'stage-8',
  'stage-9',
  'stage-10',
  'stage-11',
  'stage-12',
];

/**
 * One enemy kind's immutable definition.
 *
 * `UnitStats` is reused rather than given an enemy-specific twin: its four
 * fields already correspond exactly to the four enemy numbers, and two
 * identically-shaped types would put existing pure functions over stats out of
 * reach for enemies for no gain (design.md §1.1).
 */
export interface EnemyDefinition {
  readonly kind: EnemyKind;
  readonly displayName: string;
  readonly baseStats: UnitStats;
  /**
   * How far this enemy can attack without contact (SPEC-UNIT-ROSTER-001
   * REQ-003). Zero means melee — see `types/unit.ts` `UnitDefinition` for why
   * this sits beside `baseStats` rather than inside `UnitStats`; the reasoning
   * is identical on the enemy side.
   */
  readonly attackRange: number;
  /** Percentage of incoming raw damage this enemy shaves off (REQ-012). Zero
   * means no reduction. */
  readonly damageReductionPercent: number;
  readonly textureKey: string;
  /** Colour of the runtime-generated placeholder rectangle (C-8). */
  readonly tintColor: number;
  /**
   * Size of that placeholder rectangle, in pixels (REQ-002).
   *
   * Two kinds must not carry the same pair. Colour alone told them apart in
   * data but not on a moving screen, and the whole reason there are two kinds
   * is that they ask for different responses — a response the player cannot
   * choose without first seeing which one is coming. Colour is also the one
   * channel a colour-blind player may not have; differing in shape as well
   * gives them a second.
   *
   * Kept here rather than in `UnitStats` because this is presentation, not a
   * combat number: everything in `UnitStats` is something `AuraSystem` or
   * `CombatSystem` computes with, and a size there would invite the question
   * of whether the aura makes a unit bigger. `UnitStats` is also shared with
   * allies, which have no use for it (design.md §1.1).
   */
  readonly width: number;
  readonly height: number;
}

/** One scheduled spawn: `count` enemies of `enemyKind` at `spawnAtMs`. */
export interface WaveEntry {
  readonly spawnAtMs: number;
  readonly enemyKind: EnemyKind;
  readonly count: number;
}

/** Ordered spawn schedule for one stage, keyed on elapsed battle time. */
export type WaveSchedule = readonly WaveEntry[];

/**
 * Everything `BattleScene` needs to run one stage from start to finish, plus
 * what the stage select screen needs to list it.
 *
 * No optional fields, and that is load-bearing: a stage file missing any one of
 * them is a type error rather than a stage that renders with a blank name or
 * sorts to an arbitrary position (AC-002).
 */
export interface StageConfig {
  readonly id: StageId;
  readonly displayName: string;
  /** Sort key the registry orders on. Consumers read the registry, not this. */
  readonly order: number;
  readonly waves: WaveSchedule;
  readonly allyBaseHp: number;
  readonly enemyBaseHp: number;
}
