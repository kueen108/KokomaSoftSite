import { describe, expect, it } from 'vitest';

import { defaultPersistedState, loadState, saveState } from '../../src/systems/SaveSystem';
import { SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY } from '../../src/types/save';
import type { PersistedState, StorageAdapter } from '../../src/types/save';

/**
 * An in-memory stand-in for `localStorage` (design.md §4.1). The production
 * adapter wraps the browser global; both reach `SaveSystem` through the same
 * two methods, so this exercises the real code path rather than a shim.
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

const filledState: PersistedState = {
  schemaVersion: SAVE_SCHEMA_VERSION,
  settlementGold: 420,
  unlocked: ['tanker', 'dealer', 'archer'],
  upgradeLevels: {
    tanker: 3,
    dealer: 1,
    archer: 0,
    guardian: 0,
    bannerman: 0,
    mage: 0,
    cleric: 0,
    lancer: 0,
  },
  ringsUnlocked: ['mana', 'rupture'],
  ringLevels: { mana: 2, rupture: 4 },
  equippedRing: 'rupture',
  clearedStages: ['stage-1', 'stage-2'],
  // --- SPEC-GAME-MODE-001 ---
  survivalBestWave: 12,
  bossesCleared: ['grave-warden'],
};

/**
 * A document exactly as schema 2 wrote them: every field schema 2 knew about,
 * and no `clearedStages`.
 *
 * Retained after the bump to 4, when it stopped being readable, because that
 * loss is a designed behaviour and needs a test that says so (design.md §2.3).
 * Deleting the fixture would leave the one-step window's cost unrecorded.
 */
const schemaTwoDocument = {
  schemaVersion: 2,
  settlementGold: 777,
  unlocked: ['tanker', 'dealer'],
  upgradeLevels: { tanker: 4, dealer: 2 },
  ringsUnlocked: ['mana'],
  ringLevels: { mana: 3, rupture: 0 },
  equippedRing: 'mana',
};

/**
 * A document exactly as schema 3 wrote them: every field schema 3 knew about,
 * including `clearedStages`, and neither of the two fields
 * SPEC-GAME-MODE-001 adds — which is the shape REQ-021's migration has to read.
 *
 * Written out in full rather than derived from `filledState`, so that a later
 * change to the current state cannot quietly redefine what "the previous
 * schema" means. `schemaTwoDocument` was this fixture one bump ago, and the
 * migration tests below moved onto this one because the readable window moved
 * with the version (C-2).
 */
const schemaThreeDocument = {
  schemaVersion: 3,
  settlementGold: 777,
  unlocked: ['tanker', 'dealer'],
  upgradeLevels: { tanker: 4, dealer: 2 },
  ringsUnlocked: ['mana'],
  ringLevels: { mana: 3, rupture: 0 },
  equippedRing: 'mana',
  clearedStages: ['stage-1', 'stage-2'],
};

describe('defaultPersistedState', () => {
  it('starts with no settlement gold and every level at zero', () => {
    const state = defaultPersistedState();

    expect(state.settlementGold).toBe(0);
    expect(state.upgradeLevels).toEqual({
      tanker: 0,
      dealer: 0,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    });
  });

  it('carries the current schema version', () => {
    expect(defaultPersistedState().schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  // A brand new player must have something to summon, or REQ-001 can never be
  // exercised on a fresh save.
  it('starts with three complementary starter companions unlocked', () => {
    expect(defaultPersistedState().unlocked).toEqual(['tanker', 'dealer', 'archer']);
  });

  // Returning a shared object would let one caller's edit leak into the next
  // "fresh" state — the failure would surface much later, as a save that was
  // never written appearing to remember something.
  it('returns a fresh object on each call', () => {
    expect(defaultPersistedState()).not.toBe(defaultPersistedState());
  });
});

describe('saveState and loadState round trip', () => {
  // AC-017 — what goes in comes back out, field for field
  it('restores every field exactly as it was saved', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(loadState(storage)).toEqual({ ...filledState, hero: defaultPersistedState().hero });
  });

  // AC-017 — the whole document lives under one key (C-6)
  it('writes exactly one key', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(storage.entries.size).toBe(1);
    expect(storage.entries.has(SAVE_STORAGE_KEY)).toBe(true);
  });

  it('overwrites the previous document rather than adding a second key', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);
    saveState(storage, { ...filledState, settlementGold: 999 });

    expect(storage.entries.size).toBe(1);
    expect(loadState(storage).settlementGold).toBe(999);
  });

  it('stores the document as a single JSON string', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(JSON.parse(storage.entries.get(SAVE_STORAGE_KEY) ?? '')).toMatchObject({
      schemaVersion: SAVE_SCHEMA_VERSION,
      settlementGold: 420,
    });
  });
});

describe('loadState failure handling', () => {
  // AC-018 — nothing stored yet: the first ever launch
  it('returns the default state when nothing has been stored', () => {
    expect(loadState(new FakeStorage())).toEqual(defaultPersistedState());
  });

  // AC-018 — the document is there but unreadable
  it('returns the default state when the document cannot be parsed', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, '{ this is not json');

    expect(loadState(storage)).toEqual(defaultPersistedState());
  });

  // AC-018 — storage itself refuses, as in private browsing
  it('returns the default state when storage access throws', () => {
    expect(loadState(new ThrowingStorage())).toEqual(defaultPersistedState());
  });

  // AC-018 — the exception must not reach the player as a broken game
  it('does not let a storage exception escape', () => {
    expect(() => loadState(new ThrowingStorage())).not.toThrow();
  });

  // REQ-016 — a save written by a newer build is refused, not guessed at
  it('returns the default state for an unrecognised schema version', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, schemaVersion: SAVE_SCHEMA_VERSION + 1 }),
    );

    expect(loadState(storage)).toEqual(defaultPersistedState());
  });

  // Valid JSON of the wrong shape is the same failure as unparseable text:
  // without this branch a stray `null` or array would reach the game as state.
  it('returns the default state for JSON that is not a save document', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, 'null');

    expect(loadState(storage)).toEqual(defaultPersistedState());
  });

  it('returns the default state when a required field is missing', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION }));

    expect(loadState(storage)).toEqual(defaultPersistedState());
  });

  // REQ-016 names the unavailable adapter as its own failure branch, so the
  // caller may hand over whatever it got without checking first.
  it('returns the default state when no storage is available at all', () => {
    expect(loadState(null)).toEqual(defaultPersistedState());
  });

  // A document that is a save in every other respect but carries a corrupted
  // level falls back for that field alone, rather than discarding a save whose
  // gold and unlocks are perfectly readable.
  it('falls back to level zero for a level that is not a number', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, upgradeLevels: { tanker: 'three', dealer: 1 } }),
    );

    const loaded = loadState(storage);

    expect(loaded.upgradeLevels).toEqual({
      tanker: 0,
      dealer: 1,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    });
    expect(loaded.settlementGold).toBe(420);
  });
});

describe('ring fields in the persisted state (SPEC-RING-EQUIP-001)', () => {
  // AC-012 — the ring half of the round trip, under the same single key
  it('restores the ring unlock list, levels and equipped ring exactly', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    const loaded = loadState(storage);

    expect(loaded.ringsUnlocked).toEqual(['mana', 'rupture']);
    expect(loaded.ringLevels).toEqual({ mana: 2, rupture: 4 });
    expect(loaded.equippedRing).toBe('rupture');
  });

  // AC-012 — adding three fields must not add a second key (C-2)
  it('still writes exactly one key with the ring fields present', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(storage.entries.size).toBe(1);
    expect(storage.entries.has(SAVE_STORAGE_KEY)).toBe(true);
  });

  // REQ-004 / REQ-005 — no ring equipped is a normal state, not a missing one,
  // so it has to survive the round trip as `null` rather than be lost.
  it('restores an unequipped state as no ring rather than as absent', () => {
    const storage = new FakeStorage();

    saveState(storage, { ...filledState, equippedRing: null });

    expect(loadState(storage).equippedRing).toBeNull();
  });

  // AC-013 — an unrecognised schema version yields the ring defaults
  it('returns no unlocked ring, no equipped ring and zero levels for an unknown version', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, schemaVersion: SAVE_SCHEMA_VERSION + 1 }),
    );

    const loaded = loadState(storage);

    expect(loaded.ringsUnlocked).toEqual([]);
    expect(loaded.equippedRing).toBeNull();
    expect(loaded.ringLevels).toEqual({ mana: 0, rupture: 0 });
  });

  // REQ-014 / design.md §2.2 — the migration opens exactly one step back, so a
  // schema-1 document is still refused. Two steps back is not a gap that was
  // forgotten: opening every past version accumulates a branch per bump, and
  // most of them would have no reachable user.
  it('treats a document two schema versions back as unknown', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        settlementGold: 999,
        unlocked: ['tanker', 'dealer'],
        upgradeLevels: { tanker: 5, dealer: 5 },
      }),
    );

    expect(loadState(storage)).toEqual(defaultPersistedState());
  });

  // The default save is what a first-ever launch fights with, so the ring
  // fields have to be present and empty rather than undefined — a scene reading
  // `equippedRing` off a fresh state must get "none", not a crash.
  it('defaults to no ring unlocked, none equipped and every level at zero', () => {
    const state = defaultPersistedState();

    expect(state.ringsUnlocked).toEqual([]);
    expect(state.equippedRing).toBeNull();
    expect(state.ringLevels).toEqual({ mana: 0, rupture: 0 });
  });

  // Same reasoning as the unit roster: a ring name this build has never heard
  // of must not survive into the unlocked list or the equipped slot.
  it('filters an unknown ring type out of the unlock list', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, ringsUnlocked: ['mana', 'sapphire'] }),
    );

    expect(loadState(storage).ringsUnlocked).toEqual(['mana']);
  });

  it('drops an equipped ring whose type this build does not know', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...filledState, equippedRing: 'sapphire' }));

    expect(loadState(storage).equippedRing).toBeNull();
  });

  // A ring recorded as equipped but not unlocked is a state the game has no
  // rule for: REQ-003 gates equipping on unlock, so honouring it here would let
  // a hand-edited save wear a ring it never bought.
  it('drops an equipped ring that is not in the unlock list', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, ringsUnlocked: ['mana'], equippedRing: 'rupture' }),
    );

    expect(loadState(storage).equippedRing).toBeNull();
  });

  it('falls back to level zero for a ring level that is not a number', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, ringLevels: { mana: 'two', rupture: 4 } }),
    );

    expect(loadState(storage).ringLevels).toEqual({ mana: 0, rupture: 4 });
  });
});

describe('cleared-stage record in the persisted state (SPEC-CAMPAIGN-STAGE-001)', () => {
  // Raised from 3 to 4 by SPEC-GAME-MODE-001, which adds the survival record
  // and the cleared-boss record (C-2). The number is asserted rather than
  // merely derived so that a bump has to be a deliberate edit here as well as
  // in the source — the readable window is computed from it.
  it('pins the schema version at four', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(4);
  });

  // A first-ever launch has to read as "nothing cleared yet" rather than as a
  // missing field, or the select screen would have no list to judge locks
  // against on the one save where every player starts.
  it('defaults to an empty cleared-stage record', () => {
    expect(defaultPersistedState().clearedStages).toEqual([]);
  });

  // AC-014 — what goes in comes back out
  it('restores the cleared-stage record exactly as it was saved', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(loadState(storage).clearedStages).toEqual(['stage-1', 'stage-2']);
  });

  // AC-014 — a fourth list must not become a second key (C-7)
  it('still writes exactly one key with the cleared-stage record present', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(storage.entries.size).toBe(1);
    expect(storage.entries.has(SAVE_STORAGE_KEY)).toBe(true);
  });

  // AC-022 — the migration REQ-021 adds, seen from the cleared-stage side. The
  // gold and levels are asserted alongside the record on purpose: an unchanged
  // record alone cannot tell a migration apart from a rejection, because a
  // rejected document also yields defaults. Whether the existing progress
  // survived IS the requirement.
  //
  // Reads a schema-3 document rather than the schema-2 one it was written
  // against: the readable window is one step back and moved with the bump to 4
  // (C-2). The schema-2 case is now a rejection, asserted below.
  it('reads a previous-schema document and keeps the cleared record it carried', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(schemaThreeDocument));

    const loaded = loadState(storage);

    expect(loaded.clearedStages).toEqual(['stage-1', 'stage-2']);
    expect(loaded.settlementGold).toBe(777);
    expect(loaded.upgradeLevels).toEqual({
      tanker: 4,
      dealer: 2,
      archer: 0,
      guardian: 0,
      bannerman: 0,
      mage: 0,
      cleric: 0,
      lancer: 0,
    });
  });

  // REQ-021 — and the result is treated as current, not left at the old number,
  // so the next write does not put a stale version back on disk.
  it('reports a migrated document at the current schema version', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(schemaThreeDocument));

    expect(loadState(storage).schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  // AC-022 — the ring fields the previous schema already carried must survive
  // too; a migration that dropped them would be a reset wearing a migration's
  // name.
  it('keeps the ring progress a previous-schema document carried', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(schemaThreeDocument));

    const loaded = loadState(storage);

    expect(loaded.ringsUnlocked).toEqual(['mana']);
    expect(loaded.ringLevels).toEqual({ mana: 3, rupture: 0 });
    expect(loaded.equippedRing).toBe('mana');
  });

  // C-2 / design.md §2.3 — a schema-2 document was readable one version ago and
  // is not any more. This is the one-step window working as designed rather
  // than a regression, and it is asserted so that "helpfully" reopening a
  // second step later has to fail a test rather than pass unnoticed. Every
  // version bump otherwise accumulates a branch that, after a release, almost
  // no save reaches (src/types/save.ts).
  it('refuses a document two schema versions back and starts fresh', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(schemaTwoDocument));

    const loaded = loadState(storage);

    expect(loaded.settlementGold).toBe(0);
    expect(loaded.clearedStages).toEqual([]);
  });

  // AC-016 — same filter the unit and ring rosters use, for the same reason: a
  // stage name this build has never heard of would otherwise count as progress,
  // and a stage that does not exist would unlock the one after it.
  it('drops a cleared-stage identifier no stage definition declares', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, clearedStages: ['stage-1', 'stage-99'] }),
    );

    expect(loadState(storage).clearedStages).toEqual(['stage-1']);
  });

  // A corrupted record falls back for that field alone rather than discarding a
  // save whose gold and unlocks read perfectly — the same per-field treatment
  // the upgrade levels already get.
  it('falls back to an empty record when the stored value is not a list', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...filledState, clearedStages: 'stage-1' }));

    const loaded = loadState(storage);

    expect(loaded.clearedStages).toEqual([]);
    expect(loaded.settlementGold).toBe(420);
  });
});

describe('survival and boss records in the persisted state (SPEC-GAME-MODE-001)', () => {
  // A first-ever launch has to read as "nothing recorded yet" rather than as a
  // missing field. Zero in particular is load-bearing: REQ-010 replaces the
  // stored best only when this run beat it, and `undefined` would make that
  // comparison false forever, so the very first run would never record at all.
  it('defaults to a zero survival record and no cleared bosses', () => {
    const state = defaultPersistedState();

    expect(state.survivalBestWave).toBe(0);
    expect(state.bossesCleared).toEqual([]);
  });

  // AC-021 — what goes in comes back out
  it('restores both new records exactly as they were saved', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    const loaded = loadState(storage);

    expect(loaded.survivalBestWave).toBe(12);
    expect(loaded.bossesCleared).toEqual(['grave-warden']);
  });

  // AC-021 — two more records must not become two more keys (C-7)
  it('still writes exactly one key with both new records present', () => {
    const storage = new FakeStorage();

    saveState(storage, filledState);

    expect(storage.entries.size).toBe(1);
    expect(storage.entries.has(SAVE_STORAGE_KEY)).toBe(true);
  });

  // AC-022 — the migration REQ-021 adds, seen from the new fields' side. The
  // surviving progress is asserted alongside the empty records for the reason
  // the cleared-stage migration test gives: empty records alone read the same
  // whether the document was migrated or thrown away.
  it('fills both new records empty when reading a previous-schema document', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(schemaThreeDocument));

    const loaded = loadState(storage);

    expect(loaded.survivalBestWave).toBe(0);
    expect(loaded.bossesCleared).toEqual([]);
    expect(loaded.settlementGold).toBe(777);
    expect(loaded.clearedStages).toEqual(['stage-1', 'stage-2']);
  });

  // AC-023 — same filter the unit, ring and stage rosters use, for the same
  // reason: a boss name this build has never heard of would otherwise show as a
  // boss already beaten, and there would be no boss to point at.
  it('drops a cleared-boss identifier no boss definition declares', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, bossesCleared: ['grave-warden', 'ash-tyrant'] }),
    );

    expect(loadState(storage).bossesCleared).toEqual(['grave-warden']);
  });

  // A corrupted record falls back for that field alone rather than discarding a
  // save whose gold and unlocks read perfectly — the same per-field treatment
  // the upgrade levels and the cleared stages already get.
  it('falls back to empty records when the stored values are the wrong shape', () => {
    const storage = new FakeStorage();

    storage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify({ ...filledState, survivalBestWave: 'twelve', bossesCleared: 'grave-warden' }),
    );

    const loaded = loadState(storage);

    expect(loaded.survivalBestWave).toBe(0);
    expect(loaded.bossesCleared).toEqual([]);
    expect(loaded.settlementGold).toBe(420);
  });

  // A negative stored best would make REQ-010's "only when greater" true for
  // every run forever, so the best would be overwritten by each attempt and the
  // record would quietly collapse to whatever was played last. No error, no
  // sign on screen — just a high score that never holds (design.md §2.2).
  it('treats a negative stored survival record as no record at all', () => {
    const storage = new FakeStorage();

    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...filledState, survivalBestWave: -3 }));

    expect(loadState(storage).survivalBestWave).toBe(0);
  });
});

describe('saveState failure handling', () => {
  // A write that cannot land must not end the battle with an error dialog —
  // the player loses the record, not the session (REQ-016 reasoning).
  it('does not let a storage exception escape', () => {
    expect(() => saveState(new ThrowingStorage(), filledState)).not.toThrow();
  });

  it('does nothing and stays quiet when no storage is available', () => {
    expect(() => saveState(null, filledState)).not.toThrow();
  });
});
