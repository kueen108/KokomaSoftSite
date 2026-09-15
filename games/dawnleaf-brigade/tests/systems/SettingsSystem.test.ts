import { describe, expect, it } from 'vitest';

import {
  defaultSettings,
  loadSettings,
  masterVolume,
  saveSettings,
  stepVolume,
  toggleMute,
} from '../../src/systems/SettingsSystem';
import type { StorageAdapter } from '../../src/types/save';
import { SAVE_STORAGE_KEY } from '../../src/types/save';
import {
  SETTINGS_SCHEMA_VERSION,
  SETTINGS_STORAGE_KEY,
  VOLUME_STEP_DEFAULT,
  VOLUME_STEP_MAX,
  VOLUME_STEP_MIN,
} from '../../src/types/settings';
import type { Settings } from '../../src/types/settings';

/**
 * An in-memory stand-in for `localStorage`, identical in shape to the one
 * `SaveSystem.test.ts` uses. Both modules reach storage through the same two
 * methods (design.md §4.2), so the same fake exercises the real code path.
 */
class FakeStorage implements StorageAdapter {
  readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

/** Reproduces private-mode behaviour, where touching storage itself throws. */
class ThrowingStorage implements StorageAdapter {
  getItem(): string | null {
    throw new Error('storage access denied');
  }

  setItem(): void {
    throw new Error('storage access denied');
  }
}

/** A settings document that differs from the default on both fields. */
const mutedQuietSettings: Settings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  muted: true,
  volumeStep: VOLUME_STEP_MIN,
};

/** Writes a raw document under the settings key, bypassing `saveSettings`. */
function storedAs(document: unknown): FakeStorage {
  const storage = new FakeStorage();

  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(document));

  return storage;
}

describe('defaultSettings', () => {
  it('starts unmuted', () => {
    expect(defaultSettings().muted).toBe(false);
  });

  // design.md §4.1 — the middle step, leaving two notches either way, because
  // the maximum startles a first-time player and the minimum reads as broken.
  it('starts at the middle volume step', () => {
    expect(defaultSettings().volumeStep).toBe(VOLUME_STEP_DEFAULT);
  });

  it('carries the current schema version', () => {
    expect(defaultSettings().schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
  });

  // Returning a shared object would let one caller's edit leak into the next
  // "fresh" settings — a failure that surfaces far from its cause.
  it('returns a fresh object on each call', () => {
    expect(defaultSettings()).not.toBe(defaultSettings());
  });
});

describe('masterVolume', () => {
  // design.md §4.1 — step / VOLUME_STEP_MAX, so 1..5 maps to 0.2 .. 1.0.
  it('maps each step to its fraction of the maximum', () => {
    const volumes = [1, 2, 3, 4, 5].map((volumeStep) =>
      masterVolume({ schemaVersion: SETTINGS_SCHEMA_VERSION, muted: false, volumeStep }),
    );

    // Exact literals are safe here: `n / 5` for n = 1..5 rounds to the same
    // doubles as the decimal literals below (unlike, say, 0.2 + 0.4, which
    // does not). Verified rather than assumed.
    expect(volumes).toEqual([0.2, 0.4, 0.6, 0.8, 1]);
  });

  // AC-012 — `0 < vMin`. A lowest step of zero would make the volume keys and
  // the mute key produce the same silence, with nothing on screen to tell the
  // player which one they are in.
  it('never reaches zero at the lowest step', () => {
    const quietest = masterVolume({
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      muted: false,
      volumeStep: VOLUME_STEP_MIN,
    });

    expect(quietest).toBeGreaterThan(0);
    expect(quietest).toBeLessThanOrEqual(1);
  });

  it('reaches exactly one at the highest step', () => {
    expect(
      masterVolume({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        muted: false,
        volumeStep: VOLUME_STEP_MAX,
      }),
    ).toBe(1);
  });
});

describe('saveSettings and loadSettings round trip', () => {
  // AC-014 ② — what goes in comes back out, field for field.
  it('restores every field exactly as it was saved', () => {
    const storage = new FakeStorage();

    saveSettings(storage, mutedQuietSettings);

    expect(loadSettings(storage)).toEqual(mutedQuietSettings);
  });

  it('writes exactly one key, and it is the settings key', () => {
    const storage = new FakeStorage();

    saveSettings(storage, mutedQuietSettings);

    expect(storage.entries.size).toBe(1);
    expect(storage.entries.has(SETTINGS_STORAGE_KEY)).toBe(true);
  });

  // REQ-011 — the whole reason settings live under their own key. A write that
  // reached the save key would put a player's upgrade record at risk for the
  // sake of a volume notch.
  it('never writes the save key', () => {
    const storage = new FakeStorage();

    saveSettings(storage, mutedQuietSettings);
    saveSettings(storage, defaultSettings());

    expect(storage.entries.has(SAVE_STORAGE_KEY)).toBe(false);
  });

  // REQ-011 — reading is bound by the same clause as writing.
  it('never reads the save key', () => {
    const read: string[] = [];
    const storage: StorageAdapter = {
      getItem(key: string): string | null {
        read.push(key);

        return null;
      },
      setItem(): void {},
    };

    loadSettings(storage);

    expect(read).toEqual([SETTINGS_STORAGE_KEY]);
  });

  it('overwrites the previous document rather than adding a second key', () => {
    const storage = new FakeStorage();

    saveSettings(storage, mutedQuietSettings);
    saveSettings(storage, { ...mutedQuietSettings, volumeStep: VOLUME_STEP_MAX });

    expect(storage.entries.size).toBe(1);
    expect(loadSettings(storage).volumeStep).toBe(VOLUME_STEP_MAX);
  });

  it('stores the document as a single JSON string carrying the schema version', () => {
    const storage = new FakeStorage();

    saveSettings(storage, mutedQuietSettings);

    expect(JSON.parse(storage.entries.get(SETTINGS_STORAGE_KEY) ?? '')).toEqual({
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      muted: true,
      volumeStep: VOLUME_STEP_MIN,
    });
  });
});

describe('loadSettings failure handling', () => {
  // AC-014 ① — the first ever launch.
  it('returns the defaults when nothing has been stored', () => {
    expect(loadSettings(new FakeStorage())).toEqual(defaultSettings());
  });

  // AC-014 ③ — the document is there but unreadable.
  it('returns the defaults when the document cannot be parsed', () => {
    const storage = new FakeStorage();

    storage.setItem(SETTINGS_STORAGE_KEY, '{ this is not json');

    expect(loadSettings(storage)).toEqual(defaultSettings());
  });

  // Valid JSON of the wrong shape is the same failure as unparseable text.
  it('returns the defaults for JSON that is not an object', () => {
    expect(loadSettings(storedAs(null))).toEqual(defaultSettings());
  });

  it('returns the defaults for JSON that is an array', () => {
    expect(loadSettings(storedAs([1, 2, 3]))).toEqual(defaultSettings());
  });

  it('returns the defaults for JSON that is a bare scalar', () => {
    expect(loadSettings(storedAs(42))).toEqual(defaultSettings());
    expect(loadSettings(storedAs('muted'))).toEqual(defaultSettings());
  });

  // AC-014 ④ — a document from another schema is refused rather than guessed
  // at. There is deliberately no migration ladder: settings are cheap to lose
  // and a player rebuilds them with two keypresses (plan.md D-5).
  it('returns the defaults for an unrecognised schema version', () => {
    expect(
      loadSettings(storedAs({ ...mutedQuietSettings, schemaVersion: SETTINGS_SCHEMA_VERSION + 1 })),
    ).toEqual(defaultSettings());
  });

  it('returns the defaults for a document with no schema version at all', () => {
    expect(loadSettings(storedAs({ muted: true, volumeStep: 2 }))).toEqual(defaultSettings());
  });

  it('returns the defaults when muted is not a boolean', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, muted: 'yes' }))).toEqual(
      defaultSettings(),
    );
  });

  it('returns the defaults when the volume step is not a number', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: '3' }))).toEqual(
      defaultSettings(),
    );
  });

  // `typeof NaN` is 'number', so the type guard alone would let it through and
  // every volume computed from it would be NaN — a silent muting no branch
  // above would catch.
  it('returns the defaults when the volume step is not finite', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: null }))).toEqual(
      defaultSettings(),
    );
    expect(loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: Number.NaN }))).toEqual(
      defaultSettings(),
    );
  });

  // AC-014 ⑤ — `browserStorage()` returns null when the global is unusable.
  it('returns the defaults when there is no storage at all', () => {
    expect(loadSettings(null)).toEqual(defaultSettings());
  });

  // AC-014 ⑤ — storage itself refuses, as in private browsing.
  it('returns the defaults when storage access throws', () => {
    expect(loadSettings(new ThrowingStorage())).toEqual(defaultSettings());
  });

  it('does not let a storage exception escape', () => {
    expect(() => loadSettings(new ThrowingStorage())).not.toThrow();
  });

  // A field this build does not know about is not a reason to discard the two
  // it does — that would make adding a field a breaking change for the build
  // that comes after it.
  it('ignores unknown extra fields', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, subtitles: true }))).toEqual(
      mutedQuietSettings,
    );
  });
});

describe('loadSettings volume clamping', () => {
  // design.md §4.3 — a well-typed value outside the range is pulled back in
  // rather than discarded, because the rest of the document is still good.
  it('pulls a volume step below the minimum up to the minimum', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: -4 })).volumeStep).toBe(
      VOLUME_STEP_MIN,
    );
  });

  it('pulls a volume step above the maximum down to the maximum', () => {
    expect(
      loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: VOLUME_STEP_MAX + 99 }))
        .volumeStep,
    ).toBe(VOLUME_STEP_MAX);
  });

  it('leaves a volume step already inside the range alone', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: 4 })).volumeStep).toBe(4);
  });

  it('keeps the rest of the document when clamping', () => {
    expect(loadSettings(storedAs({ ...mutedQuietSettings, volumeStep: 99 })).muted).toBe(true);
  });
});

describe('saveSettings robustness', () => {
  // AC-014 ⑤ — a missing adapter is a no-op, not a crash.
  it('does nothing when there is no storage at all', () => {
    expect(() => saveSettings(null, mutedQuietSettings)).not.toThrow();
  });

  // A volume notch that cannot be recorded loses the notch, not the session.
  it('swallows a storage exception', () => {
    expect(() => saveSettings(new ThrowingStorage(), mutedQuietSettings)).not.toThrow();
  });
});

describe('toggleMute', () => {
  it('turns muting on when it was off', () => {
    expect(toggleMute(defaultSettings()).muted).toBe(true);
  });

  it('turns muting off when it was on', () => {
    expect(toggleMute(mutedQuietSettings).muted).toBe(false);
  });

  it('leaves the volume step untouched', () => {
    expect(toggleMute(mutedQuietSettings).volumeStep).toBe(mutedQuietSettings.volumeStep);
  });

  // design.md §4.2 — the functions return new objects so that a test which
  // mutated its input would fail loudly rather than pass by accident.
  it('returns a new object rather than mutating its argument', () => {
    const before = defaultSettings();
    const after = toggleMute(before);

    expect(after).not.toBe(before);
    expect(before.muted).toBe(false);
  });
});

describe('stepVolume', () => {
  it('raises the step by one', () => {
    expect(stepVolume(defaultSettings(), 1).volumeStep).toBe(VOLUME_STEP_DEFAULT + 1);
  });

  it('lowers the step by one', () => {
    expect(stepVolume(defaultSettings(), -1).volumeStep).toBe(VOLUME_STEP_DEFAULT - 1);
  });

  // AC-012 — `vMin2 === vMin`. Pressing past the end does nothing rather than
  // wrapping around or running off into a volume no key can bring back.
  it('stops at the maximum however many times it is raised', () => {
    let settings = defaultSettings();

    for (let i = 0; i < 20; i += 1) {
      settings = stepVolume(settings, 1);
    }

    expect(settings.volumeStep).toBe(VOLUME_STEP_MAX);
  });

  it('stops at the minimum however many times it is lowered', () => {
    let settings = defaultSettings();

    for (let i = 0; i < 20; i += 1) {
      settings = stepVolume(settings, -1);
    }

    expect(settings.volumeStep).toBe(VOLUME_STEP_MIN);
  });

  it('leaves muting untouched', () => {
    expect(stepVolume(mutedQuietSettings, 1).muted).toBe(true);
  });

  it('returns a new object rather than mutating its argument', () => {
    const before = defaultSettings();
    const after = stepVolume(before, 1);

    expect(after).not.toBe(before);
    expect(before.volumeStep).toBe(VOLUME_STEP_DEFAULT);
  });
});
