// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-7);
// rendering is verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work.
import Phaser from 'phaser';

import type { Health } from '../types/combat';
import { textStyle } from './TextStyles';

const BORDER_COLOR = 0xffffff;
const EMPTY_COLOR = 0x3a2020;

/** A labelled base health bar drawn from primitives — no texture, no asset. */
export class HealthBar {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly caption: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
    private readonly height: number,
    private readonly label: string,
    private readonly fillColor: number,
  ) {
    this.graphics = scene.add.graphics();
    this.caption = scene.add.text(
      x,
      y - 22,
      label,
      textStyle({
        fontSize: '16px',
        color: '#ffffff',
      }),
    );
  }

  /**
   * The objects this bar draws with, so the scene can hand them to the HUD
   * camera (SPEC-COMBAT-FEEL-001 D-1). Read-only; the bar keeps ownership.
   */
  gameObjects(): readonly Phaser.GameObjects.GameObject[] {
    return [this.graphics, this.caption];
  }

  render(health: Health): void {
    const ratio = health.max > 0 ? Math.max(0, health.current) / health.max : 0;

    this.graphics.clear();
    this.graphics.fillStyle(EMPTY_COLOR, 1);
    this.graphics.fillRect(this.x, this.y, this.width, this.height);
    this.graphics.fillStyle(this.fillColor, 1);
    this.graphics.fillRect(this.x, this.y, this.width * ratio, this.height);
    this.graphics.lineStyle(2, BORDER_COLOR, 0.8);
    this.graphics.strokeRect(this.x, this.y, this.width, this.height);

    this.caption.setText(`${this.label}  ${Math.max(0, Math.ceil(health.current))}/${health.max}`);
  }
}
