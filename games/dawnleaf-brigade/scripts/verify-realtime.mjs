/* global window, localStorage, console */
import { chromium } from 'playwright';
import process from 'node:process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const prior = JSON.parse(await fs.readFile('artifacts/runtime/expedition-campaign.json', 'utf8'));
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
  );
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  await page.evaluate(
    (save) => localStorage.setItem('paladogweb:save', JSON.stringify(save)),
    prior.save,
  );
  await page.locator('#play').click();
  await page.locator('#mode-0').click();
  await page.locator('#region-3').click();
  await page.locator('#stage-11').click();
  await page.locator('#resume').click();
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    let ticks = 0;
    window.__qaSamples = [];
    s.events.on('preupdate', () => {
      if (s.paused || s.battleOver) return;
      if (ticks % 60 === 0 && s.elapsedMs > 10000)
        window.__qaSamples.push({
          fps: window.__game.loop.actualFps,
          objects: s.children.length,
          enemies: s.enemies.countActive(),
          elapsed: s.elapsedMs,
        });
      const enemies = s.enemies
          .getChildren()
          .filter((e) => e.active)
          .sort((a, b) => a.x - b.x),
        near = enemies[0],
        allies = s.allyUnits.getChildren().filter((u) => u.active),
        front = allies.reduce((x, u) => Math.max(x, u.x), 260),
        spacing = s.paladog.getHealth().current < 100 ? 400 : 200,
        goal = near
          ? Math.max(140, Math.min(3600, near.x - spacing, front - 60))
          : Math.min(3540, 300 + s.elapsedMs / 20);
      s.controls.left = s.paladog.x > goal + 10;
      s.controls.right = s.paladog.x < goal - 10;
      s.controls.fire = !!near || !s.enemyBase.shielded;
      if (
        enemies.filter((e) => Math.abs(e.x - s.paladog.x) <= 300).length >= 3 &&
        s.novaCooldown <= 0
      ) {
        if (s.attackState.mana >= 40) s.castNova();
        else s.controls.fire = false;
      }
      if (ticks++ % 20 === 0) {
        const counts = Object.fromEntries(
          ['tanker', 'mage', 'cleric', 'archer', 'lancer'].map((t) => [
            t,
            allies.filter((u) => u.unitType === t).length,
          ]),
        );
        const type =
          counts.tanker < 2
            ? 'tanker'
            : counts.cleric < 1
              ? 'cleric'
              : counts.mage < 3
                ? 'mage'
                : counts.archer < 3
                  ? 'archer'
                  : counts.lancer < 2
                    ? 'lancer'
                    : 'dealer';
        if (s.summonSlots().find((q) => q.definition.type === type).summonable)
          s.controls.summon(type);
      }
    });
  });
  await page.waitForFunction(
    () => window.__game.scene.getScene('Battle').elapsedMs > 60000,
    {},
    { timeout: 180000 },
  );
  await page.screenshot({ path: 'artifacts/runtime/expedition-realtime.png' });
  const performance = await page.evaluate(() => ({
    elapsed: window.__game.scene.getScene('Battle').elapsedMs,
    objects: window.__game.scene.getScene('Battle').children.length,
    fps: window.__game.loop.actualFps,
  }));
  console.log('CAPTURE', performance);
  await page.waitForFunction(() => window.__game.scene.isActive('Result'), {}, { timeout: 180000 });
  const result = await page.evaluate(() => window.__game.scene.getScene('Result').result);
  const samples = await page.evaluate(() => window.__qaSamples);
  const fps = {
    mean: samples.reduce((sum, v) => sum + v.fps, 0) / samples.length,
    min: Math.min(...samples.map((v) => v.fps)),
    samples: samples.length,
    peakObjects: Math.max(...samples.map((v) => v.objects)),
    peakEnemies: Math.max(...samples.map((v) => v.enemies)),
  };
  assert.equal(result.outcome, 'victory');
  assert.equal(result.settlement, 240);
  assert.deepEqual(errors, []);
  await fs.writeFile(
    'artifacts/runtime/expedition-realtime.json',
    JSON.stringify(
      {
        pass: true,
        outcome: result.outcome,
        settlement: result.settlement,
        performance,
        fps,
        elapsedMs: result.elapsedMs,
        errors,
      },
      null,
      2,
    ),
  );
  console.log('PASS: realtime stage 12 victory');
} finally {
  await browser.close();
}
