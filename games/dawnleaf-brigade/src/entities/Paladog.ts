import { ARMORS, heroStats } from '../systems/HeroProgressSystem';
import type { ArmorId } from '../types/hero';
// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-7);
// movement feel is verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work.
import Phaser from 'phaser';
import { applyDamage, isDead, regenerateHealth } from '../systems/CombatSystem';
import type { DamageResult, Health } from '../types/combat';

import { PALADOG_SPEED, PALADOG_MAX_HP } from '../config/balance';
import { LANE_LEFT_BOUND, LANE_RIGHT_BOUND, TEXTURE } from '../config/gameConfig';

/** Player character with independent health, regeneration and lane movement. */
export class Paladog extends Phaser.Physics.Arcade.Sprite {
  private health = { current: PALADOG_MAX_HP, max: PALADOG_MAX_HP };
  private regenDelayMs = 0;
  private armor: ArmorId = 'leather';
  private slowRemainingMs = 0;
  configure(armor: ArmorId, level = 0): void {
    this.armor = armor;
    const hp = heroStats(level, armor).maxHp;
    this.health = { current: hp, max: hp };
  }
  receivedDamage(amount: number): number {
    return Math.round(amount * ARMORS[this.armor].incoming);
  }
  heal(amount: number): void {
    this.health = regenerateHealth(this.health, 1000, amount);
  }
  slow(ms: number): void {
    this.slowRemainingMs = Math.max(this.slowRemainingMs, ms);
  }

  getHealth(): Health {
    return this.health;
  }

  takeDamage(amount: number): DamageResult {
    this.health = applyDamage(this.health, this.receivedDamage(amount));
    this.regenDelayMs = ARMORS[this.armor].delay;
    return { health: this.health, dead: isDead(this.health) };
  }

  regenerate(deltaMs: number): void {
    this.slowRemainingMs = Math.max(0, this.slowRemainingMs - deltaMs);
    const healingMs = Math.max(0, deltaMs - this.regenDelayMs);
    this.regenDelayMs = Math.max(0, this.regenDelayMs - deltaMs);
    this.health = regenerateHealth(this.health, healingMs, ARMORS[this.armor].regen);
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE.paladog);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1 - 30 / this.height);
    (this.body as Phaser.Physics.Arcade.Body).setSize(this.width * 0.6, this.height * 0.7);
  }

  /** Moves for one frame while a direction key is held, clamped to the lane. */
  move(leftHeld: boolean, rightHeld: boolean, deltaMs: number): void {
    const direction = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);

    if (direction !== 0) {
      this.setFlipX(direction < 0);
      this.x +=
        direction *
        PALADOG_SPEED *
        ARMORS[this.armor].speed *
        (this.slowRemainingMs > 0 ? 0.6 : 1) *
        (deltaMs / 1000);
    }

    // REQ-005: the lane has hard edges and the Paladog never crosses them.
    this.x = Phaser.Math.Clamp(this.x, LANE_LEFT_BOUND, LANE_RIGHT_BOUND);
  }
}
