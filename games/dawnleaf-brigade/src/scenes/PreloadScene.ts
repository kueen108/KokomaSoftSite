import { translate } from '../i18n/index';
import { installGrowthArt } from '../ui/GrowthArt';
import { installPortraitArt, PORTRAIT_ART } from '../ui/PortraitArt';
import { EXPEDITION_ART, installExpeditionArt } from '../ui/ExpeditionArt';
import { COMBAT_ART_KEYS, installCombatArt } from '../ui/CombatArt';
import { installMovementArt } from '../ui/MovementArt';
import { installCharacterArt } from '../ui/CharacterArt';
import { Interface } from '../ui/Interface';
import Phaser from 'phaser';

import { IMAGE_ASSETS } from '../config/assets';
import { AUDIO_ASSETS } from '../config/audio';
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  PALADOG_HEIGHT,
  PALADOG_WIDTH,
  PROJECTILE_SIZE,
  SCENE,
  TEXTURE,
} from '../config/gameConfig';

/**
 * Loads the nine sprites and the eight sounds, builds what is left over as
 * shapes, then hands on (SPEC-CAMPAIGN-ART-001 REQ-001, SPEC-GAME-AUDIO-001).
 *
 * This scene used to call no loader API at all. `SPEC-CORE-COMBAT-001` REQ-015
 * forbade reading anything from `public/assets/`, and its stated reason was
 * that real artwork was Phase 3 work — pulling image files in early would have
 * started the licence-tracking obligation for placeholders due to be thrown
 * away. The prohibition was conditional, and for images the condition is met:
 * the nine PNGs exist and every one is recorded in `public/assets/LICENSES.md`.
 * So SPEC-CAMPAIGN-ART-001 superseded the image half of REQ-015.
 *
 * The audio half stood until now on the same conditional: no audio file existed
 * to supersede it with. SPEC-GAME-AUDIO-001 met that condition too — eight CC0
 * files now sit under `public/assets/audio/`, each with a row in the same
 * licence table — so REQ-015 is now spent in full and this scene loads sound.
 *
 * Anyone reading `SPEC-CORE-COMBAT-001`'s progress record will find AC-016b
 * passing on a grep that required zero `this.load.image` calls. That record was
 * true when it was written and has not been edited; this comment is where the
 * reversal is recorded instead.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE.preload);
  }

  /**
   * Queues the nine sprites under the keys the game already draws with, and the
   * eight sounds under the keys it will play them with.
   *
   * Registering under the same key is what keeps the shape path a fallback
   * rather than dead code: nothing that draws has to know whether a key holds
   * a PNG or a rectangle, so no entity grows a branch (REQ-001).
   *
   * A file that fails to load is deliberately not handled here. Phaser finishes
   * the load either way and `create()` still runs, which is what REQ-004 asks
   * for — the player reaches the game and the missing key falls back to its
   * shape, rather than the loader stalling in front of the first screen.
   *
   * Audio has no shape to fall back to, so it relies on the other half of that
   * same tolerance: a sound whose key never reached the cache is simply never
   * played, because the play path checks the cache before it reaches Phaser
   * (SPEC-GAME-AUDIO-001 REQ-015, C-14). Loading the sounds here rather than in
   * each scene means that check has one cache to consult and the two music
   * loops are decoded before the first screen that wants them.
   */
  preload(): void {
    const ui = new Interface(
      this,
      `<div class="loading"><h1>${translate('새벽잎 원정대')}</h1><progress id="progress" max="1" value="0" aria-label="${translate('게임 불러오는 중')}"></progress></div>`,
    );
    this.load.on('progress', (value: number) => {
      ui.get<HTMLProgressElement>('progress').value = value;
    });
    for (const key of [...EXPEDITION_ART, 'frost-battle', 'ember-battle', 'astral-battle'])
      this.load.image(key, `assets/images/${key}.webp`);
    for (const key of COMBAT_ART_KEYS) this.load.image(key, `assets/images/${key}.webp`);
    for (const key of ['hero-run', 'allies-walk', 'enemies-walk'])
      this.load.image(key, `assets/images/${key}.webp`);
    this.load.image('fortress-atlas', 'assets/images/fortress-atlas.webp');
    this.load.image('ruins-battle', 'assets/images/ruins-battle.webp');
    this.load.image('graveyard-battle', 'assets/images/graveyard-battle.webp');
    this.load.image('forest-battle', 'assets/images/forest-battle.webp');
    this.load.image('party-atlas', 'assets/images/party-atlas.webp');
    this.load.image('party-novice', 'assets/images/party-novice.png');
    this.load.image('party-trained', 'assets/images/party-trained.png');
    this.load.image('expedition-growth', 'assets/images/expedition-growth.png');
    for (const key of PORTRAIT_ART) this.load.image(key, `assets/images/${key}.png`);
    this.load.image('enemies-atlas', 'assets/images/enemies-atlas.webp');
    for (const asset of IMAGE_ASSETS) {
      this.load.image(asset.key, asset.path);
    }

    for (const asset of AUDIO_ASSETS) {
      this.load.audio(asset.key, asset.path);
    }
  }

  /**
   * Draws the placeholder shapes for whichever of these four keys has no
   * texture yet, then hands on.
   *
   * Every generation below is a fallback, not a default. `preload()` has already
   * registered a PNG under each of these keys, so in a normal run all four calls
   * find the key taken and stand down; they draw only when that image failed to
   * load, which is exactly what REQ-003 and REQ-004 ask for.
   *
   * The shapes are kept rather than deleted for that reason — "nothing uses
   * these any more" is the wrong reading. They are what the game falls back to.
   */
  create(): void {
    installCharacterArt(this);
    installMovementArt(this);
    installCombatArt(this);
    installExpeditionArt(this);
    installGrowthArt(this);
    installPortraitArt(this);
    this.makeRectTexture(TEXTURE.paladog, PALADOG_WIDTH, PALADOG_HEIGHT, 0x4a90d9);
    // Enemy and ally textures are deliberately NOT built here, and the absence
    // is load bearing rather than an oversight — do not "restore" these lines.
    //
    // Since SPEC-CAMPAIGN-STAGE-001 an enemy's colour AND size come from its
    // definition under src/data/enemies/, and BattleScene builds both kinds
    // from those definitions. That builder skips any key that already exists,
    // so a rectangle generated here at a hardcoded size would win the race and
    // the declared size would never be read: the screen would keep the old
    // dimensions, no error would be raised, and every unit test would pass
    // (acceptance.md AC-022 exists because of exactly this).
    //
    // The same "first one wins" rule is now what lets the artwork through:
    // preload() registers each PNG before any of this runs, so the loaded image
    // is the thing that wins and every shape builder — here and in BattleScene
    // — becomes the fallback it was always shaped like.
    this.makeRectTexture(TEXTURE.allyBase, BASE_WIDTH, BASE_HEIGHT, 0x3f9e5a);
    this.makeRectTexture(TEXTURE.enemyBase, BASE_WIDTH, BASE_HEIGHT, 0x8a4fbe);
    this.makeCircleTexture(TEXTURE.projectile, PROJECTILE_SIZE, 0xf5d76e);

    this.scene.start(SCENE.mainMenu);
  }

  // @MX:ANCHOR: [AUTO] first texture registered under a key wins; never overwrite
  // @MX:REASON: [AUTO] This guard decides what all nine textures look like. If it
  // is removed the loaded PNG is silently replaced by a placeholder shape: no
  // error, no failing test, only a screen that quietly went back to rectangles.
  // Phaser 3.90 happens to skip the redraw for image-backed textures anyway, but
  // that is an internal branch of one version, not a contract (REQ-003).
  private makeRectTexture(key: string, width: number, height: number, color: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * Draws a filled circle that fills a `size` by `size` texture.
   *
   * Takes the texture size rather than the radius so the caller declares the
   * same kind of number every other key declares, and derives the radius from
   * it — a derivation, not a second declaration site (REQ-002).
   */
  private makeCircleTexture(key: string, size: number, color: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();
    const radius = size / 2;

    graphics.fillStyle(color, 1);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}
