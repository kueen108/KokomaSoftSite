/**
 * The keys the game plays sounds under.
 *
 * Gathered into one constant for the same reason `TEXTURE` and `SCENE` are
 * (`gameConfig.ts:34-54`): a key typed a second time can drift from the first,
 * and a sound that does not play raises no error. A missing texture at least
 * falls back to a visible placeholder shape; a missing sound is silence, which
 * looks exactly like a sound the player's speakers are too quiet to carry.
 *
 * These keys live here rather than in `gameConfig.ts` because that file is
 * append-only by convention (`structure.md` @NAV:DEC-SHARED-FILE-APPEND-ONLY,
 * C-6) and this SPEC has nothing to add to it — audio declares itself in its
 * own file and nothing else has to change to accommodate it (plan.md D-6).
 */
export const SOUND = {
  cast: 'sfx-cast',
  hit: 'sfx-hit',
  summon: 'sfx-summon',
  death: 'sfx-death',
  victory: 'sfx-victory',
  defeat: 'sfx-defeat',
  bgmMenu: 'bgm-menu',
  bgmBattle: 'bgm-battle',
} as const;

/**
 * One sound to load, and the key it is registered under.
 *
 * `path` is a single string rather than a list of per-format alternatives
 * because the game ships one audio format (C-13, plan.md D-6). Should a second
 * format ever be needed, this field widens to `string | readonly string[]` and
 * goes to the loader unchanged — `this.load.audio(key, path)` already accepts
 * either. The wiring would not move; only files and table rows would be added.
 */
export interface AudioAsset {
  readonly key: string;
  readonly path: string;
}

/**
 * The eight sounds the game plays: six effects and two music loops.
 *
 * Every path here must appear in `public/assets/LICENSES.md`; acceptance.md
 * AC-003 reads this file and checks that in both directions, the way AC-013 of
 * SPEC-CAMPAIGN-ART-001 does for the images in `assets.ts`. That check greps
 * the path strings straight out of this file and expects each one to be a file
 * on disk, so the paths are written out literally rather than derived from the
 * keys — and no other text here may be shaped like one of them, or the grep
 * counts a path the loader never asks for.
 */
export const AUDIO_ASSETS: readonly AudioAsset[] = [
  { key: SOUND.cast, path: 'assets/audio/sfx-cast.ogg' },
  { key: SOUND.hit, path: 'assets/audio/sfx-hit.ogg' },
  { key: SOUND.summon, path: 'assets/audio/sfx-summon.ogg' },
  { key: SOUND.death, path: 'assets/audio/sfx-death.ogg' },
  { key: SOUND.victory, path: 'assets/audio/sfx-victory.ogg' },
  { key: SOUND.defeat, path: 'assets/audio/sfx-defeat.ogg' },
  { key: SOUND.bgmMenu, path: 'assets/audio/bgm-menu.ogg' },
  { key: SOUND.bgmBattle, path: 'assets/audio/bgm-battle.ogg' },
];
