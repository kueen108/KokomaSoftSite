/* global window, performance, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import process from 'node:process';

const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(process.env.DAWNLEAF_TEST_URL || 'http://localhost:5173');
  await page.waitForSelector('#play');
  await page.click('#play');
  await page.click('#mode-0');
  await page.click('#stage-0');
  await page.locator('#resume').waitFor({ state: 'visible' });
  await page.evaluate(() => window.__game.loop.stop());
  await page.click('#resume');
  const result = await page.evaluate(() => {
    const g = window.__game,
      s = g.scene.getScene('Battle');
    s.enemies.clear(true, true);
    s.spawnGroup({ enemyKind: 'sentinel', count: 1 });
    const enemy = s.enemies.getChildren()[0];
    enemy.x = 1250;
    enemy.setVelocityX(0);
    // Hold an actual combatant still to isolate the player's movement constraint.
    enemy.body.moves = false;
    s.paladog.x = 1100;
    s.controls.right = true;
    let time = performance.now();
    for (let frame = 0; frame < 60; frame++) {
      g.headlessStep(time, 1000 / 60);
      time += 1000 / 60;
    }
    const edge = enemy.x - enemy.body.halfWidth - s.paladog.body.halfWidth - 8;
    const stopped = s.paladog.x;
    const pose = s.motion.stateOf(s.paladog);
    s.controls.right = false;
    s.controls.left = true;
    for (let frame = 0; frame < 12; frame++) {
      g.headlessStep(time, 1000 / 60);
      time += 1000 / 60;
    }
    const retreat = stopped - s.paladog.x;
    enemy.destroy();
    s.controls.left = false;
    s.controls.right = true;
    for (let frame = 0; frame < 30; frame++) {
      g.headlessStep(time, 1000 / 60);
      time += 1000 / 60;
    }
    return { stopped, edge, pose, retreat, afterClear: s.paladog.x };
  });
  console.log(result);
  assert.ok(
    Math.abs(result.stopped - result.edge) < 1,
    'Forward movement stops at the real physics body edge',
  );
  assert.equal(result.pose, 'guard');
  assert.ok(result.retreat > 45, 'Retreat remains responsive');
  assert.ok(result.afterClear > result.edge + 40, 'Defeating the blocker reopens the lane');
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/runtime/frontline.json',
    JSON.stringify({ pass: true, result, errors }, null, 2),
  );
  console.log(
    'PASS: real battle frontline blocking, braced pose, retreat and cleared-lane advance',
  );
} finally {
  await browser.close();
}
