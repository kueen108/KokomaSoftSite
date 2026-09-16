import { afterEach, describe, expect, it, vi } from 'vitest';
import { mobileBattleLayout, toggleFullscreen } from '../../src/ui/MobileViewport';

afterEach(() => vi.unstubAllGlobals());
describe('mobile presentation geometry', () => {
  it.each([
    [844, 390],
    [844, 300],
    [667, 280],
    [390, 844],
    [360, 640],
  ])('fills width without distorting actors at %s×%s', (w, h) => {
    const layout = mobileBattleLayout(w, h);
    expect(layout.renderWidth).toBeGreaterThanOrEqual(w);
    expect(layout.renderWidth / layout.renderHeight).toBeCloseTo(1280 / 720);
    expect((layout.visibleWorldWidth * layout.renderWidth) / 1280).toBeCloseTo(w);
    expect(layout.top + (500 * layout.renderWidth) / 1280).toBeCloseTo(h - (w < 600 ? 176 : 102));
  });
  it('uses a closer camera on portrait, not a miniature landscape letterbox', () => {
    expect(mobileBattleLayout(390, 844).visibleWorldWidth).toBeLessThan(500);
  });
});
describe('fullscreen capability and failure handling', () => {
  it('returns a help fallback without an unsupported API call', async () => {
    const requestFullscreen = vi.fn();
    vi.stubGlobal('document', { fullscreenEnabled: false, documentElement: { requestFullscreen } });
    expect(await toggleFullscreen()).toBe(false);
    expect(requestFullscreen).not.toHaveBeenCalled();
  });
  it('does not report success on a rejected fullscreen request', async () => {
    vi.stubGlobal('document', {
      fullscreenEnabled: true,
      documentElement: { requestFullscreen: () => Promise.reject(new Error('Denied')) },
    });
    expect(await toggleFullscreen()).toBe(false);
  });
  it('keeps fullscreen even when landscape locking is unsupported', async () => {
    const doc = {
      fullscreenEnabled: true,
      fullscreenElement: null as object | null,
      documentElement: {
        requestFullscreen: vi.fn(() => {
          doc.fullscreenElement = {};
          return Promise.resolve();
        }),
      },
    };
    vi.stubGlobal('document', doc);
    vi.stubGlobal('screen', {
      orientation: { lock: () => Promise.reject(new Error('Unsupported')) },
    });
    expect(await toggleFullscreen()).toBe(true);
    expect(doc.documentElement.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' });
  });
  it('also handles fullscreen exit failures', async () => {
    vi.stubGlobal('document', {
      fullscreenElement: {},
      exitFullscreen: () => Promise.reject(new Error('Inactive')),
    });
    expect(await toggleFullscreen()).toBe(false);
  });
});
