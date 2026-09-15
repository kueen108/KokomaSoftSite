import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import {
  BACKDROP_OVERSCAN_PX,
  backdropColorAt,
  backdropLayers,
  skyColorAt,
} from '../systems/BackdropSystem';
import type { BackdropLayers, BackdropVariant } from '../systems/BackdropSystem';

export const BACKDROP_DEPTH = -10;

const SKY_BAND_PX = 1;

function toInt(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

export class Backdrop extends Phaser.GameObjects.Graphics {
  private readonly layers: BackdropLayers;
  private art: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite | null = null;
  private floor: Phaser.GameObjects.TileSprite | null = null;

  constructor(scene: Phaser.Scene, variant: BackdropVariant, chapter = 1) {
    super(scene);

    this.layers = backdropLayers(GAME_WIDTH, GAME_HEIGHT, BACKDROP_OVERSCAN_PX, variant);

    scene.add.existing(this);
    this.setName('backdrop').setDepth(BACKDROP_DEPTH);
    this.paint();
    this.setScrollFactor(0);
    if (scene.textures.exists('forest-battle')) {
      const key =
        chapter > 3
          ? ['frost-battle', 'ember-battle', 'astral-battle'][
              Math.min(2, Math.floor((chapter - 4) / 3))
            ]
          : chapter === 3
            ? 'graveyard-battle'
            : chapter === 2
              ? 'ruins-battle'
              : 'forest-battle';
      if (variant === 'battle') {
        // Mirror adjoining painted panels to join their edges without a visible seam.
        const panoramaKey = `${key}-panorama`;
        const floorKey = `${key}-floor`;
        if (!scene.textures.exists(panoramaKey)) {
          const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
          const panorama = scene.textures.createCanvas(panoramaKey, 2640, 750)!;
          const c = panorama.context;
          const y = chapter === 2 ? -10 : -15;
          const height = chapter === 2 ? 880 : 750;
          c.drawImage(source, 0, y, 1320, height);
          c.save();
          c.translate(2640, 0);
          c.scale(-1, 1);
          c.drawImage(source, 0, y, 1320, height);
          c.restore();
          panorama.refresh();
          const floor = scene.textures.createCanvas(floorKey, 2640, 335)!;
          const f = floor.context;
          f.drawImage(panorama.canvas, 0, 385, 2640, 335, 0, 0, 2640, 335);
          f.globalCompositeOperation = 'destination-in';
          const fade = f.createLinearGradient(0, 0, 0, 40);
          fade.addColorStop(0, 'rgba(0,0,0,0)');
          fade.addColorStop(1, 'rgba(0,0,0,1)');
          f.fillStyle = fade;
          f.fillRect(0, 0, 2640, 335);
          floor.refresh();
        }
        this.art = scene.add
          .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, panoramaKey)
          .setOrigin(0)
          .setScrollFactor(0)
          .setDepth(BACKDROP_DEPTH + 1);
        this.floor = scene.add
          .tileSprite(0, 385, GAME_WIDTH, 335, floorKey)
          .setOrigin(0)
          .setScrollFactor(0)
          .setDepth(BACKDROP_DEPTH + 1.5);
        this.overlays.push(this.floor);
      } else {
        this.art = scene.add
          .image(640, chapter === 2 ? 430 : 360, key)
          .setDisplaySize(1320, chapter === 2 ? 880 : 750)
          .setDepth(BACKDROP_DEPTH + 1);
      }
      if (variant === 'menu') this.art.setTint(0x5b8574);
      const shade = scene.add
        .graphics()
        .setScrollFactor(0)
        .setDepth(BACKDROP_DEPTH + 2);
      shade.fillGradientStyle(
        0x031a14,
        0x031a14,
        0x031a14,
        0x031a14,
        variant === 'menu' ? 0.7 : 0.12,
        0.08,
        variant === 'menu' ? 0.75 : 0.12,
        0.3,
      );
      shade.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.overlays.push(shade);
      for (let i = 0; i < 18; i++) {
        const mote = scene.add
          .circle((i * 173 + 80) % 1280, 230 + ((i * 79) % 280), i % 3 === 0 ? 2 : 1, 0xf4d97b, 0.6)
          .setScrollFactor(0)
          .setDepth(BACKDROP_DEPTH + 3);
        scene.tweens.add({
          targets: mote,
          y: mote.y - 30,
          x: mote.x + 18,
          alpha: 0.12,
          duration: 2200 + i * 137,
          yoyo: true,
          repeat: -1,
        });
        this.overlays.push(mote);
      }
    }
  }

  updateScroll(scrollX: number): void {
    if (this.art instanceof Phaser.GameObjects.TileSprite) this.art.tilePositionX = scrollX * 0.28;
    if (this.floor) this.floor.tilePositionX = scrollX;
  }

  private overlays: Phaser.GameObjects.GameObject[] = [];

  gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this, ...(this.art ? [this.art] : []), ...this.overlays];
  }

  colorAt(x: number, y: number): string {
    return backdropColorAt(x, y, this.layers);
  }

  skyRange(): { y0: number; y1: number } {
    return { ...this.layers.skyRange };
  }

  coveredRect(): Phaser.Geom.Rectangle {
    const { left, top, right, bottom } = this.layers.rect;
    return new Phaser.Geom.Rectangle(left, top, right - left, bottom - top);
  }

  groundColor(): number {
    return toInt(this.layers.ground[0].color);
  }

  private paint(): void {
    const { rect, sky, hills, ground } = this.layers;
    const width = rect.right - rect.left;

    for (let y = sky.y0; y < sky.y1; y += SKY_BAND_PX) {
      this.fillStyle(toInt(skyColorAt(y, sky)), 1);
      this.fillRect(rect.left, y, width, SKY_BAND_PX);
    }

    for (const hill of hills) {
      this.fillStyle(toInt(hill.color), 1);
      this.fillPoints(
        hill.points.map(([x, y]) => new Phaser.Geom.Point(x, y)),
        true,
      );
    }

    for (const band of ground) {
      this.fillStyle(toInt(band.color), 1);
      this.fillRect(rect.left, band.y, width, band.height);
    }
  }
}
