/**
 * Audio settings contracts. Read by `SettingsSystem` and applied by
 * `src/audio/GameAudio.ts`; written to exactly one storage key that is not the
 * save key (REQ-011).
 */

/**
 * The settings key, deliberately separate from `SAVE_STORAGE_KEY`.
 *
 * Folding these two fields into the save document would raise that schema,
 * move `SaveSystem`'s one-step migration window, and put a player's upgrade
 * record at risk for the sake of a volume notch (plan.md D-5). Two keys cost
 * one extra `getItem` and buy the freedom below.
 */
export const SETTINGS_STORAGE_KEY = 'paladogweb:settings';

/**
 * Schema version carried inside the document, versioned independently of the
 * save.
 *
 * There is deliberately no migration ladder here, and that is the practical
 * gain from splitting the keys: a save must never be lost, while settings can
 * be — a player rebuilds them with two keypresses. So an unrecognised version
 * falls back to the defaults rather than being carried forward, and adding a
 * field later stays free (design.md §4.3).
 */
export const SETTINGS_SCHEMA_VERSION = 1;

/**
 * The volume ladder: five notches, the lowest deliberately above silence.
 *
 * A zero notch would make the volume keys and the mute key produce the same
 * result, and with no on-screen readout (spec.md §5) a player who had stepped
 * to zero would press `M` and hear nothing change. Five rather than ten
 * because 0.2 per press is a difference the ear actually resolves; fewer than
 * five and there is no notch near what a given player wants.
 */
export const VOLUME_STEP_MIN = 1;
export const VOLUME_STEP_MAX = 5;
export const VOLUME_STEP_DEFAULT = 3;

/**
 * Everything the player can change about the sound.
 *
 * `readonly` throughout, and the `SettingsSystem` functions return new objects
 * rather than editing this one: a test that mutated its input and still passed
 * would hide exactly the bug it was written to catch (design.md §4.2).
 */
export interface Settings {
  readonly schemaVersion: number;
  readonly muted: boolean;
  readonly volumeStep: number;
}
