/* global window, document, localStorage, getComputedStyle, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';
const root = 'artifacts/runtime/mobile-ux';
await mkdir(root, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
const url = process.env.DAWNLEAF_TEST_URL || 'http://localhost:5173';
const reports = [];
async function target(page, selector) {
  await page
    .locator(selector)
    .evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }));
  await page.waitForTimeout(100);
  const result = await page.locator(selector).evaluate((e) => {
    const r = e.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      width: r.width,
      height: r.height,
      x: r.x,
      y: r.y,
      onScreen:
        r.x >= 0 &&
        r.y >= 0 &&
        r.right <= window.innerWidth + 1 &&
        r.bottom <= window.innerHeight + 1,
      clickable: hit === e || e.contains(hit),
      font: parseFloat(getComputedStyle(e).fontSize),
    };
  });
  assert.ok(
    result.width >= 43.9 && result.height >= 43.9,
    `${selector}: small ${JSON.stringify(result)}`,
  );
  assert.ok(result.onScreen && result.clickable, `${selector}: covered ${JSON.stringify(result)}`);
  return result;
}
try {
  for (const [width, height, locale] of [
    [844, 390, 'ko-KR'],
    [844, 300, 'fr-FR'],
    [667, 280, 'es-ES'],
    [390, 844, 'ja-JP'],
    [360, 640, 'zh-CN'],
    [932, 430, 'en-US'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, locale });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('#play');
    const seededSave = await page.evaluate(async () => {
      const { defaultPersistedState, saveState } = await import('/src/systems/SaveSystem.ts');
      const { ALLY_UNIT_TYPES } = await import('/src/types/unit.ts');
      const s = defaultPersistedState();
      saveState(localStorage, {
        ...s,
        settlementGold: 5000,
        clearedStages: ['stage-1', 'stage-2', 'stage-3'],
        unlocked: [...ALLY_UNIT_TYPES],
      });
      return localStorage.getItem('paladogweb:save');
    });
    await page.addInitScript((save) => localStorage.setItem('paladogweb:save', save), seededSave);
    await page.reload();
    await page.waitForSelector('#play');
    assert.equal(
      await page.locator('.game-interface').evaluate((e) => getComputedStyle(e).transform),
      'none',
    );
    for (const id of ['#play', '#upgrade', '#sound', '#display-mode']) await target(page, id);
    await page.screenshot({ path: `${root}/${width}-${height}-${locale}-menu.png` });
    await page.click('#upgrade');
    await page.waitForSelector('#hero-upgrades');
    await target(page, '#hero-upgrades');
    await page.click('#hero-upgrades');
    await target(page, '#aura-upgrade');
    await page.click('#aura-upgrade');
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem('paladogweb:save')).hero.auraLevel),
      1,
    );
    await target(page, '#armor-info-renewal');
    await page.click('#armor-info-renewal');
    assert.ok(
      await page
        .locator('.info-body')
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 16),
    );
    await target(page, '.info-close');
    await page.click('.info-close');
    await page.screenshot({ path: `${root}/${width}-${height}-${locale}-workshop.png` });
    await page.click('#back');
    await page.waitForSelector('#play');
    await page.click('#play');
    await page.waitForSelector('#mode-0');
    await target(page, '#mode-0');
    await page.click('#mode-0');
    await page.waitForSelector('#region-0');
    await target(page, '#region-0');
    await page.click('#region-0');
    await page.waitForSelector('#stage-0');
    await target(page, '#stage-0');
    await page.screenshot({ path: `${root}/${width}-${height}-${locale}-stages.png` });
    await page.click('#stage-0');
    await page.waitForSelector('#resume');
    await target(page, '#resume');
    await page.click('#resume');
    for (const id of [
      '#left',
      '#right',
      '#fire',
      '#nova',
      '#pause',
      '#display-mode',
      '#mission-info',
      '#resource-info',
      '#hero-info',
    ])
      await target(page, id);
    for (const id of ['#hero-hp', '#gold', '#mana', '#cost-tanker'])
      assert.ok(
        await page.locator(id).evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 14),
        `${id} font`,
      );
    await page.screenshot({ path: `${root}/${width}-${height}-${locale}-battle.png` });
    const cdp = await page.context().newCDPSession(page);
    const shelf = await page.locator('.summon-deck').boundingBox();
    const populationBeforeSwipe = await page.locator('#population').innerText();
    const swipeX = shelf.x + shelf.width - 20;
    const swipeY = shelf.y + 10;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: swipeX, y: swipeY, id: 1 }],
    });
    for (let step = 1; step <= 6; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: swipeX - ((shelf.width - 40) * step) / 6, y: swipeY, id: 1 }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    // Let native momentum/snap finish before a later programmatic target scroll.
    await page.waitForTimeout(1200);
    assert.ok(
      await page.locator('.summon-deck').evaluate((e) => e.scrollLeft > 0),
      'touch swipe scrolls the summon shelf',
    );
    assert.equal(
      await page.locator('#population').innerText(),
      populationBeforeSwipe,
      'swipe must not summon',
    );
    for (const unit of [
      'tanker',
      'dealer',
      'archer',
      'guardian',
      'bannerman',
      'mage',
      'cleric',
      'lancer',
    ]) {
      await target(page, `#unit-info-${unit}`);
      await page.click(`#unit-info-${unit}`);
      assert.equal(await page.evaluate(() => window.__game.scene.getScene('Battle').paused), true);
      await page.click('.info-close');
    }
    const right = await page.locator('#right').boundingBox(),
      fire = await page.locator('#fire').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: right.x + right.width / 2, y: right.y + right.height / 2, id: 1 },
        { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2, id: 2 },
      ],
    });
    await page.waitForTimeout(250);
    assert.deepEqual(
      await page.evaluate(() => {
        const c = window.__game.scene.getScene('Battle').controls;
        return [c.right, c.fire];
      }),
      [true, true],
    );
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    assert.deepEqual(
      await page.evaluate(() => {
        const c = window.__game.scene.getScene('Battle').controls;
        return [c.right, c.fire];
      }),
      [false, false],
    );
    await page.click('#pause');
    await page.locator('.mobile-pause-details [data-info="controls"]').click();
    assert.doesNotMatch(await page.locator('.info-body').innerText(), /SPACE|ESC|1–8/);
    await page.click('.info-close');
    await page.locator('.mobile-pause-details [data-info="weapon"]').click();
    await page.click('.info-close');
    assert.equal(await page.evaluate(() => window.__game.scene.getScene('Battle').paused), true);
    await page.click('#resume');
    const camera = await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      const r = window.__game.canvas.getBoundingClientRect();
      return {
        view: s.cameraViewWidth,
        canvasWidth: r.width,
        hero: ((s.paladog.x - s.fx.world.scrollX) * r.width) / 1280,
      };
    });
    assert.ok(camera.hero >= 0 && camera.hero < width, JSON.stringify(camera));
    if (width < 600) assert.ok(camera.view < 700, 'Portrait needs a closer camera');
    // Rotation at the far end of the battlefield must keep the hero visible
    // and release a held gesture, rather than carrying it into the new layout.
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      s.paladog.setPosition(3200, s.paladog.y);
      s.controls.right = s.controls.fire = true;
    });
    await page.setViewportSize({ width: height, height: width });
    await page.waitForTimeout(200);
    assert.deepEqual(
      await page.evaluate(() => {
        const s = window.__game.scene.getScene('Battle');
        const rect = window.__game.canvas.getBoundingClientRect();
        const x = ((s.paladog.x - s.fx.world.scrollX) * rect.width) / 1280;
        return [s.controls.right, s.controls.fire, x >= 0 && x < window.innerWidth];
      }),
      [false, false, true],
    );
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      s.scene.start('Result', {
        outcome: 'defeat',
        launch: s.launch,
        stage: s.stage,
        settlement: 0,
        survival: null,
      });
    });
    await page.waitForSelector('#next');
    for (const id of ['#next', '#upgrade', '#menu', '#result-info']) await target(page, id);
    await page.screenshot({ path: `${root}/${width}-${height}-${locale}-result.png` });
    await page.click('#menu');
    await page.waitForSelector('#play');
    assert.deepEqual(errors, []);
    reports.push({ width, height, locale, camera, pass: true });
    console.log(reports.at(-1));
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    locale: 'en-US',
  });
  await page.goto(url);
  await page.waitForSelector('#display-mode');
  await page.click('#display-mode');
  assert.equal(
    await page.evaluate(() => document.fullscreenElement === document.documentElement),
    true,
    'real browser fullscreen request',
  );
  await page.click('#display-mode');
  assert.equal(await page.evaluate(() => document.fullscreenElement === null), true);
  await page.evaluate(() =>
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false }),
  );
  await page.click('#display-mode');
  await page.waitForSelector('.info-scrim:not([hidden])');
  assert.match(await page.locator('.info-body').innerText(), /Home Screen/);
  await page.click('.info-close');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(150);
  assert.equal(
    await page.locator('.game-interface').evaluate((e) => e.classList.contains('mobile-ui')),
    false,
  );
  await target(page, '#play');
  const manifest = await (
    await page.request.get(new URL('manifest.webmanifest', url + '/').href)
  ).json();
  assert.equal(manifest.display, 'fullscreen');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  for (const icon of manifest.icons)
    assert.equal((await page.request.get(new URL(icon.src, url + '/').href)).status(), 200);
  await page.close();
  await writeFile(
    `${root}/report.json`,
    JSON.stringify(
      {
        pass: true,
        reports,
        fullscreen: 'real Chromium enter/exit + unsupported fallback',
        physicalDevice: false,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
