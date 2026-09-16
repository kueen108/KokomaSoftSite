/** UI pixels are independent from the 1280×720 simulation coordinate system. */
export function mobileViewport(): boolean {
  return window.matchMedia('(max-width: 1024px), (pointer: coarse) and (max-height: 700px)')
    .matches;
}

export function visibleViewport(): { width: number; height: number; left: number; top: number } {
  const view = window.visualViewport;
  return {
    width: view?.width ?? window.innerWidth,
    height: view?.height ?? window.innerHeight,
    left: view?.offsetLeft ?? 0,
    top: view?.offsetTop ?? 0,
  };
}

export function standaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function mobileBattleLayout(width: number, height: number) {
  const dock = width < 600 ? 176 : 102;
  const renderWidth = Math.max(width, ((height - dock + 120) * 1280) / 720);
  return {
    renderWidth,
    renderHeight: (renderWidth * 720) / 1280,
    top: height - dock - (500 * renderWidth) / 1280,
    visibleWorldWidth: Math.min(1280, (width * 1280) / renderWidth),
  };
}

/** Must be called directly from the user's click, before any async work. */
export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      screen.orientation?.unlock?.();
      return true;
    }
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) return false;
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };
    await orientation?.lock?.('landscape').catch(() => undefined);
    return Boolean(document.fullscreenElement);
  } catch {
    return false;
  }
}
