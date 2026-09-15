import Phaser from 'phaser';

import { SCENE } from '../config/gameConfig';
import { GAME_FONT_FAMILY } from '../ui/TextStyles';

/**
 * Bounded wait for the game font (REQ-013, plan.md D-5). Under the 2,000 ms
 * ceiling the requirement sets; a missing or slow file costs at most this.
 */
const FONT_WAIT_MS = 1500;

/**
 * First scene. Does its minimal setup and hands straight on (REQ-001).
 *
 * The one thing it waits for is the game font, and only for a bounded time:
 * Phaser `Text` bakes its glyphs when created, so the first text object
 * (MainMenuScene) must come after the font — or after the wait gives up and
 * `monospace` takes over (REQ-014). No player input gates the transition, so
 * SPEC-CORE-COMBAT-001 REQ-001 still holds: the wait is finite.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE.boot);
  }

  create(): void {
    // Any rejection — no Font Loading API, network error — is treated the same
    // as a timeout: continue and let the fallback family draw the text.
    const fontReady = Promise.resolve()
      .then(() => document.fonts.load(`16px ${GAME_FONT_FAMILY}`))
      .catch(() => undefined);
    const timeout = new Promise<void>((resolve) => {
      this.time.delayedCall(FONT_WAIT_MS, () => resolve());
    });

    void Promise.race([fontReady, timeout]).then(() => this.scene.start(SCENE.preload));
  }
}
