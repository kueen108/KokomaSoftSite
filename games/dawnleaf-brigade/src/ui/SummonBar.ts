// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-8);
// rendering is verified by playing the game in a browser
// (tech.md @NAV:DEC-VERIFY-DUAL). This is not pending work. The one piece of
// arithmetic this file used to be a candidate for — the cooldown fill fraction
// — lives in src/systems/EconomySystem.ts precisely so its four boundaries can
// be checked without a browser (SPEC-BATTLE-VISUAL-001 plan.md D-6).
import Phaser from 'phaser';
import { translate } from '../i18n';

import { summonCooldownFillFraction } from '../systems/EconomySystem';
import type { UnitDefinition } from '../types/unit';
import { textStyle } from './TextStyles';

/** One row of the summon bar: what the player needs to decide about a unit. */
export interface SummonSlot {
  readonly key: string;
  readonly definition: UnitDefinition;
  readonly unlocked: boolean;
  readonly summonable: boolean;
  readonly cooldownRemainingMs: number;
}

/**
 * Where the indicator column starts, measured from the bar's own x.
 *
 * Derived, not chosen. The widest row this bar can produce is
 * `[2] Dealer  35g  — unavailable`, which measures 272 px in the game font at
 * 17 px (measured in the running battle, SPEC-BATTLE-VISUAL-001 progress.md
 * §E.2); 272 + INDICATOR_GAP = 290. `render` takes the larger of this and the
 * caption's live width, so a font that renders wider pushes the column right
 * instead of letting it land on top of the text — but in the normal case the
 * column is a constant, and a constant column is what keeps the bar from
 * sliding sideways every time a row changes between READY and unavailable.
 */
const INDICATOR_COLUMN_X = 290;
const INDICATOR_GAP = 18;

/**
 * The indicator's own size. The height is bounded by something real: the
 * summon bar's bounding box already reaches y 221.33 and
 * `BackdropSystem.BATTLE_TEXT_BOTTOM_PX` (221) was derived from that very
 * measurement, so this widget must not grow the box downward. A bar centred
 * inside a 22.67 px row cannot (SPEC-BATTLE-VISUAL-001 plan.md §C 5).
 */
const INDICATOR_WIDTH = 96;
const INDICATOR_HEIGHT = 10;

/**
 * One hue, three alphas. Using a second colour here would make the indicator
 * carry a state by colour, which is the thing this file's header rule forbids
 * — the fill's *length* is the channel, and the row's words carry everything
 * else.
 */
const INDICATOR_COLOR = 0xc8cfda;
const INDICATOR_TRACK_ALPHA = 0.18;
const INDICATOR_EDGE_ALPHA = 0.45;
const INDICATOR_FILL_ALPHA = 0.9;

/** How far the whole indicator is faded for a slot the player has not unlocked. */
const LOCKED_DIM = 0.35;

/**
 * The per-unit summon readout (REQ-013): key, cost, and whether it can be
 * summoned right now.
 *
 * Colour alone does not carry the state — the row also spells out the reason
 * it cannot be summoned, so a player who cannot separate the two colours still
 * reads the same information.
 *
 * The cooldown is the one state that left the text
 * (SPEC-BATTLE-VISUAL-001 REQ-001): a number counting down is read by decoding
 * it, a bar filling up is read by glancing at it. Locked, unavailable and
 * ready all stay as words (REQ-005), so what moved is a representation and not
 * an amount of information.
 */
export class SummonBar {
  private readonly caption: Phaser.GameObjects.Text;

  /**
   * The cooldown indicators, all of them, drawn into one Graphics.
   *
   * One object rather than one per slot for the reason `Backdrop` gives for
   * the same choice: the scene then has exactly one more thing to hand to a
   * camera and no per-slot call it could forget. An object that reaches
   * neither camera has `cameraFilter` 0, so *both* draw it, and nothing looks
   * wrong until the camera shakes (the `@MX:WARN` at `BattleFx.ts:165`).
   */
  private readonly indicators: Phaser.GameObjects.Graphics;

  private readonly x: number;
  private readonly y: number;

  /** The fraction each slot's indicator was last drawn with (REQ-003). */
  private drawnFractions: Record<string, number> = {};

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.caption = scene.add.text(
      x,
      y,
      '',
      textStyle({
        fontSize: '17px',
        color: '#c8cfda',
        lineSpacing: 4,
      }),
    );
    this.indicators = scene.add.graphics();
  }

  /**
   * The objects this bar draws with, so the scene can hand them to the HUD
   * camera (SPEC-COMBAT-FEEL-001 D-1). Read-only; the bar keeps ownership.
   *
   * Every object this class creates goes through here (REQ-004). The scene's
   * one call already spreads this array, so adding the indicators cost it no
   * line at all — which is the point of making the accessor the contract
   * rather than the call site.
   */
  gameObjects(): readonly Phaser.GameObjects.GameObject[] {
    return [this.caption, this.indicators];
  }

  /**
   * The fill fraction each slot's indicator was most recently drawn with,
   * keyed by unit type (REQ-003).
   *
   * By unit type and not by `SummonSlot.key`, which is the keyboard label the
   * row prints and would key this on "1" and "2". The unit type is the key the
   * scene's own `economy.cooldownRemainingMs` already uses, so a reader can
   * hold the two side by side without a lookup table in between — which is
   * exactly what AC-002 does.
   *
   * Exposed because a Graphics cannot be asked what it drew, and a clause no
   * judgement can read is a hope rather than a clause. `render` fills this
   * from the same value it hands to `fillRect`, so a fraction reported here is
   * a fraction that was drawn — AC-002 then compares it against the scene's
   * own `cooldownRemainingMs` in the same frame, which is a second source the
   * bar does not control.
   *
   * A copy goes out, so a caller cannot edit the record of what was drawn.
   */
  filledFractions(): Readonly<Record<string, number>> {
    return { ...this.drawnFractions };
  }

  render(slots: readonly SummonSlot[]): void {
    this.caption.setText(slots.map((slot) => SummonBar.describe(slot)).join('\n'));
    this.drawIndicators(slots);
  }

  private drawIndicators(slots: readonly SummonSlot[]): void {
    this.indicators.clear();
    this.drawnFractions = {};

    if (slots.length === 0) {
      return;
    }

    // Row geometry is read back off the text rather than assumed, so a change
    // of font size or line spacing moves the bars with the words instead of
    // leaving them behind. Phaser stacks `slots.length` line boxes with
    // `lineSpacing` between them and none after the last.
    const spacing = this.caption.lineSpacing;
    const lineHeight = (this.caption.height - spacing * (slots.length - 1)) / slots.length;
    const pitch = lineHeight + spacing;
    const left = this.x + Math.max(INDICATOR_COLUMN_X, this.caption.width + INDICATOR_GAP);

    slots.forEach((slot, index) => {
      const fraction = summonCooldownFillFraction(
        slot.cooldownRemainingMs,
        slot.definition.summonCooldownMs,
      );
      this.drawnFractions[slot.definition.type] = fraction;

      // Faded, not hidden, for a slot that is not unlocked yet. Its cooldown
      // genuinely is not running, so a full bar is the honest reading; the
      // fade keeps that honest reading from being mistaken for an invitation,
      // and the row still says "locked" in words (REQ-005).
      const dim = slot.unlocked ? 1 : LOCKED_DIM;
      const top = this.y + index * pitch + (lineHeight - INDICATOR_HEIGHT) / 2;

      this.indicators.fillStyle(INDICATOR_COLOR, INDICATOR_TRACK_ALPHA * dim);
      this.indicators.fillRect(left, top, INDICATOR_WIDTH, INDICATOR_HEIGHT);

      // The fill is the whole indicator: its length, not its colour, is what
      // the player reads (REQ-001, REQ-002).
      this.indicators.fillStyle(INDICATOR_COLOR, INDICATOR_FILL_ALPHA * dim);
      this.indicators.fillRect(left, top, INDICATOR_WIDTH * fraction, INDICATOR_HEIGHT);

      // An outline, so an indicator drawn at fraction 0 is still a visible
      // empty thing rather than nothing at all — otherwise the instant after a
      // summon would read as "the bar disappeared".
      this.indicators.lineStyle(1, INDICATOR_COLOR, INDICATOR_EDGE_ALPHA * dim);
      this.indicators.strokeRect(left, top, INDICATOR_WIDTH, INDICATOR_HEIGHT);
    });
  }

  private static describe(slot: SummonSlot): string {
    const head = `[${slot.key}] ${slot.definition.displayName}  ${slot.definition.summonCost}g`;

    if (!slot.unlocked) {
      return `${head}  — ${translate('잠김')}`;
    }

    // While the cooldown runs the row says nothing more: the indicator beside
    // it carries that state, and a number here would be the very thing
    // REQ-001 replaced. The other three states keep their words (REQ-005).
    if (slot.cooldownRemainingMs > 0) {
      return head;
    }

    return `${head}  — ${slot.summonable ? translate('준비 완료') : translate('사용 불가')}`;
  }
}
