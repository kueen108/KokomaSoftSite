import Phaser from 'phaser';
import { expansionPortraits } from './Interface';
import { growthPortraits, registerPortrait } from './PortraitArt';
const keys = [
  'tex-ally-mage',
  'tex-ally-cleric',
  'tex-ally-lancer',
  'tex-enemy-bomber',
  'tex-enemy-wraith',
  'tex-enemy-sentinel',
];
export const EXPEDITION_ART = [
  'expedition-walk',
  'expedition-attack',
  'expedition-hurt',
  'expedition-guard',
];
/** Decode chroma-keyed atlases into transparent, foot-aligned runtime textures once. */
export function installExpeditionArt(scene: Phaser.Scene): void {
  for (const atlas of EXPEDITION_ART) {
    const source = scene.textures.get(atlas).getSourceImage() as HTMLImageElement;
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const c = scratch.getContext('2d')!;
    c.drawImage(source, 0, 0);
    const data = c.getImageData(0, 0, scratch.width, scratch.height),
      p = data.data;
    for (let i = 0; i < p.length; i += 4) {
      const magenta = Math.min(p[i], p[i + 2]) - p[i + 1];
      if (magenta > 65 && p[i] > 120 && p[i + 2] > 110) p[i + 3] = 0;
    }
    c.putImageData(data, 0, 0);
    const cuts = [0];
    for (let row = 1; row < 6; row++) {
      const expected = Math.round((source.height * row) / 6),
        radius = Math.round((source.height / 6) * 0.25);
      let best = expected,
        count = Infinity;
      for (let y = expected - radius; y <= expected + radius; y++) {
        let n = 0;
        for (let x = 0; x < source.width; x++) if (p[(y * source.width + x) * 4 + 3] > 60) n++;
        if (n < count || (n === count && Math.abs(y - expected) < Math.abs(best - expected))) {
          best = y;
          count = n;
        }
      }
      cuts.push(best);
    }
    cuts.push(source.height);
    const walking = atlas.endsWith('walk'),
      frames = walking ? 6 : 4;
    keys.forEach((key, row) => {
      const cells = Array.from({ length: frames }, (_, frame) => {
        const x0 = Math.round((frame * source.width) / frames),
          x1 = Math.round(((frame + 1) * source.width) / frames),
          y0 = cuts[row],
          y1 = cuts[row + 1];
        let l = x1,
          r = x0,
          t = y1,
          b = y0;
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++)
            if (p[(y * source.width + x) * 4 + 3] > 60) {
              l = Math.min(l, x);
              r = Math.max(r, x);
              t = Math.min(t, y);
              b = Math.max(b, y);
            }
        return { x: l, y: t, w: r - l + 1, h: b - t + 1 };
      });
      const height = row === 5 ? 116 : 96,
        width = walking ? 130 : 190;
      const scale = Math.min(
        (width - 8) / Math.max(...cells.map((c) => c.w)),
        (height - 4) / Math.max(...cells.map((c) => c.h)),
      );
      const name = key + '-' + (walking ? 'locomotion' : atlas.split('-')[1]);
      if (scene.textures.exists(name)) return;
      const texture = scene.textures.createCanvas(name, width * frames, height)!;
      texture.context.imageSmoothingQuality = 'high';
      cells.forEach((cell, i) => {
        texture.context.drawImage(
          scratch,
          cell.x,
          cell.y,
          cell.w,
          cell.h,
          i * width + (width - cell.w * scale) / 2,
          height - cell.h * scale,
          cell.w * scale,
          cell.h * scale,
        );
        texture.add(String(i), 0, i * width, 0, width, height);
      });
      texture.refresh();
      if (walking) {
        const base = scene.textures.createCanvas(key, width, height)!;
        base.context.drawImage(texture.canvas, 0, 0, width, height, 0, 0, width, height);
        base.refresh();
        if (row < 3) {
          const portraitKey = `${row + 6}-elite`;
          registerPortrait(portraitKey, scratch, cells[0]);
          expansionPortraits[row + 6] = growthPortraits[portraitKey];
        }
      }
    });
  }
  // Weapon shapes are code-native effects, distinct in silhouette as well as color.
  for (const kind of ['arrow', 'fire', 'frost', 'storm', 'spear', 'bomb', 'heal']) {
    const t = scene.textures.createCanvas('shot-' + kind, 64, 32)!,
      c = t.context;
    c.shadowBlur = 10;
    c.shadowColor =
      kind === 'frost'
        ? '#80e7ff'
        : kind === 'heal'
          ? '#84e7a7'
          : kind === 'storm'
            ? '#d7afff'
            : '#ffc374';
    c.strokeStyle = c.shadowColor;
    c.fillStyle = c.shadowColor;
    c.lineWidth = 3;
    if (kind === 'arrow' || kind === 'spear') {
      c.beginPath();
      c.moveTo(4, 16);
      c.lineTo(52, 16);
      c.stroke();
      c.beginPath();
      c.moveTo(59, 16);
      c.lineTo(45, 9);
      c.lineTo(45, 23);
      c.closePath();
      c.fill();
    } else if (kind === 'bomb') {
      c.fillStyle = '#433d49';
      c.beginPath();
      c.arc(35, 18, 11, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ffb66e';
      c.beginPath();
      c.moveTo(36, 7);
      c.lineTo(44, 2);
      c.stroke();
    } else if (kind === 'frost') {
      c.beginPath();
      c.moveTo(58, 16);
      c.lineTo(33, 5);
      c.lineTo(12, 16);
      c.lineTo(33, 27);
      c.closePath();
      c.fill();
    } else {
      c.beginPath();
      c.ellipse(36, 16, kind === 'fire' ? 20 : 12, 11, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fffde8';
      c.beginPath();
      c.arc(40, 15, 5, 0, Math.PI * 2);
      c.fill();
    }
    t.refresh();
  }
}
