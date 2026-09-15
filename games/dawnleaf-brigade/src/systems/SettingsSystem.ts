// @MX:NOTE: [AUTO] Like SaveSystem, this module takes its storage as an
// argument rather than reaching for the browser global (REQ-012). That is
// forced rather than chosen: the test environment is `node`
// (vitest.config.ts), so a module here that reached for the browser storage
// global by name could not run under test at all — while still counting
// against the src/systems/** coverage denominator. Naming that global is also
// what AC-016's fourth grep looks for, which is why neither this comment nor
// SaveSystem's spells it out. Playback lives in src/audio/ for the same
// reason: `game.sound` is Phaser itself and cannot live here (C-5).
import type { StorageAdapter } from '../types/save';
import {
  SETTINGS_SCHEMA_VERSION,
  SETTINGS_STORAGE_KEY,
  VOLUME_STEP_DEFAULT,
  VOLUME_STEP_MAX,
  VOLUME_STEP_MIN,
} from '../types/settings';
import type { Settings } from '../types/settings';

/** Pulls a well-typed step back inside the ladder (design.md §4.3). */
function clampStep(step: number): number {
  if (step < VOLUME_STEP_MIN) {
    return VOLUME_STEP_MIN;
  }

  if (step > VOLUME_STEP_MAX) {
    return VOLUME_STEP_MAX;
  }

  return step;
}

/** Sound on, at the middle notch of five (design.md §4.1). */
export function defaultSettings(): Settings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    muted: false,
    volumeStep: VOLUME_STEP_DEFAULT,
  };
}

/**
 * Reads a stored document, or reports it unusable by returning null.
 *
 * Shape is checked rather than trusted, for the same reason `SaveSystem` does
 * it: valid JSON of the wrong shape would otherwise reach the game as settings
 * and fail somewhere far from here. `Number.isFinite` earns its place beside
 * the `typeof` guard because `typeof NaN` is 'number', and a NaN step would
 * compute a NaN volume — silence that no branch above would catch and no key
 * could undo.
 */
function parseDocument(raw: string): Settings | null {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const stored = parsed as Record<string, unknown>;

  // No migration ladder, unlike SaveSystem: an unrecognised version falls
  // back to the defaults. Settings are cheap to lose and a player rebuilds
  // them with two keypresses, which is the practical gain from keeping this
  // key separate from the save (plan.md D-5).
  if (stored.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return null;
  }

  const muted: unknown = stored.muted;
  const volumeStep: unknown = stored.volumeStep;

  if (
    typeof muted !== 'boolean' ||
    typeof volumeStep !== 'number' ||
    !Number.isFinite(volumeStep)
  ) {
    return null;
  }

  // Fields this build does not know about are dropped here rather than
  // rejected, so that adding one later is not a breaking change for the build
  // that comes after it.
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    muted,
    volumeStep: clampStep(volumeStep),
  };
}

/**
 * Reads the settings, falling back to the defaults on every failure.
 *
 * The five ways this can fail — no adapter, nothing stored, unreadable
 * document, unrecognised version, wrong field types — share one ending, and
 * the player is not told: a volume that starts at the middle notch is not an
 * error worth interrupting anyone for (design.md §4.3).
 */
export function loadSettings(storage: StorageAdapter | null): Settings {
  if (storage === null) {
    return defaultSettings();
  }

  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);

    if (raw === null) {
      return defaultSettings();
    }

    return parseDocument(raw) ?? defaultSettings();
  } catch {
    return defaultSettings();
  }
}

/** Writes both fields as one JSON document under the settings key (REQ-011). */
export function saveSettings(storage: StorageAdapter | null, settings: Settings): void {
  if (storage === null) {
    return;
  }

  try {
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION }),
    );
  } catch {
    // A notch that cannot be recorded loses the notch, not the session.
    // Storage refuses outright in private mode, and throwing here would end a
    // keypress with an error instead of a quieter game.
  }
}

/** Flips muting, leaving the volume where the player left it. */
export function toggleMute(settings: Settings): Settings {
  return { ...settings, muted: !settings.muted };
}

/**
 * Moves one notch and stops at either end (AC-012).
 *
 * Stopping rather than wrapping: a player holding the key down expects to
 * arrive at the loudest or quietest setting, not to pass through it back to
 * the other extreme.
 */
export function stepVolume(settings: Settings, delta: 1 | -1): Settings {
  return { ...settings, volumeStep: clampStep(settings.volumeStep + delta) };
}

/** The master volume this step asks for: 0.2 · 0.4 · 0.6 · 0.8 · 1.0. */
export function masterVolume(settings: Settings): number {
  return settings.volumeStep / VOLUME_STEP_MAX;
}
