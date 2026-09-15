// @MX:NOTE: [AUTO] Not covered by unit tests, and that is a decision rather
// than an omission. Coverage is scoped to src/systems/ (constraint C-5); this
// module holds one constant and one object spread, and whether the font really
// draws is verified by opening the game in a browser (AC-013). This is not
// pending work.
// @MX:ANCHOR: [AUTO] The single place in src/ that names a font family. Every
// text object — 25 call sites across nine files — builds its style here.
// @MX:REASON: REQ-012 forbids any `fontFamily` literal outside this module, so
// a 26th text site cannot drift back to a hard-coded family; AC-012's second
// grep enforces that by file name (`src/ui/TextStyles.ts`).
import Phaser from 'phaser';

/**
 * The game font stack (REQ-011, plan.md D-5). Galmuri11 is served by the
 * `@font-face` rule in index.html. System CJK fonts cover Japanese and Chinese
 * glyphs the game font lacks; monospace is the final fallback.
 */
export const GAME_FONT_FAMILY =
  '"Galmuri11", "Hiragino Sans", "Yu Gothic", "PingFang SC", "Microsoft YaHei", monospace';

/**
 * A text style that takes its font family from this module and everything
 * else — size, colour, alignment, line spacing — from the call site (C-15).
 * An override that names its own `fontFamily` wins, but no call site should;
 * AC-012 catches one that does.
 */
export function textStyle(
  overrides: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: GAME_FONT_FAMILY, ...overrides };
}
