/**
 * Game mode contracts.
 *
 * Mode content lives under `src/data/modes/`. This file declares only the
 * shapes, so `src/systems/` can adjudicate a battle by mode without importing
 * any content (REQ-023, C-1).
 */
import type { BossDefinition } from './boss';
import type { EnemyKind, StageConfig } from './stage';

/**
 * The three ways a battle can be played.
 *
 * A union for the same reason every other identifier in this project is one: a
 * typo becomes a compile error rather than a value that routes nowhere. Unlike
 * the others this one is not persisted, but it does decide how a battle ends,
 * and a mode that reached `resolveModeOutcome` unrecognised would have no
 * outcome rule at all.
 */
export type GameMode = 'campaign' | 'survival' | 'boss';

/**
 * Every mode identifier this build knows.
 *
 * A roster, NOT the menu order. Order is defined solely by the mode registry
 * (REQ-001), which sorts on `ModeDefinition.order`; nothing should read the
 * order in which the names happen to appear below.
 */
export const GAME_MODES: readonly GameMode[] = ['campaign', 'survival', 'boss'];

/**
 * Everything `BattleScene` needs to run one battle, discriminated by mode.
 *
 * A union rather than one interface with optional `stage` and `boss` fields.
 * With optionals, a boss battle carrying no boss compiles cleanly and fails at
 * runtime as an undefined read — on screen, a battle with nothing in it. The
 * union cannot express that combination at all (design.md §1.3).
 *
 * The boss member's field is `bossDefinition` rather than the shorter `boss`
 * design.md §1.3 sketched. A scene distinguishes the members by asking which
 * field is present, and `'boss' in launch` is a quoted mode identifier as far
 * as AC-002's count is concerned even though it is a property name. Rather than
 * argue the criterion should tell them apart, the field is named so the
 * question does not arise — and it reads more precisely for it.
 */
export type BattleLaunch =
  | { readonly mode: 'campaign'; readonly stage: StageConfig }
  | { readonly mode: 'survival' }
  | { readonly mode: 'boss'; readonly bossDefinition: BossDefinition };

/**
 * The mode a battle entered with a stage but no mode is running.
 *
 * `StageSelectScene` is not modified by this SPEC (plan.md §A PRESERVE, D-5):
 * it knows nothing about modes and starts a battle with `{ stage }` alone. That
 * payload has to mean something, and campaign is what it has always meant.
 *
 * Named here rather than written into `BattleScene` because a scene naming a
 * mode is what AC-002 forbids — and rightly, since a scene that spells out mode
 * identifiers is a second place the mode list lives. One named import is not a
 * list.
 */
export const IMPLICIT_BATTLE_MODE: Extract<BattleLaunch, { mode: 'campaign' }>['mode'] = 'campaign';

/**
 * Where confirming a mode goes (REQ-004).
 *
 * The destination is a value carried by the mode definition rather than a
 * decision the select screen makes, because the destinations genuinely differ:
 * campaign has a second question to ask ("which stage") and the other two do
 * not. A screen that decided this itself would have to name the modes, which is
 * the coupling REQ-001 exists to prevent — adding a fourth mode would mean
 * editing the screen as well as the registry, and forgetting to would route it
 * nowhere without any error.
 */
export type ModeEntry =
  { readonly kind: 'stage-select' } | { readonly kind: 'battle'; readonly launch: BattleLaunch };

/**
 * One mode's immutable definition. No optional fields, for the reason
 * `StageConfig` has none: a mode missing any of them is a type error rather
 * than a row that renders blank or sorts arbitrarily.
 */
export interface ModeDefinition {
  readonly mode: GameMode;
  readonly displayName: string;
  /**
   * One line explaining what this mode is (REQ-003), and required to be
   * non-empty.
   *
   * Survival is why this is not optional. It is the one mode with no victory
   * at all, and a player who enters without knowing that reads their inevitable
   * defeat as the game being broken. A name alone cannot carry that.
   */
  readonly description: string;
  /** Sort key the registry orders on. Consumers read the registry, not this. */
  readonly order: number;
  readonly entry: ModeEntry;
}

/**
 * The survival mode's tuning, passed to `SurvivalSystem` as an argument.
 *
 * An argument rather than an import, so the rules stay inside the `../types/`
 * import boundary (C-1) — the same arrangement that has `StageSystem` take the
 * campaign ordering and the enemy lookup instead of reading the registries.
 */
export interface SurvivalConfig {
  /** Gap between two waves, milliseconds. Wave `n` enters at `(n-1) x` this. */
  readonly waveIntervalMs: number;
  readonly allyBaseHp: number;
  /** One brute per this many enemies in a wave (REQ-006). */
  readonly brutePeriod: number;
}

/**
 * One group inside a survival wave: `count` enemies of `enemyKind`.
 *
 * The same pair `WaveEntry` carries, minus the spawn time. A campaign wave is
 * one row of a schedule written out in advance, so it has to say when it
 * happens; a survival wave is generated at the moment it is due, so a time
 * would only restate what the caller already decided. `WaveEntry` is assignable
 * to this, which is what lets one spawn loop serve both modes.
 */
export interface SurvivalSpawn {
  readonly enemyKind: EnemyKind;
  readonly count: number;
}
