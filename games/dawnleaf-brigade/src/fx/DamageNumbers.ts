// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-5) and
// C-6 forbids unit tests for fx files; the pool is verified by counting Text
// objects in the running scene across forty hits (acceptance.md AC-006).
// @MX:NOTE: [AUTO] Imports nothing from src/systems/ or src/entities/
// (design.md §1.1). The only project import is the font helper, and REQ-012
// requires exactly that: the family is named in src/ui/TextStyles.ts and
// nowhere else, so this file carries no `fontFamily` key (AC-012).
import Phaser from 'phaser';

import { textStyle } from '../ui/TextStyles';

// @MX:NOTE: [AUTO] 24 is an estimate, not a measurement (plan.md D-4): the
// hits that can overlap in one frame are roughly ally population × enemies +
// one projectile, repeated a few times within a 600 ms lifetime; 24 is about
// twice that. It does not have to be exact, because saturation has a defined
// behaviour — the oldest live number is reclaimed (see `show`). If balance
// changes ever keep the pool saturated, this constant is the first knob.
const POOL_SIZE = 24;

/** Counted by name in the browser: `S.children.list.filter(o => o.name === 'fx-damage')`. */
const NUMBER_NAME = 'fx-damage';

/**
 * The rise: a number appears 20 px above the hit point, drifts up a further
 * 28 px and fades over 600 ms (design.md §5.1). Inside REQ-009's 800 ms.
 */
const START_OFFSET_Y = 20;
const END_OFFSET_Y = 48;
const RISE_MS = 600;

/** Over hit overlays and sparks (both depth 1), so a number is never hidden by them. */
const NUMBER_DEPTH = 2;

/** One pooled text plus the frame it was last handed out, for oldest-first reclaim. */
interface Slot {
  readonly text: Phaser.GameObjects.Text;
  startedAt: number;
}

// @MX:WARN: [AUTO] Never create a Text object per hit, and never `destroy()`
// a slot. The pool is built once in the constructor; `show` reconfigures.
// @MX:REASON: A Phaser Text owns its own canvas and re-rasterises on every
// setText. One `add.text` per hit is the per-effect object growth REQ-004
// forbids, plus a leaked canvas texture per hit (spec.md REQ-010 footnote);
// a destroyed slot shrinks the pool for the rest of the battle. AC-006 counts
// the scene's Text objects before, during and after forty hits and requires
// the three counts to be equal.
/**
 * A fixed pool of damage numbers (REQ-010), made and owned by `BattleFx` and
 * living exactly as long as the scene's display list (design.md §1.1).
 *
 * `show` never allocates: it takes a free slot, or when all 24 are live, the
 * one that has been live longest (plan.md D-4). Pool objects are ordinary
 * scene children, so a scene restart destroys them with everything else and
 * the next `create()` builds a fresh pool — nothing static survives.
 */
export class DamageNumbers {
  /** The pool, exposed so the owner can assign every member to the world camera. */
  readonly texts: readonly Phaser.GameObjects.Text[];

  private readonly slots: readonly Slot[];

  constructor(private readonly scene: Phaser.Scene) {
    const slots: Slot[] = [];

    for (let i = 0; i < POOL_SIZE; i += 1) {
      const text = scene.add
        .text(
          0,
          0,
          '',
          textStyle({ fontSize: '18px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }),
        )
        .setOrigin(0.5)
        .setDepth(NUMBER_DEPTH)
        .setName(NUMBER_NAME)
        .setActive(false)
        .setVisible(false);

      slots.push({ text, startedAt: 0 });
    }

    this.slots = slots;
    this.texts = slots.map((slot) => slot.text);
  }

  /**
   * Shows `amount` at the hit point `(x, y)`: it appears just above, rises and
   * fades out within 600 ms, then hides itself back into the pool (REQ-009).
   *
   * `amount` is the value handed to `takeDamage`, not the health actually
   * lost (spec.md REQ-009 footnote) — the caller passes it through untouched.
   */
  show(x: number, y: number, amount: number): void {
    const slot = this.freeSlot() ?? this.oldestSlot();
    const { text } = slot;

    // A reclaimed slot is mid-tween; a free one is not, and this is a no-op then.
    this.scene.tweens.killTweensOf(text);

    text
      .setText(String(Math.round(amount)))
      .setPosition(x, y - START_OFFSET_Y)
      .setAlpha(1)
      .setActive(true)
      .setVisible(true);
    slot.startedAt = this.scene.time.now;

    this.scene.tweens.add({
      targets: text,
      y: y - END_OFFSET_Y,
      alpha: 0,
      duration: RISE_MS,
      ease: 'Quad.Out',
      onComplete: () => {
        text.setActive(false).setVisible(false);
      },
    });
  }

  private freeSlot(): Slot | undefined {
    return this.slots.find((slot) => !slot.text.active);
  }

  /** The live slot handed out earliest — the one a saturated pool takes back (D-4). */
  private oldestSlot(): Slot {
    let oldest = this.slots[0];

    for (const slot of this.slots) {
      if (slot.startedAt < oldest.startedAt) {
        oldest = slot;
      }
    }

    return oldest;
  }
}
