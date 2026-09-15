import { translate } from '../i18n/index';
/** Small, consistent vector glyphs; no network, font, or raster dependency. */
const paths = {
  castle: '<path d="M4 21V8h4V4h3v4h2V4h3v4h4v13H4Z"/><path d="M10 21v-6h4v6M6 11h2m8 0h2"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 3 11 8 15 5-4 13-10 8-15Z"/>',
  mana: '<path d="m12 2 7 10-7 10-7-10 7-10Z"/><path d="m5 12 7 3 7-3M12 2v20"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M12 8v8m-2-6 2-2 2 2"/>',
  party:
    '<circle cx="12" cy="7" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M4 5a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M2 20v-4m20 4v-4"/>',
  sword: '<path d="m5 19 13-13 3-3-1 6L8 21M3 14l7 7M3 21l3-3"/>',
  shield: '<path d="m12 2 8 4v7c0 5-8 9-8 9s-8-4-8-9V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
  bow: '<path d="M4 3c14 0 17 8 17 17L4 3Zm0 0 3 14 14 3M2 22 20 4m-5 0h5v5"/>',
  flame:
    '<path d="M13 2c1 7-6 6-3 12-3-1-4-3-4-5-7 10 2 16 9 12 8-5 3-11 0-14 1 4-1 5-2 5 2-5 1-7 0-10Z"/>',
  snow: '<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1V5m14 9-4 1v4M3 14l4 1v4m14-9-4-1V5"/>',
  star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
  aura: '<ellipse cx="12" cy="16" rx="10" ry="5"/><ellipse cx="12" cy="16" rx="6" ry="3"/><path d="m12 2 2 5 4 2-4 2-2 5-2-5-4-2 4-2 2-5Z"/>',
  nova: '<circle cx="12" cy="12" r="6"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4M4 4l3 3m10 10 3 3M4 20l3-3M17 7l3-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  skull:
    '<path d="M7 19H5v-6a7 7 0 0 1 14 0v6h-2v3H7v-3Z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="m11 17 1-2 1 2m-3 2v3m4-3v3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  play: '<path d="m7 3 14 9-14 9V3Z"/>',
  sound: '<path d="M3 9h4l5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  mute: '<path d="M3 9h4l5-5v16l-5-5H3V9Zm13 0 6 6m0-6-6 6"/>',
  gear: '<path d="m9 3-1 3-3 1-2 3 2 3v4l3 1 2 3h4l2-3 3-1v-4l2-3-2-3-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  book: '<path d="M12 5C9 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-7-2-10 1Zm0 0v16"/>',
  arrow: '<path d="M20 12H4m7-7-7 7 7 7"/>',
  up: '<path d="m6 13 6-7 6 7M12 6v16"/>',
  ring: '<ellipse cx="12" cy="15" rx="7" ry="6"/><path d="m12 2 4 4-4 4-4-4 4-4Z"/>',
  flag: '<path d="M5 22V3h14l-4 5 4 5H5"/>',
} as const;
export type IconName = keyof typeof paths;
export function icon(name: IconName): string {
  return `<svg class="glyph glyph-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
export const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function infoButton(id: string, title: string, body = ''): string {
  return `<button id="${id}" class="info-button" data-info-title="${escapeHtml(title)}" data-info="${escapeHtml(body)}" aria-label="${translate('{0} 설명', [escapeHtml(title)])}" aria-haspopup="dialog">i</button>`;
}
