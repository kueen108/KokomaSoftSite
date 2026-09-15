// @MX:ANCHOR: [AUTO] The backdrop definition — the one place the sky, the hills
// and the ground are described, and the one place that answers what colour the
// backdrop paints at a given point.
// @MX:REASON: Every scene renders this definition through `src/ui/Backdrop.ts`
// (REQ-004), and three acceptance criteria question it: AC-002 and AC-004 read
// colours through it, AC-006 reads its geometry, AC-015 walks the dark zone
// through it. It is engine-independent by contract (C-4) — nothing here may
// import Phaser, which is what lets the palette be judged before a browser is
// opened. When pen.dev's `bg-battle.png` lands, the drawing side is replaced
// and this contract is answered from texture pixels instead; neither REQ-003
// nor AC-002 changes a character.

/** Which of the two brightness variants of the one definition to build. */
export type BackdropVariant = 'battle' | 'menu';

/**
 * How far the backdrop reaches past each canvas edge (REQ-005).
 *
 * The camera shake displaces by +/-(intensity * axis), which at
 * `SHAKE_INTENSITY = 0.006` is 7.68 px across and 4.32 px down. 20 px is 2.6x
 * the wider of those. It is not sized to the calculation on purpose: the
 * intensity lives in `src/fx/BattleFx.ts`, another SPEC may raise it, and an
 * exactly-fitted margin would break into a flickering edge band with no error.
 * The cost of the slack is one slightly larger rectangle.
 */
export const BACKDROP_OVERSCAN_PX = 20;

/**
 * Where the ground starts — `LANE_Y + 30`, the same line `drawGround` has
 * always used (`BattleScene.drawGround`). Written as a literal rather than
 * imported because `src/config/gameConfig.ts` imports Phaser and C-4 keeps
 * Phaser out of this directory.
 */
export const BACKDROP_HORIZON_Y = 500;

/** The battle scene's lowest visible text, measured in `plan.md` §C 7. */
const BATTLE_TEXT_BOTTOM_PX = 221;

/** One line of the largest glyph the game draws (`MainMenuScene`, 56 px). */
const LARGEST_TEXT_LINE_PX = 56;

/**
 * How far down the canvas the backdrop must stay dark enough for any text
 * colour the game uses (REQ-003's second clause, measured by AC-015).
 *
 * Derived rather than chosen: `plan.md` §C 7 read the battle scene's visible
 * text as spanning y 38-221 while that scene was live, and D-10 adds one line
 * of the largest glyph so a line of text moved down is still covered. The
 * measurement corrected the plan's own estimate of 190 — the summon bar's
 * bounding box reaches further than its origin does.
 *
 * This constant chooses where AC-015 looks. It never decides whether the SPEC
 * passes: text that leaves this zone is caught by AC-002, which re-enumerates
 * the live text objects instead of trusting a number (`plan.md` §G).
 */
export const DARK_ZONE_BOTTOM_PX = BATTLE_TEXT_BOTTOM_PX + LARGEST_TEXT_LINE_PX;

/**
 * How sharply the sky brightens toward the horizon.
 *
 * A straight ramp does not fit. The dark zone reaches y 277, which is 57% of
 * the way from the top of the overscanned sky to the horizon, and `#f2777a`
 * caps the background there at 0.0355 luminance; a linear ramp to a horizon of
 * 0.1373 arrives at 0.063 by then — nearly twice the ceiling. Cubing the
 * parameter holds the top of the sky deep and spends the brightening in the
 * last stretch, which is both what the contrast floor requires and what a late
 * afternoon sky actually does.
 */
const SKY_EASE_EXPONENT = 3;

/**
 * The single parameter that separates the two variants (REQ-015, D-2).
 *
 * Menu text covers 88% of the screen (`plan.md` §C 7: 41-674 on Upgrade), so
 * there is nowhere to put a bright band — the whole menu backdrop has to clear
 * the 4.5:1 floor against all seven text colours, which caps it at 0.0355
 * luminance everywhere. Scaling every channel by one factor keeps the hue and
 * the geometry identical and moves only the brightness range, which is what
 * "one definition, two variants" means. `PROMPTS.md` §9 already described the
 * menu art as "slightly darker/more dramatic sky"; this puts that relationship
 * in code ahead of the artwork.
 */
const MENU_BRIGHTNESS = 0.42;

/**
 * The battle palette. The menu palette is this one scaled (see
 * `MENU_BRIGHTNESS`), so these five colours are the only hues in the game's
 * backdrop.
 *
 * Warm late afternoon, per `PROMPTS.md` §0: a deep violet zenith falling to a
 * tan horizon, ridges reading as silhouettes against it, and warm dark ground.
 * `ground` carries the same luminance as the `#2c313c` the battle scene has
 * always drawn (0.0308 against 0.0306), warmed to the palette — so nothing
 * about contrast moves, only the hue.
 */
const BATTLE_PALETTE = {
  skyTop: '#1e1a2e',
  skyBottom: '#8f5c33',
  hillFar: '#5b4152',
  hillNear: '#38293a',
  ground: '#3a2f28',
} as const;

/**
 * The two ridges, as (fraction of the overscanned width, y) pairs so the shape
 * survives a change of canvas size. The far ridge is drawn first and the near
 * one over it.
 *
 * The highest vertex sits at y 440, which is what puts every hill below the
 * range `skyRange()` reports.
 */
const RIDGE_PROFILES: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0, 486],
    [0.12, 452],
    [0.27, 478],
    [0.42, 440],
    [0.6, 470],
    [0.78, 444],
    [0.92, 474],
    [1, 456],
  ],
  [
    [0, 492],
    [0.18, 470],
    [0.38, 496],
    [0.56, 474],
    [0.76, 498],
    [0.92, 476],
    [1, 490],
  ],
];

/** A vertical gradient: one colour at `y0` easing to another at `y1`. */
export interface SkyGradient {
  readonly y0: number;
  readonly y1: number;
  readonly colorTop: string;
  readonly colorBottom: string;
}

/** A filled silhouette, given as the points to trace. */
export interface HillLayer {
  readonly points: readonly (readonly [number, number])[];
  readonly color: string;
}

/** A flat horizontal band of one colour. */
export interface GroundBand {
  readonly y: number;
  readonly height: number;
  readonly color: string;
}

/** The rectangle the backdrop actually covers, overscan included. */
export interface CoveredRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Everything one variant of the backdrop is made of. */
export interface BackdropLayers {
  readonly variant: BackdropVariant;
  readonly rect: CoveredRect;
  readonly sky: SkyGradient;
  /**
   * The rows in which nothing but the sky is painted, at any x.
   *
   * REQ-015's "does not darken downward" holds inside the sky and only there —
   * a ridge is allowed to be darker than the sky above it, because that is what
   * a ridge looks like. Reporting the range rather than letting a criterion
   * write it as a literal is what keeps AC-004 measuring the right band when
   * the definition changes.
   */
  readonly skyRange: { readonly y0: number; readonly y1: number };
  /** Far ridge first, near ridge last: the order they are drawn in. */
  readonly hills: readonly HillLayer[];
  readonly ground: readonly GroundBand[];
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

function parseHex(hex: string): [number, number, number] {
  const trimmed = hex.startsWith('#') ? hex.slice(1) : hex;
  // The three-digit shorthand has to parse. AC-002 reads `style.color` off
  // live Text objects, and Phaser's default for a Text that never set a colour
  // is `#fff` — six-digit parsing turns that into NaN, which does not raise,
  // so the criterion would report NaN as its minimum contrast and pass or fail
  // by accident rather than by measurement.
  const body = trimmed.length === 3 ? trimmed.replace(/./g, (c) => c + c) : trimmed;
  return [
    Number.parseInt(body.slice(0, 2), 16),
    Number.parseInt(body.slice(2, 4), 16),
    Number.parseInt(body.slice(4, 6), 16),
  ];
}

function formatHex(r: number, g: number, b: number): string {
  const channel = (v: number): string =>
    clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** The same colour at `factor` of its brightness, hue and geometry untouched. */
function shade(hex: string, factor: number): string {
  const [r, g, b] = parseHex(hex);
  return formatHex(r * factor, g * factor, b * factor);
}

/** The colour `t` of the way from `from` to `to`, in sRGB byte space. */
function mixHex(from: string, to: string, t: number): string {
  const [r0, g0, b0] = parseHex(from);
  const [r1, g1, b1] = parseHex(to);
  return formatHex(r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t);
}

// @MX:NOTE: [AUTO] WCAG 2.1's relative luminance, transcribed rather than
// approximated. The 0.03928 knee matters more here than anywhere else in the
// game: the dark zone lives entirely in the range where the linear branch and
// the gamma branch disagree, so getting the branch wrong would shift exactly
// the numbers this SPEC is deciding a palette by.
/** Relative luminance of an `#rrggbb` colour, per WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const linear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  const [r, g, b] = parseHex(hex.toLowerCase());
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Contrast between two colours, per WCAG 2.1. Symmetric: the formula asks which
 * is lighter, not which was passed first.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** The sky's colour at a row, eased toward the horizon (REQ-015). */
export function skyColorAt(y: number, sky: SkyGradient): string {
  const span = sky.y1 - sky.y0;
  const t = span <= 0 ? 0 : clamp((y - sky.y0) / span, 0, 1);
  return mixHex(sky.colorTop, sky.colorBottom, t ** SKY_EASE_EXPONENT);
}

/** True when the point lies inside the traced outline (even-odd ray cast). */
function containsPoint(
  points: readonly (readonly [number, number])[],
  x: number,
  y: number,
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// @MX:ANCHOR: [AUTO] Builds one variant of the backdrop definition.
// @MX:REASON: The single definition REQ-004 requires — `src/ui/Backdrop.ts`
// draws what this returns for all six scenes, and AC-006 measures its geometry
// while AC-004 and AC-015 walk its colours. A second definition appearing
// anywhere is the failure this function exists to make structurally impossible.
/**
 * The backdrop for one variant, sized to a canvas and its overscan.
 *
 * Dimensions arrive as arguments rather than being imported so this module
 * stays free of `gameConfig` and therefore of Phaser (C-4).
 */
export function backdropLayers(
  width: number,
  height: number,
  overscan: number,
  variant: BackdropVariant,
): BackdropLayers {
  const rect: CoveredRect = {
    left: -overscan,
    top: -overscan,
    right: width + overscan,
    bottom: height + overscan,
  };

  const factor = variant === 'menu' ? MENU_BRIGHTNESS : 1;
  const tint = (hex: string): string => (factor === 1 ? hex : shade(hex, factor));

  const sky: SkyGradient = {
    y0: rect.top,
    y1: BACKDROP_HORIZON_Y,
    colorTop: tint(BATTLE_PALETTE.skyTop),
    colorBottom: tint(BATTLE_PALETTE.skyBottom),
  };

  const ridgeColors = [tint(BATTLE_PALETTE.hillFar), tint(BATTLE_PALETTE.hillNear)];
  const span = rect.right - rect.left;
  const hills: HillLayer[] = RIDGE_PROFILES.map((profile, index) => ({
    points: [
      ...profile.map(
        ([fraction, y]) => [rect.left + fraction * span, y] as readonly [number, number],
      ),
      [rect.right, BACKDROP_HORIZON_Y] as readonly [number, number],
      [rect.left, BACKDROP_HORIZON_Y] as readonly [number, number],
    ],
    color: ridgeColors[index],
  }));

  // The sky is unobstructed down to the row above the highest vertex any ridge
  // reaches. Stopping one row short is not a rounding cushion: at the apex row
  // itself the topmost ridge is painted, so including it would put a ridge
  // colour inside a range whose whole purpose is to contain nothing but sky.
  const highestHillY = Math.min(...hills.flatMap((hill) => hill.points.map(([, y]) => y)));

  return {
    variant,
    rect,
    sky,
    skyRange: { y0: rect.top, y1: highestHillY - 1 },
    hills,
    ground: [
      {
        y: BACKDROP_HORIZON_Y,
        height: rect.bottom - BACKDROP_HORIZON_Y,
        color: tint(BATTLE_PALETTE.ground),
      },
    ],
  };
}

// @MX:ANCHOR: [AUTO] The REQ-004 contract: what colour does the backdrop paint
// at this point?
// @MX:REASON: AC-002 and AC-004 are built on this function, and it is the seam
// pen.dev's artwork replaces — the painted answer becomes a texture read
// (`TextureManager.getPixel`) and every criterion stays as written. Note what
// it does not claim: this is the colour the definition says it paints, not the
// pixel the renderer produced. AC-002 ② closes that gap by comparing the two at
// three points, and AC-001 looks at the screen.
/** The colour the backdrop paints at a point, clamped to the covered rect. */
export function backdropColorAt(x: number, y: number, layers: BackdropLayers): string {
  const { rect, ground, hills, sky } = layers;
  const px = clamp(x, rect.left, rect.right);
  const py = clamp(y, rect.top, rect.bottom);

  // Answered in reverse painting order: ground over hills over sky.
  if (py >= ground[0].y) {
    let chosen = ground[0];
    for (const band of ground) {
      if (py >= band.y) {
        chosen = band;
      }
    }
    return chosen.color;
  }

  for (let i = hills.length - 1; i >= 0; i -= 1) {
    if (containsPoint(hills[i].points, px, py)) {
      return hills[i].color;
    }
  }

  return skyColorAt(py, sky);
}
