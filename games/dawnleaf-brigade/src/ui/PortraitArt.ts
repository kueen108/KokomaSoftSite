import type Phaser from 'phaser';

/** UI art never goes through the ~100px combat texture rasterizer. */
export const growthPortraits: Record<string, string> = {};
export const PORTRAIT_ART = [
  'party-portraits-novice-v2',
  'party-portraits-trained-v2',
  'expedition-portraits-v2',
] as const;

export function registerPortrait(
  key: string,
  source: CanvasImageSource,
  cell: { x: number; y: number; w: number; h: number },
): void {
  const canvas = document.createElement('canvas');
  canvas.width = cell.w;
  canvas.height = cell.h;
  // One-to-one copy: never shrink to a sprite and enlarge again for the menu.
  canvas.getContext('2d')!.drawImage(source, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
  growthPortraits[key] = canvas.toDataURL();
}

/** Crop full-resolution, transparent artwork; retain the original alpha fringe. */
export function installPortraitArt(scene: Phaser.Scene): void {
  for (const [atlas, rows, entries] of [
    [PORTRAIT_ART[0], 2, Array.from({ length: 6 }, (_, i) => `${i}-novice`)],
    [PORTRAIT_ART[1], 2, Array.from({ length: 6 }, (_, i) => `${i}-trained`)],
    ['party-atlas', 2, Array.from({ length: 6 }, (_, i) => `${i}-elite`)],
    [
      PORTRAIT_ART[2],
      3,
      ['novice', 'trained', 'elite'].flatMap((r) => [6, 7, 8].map((i) => `${i}-${r}`)),
    ],
  ] as const) {
    if (!scene.textures.exists(atlas)) continue;
    const source = scene.textures.get(atlas).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Generated atlases can have slightly uneven gutters. Locate transparent
    // separators instead of cutting an antler/weapon at an arithmetic gridline.
    const separator = (expected: number, radius: number, countAt: (n: number) => number) => {
      let best = expected,
        count = countAt(expected);
      for (let n = expected - radius; n <= expected + radius; n++) {
        const candidate = countAt(n);
        if (
          candidate < count ||
          (candidate === count && Math.abs(n - expected) < Math.abs(best - expected))
        ) {
          best = n;
          count = candidate;
        }
      }
      // Split a gutter in its middle, not at its first transparent pixel.
      // Both adjacent portraits need room for their antialiased fringes.
      let first = best,
        last = best;
      while (first > expected - radius && countAt(first - 1) === count) first--;
      while (last < expected + radius && countAt(last + 1) === count) last++;
      return Math.round((first + last) / 2);
    };
    const rowCuts = [0];
    for (let row = 1; row < rows; row++) {
      rowCuts.push(
        separator(
          Math.round((row * source.height) / rows),
          Math.floor((source.height / rows) * 0.12),
          (y) => {
            let count = 0;
            for (let x = 0; x < source.width; x++)
              if (pixels[(y * source.width + x) * 4 + 3] > 35) count++;
            return count;
          },
        ),
      );
    }
    rowCuts.push(source.height);
    const columnCuts = Array.from({ length: rows }, (_, row) => {
      const cuts = [0];
      for (let column = 1; column < 3; column++) {
        cuts.push(
          separator(
            Math.round((column * source.width) / 3),
            Math.floor((source.width / 3) * 0.12),
            (x) => {
              let count = 0;
              for (let y = rowCuts[row]; y < rowCuts[row + 1]; y++)
                if (pixels[(y * source.width + x) * 4 + 3] > 35) count++;
              return count;
            },
          ),
        );
      }
      cuts.push(source.width);
      return cuts;
    });
    entries.forEach((key, index) => {
      const row = Math.floor(index / 3);
      const x0 = columnCuts[row][index % 3];
      const x1 = columnCuts[row][(index % 3) + 1];
      const y0 = rowCuts[row];
      const y1 = rowCuts[row + 1];
      let left = x1,
        right = x0,
        top = y1,
        bottom = y0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (pixels[(y * source.width + x) * 4 + 3] > 35) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
      if (right <= left || bottom <= top) return;
      // Keep antialiasing outside the solid silhouette without importing a neighbour.
      left = Math.max(x0, left - 3);
      right = Math.min(x1 - 1, right + 3);
      top = Math.max(y0, top - 3);
      bottom = Math.min(y1 - 1, bottom + 3);
      registerPortrait(key, source, { x: left, y: top, w: right - left + 1, h: bottom - top + 1 });
    });
  }
}
