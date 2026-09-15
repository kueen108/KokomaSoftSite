import { describe, expect, it } from 'vitest';

import {
  BACKDROP_OVERSCAN_PX,
  DARK_ZONE_BOTTOM_PX,
  backdropColorAt,
  backdropLayers,
  contrastRatio,
  relativeLuminance,
  skyColorAt,
} from '../../src/systems/BackdropSystem';
import type { BackdropVariant } from '../../src/systems/BackdropSystem';

/**
 * Canvas size, copied rather than imported: `src/config/gameConfig.ts` imports
 * Phaser, and C-4 keeps Phaser out of `src/systems/` and out of the tests that
 * exercise it. The values are the design resolution (1280x720).
 */
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

/**
 * AC-006 — `BattleFx`'s shake intensity, mirrored here. `src/systems/` cannot
 * import it (C-4), so the duplicate is unavoidable; the static half of AC-006
 * (`grep -c "const SHAKE_INTENSITY = 0.006;" src/fx/BattleFx.ts` === 1) guards
 * the original so this copy cannot drift silently.
 */
const SHAKE_INTENSITY_MIRROR = 0.006;

/**
 * AC-015 — every text colour the game uses in any scene, per `plan.md` §C 5.
 * `#000000` is not here: it appears in `DamageNumbers.ts:73` as a stroke, not
 * as a fill, so it is not a text colour in the sense REQ-003 means.
 */
const TEXT_COLORS = [
  '#6ee7a0',
  '#9aa4b2',
  '#c8cfda',
  '#d8b6f5',
  '#f2777a',
  '#f5d76e',
  '#ffffff',
] as const;

const battle = backdropLayers(GAME_WIDTH, GAME_HEIGHT, BACKDROP_OVERSCAN_PX, 'battle');
const menu = backdropLayers(GAME_WIDTH, GAME_HEIGHT, BACKDROP_OVERSCAN_PX, 'menu');

type Layers = ReturnType<typeof backdropLayers>;

const VARIANTS: ReadonlyArray<readonly [BackdropVariant, Layers]> = [
  ['battle', battle],
  ['menu', menu],
];

/** The luminance profile down the sky, at the resolution AC-004 samples. */
function skyLuminances(layers: Layers, x: number): number[] {
  const out: number[] = [];
  const { y0, y1 } = layers.skyRange;
  for (let y = y0; y <= y1; y += 2) {
    out.push(relativeLuminance(backdropColorAt(x, y, layers)));
  }
  return out;
}

describe('relativeLuminance', () => {
  // The two anchors the WCAG 2.1 formula is pinned by.
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
  });

  // Published values for the three colours this SPEC reasons about most, so a
  // transcription slip in the sRGB curve shows up as a number rather than as a
  // palette that quietly passes.
  it('matches the published values for the colours the SPEC reasons about', () => {
    expect(relativeLuminance('#f2777a')).toBeCloseTo(0.3348, 3);
    expect(relativeLuminance('#1e1a2e')).toBeCloseTo(0.0121, 4);
    expect(relativeLuminance('#8f5c33')).toBeCloseTo(0.1373, 4);
    expect(relativeLuminance('#20242c')).toBeCloseTo(0.0175, 4);
  });

  it('reads uppercase and a leading hash the same way', () => {
    expect(relativeLuminance('#F2777A')).toBe(relativeLuminance('#f2777a'));
    expect(relativeLuminance('f2777a')).toBe(relativeLuminance('#f2777a'));
  });

  // AC-002 reads `style.color` straight off live Text objects, and Phaser's
  // default for a Text that never set one is the shorthand `#fff`. Parsing
  // that as six digits yields NaN, which would not raise — it would make the
  // criterion report NaN as its minimum contrast and pass or fail by accident.
  it('reads the three-digit shorthand Phaser defaults to', () => {
    expect(relativeLuminance('#fff')).toBe(relativeLuminance('#ffffff'));
    expect(relativeLuminance('#1e2')).toBe(relativeLuminance('#11ee22'));
    expect(Number.isNaN(contrastRatio('#fff', '#1e1a2e'))).toBe(false);
  });

  it('uses the linear branch below the 0.03928 knee', () => {
    // #080808 is 8/255 = 0.0314, under the knee, so the divide-by-12.92 branch
    // applies. Getting the branch wrong shifts only the darkest colours, which
    // is exactly the range the dark zone lives in.
    expect(relativeLuminance('#080808')).toBeCloseTo(8 / 255 / 12.92, 12);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black against white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
  });

  it('is symmetric in its two arguments', () => {
    expect(contrastRatio('#f2777a', '#1e1a2e')).toBeCloseTo(
      contrastRatio('#1e1a2e', '#f2777a'),
      12,
    );
  });

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio('#8f5c33', '#8f5c33')).toBeCloseTo(1, 12);
  });

  // The two pairs `spec.md` §2 measured on the game as it ships. Both are
  // against `#f2777a`, the darkest text colour, and they differ only in the
  // background: the config colour every scene sits on, and the battle ground.
  // 4.77 is the game's current worst, which is why the floor was set at 4.5.
  it('reproduces both measured pairs the game ships with', () => {
    expect(contrastRatio('#f2777a', '#20242c')).toBeCloseTo(5.7, 2);
    expect(contrastRatio('#f2777a', '#2c313c')).toBeCloseTo(4.77, 2);
  });
});

describe('backdropLayers — coverage and overscan (AC-006)', () => {
  for (const [name, layers] of VARIANTS) {
    it(`covers the overscanned canvas exactly (${name})`, () => {
      expect(layers.rect).toEqual({
        left: -BACKDROP_OVERSCAN_PX,
        top: -BACKDROP_OVERSCAN_PX,
        right: GAME_WIDTH + BACKDROP_OVERSCAN_PX,
        bottom: GAME_HEIGHT + BACKDROP_OVERSCAN_PX,
      });
    });
  }

  it('carries an overscan at least as large as the worst shake displacement', () => {
    expect(BACKDROP_OVERSCAN_PX).toBeGreaterThanOrEqual(
      Math.ceil(SHAKE_INTENSITY_MIRROR * GAME_WIDTH),
    );
    expect(BACKDROP_OVERSCAN_PX).toBeGreaterThanOrEqual(
      Math.ceil(SHAKE_INTENSITY_MIRROR * GAME_HEIGHT),
    );
  });

  it('mirrors the shake intensity the calculation rests on', () => {
    expect(SHAKE_INTENSITY_MIRROR).toBe(0.006);
  });

  for (const [name, layers] of VARIANTS) {
    it(`leaves no vertical gap between sky and ground (${name})`, () => {
      expect(layers.sky.y0).toBe(layers.rect.top);
      expect(layers.ground.length).toBeGreaterThan(0);

      let edge = layers.sky.y1;
      for (const band of layers.ground) {
        expect(band.y).toBe(edge);
        edge = band.y + band.height;
      }
      expect(edge).toBe(layers.rect.bottom);
    });
  }

  for (const [name, layers] of VARIANTS) {
    it(`paints a colour at every point of the rect (${name})`, () => {
      const { left, top, right, bottom } = layers.rect;
      for (const x of [left, 0, GAME_WIDTH / 2, GAME_WIDTH, right]) {
        for (let y = top; y <= bottom; y += 2) {
          expect(backdropColorAt(x, y, layers)).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    });
  }
});

describe('backdropColorAt — the REQ-004 contract', () => {
  for (const [name, layers] of VARIANTS) {
    it(`answers the end colours at the two sky ends (${name})`, () => {
      expect(backdropColorAt(GAME_WIDTH / 2, layers.sky.y0, layers)).toBe(layers.sky.colorTop);
      expect(skyColorAt(layers.sky.y1, layers.sky)).toBe(layers.sky.colorBottom);
      expect(skyColorAt(layers.sky.y0, layers.sky)).toBe(layers.sky.colorTop);
    });
  }

  for (const [name, layers] of VARIANTS) {
    it(`interpolates monotonically between the ends (${name})`, () => {
      const { sky } = layers;
      let previous = -1;
      for (let y = sky.y0; y <= sky.y1; y += 2) {
        const here = relativeLuminance(skyColorAt(y, sky));
        expect(here).toBeGreaterThanOrEqual(previous - 1e-9);
        previous = here;
      }
    });
  }

  for (const [name, layers] of VARIANTS) {
    it(`clamps a point outside the rect onto its edge (${name})`, () => {
      const { left, top, right, bottom } = layers.rect;
      expect(backdropColorAt(left - 500, top - 500, layers)).toBe(
        backdropColorAt(left, top, layers),
      );
      expect(backdropColorAt(right + 500, bottom + 500, layers)).toBe(
        backdropColorAt(right, bottom, layers),
      );
    });
  }

  for (const [name, layers] of VARIANTS) {
    it(`answers the ground colour below the horizon (${name})`, () => {
      const band = layers.ground[0];
      expect(backdropColorAt(GAME_WIDTH / 2, band.y + 1, layers)).toBe(band.color);
    });
  }

  // `skyColorAt` is exported and takes any gradient, so a degenerate one — a
  // sky with no height — must answer its top colour rather than divide by zero.
  it('answers the top colour for a gradient with no height', () => {
    const flat = { y0: 100, y1: 100, colorTop: '#111111', colorBottom: '#999999' };
    expect(skyColorAt(100, flat)).toBe('#111111');
    expect(skyColorAt(400, flat)).toBe('#111111');
  });

  // The ground is a list of bands (`plan.md` D-1), and the definition happens
  // to use one today. Reading a synthetic two-band ground keeps the selection
  // honest rather than accidentally correct for a list of length one.
  it('picks the band a point falls in when the ground has several', () => {
    const layered = {
      ...battle,
      ground: [
        { y: 500, height: 60, color: '#111111' },
        { y: 560, height: 180, color: '#222222' },
      ],
    };
    expect(backdropColorAt(GAME_WIDTH / 2, 500, layered)).toBe('#111111');
    expect(backdropColorAt(GAME_WIDTH / 2, 559, layered)).toBe('#111111');
    expect(backdropColorAt(GAME_WIDTH / 2, 560, layered)).toBe('#222222');
    expect(backdropColorAt(GAME_WIDTH / 2, 740, layered)).toBe('#222222');
  });

  it('draws hills, so the picture has three distinguishable layers (AC-001)', () => {
    expect(battle.hills.length).toBeGreaterThan(0);
    const skyColours = new Set(battle.hills.map((h) => h.color));
    expect(skyColours.has(battle.sky.colorTop)).toBe(false);
    expect(skyColours.has(battle.ground[0].color)).toBe(false);
  });

  it('keeps every hill below the sky range, so the sky reads as unobstructed', () => {
    for (const hill of battle.hills) {
      for (const [, y] of hill.points) {
        expect(y).toBeGreaterThan(battle.skyRange.y1);
      }
    }
  });
});

describe('REQ-015 — the sky brightens toward the horizon, in two variants', () => {
  // REQ-015 front clause. Read through `colorAt` at three columns rather than
  // through the gradient alone, because that is what AC-004 will read in the
  // browser.
  for (const [name, layers] of VARIANTS) {
    it(`never darkens downward across the sky range (${name})`, () => {
      for (const x of [0, GAME_WIDTH / 2, GAME_WIDTH]) {
        const Ls = skyLuminances(layers, x);
        expect(Ls.length).toBeGreaterThan(1);
        for (let i = 1; i < Ls.length; i += 1) {
          expect(Ls[i]).toBeGreaterThanOrEqual(Ls[i - 1] - 1e-9);
        }
      }
    });
  }

  it('starts the sky at or above the top of the canvas (AC-004 ⑦)', () => {
    for (const [, layers] of VARIANTS) {
      expect(layers.skyRange.y0).toBeLessThanOrEqual(0);
    }
  });

  // AC-004 ④⑤ — the range floors that stop a perfectly flat sky from passing
  // the non-decreasing check.
  it('spans at least a 4x luminance range in the battle variant', () => {
    const Ls = skyLuminances(battle, GAME_WIDTH / 2);
    expect(Math.max(...Ls) / Math.min(...Ls)).toBeGreaterThanOrEqual(4);
  });

  it('spans at least a 1.5x luminance range in the menu variant', () => {
    const Ls = skyLuminances(menu, GAME_WIDTH / 2);
    expect(Math.max(...Ls) / Math.min(...Ls)).toBeGreaterThanOrEqual(1.5);
  });

  // REQ-015 back clause, and AC-004 ⑥.
  it('keeps the menu variant darker than the battle variant', () => {
    const battleMax = Math.max(...skyLuminances(battle, GAME_WIDTH / 2));
    const menuMax = Math.max(...skyLuminances(menu, GAME_WIDTH / 2));
    expect(menuMax).toBeLessThan(battleMax);
  });

  it('builds both variants from one geometry, so only brightness differs', () => {
    expect(menu.sky.y0).toBe(battle.sky.y0);
    expect(menu.sky.y1).toBe(battle.sky.y1);
    expect(menu.skyRange).toEqual(battle.skyRange);
    expect(menu.hills.map((h) => h.points)).toEqual(battle.hills.map((h) => h.points));
    expect(menu.ground.map((b) => [b.y, b.height])).toEqual(
      battle.ground.map((b) => [b.y, b.height]),
    );
  });
});

describe('AC-015 — the dark zone is safe for every text colour the game uses', () => {
  it('derives the dark-zone bottom from the measured text bounds', () => {
    // `plan.md` §C 7 measured the battle scene's visible text bottom at 221;
    // D-10 adds one line of the largest glyph (56 px) so a line of text moved
    // down is still covered.
    expect(DARK_ZONE_BOTTOM_PX).toBe(221 + 56);
  });

  // AC-015 ① — the battle variant, top of canvas down to the dark-zone bottom.
  it('keeps the battle dark zone at 4.5:1 against all seven colours', () => {
    let worst = Number.POSITIVE_INFINITY;
    for (let y = 0; y <= DARK_ZONE_BOTTOM_PX; y += 2) {
      for (const x of [0, GAME_WIDTH / 2, GAME_WIDTH]) {
        const bg = backdropColorAt(x, y, battle);
        for (const color of TEXT_COLORS) {
          worst = Math.min(worst, contrastRatio(color, bg));
        }
      }
    }
    expect(worst).toBeGreaterThanOrEqual(4.5);
  });

  // AC-015 ② — the menu variant, the whole canvas: menu text spans 88% of the
  // screen, so there is nowhere to put a bright band.
  it('keeps the whole menu variant at 4.5:1 against all seven colours', () => {
    let worst = Number.POSITIVE_INFINITY;
    for (let y = 0; y <= GAME_HEIGHT; y += 2) {
      for (const x of [0, GAME_WIDTH / 2, GAME_WIDTH]) {
        const bg = backdropColorAt(x, y, menu);
        for (const color of TEXT_COLORS) {
          worst = Math.min(worst, contrastRatio(color, bg));
        }
      }
    }
    expect(worst).toBeGreaterThanOrEqual(4.5);
  });

  // The binding colour, named so a future palette change reports the right
  // reason. `#f2777a` caps background luminance at 0.0355.
  it('is bound by #f2777a, the darkest text colour the game uses', () => {
    const bg = backdropColorAt(GAME_WIDTH / 2, DARK_ZONE_BOTTOM_PX, battle);
    const ranked = TEXT_COLORS.map((c) => [c, contrastRatio(c, bg)] as const).sort(
      (a, b) => a[1] - b[1],
    );
    expect(ranked[0][0]).toBe('#f2777a');
  });

  // The floor holds below the dark zone too, for the one text colour that
  // actually appears there: the white damage numbers around y 450-470.
  it('keeps white readable at the brightest point of the battle sky', () => {
    expect(contrastRatio('#ffffff', battle.sky.colorBottom)).toBeGreaterThanOrEqual(4.5);
  });
});
