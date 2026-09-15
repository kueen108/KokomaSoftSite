// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-8);
// rendering is verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work.
import Phaser from 'phaser';
import { translate } from '../i18n';

import { textStyle } from './TextStyles';

/** The battle gold readout (REQ-013). Drawn as text, no texture, no asset. */
export class GoldCounter {
  private readonly caption: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.caption = scene.add.text(
      x,
      y,
      '',
      textStyle({
        fontSize: '20px',
        color: '#f5d76e',
      }),
    );
  }

  /**
   * The objects this readout draws with, so the scene can hand them to the
   * HUD camera (SPEC-COMBAT-FEEL-001 D-1). Read-only; the counter keeps ownership.
   */
  gameObjects(): readonly Phaser.GameObjects.GameObject[] {
    return [this.caption];
  }

  render(gold: number): void {
    this.caption.setText(translate('골드 {0}', [Math.floor(gold)]));
  }
}
