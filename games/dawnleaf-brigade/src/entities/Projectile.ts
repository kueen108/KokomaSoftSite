// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-7);
// flight and impact are verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work.
import Phaser from 'phaser';

import { PROJECTILE_CULL_X, PROJECTILE_CULL_X_LEFT } from '../config/gameConfig';
import type { ProjectileSpec, ShotEffect } from '../types/combat';

/**
 * A projectile. Travels toward whichever side its `direction` names, damages
 * the first thing it touches, and is then gone — it does not pierce through
 * to a second target (REQ-007).
 *
 * Direction-aware since SPEC-UNIT-ROSTER-001 REQ-008: the Paladog's mace
 * projectile passes `direction: 1`, which reproduces its original
 * rightward-only flight exactly — this is the pre-existing behaviour made
 * explicit, not a change to it. A ranged enemy unit's projectile passes `-1`
 * and culls at the symmetric left bound instead.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  readonly damage: number;
  readonly effect: ShotEffect;
  private victims = new Set<unknown>();
  canHit(target: unknown): boolean {
    return !this.victims.has(target);
  }
  consumeHit(target: unknown): void {
    this.victims.add(target);
    if (this.effect !== 'spear' || this.victims.size >= 2) this.destroy();
  }

  private readonly launchX: number;
  private readonly speed: number;
  private readonly direction: 1 | -1;

  constructor(scene: Phaser.Scene, x: number, y: number, spec: ProjectileSpec) {
    super(scene, x, y, spec.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.launchX = x;
    this.damage = spec.damage;
    this.effect = spec.effect ?? 'plain';
    this.speed = spec.speed;
    this.direction = spec.direction;
    this.setFlipX(spec.direction < 0);
    (this.body as Phaser.Physics.Arcade.Body).setSize(16, 14);
  }

  // @MX:WARN: [AUTO] Call this AFTER adding the projectile to its physics
  // group, never from the constructor.
  // @MX:REASON: Phaser's Arcade Group applies its own defaults to every child
  // passed to `add()`, and those defaults include setVelocityX(0). A velocity
  // set during construction is silently wiped, leaving the projectile parked
  // on top of the Paladog: mana and cooldown still behave correctly, so the
  // HUD looks right and nothing fails — the shot just never travels. Observed
  // exactly that way in a browser before this was split out of the constructor.
  /** Sends the projectile toward `direction`'s side (REQ-007, REQ-008). */
  launch(): void {
    this.setVelocityX(this.speed * this.direction);
  }

  // @MX:WARN: [AUTO] The caller MUST destroy a projectile once this returns
  // true. Skipping the check does not break anything visibly and no test will
  // catch it.
  // @MX:REASON: A missed shot that is never destroyed keeps flying forever
  // with a live physics body. Nothing looks wrong at first — the failure shows
  // up only after a long session, as a gradual frame-rate collapse from
  // accumulated off-screen objects, which is then hard to trace back here.
  // This cleanup is part of REQ-007 and AC-008b, not an optimisation.
  /** True once the projectile has flown past everything it could have hit. */
  hasLeftLane(): boolean {
    return (
      Math.abs(this.x - this.launchX) > 720 ||
      (this.direction === 1 ? this.x > PROJECTILE_CULL_X : this.x < PROJECTILE_CULL_X_LEFT)
    );
  }
}
