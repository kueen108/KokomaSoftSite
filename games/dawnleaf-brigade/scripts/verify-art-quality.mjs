/* global window, localStorage, document, Image, getComputedStyle, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import process from 'node:process';

const directory = 'artifacts/runtime/art-quality';
const url = process.env.DAWNLEAF_TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
await mkdir(directory, { recursive: true });
const reports = [],
  portraits = [];
try {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 844, height: 390 },
  ]) {
    for (const level of [0, 2, 4]) {
      const rank = ['novice', 'trained', 'elite'][level / 2];
      const page = await browser.newPage({ viewport, deviceScaleFactor: 2, locale: 'ko-KR' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(url);
      await page.waitForSelector('#play');
      await page.evaluate(async (level) => {
        const { defaultPersistedState, saveState } = await import('/src/systems/SaveSystem.ts');
        const { ALLY_UNIT_TYPES } = await import('/src/types/unit.ts');
        const { CAMPAIGN_STAGES } = await import('/src/data/stages/index.ts');
        const state = defaultPersistedState();
        saveState(localStorage, {
          ...state,
          settlementGold: 5000,
          unlocked: [...ALLY_UNIT_TYPES],
          clearedStages: CAMPAIGN_STAGES.map((s) => s.id),
          upgradeLevels: Object.fromEntries(ALLY_UNIT_TYPES.map((t) => [t, level])),
          hero: { ...state.hero, auraLevel: level },
        });
      }, level);
      await page.reload();
      await page.waitForSelector('#play');
      await page.addStyleTag({ content: '.menu-hero { animation: none !important; }' });
      const menu = await page.locator('.menu-hero .portrait').evaluate(async (element) => {
        const image = new Image();
        image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
        await image.decode();
        const rect = element.getBoundingClientRect();
        return {
          width: image.width,
          height: image.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
        };
      });
      assert.ok(menu.height >= 450, `${rank}: menu must not use a combat-size thumbnail`);
      await page.screenshot({ path: `${directory}/${viewport.width}-${rank}-menu.png` });
      await page.click('#upgrade');
      await page.waitForSelector('#hero-upgrades .portrait');
      const items = await page.locator('.roster-row .portrait').evaluateAll(async (elements) => {
        return Promise.all(
          elements.map(async (element, index) => {
            const image = new Image();
            image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let transparent = 0,
              visible = 0;
            for (let i = 3; i < pixels.length; i += 4) {
              if (pixels[i] === 0) transparent++;
              if (pixels[i] > 200) visible++;
            }
            let clippedEdgePixels = 0;
            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                if (
                  (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) &&
                  pixels[(y * canvas.width + x) * 4 + 3] > 60
                )
                  clippedEdgePixels++;
              }
            }
            return {
              index,
              rank: element.dataset.growth,
              width: image.width,
              height: image.height,
              clippedEdgePixels,
              transparent: transparent / (pixels.length / 4),
              visible: visible / (pixels.length / 4),
              image: image.src,
            };
          }),
        );
      });
      assert.equal(items.length, 9);
      for (const item of items) {
        assert.equal(item.rank, rank);
        assert.ok(
          item.height >= 340,
          `${rank}/${item.index}: insufficient native portrait detail (${item.height}px)`,
        );
        assert.ok(item.width >= 250, `${rank}/${item.index}: narrow or clipped crop`);
        assert.equal(
          item.clippedEdgePixels,
          0,
          `${rank}/${item.index}: solid silhouette touches crop edge`,
        );
        assert.ok(
          item.transparent > 0.1 && item.visible > 0.2,
          `${rank}/${item.index}: alpha/empty art`,
        );
      }
      await page.click('#hero-upgrades');
      await page.screenshot({ path: `${directory}/${viewport.width}-${rank}-workshop.png` });
      const sources = await page.evaluate(() => {
        const textures = window.__game.textures;
        return [
          'party-portraits-novice-v2',
          'party-portraits-trained-v2',
          'expedition-portraits-v2',
        ].map((key) => {
          if (!textures.exists(key)) return { key, loaded: false };
          const source = textures.get(key).getSourceImage();
          return { key, loaded: true, width: source.width, height: source.height };
        });
      });
      assert.ok(
        sources.every((s) => s.loaded),
        'No silent portrait fallback in acceptance run',
      );
      assert.deepEqual(errors, []);
      const summarized = items.map(({ image, ...item }) => ({
        ...item,
        sha256: createHash('sha256').update(image).digest('hex'),
      }));
      reports.push({
        viewport,
        deviceScaleFactor: 2,
        rank,
        menu,
        portraits: summarized,
        sources,
        errors,
      });
      if (viewport.width === 1280) portraits.push(...items);
      await page.close();
    }
  }
  for (let index = 0; index < 9; index++) {
    const hashes = reports
      .filter((r) => r.viewport.width === 1280)
      .map((r) => r.portraits[index].sha256);
    assert.equal(new Set(hashes).size, 3, `Actor ${index}: ranks must use genuinely different art`);
  }
  const sheet = await browser.newPage({ viewport: { width: 1260, height: 1080 } });
  // A QA contact sheet, not a game asset or image transformation.
  const markup =
    '<!doctype html><meta charset="utf-8"><title>Rank portrait quality</title><style>body{margin:0;background:#142c27;color:#eee;font:16px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr)}figure{margin:0;padding:10px;border:1px solid #426053;text-align:center}img{height:300px;width:380px;object-fit:contain}figcaption{padding:8px}</style><main>' +
    Array.from({ length: 9 }, (_, index) =>
      portraits
        .filter((p) => p.index === index)
        .map(
          (p) =>
            `<figure><img src="${p.image}"><figcaption>${index} · ${p.rank} · ${p.width}×${p.height}</figcaption></figure>`,
        )
        .join(''),
    ).join('') +
    '</main>';
  await writeFile(`${directory}/portraits.html`, markup);
  await sheet.setContent(markup);
  await sheet
    .locator('img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await sheet.screenshot({ path: `${directory}/portraits.png`, fullPage: true });
  await sheet.close();
  await writeFile(`${directory}/report.json`, JSON.stringify({ pass: true, reports }, null, 2));
  console.log(
    JSON.stringify({
      pass: true,
      fixtures: reports.length,
      uniquePortraits: portraits.length,
      nativeHeightRange: [
        Math.min(...portraits.map((p) => p.height)),
        Math.max(...portraits.map((p) => p.height)),
      ],
    }),
  );
} finally {
  await browser.close();
}
