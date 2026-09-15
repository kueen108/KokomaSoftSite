import Phaser from 'phaser';
import { TEXTURE } from '../config/gameConfig';
import { unitDefinition } from '../data/units';
import { enemyDefinition } from '../data/enemies';
import { bossDefinition } from '../data/bosses';

/** All poses share a canvas and foot anchor, so changing frames never changes collision geometry. */
export function installMovementArt(scene: Phaser.Scene): void {
  const definitions = [
    {
      atlas: 'hero-run',
      bands: [0, 0.5, 1],
      columns: 4,
      rows: 2,
      keys: [TEXTURE.paladog],
      frames: 8,
    },
    {
      atlas: 'allies-walk',
      bands: [0, 239, 458, 683, 890, 1145].map((y) => y / 1145),
      columns: 6,
      rows: 5,
      frames: 6,
      keys: (['tanker', 'dealer', 'archer', 'guardian', 'bannerman'] as const).map(
        (t) => unitDefinition(t).textureKey,
      ),
    },
    {
      atlas: 'enemies-walk',
      bands: [0, 185, 393, 587, 790, 994, 1254].map((y) => y / 1254),
      columns: 6,
      rows: 6,
      frames: 6,
      keys: [
        ...(['grunt', 'brute', 'skirmisher', 'juggernaut', 'overseer'] as const).map(
          (t) => enemyDefinition(t).textureKey,
        ),
        bossDefinition('grave-warden').textureKey,
      ],
    },
  ];
  for (const d of definitions) {
    if (!scene.textures.exists(d.atlas)) continue;
    const source = scene.textures.get(d.atlas).getSourceImage() as HTMLImageElement;
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const ctx = scratch.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
    d.keys.forEach((key, row) => {
      if (!scene.textures.exists(key)) return;
      const cells = Array.from({ length: d.frames }, (_, frame) => {
        const cell = d.keys.length === 1 ? frame : row * d.columns + frame;
        const ox = Math.round(((cell % d.columns) * source.width) / d.columns);
        const oy = Math.round(d.bands[Math.floor(cell / d.columns)] * source.height);
        const endX = Math.round((((cell % d.columns) + 1) * source.width) / d.columns);
        const endY = Math.round(d.bands[Math.floor(cell / d.columns) + 1] * source.height);
        let left = endX,
          right = ox,
          top = endY,
          bottom = oy;
        for (let y = oy; y < endY; y++)
          for (let x = ox; x < endX; x++) {
            if (pixels[(y * source.width + x) * 4 + 3] > 60) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
        return { left, top, width: right - left + 1, height: bottom - top + 1 };
      });
      if (cells.some((c) => c.width <= 0 || c.height <= 0)) return;
      const original = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
      const width = original.width,
        height = original.height;
      const maxW = Math.max(...cells.map((c) => c.width)),
        maxH = Math.max(...cells.map((c) => c.height));
      const scale = Math.min(width / maxW, height / maxH);
      const textureKey = `${key}-locomotion`;
      if (scene.textures.exists(textureKey)) return;
      const texture = scene.textures.createCanvas(textureKey, width * d.frames, height)!;
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
