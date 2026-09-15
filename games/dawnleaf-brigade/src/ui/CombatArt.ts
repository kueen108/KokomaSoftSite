import Phaser from 'phaser';
import { TEXTURE } from '../config/gameConfig';
import { unitDefinition } from '../data/units';
import { enemyDefinition } from '../data/enemies';
import { bossDefinition } from '../data/bosses';

export const COMBAT_ART_KEYS = [
  'party-attack',
  'party-hurt',
  'party-guard',
  'enemies-attack',
  'enemies-hurt',
  'enemies-guard',
];

/** Build four transparent, foot-aligned poses for each combat state and character. */
export function installCombatArt(scene: Phaser.Scene): void {
  const party = [
    TEXTURE.paladog,
    ...(['tanker', 'dealer', 'archer', 'guardian', 'bannerman'] as const).map(
      (t) => unitDefinition(t).textureKey,
    ),
  ];
  const enemies = [
    ...(['grunt', 'brute', 'skirmisher', 'juggernaut', 'overseer'] as const).map(
      (t) => enemyDefinition(t).textureKey,
    ),
    bossDefinition('grave-warden').textureKey,
  ];
  for (const atlas of COMBAT_ART_KEYS) {
    if (!scene.textures.exists(atlas)) continue;
    const source = scene.textures.get(atlas).getSourceImage() as HTMLImageElement;
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const context = scratch.getContext('2d')!;
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    const keys = atlas.startsWith('party') ? party : enemies;
    const state = atlas.split('-')[1];
    // Locate transparent inter-row gutters near the expected grid boundaries.
    const rowCuts = [0];
    for (let row = 1; row < 6; row++) {
      const expected = Math.round((row * source.height) / 6),
        radius = Math.round((source.height / 6) * 0.16);
      let best = expected,
        count = Infinity;
      for (let y = expected - radius; y <= expected + radius; y++) {
        let opaque = 0;
        for (let x = 0; x < source.width; x++)
          if (pixels[(y * source.width + x) * 4 + 3] > 60) opaque++;
        if (
          opaque < count ||
          (opaque === count && Math.abs(y - expected) < Math.abs(best - expected))
        ) {
          count = opaque;
          best = y;
        }
      }
      rowCuts.push(best);
    }
    rowCuts.push(source.height);
    keys.forEach((key, row) => {
      const columns = [0];
      for (let column = 1; column < 4; column++) {
        const expected = Math.round((column * source.width) / 4),
          radius = Math.round((source.width / 4) * 0.18);
        let best = expected,
          count = Infinity;
        for (let x = expected - radius; x <= expected + radius; x++) {
          let opaque = 0;
          for (let y = rowCuts[row]; y < rowCuts[row + 1]; y++)
            if (pixels[(y * source.width + x) * 4 + 3] > 60) opaque++;
          if (
            opaque < count ||
            (opaque === count && Math.abs(x - expected) < Math.abs(best - expected))
          ) {
            count = opaque;
            best = x;
          }
        }
        columns.push(best);
      }
      columns.push(source.width);
      const cells = Array.from({ length: 4 }, (_, column) => {
        const x0 = columns[column],
          x1 = columns[column + 1],
          y0 = rowCuts[row],
          y1 = rowCuts[row + 1];
        let left = x1,
          right = x0,
          top = y1,
          bottom = y0;
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++)
            if (pixels[(y * source.width + x) * 4 + 3] > 60) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        return { left, top, width: right - left + 1, height: bottom - top + 1 };
      });
      if (cells.some((c) => c.width <= 0 || c.height <= 0)) return;
      const original = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
      const width = Math.ceil(original.width * 1.55),
        height = Math.ceil(original.height * 1.12);
      const scale = Math.min(
        width / Math.max(...cells.map((c) => c.width)),
        original.height / Math.max(...cells.map((c) => c.height)),
      );
      const name = `${key}-${state}`;
      if (scene.textures.exists(name)) return;
      const texture = scene.textures.createCanvas(name, width * 4, height)!;
      texture.context.imageSmoothingQuality = 'high';
      cells.forEach((c, i) => {
        const w = c.width * scale,
          h = c.height * scale;
        texture.context.drawImage(
          source,
          c.left,
          c.top,
          c.width,
          c.height,
          i * width + (width - w) / 2,
          height - h,
          w,
          h,
        );
        texture.add(String(i), 0, i * width, 0, width, height);
      });
      texture.refresh();
    });
  }
}
