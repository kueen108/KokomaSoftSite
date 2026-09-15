import Phaser from 'phaser';
import { TEXTURE } from '../config/gameConfig';
import { unitDefinition } from '../data/units';
import { enemyDefinition } from '../data/enemies';
import { bossDefinition } from '../data/bosses';

/** Trim each atlas cell at load time and rasterize once at gameplay size. */
export function installCharacterArt(scene: Phaser.Scene): void {
  const party = [
    TEXTURE.paladog,
    ...['tanker', 'dealer', 'archer', 'guardian', 'bannerman'].map(
      (t) => unitDefinition(t as Parameters<typeof unitDefinition>[0]).textureKey,
    ),
  ];
  const enemies = [
    ...['grunt', 'brute', 'skirmisher', 'juggernaut', 'overseer'].map(
      (t) => enemyDefinition(t as Parameters<typeof enemyDefinition>[0]).textureKey,
    ),
    bossDefinition('grave-warden').textureKey,
  ];
  for (const [atlas, keys] of [
    ['party-atlas', party],
    ['enemies-atlas', enemies],
    ['fortress-atlas', [TEXTURE.allyBase, TEXTURE.enemyBase]],
  ] as const) {
    if (!scene.textures.exists(atlas)) continue;
    const source = scene.textures.get(atlas).getSourceImage() as HTMLImageElement;
    const columns = atlas === 'fortress-atlas' ? 2 : 3;
    const cellW = source.width / columns,
      cellH = source.height / (atlas === 'fortress-atlas' ? 1 : 2);
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const ctx = scratch.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
    keys.forEach((key, index) => {
      // The ogre's club extends past the nominal first cell boundary.
      const enemyTop = atlas === 'enemies-atlas' && index < 2;
      const ox = enemyTop ? (index === 0 ? 0 : 396) : (index % columns) * cellW;
      const scanW = enemyTop ? (index === 0 ? 396 : 628) : cellW;
      const oy = Math.floor(index / columns) * cellH;
      let left = scanW,
        right = 0,
        top = cellH,
        bottom = 0;
      for (let y = 0; y < cellH; y++)
        for (let x = 0; x < scanW; x++) {
          if (pixels[((oy + y) * source.width + ox + x) * 4 + 3] > 35) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      if (right <= left) return;
      const height =
        atlas === 'fortress-atlas'
          ? 190
          : atlas === 'party-atlas'
            ? index === 0
              ? 112
              : index === 5
                ? 104
                : 87
            : index === 5
              ? 166
              : index === 1
                ? 112
                : 87;
      const width = Math.round(((right - left + 1) / (bottom - top + 1)) * height);
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const canvas = scene.textures.createCanvas(key, width, height)!;
      canvas.context.imageSmoothingQuality = 'high';
      canvas.context.drawImage(
        source,
        ox + left,
        oy + top,
        right - left + 1,
        bottom - top + 1,
        0,
        0,
        width,
        height,
      );
      canvas.refresh();
    });
  }
  if (scene.textures.exists(TEXTURE.projectile)) scene.textures.remove(TEXTURE.projectile);
  const bolt = scene.textures.createCanvas(TEXTURE.projectile, 42, 20)!;
  const c = bolt.context;
  const tail = c.createLinearGradient(0, 0, 35, 0);
  tail.addColorStop(0, 'rgba(240,190,70,0)');
  tail.addColorStop(1, 'rgba(255,225,145,.95)');
  c.fillStyle = tail;
  c.beginPath();
  c.moveTo(0, 10);
  c.lineTo(31, 5);
  c.lineTo(36, 10);
  c.lineTo(31, 15);
  c.closePath();
  c.fill();
  const glow = c.createRadialGradient(32, 10, 1, 32, 10, 10);
  glow.addColorStop(0, '#fffbe4');
  glow.addColorStop(0.35, '#fff1b6');
  glow.addColorStop(1, 'rgba(255,199,80,0)');
  c.fillStyle = glow;
  c.fillRect(22, 0, 20, 20);
  bolt.refresh();
}
