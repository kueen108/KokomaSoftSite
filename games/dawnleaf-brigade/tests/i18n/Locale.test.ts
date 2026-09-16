import { describe, expect, it } from 'vitest';
import { catalogs, resolveLocale, SUPPORTED_LOCALES, translate } from '../../src/i18n';
import { rows } from '../../src/i18n/catalog';
import { storyRows } from '../../src/i18n/story';
import { messageRows } from '../../src/i18n/messages';
import { mobileRows } from '../../src/i18n/mobile';
import ts from 'typescript';

describe('language selection', () => {
  it.each([
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['ja-JP', 'ja'],
    ['zh-CN', 'zh'],
    ['zh-TW', 'zh'],
    ['zh-Hant-HK', 'zh'],
    ['fr-CA', 'fr'],
    ['es-MX', 'es'],
    ['ko-KR', 'ko'],
    ['JA_jp', 'ja'],
    [' de-DE ', 'en'],
    ['pt-BR', 'en'],
    ['ar', 'en'],
    ['en-invalid!', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    [null, 'en'],
  ])('resolves %s to %s', (input, expected) => {
    expect(resolveLocale(input)).toBe(expected);
  });

  it('reorders dynamic values without replacing placeholder-like text inside a value', () => {
    const result = translate(
      '{0} · {1}초 후 +{2} HP/s · HP 0이면 패배',
      ['Armour {2}', 2, 4],
      'en',
    );
    expect(result).toBe('Armour {2} · +4 HP/s after 2s · Defeat at 0 HP');
  });

  it('falls back to English for a missing translation', () => {
    const descriptor = Object.getOwnPropertyDescriptor(catalogs.fr, '승리')!;
    Reflect.deleteProperty(catalogs.fr, '승리');
    try {
      expect(translate('승리', [], 'fr')).toBe('Victory');
    } finally {
      Object.defineProperty(catalogs.fr, '승리', descriptor);
    }
  });
});

describe('catalog coverage', () => {
  const entries = [...rows, ...storyRows, ...messageRows, ...mobileRows];
  const placeholders = (text: string) =>
    [...text.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort();

  it('contains unique keys and complete translations with matching placeholders', () => {
    expect(new Set(entries.map((row) => row[0])).size).toBe(entries.length);
    for (const language of SUPPORTED_LOCALES) {
      expect(Object.keys(catalogs[language]).sort()).toEqual(Object.keys(catalogs.en).sort());
      for (const [key, value] of Object.entries(catalogs[language])) {
        expect(value.trim(), `${language}: ${key}`).not.toBe('');
        expect(placeholders(value), `${language}: ${key}`).toEqual(placeholders(key));
        if (language !== 'ko') expect(value, `${language}: ${key}`).not.toMatch(/[가-힣]/);
        // Translations are text, not markup. Only caller-owned placeholders may carry HTML.
        expect(value, `${language}: ${key}`).not.toMatch(/[<>"&]/);
      }
    }
  });

  it('covers every translation call and leaves no Korean UI literals outside translation keys', () => {
    const sources = import.meta.glob('../../src/**/*.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    let calls = 0;
    for (const [file, source] of Object.entries(sources)) {
      if (file.includes('/i18n/')) continue;
      const ast = ts.createSourceFile(file, String(source), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText(ast) === 'translate') {
          const key = node.arguments[0];
          expect(ts.isStringLiteral(key), file).toBe(true);
          if (ts.isStringLiteral(key))
            expect(catalogs.en[key.text], `${file}: ${key.text}`).toBeDefined();
          if (ts.isStringLiteral(key) && placeholders(key.text).length) {
            const args = node.arguments[1];
            expect(
              args && ts.isArrayLiteralExpression(args),
              `${file}: missing interpolation values`,
            ).toBe(true);
            if (args && ts.isArrayLiteralExpression(args)) {
              const needed =
                Math.max(...[...key.text.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]))) +
                1;
              expect(args.elements.length, `${file}: ${key.text}`).toBe(needed);
            }
          }
          calls++;
        }
        if (
          (ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            ts.isTemplateHead(node) ||
            ts.isTemplateMiddle(node) ||
            ts.isTemplateTail(node)) &&
          /[가-힣]/.test(node.text)
        ) {
          expect(
            ts.isCallExpression(node.parent) && node.parent.expression.getText(ast) === 'translate',
            `${file}: untranslated ${node.text}`,
          ).toBe(true);
        }
        node.forEachChild(visit);
      };
      visit(ast);
    }
    expect(calls).toBeGreaterThan(250);
  });
});
