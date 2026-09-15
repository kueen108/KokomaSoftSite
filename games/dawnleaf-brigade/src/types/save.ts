import type { HeroProgress } from './hero';
/**
 * Persistence contracts. Read by `SaveSystem` and `UpgradeSystem`, written to
 * exactly one storage key by whichever scene owns the storage adapter.
 */
import type { BossId } from './boss';
import type { RingType } from './ring';
import type { StageId } from './stage';
import type { AllyUnitType } from './unit';

/** The single storage key this game ever writes (C-6). */
export const SAVE_STORAGE_KEY = 'paladogweb:save';

/**
 * Schema version carried inside the document (REQ-015).
 *
 * A document written by a newer game is rejected rather than guessed at: the
 * unknown-version branch of REQ-016 sends it to the default state, which is
 * what makes it safe to add fields later instead of reserving space for them
 * now (design.md §4.2).
 *
 * Raised to 2 by SPEC-RING-EQUIP-001, which added the three ring fields below.
 * There is deliberately no migration from 1 (C-1): a version-1 save is an
 * unrecognised version to this build and takes the same branch as any other,
 * so existing progress is reset. That cost was accepted because nothing is
 * released yet and no player holds progress to lose — a reason that expires on
 * the first release, so the next version bump has to be judged again rather
 * than copied from this one.
 *
 * Raised to 3 by SPEC-CAMPAIGN-STAGE-001, which added `clearedStages`. That
 * judgement was made rather than copied, and it came out the other way: a
 * migration from 2 IS provided (REQ-014). The reset reason has not expired —
 * there is still no release — but the first one is now near enough that a build
 * shipping without a migration path would make the *next* bump the one where
 * real progress disappears. The path costs a single branch filling an empty
 * list while there is nothing to carry, and it is never that cheap again.
 *
 * The migration opens exactly one step back and no further (design.md §2.2).
 * Opening every past version accumulates one branch per bump, and after the
 * first release most of those branches have no reachable user. So the same
 * obligation passes to 3 → 4: judge it then, do not copy this.
 *
 * Raised to 4 by SPEC-GAME-MODE-001, which added `survivalBestWave` and
 * `bossesCleared`. Judged again rather than copied, and it came out the same
 * way for a stronger reason: a migration from 3 IS provided (REQ-021). The
 * reset reason has still not expired — `git remote -v` is empty and nothing is
 * released — but this SPEC is the last step of the roadmap, so the release is
 * the next thing rather than a distant one.
 *
 * The one-step window bills for the first time here. Moving to 4 puts the
 * window at 3 → 4, so a schema-2 document, readable one bump ago, is refused
 * from now on. That is the rule working, not a regression, and this is the
 * cheapest moment it could ever be charged: the number of players holding a
 * schema-2 save is zero.
 *
 * The same obligation passes to 4 → 5: judge it then, do not copy this. By then
 * the release question will have a different answer, and whether to widen the
 * window past one step becomes a real question rather than a settled one.
 */
export const SAVE_SCHEMA_VERSION = 4;

/**
 * The minimum of `localStorage` that `SaveSystem` needs.
 *
 * The caller supplies this rather than `SaveSystem` reaching for the browser
 * global. That is not a style preference: the test environment is `node`
 * (`vitest.config.ts`), so a module touching `localStorage` directly could
 * never run under test while still counting against the `src/systems/**`
 * coverage denominator (research.md §E).
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Everything that survives between battles.
 *
 * Upgrade *levels* are stored; the stats they imply are not. Recomputing stats
 * from the level on every read (REQ-019) is what keeps an old save valid after
 * the balance formula moves (design.md §4.2).
 */
export interface PersistedState {
  readonly hero?: HeroProgress;
  readonly schemaVersion: number;
  readonly settlementGold: number;
  readonly unlocked: readonly AllyUnitType[];
  readonly upgradeLevels: Readonly<Record<AllyUnitType, number>>;
  // --- SPEC-RING-EQUIP-001 ---
  readonly ringsUnlocked: readonly RingType[];
  readonly ringLevels: Readonly<Record<RingType, number>>;
  /**
   * The one ring worn, or none. `null` is a normal state, not a missing one
   * (REQ-004): a player may own rings and choose to wear none.
   *
   * Singular rather than an array, and that is what makes the single slot a
   * structure instead of a habit (REQ-005). Stored as a list "we only ever fill
   * to one", nothing stops a second entry arriving later — and two rings on the
   * same number have no combination rule, so the result would not be an error,
   * just a quietly wrong figure.
   */
  readonly equippedRing: RingType | null;
  // --- SPEC-CAMPAIGN-STAGE-001 ---
  /**
   * Which stages have been cleared, in no particular order (REQ-011).
   *
   * A list rather than a single high-water mark, and that is a choice about
   * what the campaign is allowed to become. A number encodes "progress runs
   * strictly in one line" into the stored data itself, so an optional or
   * branching stage later would need a schema change on saves that already
   * exist. The list expresses today's rule — is the one before it cleared?
   * (REQ-010) — just as directly, and costs a few strings.
   *
   * Each identifier appears at most once however often the stage is replayed
   * (REQ-011); `StageSystem` is where that holds.
   */
  readonly clearedStages: readonly StageId[];
  // --- SPEC-GAME-MODE-001 ---
  /**
   * The highest wave number ever reached in a survival run (REQ-020).
   *
   * A single number where `clearedStages` is a list, and the contrast is the
   * point rather than an inconsistency. The list exists because campaign
   * progress might one day branch, and a high-water mark would have written
   * "progress runs in one line" into saves that already exist. Survival has no
   * such possibility to protect: wave numbers are one ordered axis and a best
   * result is one point on it. Storing a list would immediately raise "which
   * runs are kept, and sorted how" — a question with no answer until there is
   * more than one kind of record (spec.md §5).
   *
   * Never negative. A negative value would make REQ-010's "only when greater"
   * true for every run, so the best would be replaced by whatever was played
   * last; `SaveSystem` refuses one on read rather than trusting the document.
   */
  readonly survivalBestWave: number;
  /**
   * Which bosses have been beaten, in no particular order (REQ-018).
   *
   * A list for the reason `clearedStages` is one: with more than one boss,
   * whether each has been beaten is independent, and no single number expresses
   * that.
   *
   * Each identifier appears at most once however often the boss is beaten again
   * (REQ-018). Re-fighting a beaten boss is ordinary play rather than an edge
   * case, so appending on every win would grow the document once per attempt —
   * silently, and with nothing on screen to show for it. `BossSystem` is where
   * that holds.
   */
  readonly bossesCleared: readonly BossId[];
}
