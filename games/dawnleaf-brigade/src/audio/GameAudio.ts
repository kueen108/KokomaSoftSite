// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-3), and
// this module exists precisely to hold what cannot be pure: it is the one
// place in the codebase that touches `game.sound` (design.md §1.1). What it
// does is verified by driving the real game in a browser — acceptance.md
// AC-004 ~ AC-008 read `getAllPlaying()` after each of the five events
// (tech.md @NAV:DEC-VERIFY-DUAL).
// @MX:NOTE: [AUTO] The dependency runs one way, scene → audio. This module may
// read what `src/systems/` computes; nothing in src/systems/ may learn that
// sound exists, or it stops being unit-testable while staying in the coverage
// denominator (REQ-012). Entities are further out still: they never call in
// here, so the same entity can be used with no sound at all (plan.md D-1).
// Imported for its value, not only its types: the unlock listener below names
// the event through `Phaser.Sound.Events.UNLOCKED` rather than the string it
// expands to, so a rename in Phaser breaks the build instead of going quiet.
import Phaser from 'phaser';

import { browserStorage } from '../storage/browserStorage';
import {
  loadSettings,
  masterVolume,
  saveSettings,
  stepVolume,
  toggleMute,
} from '../systems/SettingsSystem';
import type { StorageAdapter } from '../types/save';
import type { Settings } from '../types/settings';

/**
 * Where the single instance lives.
 *
 * The registry belongs to `Phaser.Game`, so it survives every scene change —
 * which is the lifetime this module needs. Phaser attaches the sound manager
 * to the game (`Game.js:256`, `:260`) and `Systems.shutdown` (`:770-786`)
 * contains no sound handling at all, so a sound started in one scene keeps
 * playing into the next. Holding this in a scene-lifetime object instead — the
 * way `BattleFx` is held — would throw it away on every retry (plan.md D-1).
 *
 * Using the registry is also what leaves `src/main.ts` and
 * `src/config/gameConfig.ts` untouched (C-6): whichever scene asks first
 * builds it, so neither of those two append-only files needs a new line.
 */
const REGISTRY_KEY = 'gameAudio';

/**
 * How loud a background track sits under everything else.
 *
 * A per-sound value multiplied by the manager's master volume, which is the
 * one thing the player adjusts (plan.md D-2). Music is a floor the effects
 * stand on, so it is set at roughly half of them and the player cannot move
 * that ratio — one axis of control, not two. The number itself is
 * `design.md` §3.2's, reproduced rather than recomputed.
 *
 * It is handed to `sound.add` bare, and must stay that way. Phaser routes each
 * sound's gain through the manager's master gain, so the master is already
 * applied downstream of this number (`WebAudioSoundManager.js:574` owns that
 * node). Writing `BGM_VOLUME * masterVolume(...)` here would apply the player's
 * setting twice — at step 3 of five that is 0.45 × 0.6 × 0.6, music two notches
 * quieter than asked for, and quiet music raises no error.
 */
const BGM_VOLUME = 0.45;

/**
 * The only thing in this codebase that plays a sound.
 *
 * Every method here is allowed to do nothing. That is not defensiveness — it
 * is the shape the two failure modes force. A sound that fails to play is
 * silence, and silence raises no error, so the alternative to returning
 * quietly is not "a louder failure" but "a crash" (see `playSfx`).
 */
export class GameAudio {
  private readonly game: Phaser.Game;

  /**
   * The ledger: what should be sounding, and the object that is sounding it.
   *
   * Holding this is what makes REQ-007 and REQ-008 one judgement rather than
   * two (plan.md D-3) — knowing what is playing answers both "is this already
   * the right track?" and "is anything else still running?". The alternative,
   * inferring it from `getAllPlaying()` on every call, means picking the
   * looping entries out of a list that also holds effects, and a wrong answer
   * there is silence or a second track, neither of which raises an error.
   *
   * The two move together and are only ever written in `playBgm` step 5.
   */
  private currentKey: string | null = null;

  private current: Phaser.Sound.BaseSound | null = null;

  /**
   * The one track remembered while the audio system is locked (D-7, REQ-016).
   *
   * One, not a queue. A track is a *state* — "which music should be sounding"
   * is still the right question several frames later — so only the last answer
   * matters. Walking three menu screens while locked asks for the menu track
   * three times and starts it once.
   */
  private pendingKey: string | null = null;

  /**
   * Where the settings are written back, or `null` when storage is unusable.
   *
   * Held rather than fetched per keypress so that one refusal — private mode,
   * a disabled origin — is decided once at construction instead of on every
   * press. `SettingsSystem` accepts `null` throughout and falls back to the
   * defaults, so a game with no storage still mutes; it just forgets on reload
   * (design.md §4.3).
   */
  private readonly storage: StorageAdapter | null;

  /**
   * What the player has chosen. Replaced whole, never mutated.
   *
   * `Settings` is `readonly` and every `SettingsSystem` function returns a new
   * object, so "changed the copy but the original moved too" cannot happen
   * here (design.md §4.2).
   */
  private currentSettings: Settings;

  constructor(game: Phaser.Game, storage: StorageAdapter | null) {
    this.game = game;
    this.storage = storage;
    this.currentSettings = loadSettings(storage);

    // Applied before any track can start, which is what makes a muted reload
    // silent from the first frame rather than from the first keypress
    // (REQ-011, AC-013). Both properties are plain manager fields and accept a
    // write while the context is still locked, so this needs no lock guard —
    // and it must not have one: the whole point is that the value is in place
    // before the unlock listener below starts the remembered track.
    this.applySettings();

    // Listening only while locked, and only once, because unlocking happens at
    // most once per page: `WebAudioSoundManager.unlock` (`:339-378`) removes
    // all five of its input listeners after the first event, so there is no
    // second UNLOCKED to hear. Registering unconditionally would leave a
    // listener on the manager for a game whose context was never suspended.
    if (game.sound.locked) {
      game.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (this.pendingKey === null) {
          return;
        }

        const key = this.pendingKey;

        // Cleared before the call, not after: `playBgm` now passes step 2 and
        // runs to completion, and leaving the field set would keep a track
        // that has already started looking like one still waiting to.
        this.pendingKey = null;

        this.playBgm(key);
      });
    }
  }

  // @MX:ANCHOR: [AUTO] The five-branch order below is the contract, not an
  // arrangement of it. Reordering the cache check past the stop, or dropping
  // the `isPlaying` half of the same-key check, keeps every test green while
  // producing a silent game.
  // @MX:REASON: Six scenes call this — the five menu screens and Battle — and
  // each one states only which track it wants, delegating "is it already
  // running?" and "is anything else?" entirely to this order.
  /**
   * Starts the track this screen requires, or leaves the one already running
   * alone. Five branches, in `design.md` §3.2's order — the order is the
   * design, not an implementation detail of it.
   *
   * Step 1 before step 4 is the part that is easy to get wrong. A key that
   * failed to load returns here having touched nothing, so the track that did
   * load keeps playing; were the cache check to sit after the stop, a single
   * missing file would silence the music that was working (REQ-015's second
   * half, and what `acceptance.md` AC-015's `k2` reads).
   *
   * Step 3 asks `isPlaying` as well as the key. Comparing keys alone lets a
   * track that has ended or been stopped satisfy "same key, leave it", which
   * produces a silent screen — and a silent screen raises no error (D-3).
   *
   * Step 4 destroys as well as stops. A stopped `Sound` stays in the manager's
   * `sounds` array; it is filtered out of `getAllPlaying()`, so it is invisible
   * to every check while still accumulating one entry per scene change.
   */
  playBgm(key: string): void {
    // 1 — not loaded (D-8, REQ-015)
    if (!this.has(key)) {
      return;
    }

    // 2 — locked: remember, do not request (D-7, REQ-016). Requesting here
    // would not fail loudly — `BaseSound.js:337` sets `isPlaying = true` on a
    // suspended context — it would just make a silent track that reports
    // itself as playing. AC-015 reads `sound.sounds.length === 0` at this
    // point, which is why nothing may be constructed either, not merely
    // left unplayed.
    if (this.game.sound.locked) {
      this.pendingKey = key;
      return;
    }

    // 3 — already the right track, still running (D-3, REQ-007)
    if (key === this.currentKey && this.current !== null && this.current.isPlaying) {
      return;
    }

    // 4 — something else is holding the channel (REQ-008)
    if (this.current !== null) {
      this.current.stop();
      this.current.destroy();
      this.current = null;
      this.currentKey = null;
    }

    // 5 — start it, and write the ledger
    const started = this.game.sound.add(key, { loop: true, volume: BGM_VOLUME });

    started.play();

    this.current = started;
    this.currentKey = key;
  }

  /**
   * Plays a one-shot sound, or returns having done nothing (design.md §3.4).
   *
   * Two guards, and the order between them does not matter because neither
   * remembers anything — both simply decline.
   *
   * The cache guard is the one that keeps a missing file from stopping the
   * game. `WebAudioSound.js:44-48` throws `Audio key ... not found in cache`
   * when the buffer is absent, so without this line one failed download turns
   * into an exception on a hot path (REQ-015, plan.md D-8). Asking the cache is
   * a map lookup; wrapping the call in try/catch instead would pay for the
   * throw and would swallow unrelated errors with it.
   *
   * The lock guard drops the request rather than deferring it, and that is the
   * one asymmetry in this module: background music is a *state* and is worth
   * remembering, but an effect is an *event* — replayed late it is the sound of
   * something that already happened, which is worse than nothing (plan.md
   * D-7). Playing while locked is not an option: `BaseSound.js:337` sets
   * `isPlaying = true` regardless and `WebAudioSound.js:376` starts a source on
   * a suspended context, so the state would claim success with no sound made.
   */
  playSfx(key: string): void {
    if (!this.has(key)) {
      return;
    }

    if (this.game.sound.locked) {
      return;
    }

    // `BaseSoundManager.play` (`:324-347`) builds a fresh `Sound` per call and
    // destroys it on completion, so there is no bookkeeping to do and no leak
    // to avoid. Overlapping copies are correct: two hits in one frame are two
    // events. It is also what makes AC-004 observable — a key appearing twice
    // in `getAllPlaying()` means the call was made twice.
    this.game.sound.play(key);
  }

  /** Whether the loader actually got this key. The guard above explains why. */
  private has(key: string): boolean {
    return this.game.cache.audio.exists(key);
  }

  /** The current choice, for judging and debugging. Read-only by construction. */
  get settings(): Settings {
    return this.currentSettings;
  }

  // @MX:ANCHOR: [AUTO] Six scenes call this, and a scene that forgets it is a
  // screen where `M` silently does nothing — no error, no log, just a control
  // that stops working on one screen out of six.
  // @MX:REASON: Phaser's keyboard plugin belongs to a scene, not to the game
  // (`scene.input.keyboard`), so there is no single place to bind a global key;
  // six calls is the shape that requirement forces (design.md §7.4, plan.md D-9).
  /**
   * Binds this screen's audio controls (REQ-009, REQ-010, design.md §7.4).
   *
   * `on`, not `once`: muting is a toggle and has to survive being used. That
   * differs from the keys that leave a scene — `MainMenuScene:63`'s `SPACE`,
   * `ResultScene`'s `ESC` — which fire once because there is no second time.
   *
   * Nothing is removed on the way out, and nothing needs to be. A scene's
   * `shutdown` reaches `KeyboardPlugin.shutdown` through one relay — the scene
   * emits SHUTDOWN, `InputPlugin` re-emits it on `pluginEvents`, and the
   * keyboard plugin listens there (design.md §7.4) — which calls
   * `removeAllListeners()`. Re-entering a scene therefore binds onto a cleared
   * plugin rather than stacking a second handler.
   *
   * The arrows are opt-in because `BattleScene:437` builds them as cursor keys
   * for movement; the main menu is the one screen the player named where they
   * are free (plan.md D-9).
   */
  toggleMuted(): void {
    this.commit(toggleMute(this.currentSettings));
  }

  changeVolume(delta: 1 | -1): void {
    this.commit(stepVolume(this.currentSettings, delta));
  }

  attach(scene: Phaser.Scene, options?: { volumeKeys?: boolean }): void {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      return;
    }

    keyboard.on('keydown-M', () => {
      this.toggleMuted();
    });

    if (options?.volumeKeys !== true) {
      return;
    }

    keyboard.on('keydown-LEFT', () => {
      this.changeVolume(-1);
    });

    keyboard.on('keydown-RIGHT', () => {
      this.changeVolume(1);
    });
  }

  /**
   * Takes a new settings value: hold it, make it audible, write it down.
   *
   * One path for all three keys, so "changed but not saved" and "saved but not
   * heard" have nowhere to appear. Saving last is deliberate — `saveSettings`
   * swallows a refusing storage (design.md §4.2), so a press that cannot be
   * recorded still takes effect for this session.
   */
  private commit(next: Settings): void {
    this.currentSettings = next;

    this.applySettings();

    saveSettings(this.storage, next);
  }

  /**
   * Pushes the held settings onto the manager — the only two lines in this
   * codebase that write `game.sound`'s own state.
   *
   * Two axes, kept separate on purpose. Muting is a switch the player flips
   * back; volume is where they left it. Folding mute into "volume 0" would
   * lose the second value, and the reverse — reading volume 0 as muted — is
   * the trap `design.md` §4.1 keeps the minimum step above zero to avoid.
   */
  private applySettings(): void {
    this.game.sound.mute = this.currentSettings.muted;

    // The single axis the player moves (plan.md D-2). Per-sound volumes —
    // `BGM_VOLUME` is the only one — are ratios *under* this, applied by the
    // manager's gain node rather than multiplied in by hand.
    this.game.sound.volume = masterVolume(this.currentSettings);
  }
}

// @MX:ANCHOR: [AUTO] Exactly one GameAudio per game, and every scene must
// reach it through here rather than constructing its own. A second instance
// keeps a second ledger, and two ledgers each believe they hold the only
// track — which is how two loops end up playing at once.
// @MX:REASON: Six callers, all of them scene `create()` methods that run again
// on every re-entry and retry; the shared instance is the only reason a track
// survives a scene change instead of restarting.
/**
 * The instance for this game, building it on the first ask.
 *
 * Scenes call this rather than constructing directly, so that "one instance
 * per game" is a property of the code rather than a rule people have to
 * remember. `MainMenuScene` is the first caller in practice; `Boot` and
 * `Preload` never call it, because they carry no controls and play nothing
 * (REQ-009, design.md §7.2).
 *
 * The read is typed `unknown` and narrowed rather than cast: the registry
 * hands back `any`, and a cast here would let an unrelated value under the
 * same key travel as a `GameAudio` until it failed somewhere far away.
 */
export function gameAudio(game: Phaser.Game): GameAudio {
  const existing: unknown = game.registry.get(REGISTRY_KEY);

  if (existing instanceof GameAudio) {
    return existing;
  }

  // Storage is resolved here rather than by each scene, so the settings key is
  // opened exactly once per game and every screen reads the same answer.
  // `browserStorage()` returns `null` where the origin refuses, which
  // `SettingsSystem` already treats as "use the defaults" (design.md §4.3).
  const created = new GameAudio(game, browserStorage());

  game.registry.set(REGISTRY_KEY, created);

  return created;
}
