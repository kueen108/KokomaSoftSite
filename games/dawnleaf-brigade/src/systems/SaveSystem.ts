import { validLevel, validGold } from './PolishSystem';
import { ringDefinition } from '../data/rings';
import { normalizeHero } from './HeroProgressSystem';
// @MX:NOTE: [AUTO] The storage adapter is an argument, and that is forced
// rather than chosen. The test environment is `node` (vitest.config.ts), so a
// module reaching for the browser storage global directly could not run under
// test at all — while still counting against the src/systems/** coverage
// denominator, which `quality.yaml` allows no exemption from (research.md §E).
// The production adapter lives outside this directory in src/storage/ and is
// the only place whose code names that global.
import { BOSS_IDS } from '../types/boss';
import { RING_TYPES } from '../types/ring';
import type { RingType } from '../types/ring';
import { SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY } from '../types/save';
import type { PersistedState, StorageAdapter } from '../types/save';
import { STAGE_IDS } from '../types/stage';
import { ALLY_UNIT_TYPES } from '../types/unit';
import type { AllyUnitType } from '../types/unit';

/**
 * The one older schema this build still reads (REQ-014, design.md §2.2).
 *
 * Derived rather than written as a literal, so the next bump carries the
 * one-step window forward instead of leaving a stale number pointing two
 * versions back.
 */
const MIGRATABLE_SCHEMA_VERSION = SAVE_SCHEMA_VERSION - 1;

/**
 * A save for a player who has never played: no gold, no upgrades, one unit,
 * and no ring — neither owned nor worn (REQ-014).
 */
export function defaultPersistedState(): PersistedState {
  const upgradeLevels = {} as Record<AllyUnitType, number>;

  for (const type of ALLY_UNIT_TYPES) {
    upgradeLevels[type] = 0;
  }

  const ringLevels = {} as Record<RingType, number>;

  for (const type of RING_TYPES) {
    ringLevels[type] = 0;
  }

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    settlementGold: 0,
    unlocked: ['tanker', 'dealer', 'archer'],
    upgradeLevels,
    ringsUnlocked: [],
    ringLevels,
    equippedRing: null,
    clearedStages: [],
    // Zero rather than absent, and that matters on the very first run: REQ-010
    // replaces the stored best only when this run beat it, so an undefined
    // starting value would lose that comparison forever and no run would ever
    // record.
    survivalBestWave: 0,
    bossesCleared: [],
    hero: normalizeHero(null),
  };
}

/**
 * Reads a stored document, or reports it unusable by returning null.
 *
 * Shape is checked rather than trusted: valid JSON of the wrong shape is the
 * same failure as unparseable text, and without this a stray `null` or array
 * would reach the game as state and fail somewhere far from here.
 */
function parseDocument(raw: string): PersistedState | null {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  // `saved`, not a name that a browser also uses for one of its globals: a
  // local binding shadowing one reads as a contradiction in the one file whose
  // whole point is to touch none of them.
  const saved = parsed as Record<string, unknown>;

  // REQ-014: the current version and exactly one step back are both readable.
  // Anything else — an older save, or one written by a newer build — is still
  // refused rather than guessed at, which is what keeps adding a field cheap.
  if (
    saved.schemaVersion !== SAVE_SCHEMA_VERSION &&
    saved.schemaVersion !== MIGRATABLE_SCHEMA_VERSION
  ) {
    return null;
  }

  const settlementGold = saved.settlementGold;
  const unlocked: unknown = saved.unlocked;
  const upgradeLevels: unknown = saved.upgradeLevels;
  const ringsUnlocked: unknown = saved.ringsUnlocked;
  const ringLevels: unknown = saved.ringLevels;

  if (
    typeof settlementGold !== 'number' ||
    !Array.isArray(unlocked) ||
    typeof upgradeLevels !== 'object' ||
    upgradeLevels === null ||
    !Array.isArray(ringsUnlocked) ||
    typeof ringLevels !== 'object' ||
    ringLevels === null
  ) {
    return null;
  }

  const storedLevels = upgradeLevels as Record<string, unknown>;
  const levels = { ...defaultPersistedState().upgradeLevels };

  for (const type of ALLY_UNIT_TYPES) {
    const stored = storedLevels[type];

    if (typeof stored === 'number') {
      levels[type] = validLevel(stored);
    }
  }

  const storedRingLevels = ringLevels as Record<string, unknown>;
  const ringLevelsRead = { ...defaultPersistedState().ringLevels };

  for (const type of RING_TYPES) {
    const stored = storedRingLevels[type];

    if (typeof stored === 'number') {
      ringLevelsRead[type] = validLevel(stored, ringDefinition(type).maxLevel);
    }
  }

  // Same filter as the unit roster, for the same reason: a ring name this build
  // has never heard of must not reach the game as an owned ring.
  const ownedRings = RING_TYPES.filter((type) => (ringsUnlocked as unknown[]).includes(type));

  // One expression covers both of this SPEC's storage rules, because they turn
  // out to be the same rule. REQ-015 filters a stored record against the stages
  // this build declares, and REQ-014's migration is what a schema-2 document
  // hits here — it carries no `clearedStages` at all, so the filter has nothing
  // to keep and the migrated record comes out empty. A stored value of the
  // wrong shape lands in the same place, which matches how a corrupted upgrade
  // level is handled: fall back for that field alone rather than discard a save
  // whose gold and unlocks read perfectly.
  const storedCleared: unknown = saved.clearedStages;
  const clearedStages = Array.isArray(storedCleared)
    ? STAGE_IDS.filter((id) => (storedCleared as unknown[]).includes(id))
    : [];

  // The same one expression covering two rules again, one schema on. A schema-3
  // document carries no `bossesCleared` at all, so `Array.isArray` is false and
  // the migrated record comes out empty — that is REQ-021. A document that does
  // carry one gets filtered against the bosses this build declares — that is
  // REQ-022. No separate branch, because they are not separate rules.
  const storedBosses: unknown = saved.bossesCleared;
  const bossesCleared = Array.isArray(storedBosses)
    ? BOSS_IDS.filter((id) => (storedBosses as unknown[]).includes(id))
    : [];

  // The `>= 0` half is not defensive tidiness. A negative stored best makes
  // REQ-010's "replace only when greater" true for every run, so each attempt
  // would overwrite the best with its own result and the record would collapse
  // to "last played". Nothing errors and the screen looks right (design.md §2.2).
  const storedBest: unknown = saved.survivalBestWave;
  const survivalBestWave =
    typeof storedBest === 'number' && Number.isFinite(storedBest) && storedBest >= 0
      ? Math.min(99999, Math.floor(storedBest))
      : 0;

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    settlementGold: validGold(settlementGold),
    // Filtered against the known roster rather than copied across, so a type
    // this build has never heard of cannot end up in the unlocked list.
    unlocked: ALLY_UNIT_TYPES.filter(
      (type) =>
        ['tanker', 'dealer', 'archer'].includes(type) ||
        (unlocked as unknown[]).includes(type) ||
        (type === 'cleric' && clearedStages.includes('stage-3')) ||
        (type === 'mage' && clearedStages.includes('stage-4')) ||
        (type === 'lancer' && clearedStages.includes('stage-6')),
    ),
    upgradeLevels: levels,
    ringsUnlocked: ownedRings,
    ringLevels: ringLevelsRead,
    // Resolved against the owned list rather than read straight across, which
    // enforces REQ-003's gate here too: an edited save cannot wear a ring it
    // never bought, and an unknown name lands on "none" rather than on itself.
    equippedRing: ownedRings.find((type) => type === saved.equippedRing) ?? null,
    clearedStages,
    survivalBestWave,
    bossesCleared,
    hero: normalizeHero(saved.hero),
  };
}

/**
 * Reads the save, falling back to the default state on every failure (REQ-016).
 *
 * The four ways this can fail — no adapter, nothing stored, unreadable
 * document, unrecognised schema version — deliberately share one ending. That
 * is not laziness: in a game with no server, telling the player "your save
 * could not be read" offers them nothing to do about it and turns a silent
 * fresh start into an alarming one (design.md §4.3).
 */
export function loadState(storage: StorageAdapter | null): PersistedState {
  if (storage === null) {
    return defaultPersistedState();
  }

  try {
    const raw = storage.getItem(SAVE_STORAGE_KEY);

    if (raw === null) {
      return defaultPersistedState();
    }

    return parseDocument(raw) ?? defaultPersistedState();
  } catch {
    return defaultPersistedState();
  }
}

/** Writes the whole state as one JSON document under one key (REQ-015, C-6). */
export function saveState(storage: StorageAdapter | null, state: PersistedState): boolean {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...state, schemaVersion: SAVE_SCHEMA_VERSION }),
    );
    return true;
  } catch {
    // A write that cannot land loses the record, not the session. Storage can
    // refuse outright in private mode, and throwing here would end a finished
    // battle with an error instead of a result screen.
    return false;
  }
}
