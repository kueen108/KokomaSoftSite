import Phaser from 'phaser';
import { TEXTURE } from '../config/gameConfig';
import { growthRank } from '../systems/HeroProgressSystem';
import { registerPortrait } from './PortraitArt';

const party = [
  TEXTURE.paladog,
  'tex-ally-tanker',
  'tex-ally-dealer',
  'tex-ally-archer',
  'tex-ally-guardian',
  'tex-ally-bannerman',
];
const expansion = ['tex-ally-mage', 'tex-ally-cleric', 'tex-ally-lancer'];

/** Rank choice is permanent for the battle; all motion families share its base key. */
export function applyGrowthAppearance(unit: Phaser.Physics.Arcade.Sprite, level: number): void {
  const key = `${unit.texture.key}-${growthRank(level)}`;
  unit.setData('growthLevel', level);
  if (!unit.scene.textures.exists(key)) return;
  const body = unit.body as Phaser.Physics.Arcade.Body;
  const size = {
    w: body.width,
    h: body.height,
    x: body.offset.x - unit.displayOriginX,
    y: body.offset.y - unit.displayOriginY,
  };
  const foot = unit.height - unit.displayOriginY;
  unit.setTexture(key).setOrigin(0.5, 1 - foot / unit.height);
  body.setSize(size.w, size.h, false);
  body.setOffset(unit.displayOriginX + size.x, unit.displayOriginY + size.y);
}

/** Load-time atlas extraction only: retain generated alpha and normalize feet/hitboxes. */
export function installGrowthArt(scene: Phaser.Scene): void {
  for (const [atlas, keys, ranks, indices] of [
    ['party-novice', party, Array(6).fill('novice'), [0, 1, 2, 3, 4, 5]],
    ['party-trained', party, Array(6).fill('trained'), [0, 1, 2, 3, 4, 5]],
    [
      'expedition-growth',
      [...expansion, ...expansion],
      ['novice', 'novice', 'novice', 'trained', 'trained', 'trained'],
      [6, 7, 8, 6, 7, 8],
    ],
  ] as const) {
    if (!scene.textures.exists(atlas)) continue;
    const source = scene.textures.get(atlas).getSourceImage() as HTMLImageElement;
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const context = scratch.getContext('2d')!;
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    const cuts = [0];
    for (let row = 1; row < 6; row++) {
      const expected = Math.round((source.height * row) / 6);
      let best = expected,
        count = Infinity;
      for (
        let y = expected - Math.round(source.height / 36);
        y <= expected + Math.round(source.height / 36);
        y++
      ) {
        let n = 0;
        for (let x = 0; x < source.width; x++) if (pixels[(y * source.width + x) * 4 + 3] > 60) n++;
        if (n < count || (n === count && Math.abs(y - expected) < Math.abs(best - expected))) {
          best = y;
          count = n;
        }
      }
      cuts.push(best);
    }
    cuts.push(source.height);
    keys.forEach((base, row) => {
      if (!scene.textures.exists(base)) return;
      const key = `${base}-${ranks[row]}`;
      if (scene.textures.exists(key)) return;
      const original = scene.textures.getFrame(base);
      const width = Math.ceil(original.width * 1.55),
        height = Math.ceil(original.height * 1.12);
      const cells = Array.from({ length: 6 }, (_, column) => {
        const x0 = Math.round((source.width * column) / 6),
          x1 = Math.round((source.width * (column + 1)) / 6);
        let left = x1,
          right = x0,
          top = cuts[row + 1],
          bottom = cuts[row];
        for (let y = cuts[row]; y < cuts[row + 1]; y++)
          for (let x = x0; x < x1; x++) {
            if (pixels[(y * source.width + x) * 4 + 3] > 60) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
        return {
          x: left,
          y: top,
          w: Math.max(1, right - left + 1),
          h: Math.max(1, bottom - top + 1),
        };
      });
      const scale = Math.min(
        (width - 8) / Math.max(...cells.map((c) => c.w)),
        (height - 4) / Math.max(...cells.map((c) => c.h)),
      );
      const paint = (ctx: CanvasRenderingContext2D, column: number, dx = 0) => {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const cell = cells[column],
          w = cell.w * scale,
          h = cell.h * scale;
        ctx.drawImage(
          source,
          cell.x,
          cell.y,
          cell.w,
          cell.h,
          dx + (width - w) / 2,
          height - h,
          w,
          h,
        );
      };
      const idle = scene.textures.createCanvas(key, width, height)!;
      paint(idle.context, 0);
      idle.refresh();
      // Native-resolution fallback if the dedicated portrait asset fails to load.
      registerPortrait(`${indices[row]}-${ranks[row]}`, source, cells[0]);
      for (const [motion, columns] of [
        ['locomotion', base === TEXTURE.paladog ? [0, 1, 1, 0, 2, 2, 0, 1] : [0, 1, 1, 0, 2, 2]],
        ['attack', [0, 3, 4, 0]],
        ['hurt', [5, 5, 0, 0]],
        ['guard', [5, 5, 5, 5]],
      ] as const) {
        const texture = scene.textures.createCanvas(
          `${key}-${motion}`,
          width * columns.length,
          height,
        )!;
        columns.forEach((column, frame) => {
          paint(texture.context, column, frame * width);
          texture.add(String(frame), 0, frame * width, 0, width, height);
        });
        texture.refresh();
      }
    });
  }
}
