import { rows } from './catalog';
import { messageRows } from './messages';
import { storyRows } from './story';
import { mobileRows } from './mobile';

export const SUPPORTED_LOCALES = ['en', 'ja', 'zh', 'fr', 'es', 'ko'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Use the browser's primary language; an unsupported primary falls back to English. */
export function resolveLocale(language?: string | null): Locale {
  const normalized = language?.trim().toLowerCase().replaceAll('_', '-') ?? '';
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(normalized)) return DEFAULT_LOCALE;
  const base = normalized.split('-')[0];
  return SUPPORTED_LOCALES.includes(base as Locale) ? (base as Locale) : DEFAULT_LOCALE;
}

// Resolve before data modules initialise their translated display names.
export const locale: Locale = resolveLocale(
  typeof navigator === 'undefined' ? undefined : navigator.language || navigator.languages?.[0],
);

const entries = [...rows, ...storyRows, ...messageRows, ...mobileRows];
export const catalogs: Record<Locale, Readonly<Record<string, string>>> = Object.fromEntries(
  SUPPORTED_LOCALES.map((language) => {
    const column = { ko: 0, en: 1, ja: 2, zh: 3, fr: 4, es: 5 }[language];
    const messages = Object.fromEntries(entries.map((row) => [row[0], row[column]]));
    messages['\n이전 전장을 먼저 클리어하세요.'] =
      '\n' + messages['이전 전장을 먼저 클리어하세요.'];
    return [language, messages];
  }),
) as Record<Locale, Readonly<Record<string, string>>>;

/** Whole sentences let translators reorder values without changing game state or IDs. */
export function translate(
  key: string,
  values: readonly (string | number)[] = [],
  language: Locale = locale,
): string {
  const message = catalogs[language]?.[key] ?? catalogs.en[key] ?? key;
  return message.replace(/\{(\d+)\}/g, (token, index: string) =>
    values[Number(index)] === undefined ? token : String(values[Number(index)]),
  );
}

export function localizeDocument(): void {
  document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : locale;
  document.title = `${translate('새벽잎 원정대')} · ${translate('네 개의 맹세')}`;
  document.getElementById('game')?.setAttribute('aria-label', document.title);
  const note = document.querySelector('.landscape-note');
  if (note)
    note.textContent = translate('가로로 돌리면 더 넓은 전장에서 편하게 플레이할 수 있습니다.');
}
