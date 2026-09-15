// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-7); the
// damage rules this delegates to ARE unit-tested in CombatSystem, and the
// on-screen result is verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work.
import Phaser from 'phaser';

import { applyDamage, isDead } from '../systems/CombatSystem';
import type { DamageResult, Health } from '../types/combat';

/**
 * An ally or enemy stronghold. Holds the health that decides the battle:
 * when either base reaches zero the battle ends (REQ-014).
 */
export class Base extends Phaser.Physics.Arcade.Sprite {
  private health: Health;
  shielded = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hitPoints: number) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1 - 30 / this.height);
    // Anchor the collision body at the feet so lane-height projectiles hit the gate.
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(60, 150)
      .setOffset((this.width - 60) / 2, this.height - 150);
    this.setImmovable(true);
    this.health = { current: hitPoints, max: hitPoints };
  }

  takeDamage(amount: number): DamageResult {
    this.health = applyDamage(this.health, this.shielded ? 0 : amount);

    return { health: this.health, dead: isDead(this.health) };
  }

  getHealth(): Health {
    return this.health;
  }
}
