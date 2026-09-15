// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-5) and
// C-6 forbids unit tests for fx files; every effect here is verified by reading
// the running scene in a browser — tween counts, body values, cameraFilter bits
// (acceptance.md AC-002/003/004/007). This is not pending work.
// @MX:NOTE: [AUTO] This module imports nothing from src/systems/ or
// src/entities/ (design.md §1.1). The scene tells it which kind of thing was
// hit; it never asks an entity. Keep it that way — the dependency runs one way,
// scene → fx, so that entities stay ignorant of presentation (plan.md D-7).
import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';

import { DamageNumbers } from './DamageNumbers';

/**
 * What a hit target does besides flashing (design.md §3.1).
 *
 * Units use hurt/guard animation poses; the boss wobbles in place;
 * a base only flashes. The scene chooses the value, because the scene is the
 * one place that knows every class by name (plan.md D-7).
 */
export type HitReaction = 'enemy' | 'ally' | 'boss' | 'base';

/** The white hit flash: an overlay above the sprite, faded out (design.md §3.1). */
const FLASH_MS = 80;
const FLASH_COLOR = 0xffffff;
// @MX:NOTE: [AUTO] Two alphas, one per renderer. WebGL fills the sprite's own
// silhouette white, so it can start near-opaque; Canvas has no tint (C-13) and
// gets a plain white box instead, which reads as "hit" at 0.6 without hiding
// the sprite (design.md §3.2).
const FLASH_ALPHA_WEBGL = 0.9;
const FLASH_ALPHA_CANVAS = 0.6;

// Hurt/guard sprite poses provide recoil through UnitMotion's simulation clock.
// Cosmetic tweens must never own actor.x: a yoyo restores a stale position,
// cancels player retreat/AI movement, and makes balance depend on wall-clock FPS.

/** The boss's in-place wobble: 0 → +2° → −2° → 0 over 120 ms (design.md §3.1). */
const BOSS_WOBBLE_DEG = 2;
const BOSS_WOBBLE_MS = 120;

/**
 * The death copy: a scene-owned image at the death spot that shrinks to a
 * fifth of its size and fades out over 300 ms (design.md §4.1). Well inside
 * REQ-003's 500 ms ceiling. Counted by name in acceptance.md AC-005.
 */
const GHOST_NAME = 'fx-ghost';
const GHOST_MS = 300;
const GHOST_END_SCALE = 0.2;

// @MX:NOTE: [AUTO] 6×6 and not a rounder size, on purpose. acceptance.md
// AC-015 greps src/ for the nine unit-size literals that SPEC-CAMPAIGN-ART-001
// retired — 16×16 among them — and requires 0 matches. A 16×16 spark would
// re-trip that grep (plan.md D-3). 6×6 is none of the nine. This constant is
// the single declaration site for the size; nothing else spells it out, not
// even this comment (the grep reads comments too).
const SPARK_TEXTURE_KEY = 'tex-fx-spark';
const SPARK_SIZE = 6;
const SPARK_COLOR = 0xffffff;
/** Warm gold. Tint is WebGL-only (C-13), so Canvas shows the white square. */
const SPARK_TINT = 0xf5d76e;
/** Per death (design.md §4.2). */
const SPARK_COUNT = 12;
/** Under REQ-003's 500 ms, so the burst is gone before AC-005 recounts. */
const SPARK_LIFESPAN_MS = 350;
const SPARK_SPEED = { min: 60, max: 160 };
// The ground graphic is created after this module and fills the lane from
// LANE_Y + 30 down at depth 0; sparks that fly low would vanish under it at
// the same depth. One step up keeps the burst visible over ground and units.
const SPARK_DEPTH = 1;

/**
 * The base-hit shake (design.md §6): 120 ms, well under REQ-005's 250 ms
 * ceiling. Intensity is a fraction of the viewport — 0.006 of 1280 px is
 * about 7.7 px of travel.
 */
const SHAKE_MS = 120;
const SHAKE_INTENSITY = 0.006;

/**
 * The boss-phase flash (design.md §6): 180 ms in the boss HUD's pale violet
 * (#d8b6f5), so the flash reads as "the boss changed" rather than "hit".
 */
const PHASE_FLASH_MS = 180;
const PHASE_FLASH_RGB = { r: 216, g: 182, b: 245 } as const;

/**
 * The finish sequence (design.md §7): physics at a quarter speed, a 200 ms
 * flash in the outcome's colour, a 600 ms fade to black, and the result scene
 * 800 ms after the decision — inside REQ-015's 500–1,000 ms window.
 */
// @MX:NOTE: [AUTO] 4 means SLOWER here. Arcade `World.timeScale` scales the
// frame time ("2.0 = half speed", World.js:212-216) — the opposite sense of
// `Clock.timeScale` and `TweenManager.timeScale`, where a value below 1 slows
// (Clock.js:71-74). Only the physics scale is touched: the 800 ms delay below
// rides the scene Clock, so scaling that too would stretch it to 3.2 s
// (design.md §7.2). No restore code exists on purpose — `ArcadePhysics`
// destroys and nulls its `World` on shutdown (ArcadePhysics.js:725-728) and
// builds a new one at `timeScale` 1 on the next start (`:130-134`).
const FINISH_PHYSICS_TIME_SCALE = 4;
const FINISH_FLASH_MS = 200;
const FINISH_FADE_MS = 600;
const FINISH_DELAY_MS = 800;
/** Warm gold for a win, deep red for a loss; the fade is to plain black. */
const VICTORY_FLASH_RGB = { r: 255, g: 226, b: 128 } as const;
const DEFEAT_FLASH_RGB = { r: 168, g: 24, b: 32 } as const;

/** A decided battle. The scene only calls `finish` once `ongoing` is ruled out. */
export type FinishOutcome = 'victory' | 'defeat';

/**
 * The battle's presentation layer, owned by `BattleScene` and living exactly
 * as long as one run of its `create()` (design.md §1).
 *
 * Five jobs so far: the second camera and the per-object camera assignment
 * that keeps the HUD still while the world shakes (plan.md D-1); the hit
 * reaction — a white flash over the target plus a jolt that never touches the
 * sprite's tint or scale (plan.md D-2); the death effect — a shrinking copy
 * of the sprite plus one particle burst from a single reused emitter (plan.md
 * D-3); the damage number that rises from every hit, drawn from a fixed pool
 * of 24 texts (plan.md D-4); the two camera effects — a world-only shake on a
 * base hit and a flash on a boss phase change (design.md §6); and the finish
 * sequence — slowed physics, flash, fade, then the result scene 800 ms after
 * the decision (design.md §7).
 */
export class BattleFx {
  /** Draws the world; shakes, flashes and fades are applied to this one only. */
  readonly world: Phaser.Cameras.Scene2D.Camera;
  /** Draws the HUD and nothing else. Added second, so it renders on top. */
  readonly hud: Phaser.Cameras.Scene2D.Camera;

  private readonly isWebGL: boolean;
  /**
   * The one emitter every death fires. Made once here, never per death: a
   * fresh `add.particles` per kill is exactly the per-effect object growth
   * REQ-004 forbids (design.md §4.2). Its particles live inside it, not on
   * the display list, so AC-005's object count never sees them.
   */
  private readonly spark: Phaser.GameObjects.Particles.ParticleEmitter;
  /**
   * The damage-number pool, built once here (REQ-010). `hit` reconfigures a
   * slot per hit and never adds a Text object (design.md §5).
   */
  private readonly numbers: DamageNumbers;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reduced = false,
  ) {
    this.world = scene.cameras.main;
    this.hud = scene.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT, false, 'hud');
    // Read once. Tint is WebGL-only (C-13), so the flash takes a different
    // shape under Canvas, and the choice cannot change mid-scene.
    this.isWebGL = scene.renderer.type === Phaser.WEBGL;
    // After the HUD camera exists: the emitter is a world object and must be
    // hidden from the HUD camera like everything else (toWorld).
    this.spark = this.createSparkEmitter();
    // Same rule for the pool: 24 world objects, every one hidden from the HUD
    // camera, or AC-007's unassigned count would read 24.
    this.numbers = new DamageNumbers(scene);
    this.toWorld(...this.numbers.texts);
  }

  // @MX:WARN: [AUTO] Every game object in the battle must pass through exactly
  // one of toWorld / toHud (acceptance.md AC-007 counts the rest, requires 0).
  // @MX:REASON: An object that passes through neither has a zero cameraFilter
  // and is drawn by BOTH cameras: no error, nothing visible while the camera is
  // still, and a doubled "ghost" the moment the world camera shakes — so the
  // spawn site that forgot the call never notices. Dynamic spawns are covered
  // by the physics groups' createCallback; anything created elsewhere in
  // BattleScene must call one of these two by hand.
  /** Marks objects as world-drawn: the HUD camera skips them. */
  toWorld(...objects: Phaser.GameObjects.GameObject[]): void {
    this.hud.ignore(objects);
  }

  /** Marks objects as HUD-drawn: the world camera skips them, so they never shake. */
  toHud(...objects: Phaser.GameObjects.GameObject[]): void {
    this.world.ignore(objects);
  }

  /**
   * Shows a hit on `target`: a white flash over it, by kind a jolt (REQ-001),
   * and `damage` rising from the hit point as a number (REQ-009). `damage` is
   * the value the scene handed to `takeDamage`, shown as-is. Nothing here
   * writes the sprite's tint, scale or origin, so the aura highlight an ally
   * wears survives the hit (AC-004) and the body's size and offset never move
   * (REQ-002).
   */
  hit(target: Phaser.Physics.Arcade.Sprite, reaction: HitReaction, damage: number): void {
    if (!target.active) {
      return;
    }

    this.flash(target);
    this.numbers.show(target.x, target.y, damage);

    switch (reaction) {
      case 'enemy':
      case 'ally':
        // BattleScene already requests a simulation-timed hurt/guard pose.
        // Flash and damage numbers are visual only; movement remains authoritative.
        break;
      case 'boss':
        this.wobble(target);
        break;
      case 'base':
        // A building does not flinch; the camera shake (baseHit) carries that.
        break;
    }
  }

  // @MX:WARN: [AUTO] Shake `this.world` and only `this.world`. Never call
  // shake (or flash, or fade) on `this.hud`, and never on `scene.cameras`
  // as a whole.
  // @MX:REASON: REQ-006 requires the HUD to hold still while the world
  // shakes, and the second camera is the ONLY thing that delivers it —
  // setScrollFactor(0) does not survive a shake (spec.md REQ-006 footnote,
  // Shake.js:204-210 moves the camera matrix). A shake on `hud` breaks REQ-006
  // silently: no error, just a vibrating health bar. AC-007 reads
  // `cameras[1].shakeEffect.isRunning` and requires false.
  /**
   * Shakes the world camera for a base hit (REQ-005): 120 ms at 0.006 of the
   * viewport (design.md §6). A shake already running is left alone — Phaser's
   * default `force: false` ignores the new call — so a base under a volley
   * rattles once, never harder (design.md §6).
   */
  baseHit(): void {
    if (this.reduced) return;
    this.world.shake(SHAKE_MS, SHAKE_INTENSITY);
  }

  /**
   * Flashes the world camera once for a boss phase change (REQ-007). The
   * scene decides WHEN — it compares the phase reference frame to frame
   * (design.md §6.1) — and this only draws. Camera flash is a plain fill over
   * the camera's viewport in both renderers, so Canvas needs no branch (C-13).
   */
  phaseFlash(): void {
    if (this.reduced) return;
    this.world.flash(PHASE_FLASH_MS, PHASE_FLASH_RGB.r, PHASE_FLASH_RGB.g, PHASE_FLASH_RGB.b);
  }

  // @MX:NOTE: [AUTO] `force: true` on this flash, and only on this one. The
  // boss phase flash above runs 180 ms with Phaser's default `force: false`;
  // if the outcome is decided while it is still running, a non-forced outcome
  // flash is silently ignored (Flash.js:192) and REQ-008 — an effect begun
  // within one frame of the decision — fails with no error. Forcing restarts
  // the effect in the outcome colour instead.
  /**
   * Plays the finish (REQ-008, REQ-015; design.md §7.1): slows the physics
   * world to a quarter speed, flashes the world camera in the outcome's
   * colour, fades it to black the frame the flash completes, and calls
   * `onDone` 800 ms after this call on the scene Clock. The scene passes
   * `scene.start` as `onDone`. Nothing here touches a rule value or the save —
   * the scene settles before it calls this. The HUD camera is left alone, so
   * the bars stay readable while the world darkens.
   */
  finish(outcome: FinishOutcome, onDone: () => void): void {
    this.scene.physics.world.timeScale = FINISH_PHYSICS_TIME_SCALE;

    if (this.reduced) {
      this.world.fade(FINISH_DELAY_MS, 0, 0, 0, true);
      this.scene.time.delayedCall(FINISH_DELAY_MS, onDone);
      return;
    }
    const rgb = outcome === 'victory' ? VICTORY_FLASH_RGB : DEFEAT_FLASH_RGB;

    // Chained on the completion event, not on `flash`'s callback argument —
    // that argument is an onUpdate hook (Flash.js:208), not onComplete. The
    // camera updates its flash before its fade each frame, so the fade starts
    // on the frame the flash ends and `flashEffect.isRunning ||
    // fadeEffect.isRunning` holds every frame until `onDone` (AC-009).
    this.world.once(Phaser.Cameras.Scene2D.Events.FLASH_COMPLETE, () => {
      this.world.fade(FINISH_FADE_MS, 0, 0, 0, true);
    });
    this.world.flash(FINISH_FLASH_MS, rgb.r, rgb.g, rgb.b, true);

    // The scene Clock, at timeScale 1: wall time, so 800 ms is 800 ms.
    this.scene.time.delayedCall(FINISH_DELAY_MS, onDone);
  }

  // @MX:WARN: [AUTO] Call this BEFORE the sprite's destroy(), never after, and
  // never in place of it. The scene's destroy() stays exactly where it is.
  // @MX:REASON: The ghost is built from the live sprite's x, y, texture,
  // frame, flip, origin and display size. destroy() drops the texture
  // reference and pulls the object out of the scene in the same frame, so a
  // call after it copies a corpse: missing texture, nothing visible, an error
  // under Canvas. And moving destroy() to the ghost's onComplete would drag
  // the bounty and population-slot code with it — REQ-003 requires those to
  // apply at the death instant, one frame sooner than the ghost is gone.
  /**
   * Shows a death at `sprite`'s spot: a copy of it shrinking and fading over
   * 300 ms, and a burst of twelve sparks (REQ-003). Everything here is owned
   * by the scene, not by the sprite (C-14), so the sprite may be destroyed on
   * the very next line and the effect still plays out and removes itself
   * (REQ-004).
   */
  death(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite.active) {
      return;
    }

    // A knockback from the killing hit may still be running on the sprite.
    // Its DESTROY listener (releaseOnDestroy) would remove it too, but this
    // kills it now, before the copy is made; the listener's later remove() is
    // a guarded no-op on an already-destroyed tween.
    this.scene.tweens.killTweensOf(sprite);

    const ghost = this.scene.add
      .image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
      .setOrigin(sprite.originX, sprite.originY)
      .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
      .setFlipX(sprite.flipX)
      .setDepth(sprite.depth)
      .setName(GHOST_NAME);

    this.toWorld(ghost);

    // Relative to the copy's own scale: setDisplaySize may have left scaleX
    // and scaleY unequal, and "a fifth of its size" must hold either way.
    this.scene.tweens.add({
      targets: ghost,
      scaleX: ghost.scaleX * GHOST_END_SCALE,
      scaleY: ghost.scaleY * GHOST_END_SCALE,
      alpha: 0,
      duration: GHOST_MS,
      ease: 'Quad.In',
      onComplete: () => ghost.destroy(),
    });

    this.spark.explode(this.reduced ? 3 : SPARK_COUNT, sprite.x, sprite.y);
  }

  /**
   * The single spark emitter, in explode mode from the start (`frequency: -1`
   * — no flow, particles only when `explode` asks). Lives as long as the
   * scene; the scene's shutdown destroys it with the rest of the display list.
   */
  private createSparkEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
    this.ensureSparkTexture();

    const emitter = this.scene.add.particles(0, 0, SPARK_TEXTURE_KEY, {
      frequency: -1,
      lifespan: SPARK_LIFESPAN_MS,
      speed: SPARK_SPEED,
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: SPARK_TINT,
    });

    emitter.setName('fx-spark').setDepth(SPARK_DEPTH);
    this.toWorld(emitter);

    return emitter;
  }

  /**
   * Draws the 6×6 white spark once per texture manager, not once per scene
   * run: a restarted BattleScene finds the key and skips, the same guard the
   * scene's unit textures use (SPEC-CAMPAIGN-ART-001 REQ-003). No file, so
   * nothing for LICENSES.md and nothing REQ-016 has to see.
   */
  private ensureSparkTexture(): void {
    if (this.scene.textures.exists(SPARK_TEXTURE_KEY)) {
      return;
    }

    const graphics = this.scene.add.graphics();

    graphics.fillStyle(SPARK_COLOR, 1);
    graphics.fillRect(0, 0, SPARK_SIZE, SPARK_SIZE);
    graphics.generateTexture(SPARK_TEXTURE_KEY, SPARK_SIZE, SPARK_SIZE);
    graphics.destroy();
  }

  /**
   * A scene-owned overlay that fades out over 80 ms and destroys itself.
   *
   * It is deliberately not a child of the sprite (C-14) and does not follow
   * it: its own tween owns its lifetime, so a sprite that dies mid-flash leaves
   * the flash to finish and remove itself on schedule (REQ-004).
   */
  private flash(target: Phaser.Physics.Arcade.Sprite): void {
    if (this.reduced) return;
    const overlay = this.overlayFor(target);

    overlay.setName('fx-flash');
    this.toWorld(overlay);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: FLASH_MS,
      ease: 'Linear',
      onComplete: () => overlay.destroy(),
    });
  }

  /** The renderer-specific flash shape (design.md §3.2). */
  private overlayFor(target: Phaser.Physics.Arcade.Sprite): Phaser.GameObjects.GameObject {
    if (this.isWebGL) {
      return this.scene.add
        .image(target.x, target.y, target.texture.key, target.frame.name)
        .setOrigin(target.originX, target.originY)
        .setDisplaySize(target.displayWidth, target.displayHeight)
        .setFlipX(target.flipX)
        .setTintFill(FLASH_COLOR)
        .setAlpha(FLASH_ALPHA_WEBGL)
        .setDepth(target.depth + 1);
    }

    // Canvas: tint is a no-op there, so the silhouette would be invisible. A
    // plain white box the size of the sprite is drawn the same by both
    // renderers.
    return this.scene.add
      .rectangle(target.x, target.y, target.displayWidth, target.displayHeight, FLASH_COLOR)
      .setAlpha(FLASH_ALPHA_CANVAS)
      .setDepth(target.depth + 1);
  }

  /** Rocks the boss 0 → +2° → −2° → 0 without moving its body (design.md §3.1). */
  private wobble(target: Phaser.Physics.Arcade.Sprite): void {
    if (this.isJolting(target)) {
      return;
    }

    const quarter = BOSS_WOBBLE_MS / 4;
    const chain = this.scene.tweens.chain({
      targets: target,
      tweens: [
        { angle: BOSS_WOBBLE_DEG, duration: quarter, ease: 'Sine.InOut' },
        { angle: -BOSS_WOBBLE_DEG, duration: quarter * 2, ease: 'Sine.InOut' },
        { angle: 0, duration: quarter, ease: 'Sine.InOut' },
      ],
    });

    this.releaseOnDestroy(target, chain);
  }

  /**
   * Whether a jolt is already queued or running on `target`.
   *
   * `getTweensOf` rather than `isTweening`: a tween added earlier in this same
   * frame is still pending, not playing, and `isTweening` would miss it. Two
   * hits landing on one unit in one frame — a melee tick and a projectile —
   * is exactly the case that must not stack.
   */
  private isJolting(target: Phaser.GameObjects.GameObject): boolean {
    return this.scene.tweens.getTweensOf(target).length > 0;
  }

  /**
   * Ties a jolt tween to its target's life.
   *
   * Phaser does not stop a tween when its target is destroyed; it would keep
   * writing to the dead object until it ran out, and a scene-owned listener
   * would otherwise pile up one closure per hit on a long-lived unit. So the
   * DESTROY listener removes the tween, and the tween's completion removes
   * the listener — whichever comes first cleans up the other (REQ-004).
   */
  private releaseOnDestroy(
    target: Phaser.GameObjects.GameObject,
    tween: Phaser.Tweens.BaseTween,
  ): void {
    const release = (): void => {
      tween.remove();
    };

    target.once(Phaser.GameObjects.Events.DESTROY, release);
    tween.once(Phaser.Tweens.Events.TWEEN_COMPLETE, () => {
      target.off(Phaser.GameObjects.Events.DESTROY, release);
    });
  }
}
