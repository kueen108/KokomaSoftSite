import { afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { growthPortraits, installPortraitArt, registerPortrait } from '../../src/ui/PortraitArt';

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of Object.keys(growthPortraits)) delete growthPortraits[key];
});

describe('native-resolution portraits', () => {
  it('copies native pixels once without routing through gameplay dimensions', () => {
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toDataURL: () => 'native-png',
    };
    vi.stubGlobal('document', { createElement: () => canvas });
    const source = {} as HTMLImageElement;
    registerPortrait('0-novice', source, { x: 12, y: 24, w: 478, h: 482 });
    expect([canvas.width, canvas.height]).toEqual([478, 482]);
    expect(drawImage).toHaveBeenCalledExactlyOnceWith(source, 12, 24, 478, 482, 0, 0, 478, 482);
    expect(growthPortraits['0-novice']).toBe('native-png');
  });

  it('does not let a missing dedicated atlas erase native-source fallbacks', () => {
    growthPortraits['0-novice'] = 'fallback';
    const scene = { textures: { exists: () => false } } as unknown as Phaser.Scene;
    installPortraitArt(scene);
    expect(growthPortraits['0-novice']).toBe('fallback');
  });

  it('retains alpha padding and keeps crops inside their own cell', () => {
    const pixels = new Uint8ClampedArray(30 * 20 * 4);
    // Two solid pixels in the first 10×10 cell, including its top-left edge.
    pixels[3] = 255;
    pixels[(5 * 30 + 5) * 4 + 3] = 255;
    const copies: unknown[][] = [];
    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: (...args: unknown[]) => copies.push(args),
          getImageData: () => ({ data: pixels }),
        }),
        toDataURL: () => 'cropped',
      }),
    });
    const source = { width: 30, height: 20 };
    const scene = {
      textures: {
        exists: (key: string) => key === 'party-portraits-novice-v2',
        get: () => ({ getSourceImage: () => source }),
      },
    } as unknown as Phaser.Scene;
    installPortraitArt(scene);
    expect(copies).toContainEqual([source, 0, 0, 9, 9, 0, 0, 9, 9]);
    expect(Object.keys(growthPortraits)).toEqual(['0-novice']);
  });
});
