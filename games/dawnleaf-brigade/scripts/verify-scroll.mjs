/* global window, document, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : process.platform === 'darwin'
      ? { channel: 'chrome' }
      : {}),
});
const output = 'artifacts/runtime';
await mkdir(output, { recursive: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
  );
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  await page.locator('#play').click();
  await page.locator('#mode-0').click();
  await page.locator('#stage-0').click();
  await page.locator('#resume').click();
  const snapshot = () =>
    page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle'),
        c = s.cameras.main;
      const inView = (x) => x >= c.scrollX && x <= c.scrollX + c.width;
      const r = document.querySelector('.battle-top').getBoundingClientRect();
      return {
        hero: s.paladog.x,
        scroll: c.scrollX,
        viewWidth: c.width,
        worldWidth: s.physics.world.bounds.width,
        allyX: s.allyBase.x,
        enemyX: s.enemyBase.x,
        allyVisible: inView(s.allyBase.x),
        enemyVisible: inView(s.enemyBase.x),
        hud: [r.x, r.y, r.width, r.height],
      };
    });
  const start = await snapshot();
  assert.equal(start.worldWidth, 3840);
  assert.equal(start.allyVisible, true);
  assert.equal(start.enemyVisible, false);
  assert.ok(start.enemyX - start.allyX > start.viewWidth * 2);
  await page.screenshot({ path: `${output}/scroll-home.png` });
  await page.locator('#summon-tanker').click();
  await page.keyboard.down('ArrowRight');
  const frames = await page.evaluate(async () => {
    const s = window.__game.scene.getScene('Battle');
    const hero = new Set(),
      bear = new Set();
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => window.setTimeout(r, 60));
      hero.add(s.paladog.frame.name);
      const u = s.allyUnits.getChildren()[0];
      if (u) bear.add(u.frame.name);
    }
    return { hero: [...hero], bear: [...bear] };
  });
  assert.equal(frames.hero.length, 8, 'mounted hero cycles through eight drawn frames');
  assert.equal(frames.bear.length, 6, 'marching bear cycles through six drawn frames');
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').paladog.x > 1800);
  await page.keyboard.up('ArrowRight');
  await delay(300);
  const middle = await snapshot();
  assert.ok(middle.scroll > 1000);
  assert.equal(middle.allyVisible, false);
  assert.equal(middle.enemyVisible, false);
  assert.deepEqual(middle.hud, start.hud);
  await page.screenshot({ path: `${output}/scroll-middle.png` });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => window.__game.scene.getScene('Battle').paladog.x >= 3639,
    {},
    { timeout: 20000 },
  );
  await page.keyboard.up('ArrowRight');
  await delay(600);
  const end = await snapshot();
  assert.equal(end.enemyVisible, true);
  assert.equal(end.allyVisible, false);
  assert.ok(Math.abs(end.scroll - 2560) < 2);
  assert.deepEqual(end.hud, start.hud);
  await page.screenshot({ path: `${output}/scroll-enemy.png` });
  await page.locator('#pause').click();
  const paused = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    return {
      x: s.paladog.x,
      frame: s.paladog.frame.name,
      scroll: s.cameras.main.scrollX,
      time: s.elapsedMs,
    };
  });
  await delay(300);
  assert.deepEqual(
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      return {
        x: s.paladog.x,
        frame: s.paladog.frame.name,
        scroll: s.cameras.main.scrollX,
        time: s.elapsedMs,
      };
    }),
    paused,
  );
  await page.locator('#resume').click();
  const sheets = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    return s.textures
      .getTextureKeys()
      .filter((k) => k.endsWith('-locomotion'))
      .map((k) => {
        const t = s.textures.get(k),
          ctx = t.getSourceImage().getContext('2d');
        return {
          key: k,
          frames: t.getFrameNames().length,
          hashes: t.getFrameNames().map((n) => {
            const f = t.get(n);
            const p = ctx.getImageData(f.cutX, f.cutY, f.cutWidth, f.cutHeight).data;
            let hash = 2166136261;
            for (const v of p) hash = Math.imul(hash ^ v, 16777619);
            return hash;
          }),
          transparent: ctx.getImageData(0, 0, 1, 1).data[3] === 0,
        };
      });
  });
  assert.equal(
    sheets.length,
    18,
    'hero, eight companions, eight enemies and boss all have movement sheets',
  );
  for (const s of sheets) {
    assert.equal(s.frames, s.key.startsWith('tex-paladog-') ? 8 : 6);
    assert.equal(new Set(s.hashes).size, s.frames, `${s.key} has genuinely distinct image frames`);
    assert.equal(s.transparent, true);
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await delay(200);
  const mobileStart = await snapshot();
  const right = page.locator('#left');
  const rect = await right.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await delay(600);
  await page.mouse.up();
  assert.equal(
    await page.evaluate(() => window.__game.scene.getScene('Battle').controls.left),
    false,
    'pointer release clears held control',
  );
  const mobileEnd = await snapshot();
  assert.ok(mobileEnd.hero < mobileStart.hero - 80, 'held mobile movement changes world position');
  assert.equal(
    await page.evaluate(() => window.__game.scene.getScene('Battle').paladog.flipX),
    true,
  );
  await page.screenshot({ path: `${output}/scroll-mobile.png` });
  const actors = await page.evaluate(async () => {
    const s = window.__game.scene.getScene('Battle');
    const { Boss } = await import('/src/entities/Boss.ts');
    const { GRAVE_WARDEN } = await import('/src/data/bosses/grave-warden.ts');
    // Keep the now-vulnerable hero away from this isolated walking-pose fixture.
    s.paladog.body.reset(1200, 470);
    const types = [
      'tanker',
      'dealer',
      'archer',
      'guardian',
      'bannerman',
      'mage',
      'cleric',
      'lancer',
    ];
    s.allyUnits.clear(true, true);
    s.enemies.clear(true, true);
    s.persisted.unlocked = types;
    s.economy = {
      ...s.economy,
      gold: 999,
      liveUnitCount: 0,
      cooldownRemainingMs: Object.fromEntries(types.map((t) => [t, 0])),
    };
    for (const type of types) s.pendingSummons.add(type);
    s.handleSummonInput();
    for (const enemyKind of [
      'grunt',
      'brute',
      'skirmisher',
      'juggernaut',
      'overseer',
      'bomber',
      'wraith',
      'sentinel',
    ])
      s.spawnGroup({ enemyKind, count: 1 });
    s.boss = new Boss(s, 3000, 470, GRAVE_WARDEN);
    s.fx.toWorld(s.boss);
    s.boss.startAdvance();
    const units = [...s.allyUnits.getChildren(), ...s.enemies.getChildren(), s.boss];
    const sets = units.map(() => new Set());
    const bodies = units.map((u) => [u.body.width, u.body.height]);
    for (let i = 0; i < 70; i++) {
      await new Promise((r) => window.setTimeout(r, 60));
      units.forEach((u, i) => sets[i].add(u.frame.name));
    }
    return units.map((u, i) => ({
      name: u.unitType ?? u.enemyKind ?? 'boss',
      frames: [...sets[i]],
      before: bodies[i],
      after: [u.body.width, u.body.height],
    }));
  });
  assert.equal(actors.length, 17);
  for (const a of actors) {
    assert.equal(a.frames.length, 6, `${a.name} plays all six movement frames`);
    assert.deepEqual(a.after, a.before, `${a.name} keeps collision dimensions while animating`);
  }
  assert.deepEqual(errors, []);
  const report = {
    pass: true,
    start,
    middle,
    end,
    frames,
    sheets,
    actors,
    mobileStart,
    mobileEnd,
    errors,
  };
  await writeFile(`${output}/scroll-report.json`, JSON.stringify(report, null, 2));
  console.log(
    'PASS: scrolling, castle visibility, fixed HUD, 110 distinct frames, pause, mobile pointer controls',
  );
} finally {
  await browser.close();
}
