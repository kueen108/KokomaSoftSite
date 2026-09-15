/* global window, document, localStorage, console, Storage */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
const output = 'artifacts/runtime';
await mkdir(output, { recursive: true });
const errors = [],
  reports = [];
const url =
  process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173';
async function openPage(mobile = false) {
  const p = await browser.newPage({
    viewport: mobile ? { width: 844, height: 390 } : { width: 1280, height: 720 },
    hasTouch: mobile,
    locale: 'ko-KR',
  });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(url);
  await p.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  return p;
}
try {
  // Exercise actual settings and reload before reading battle multipliers.
  for (const [difficulty, hp, damage, reward] of [
    ['story', 0.85, 0.75, 0.8],
    ['normal', 1, 1, 1],
    ['veteran', 1.15, 1.25, 1.2],
  ]) {
    const p = await openPage();
    await p.locator('#play').click();
    await p.locator('#mode-0').click();
    await p.locator(`#difficulty-${difficulty}`).click();
    assert.equal(await p.locator(`#difficulty-${difficulty}`).getAttribute('aria-pressed'), 'true');
    if (difficulty === 'normal') await p.screenshot({ path: `${output}/polish-map.png` });
    await p.reload();
    await p.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
    await p.locator('#sound').click();
    await p.locator('#effects').click();
    assert.match(await p.locator('#effects').innerText(), /간결/);
    await p.screenshot({ path: `${output}/polish-settings.png` });
    await p.locator('#close-sound').click();
    await p.locator('#play').click();
    await p.locator('#mode-2').click();
    await p.waitForFunction(
      () => window.__game?.scene.isActive('Battle') && window.__game.scene.getScene('Battle').boss,
    );
    if (await p.locator('#paused').isVisible()) await p.locator('#resume').click();
    const actual = await p.evaluate(() => {
      const g = window.__game,
        s = g.scene.getScene('Battle');
      g.loop.stop();
      s.spawnGroup({ enemyKind: 'grunt', count: 1 });
      const e = s.enemies.getChildren()[0];
      const before = s.paladog.getHealth().current;
      s.boss.x = s.paladog.x;
      s.boss.setAuraWeakened(false);
      s.bossPulseRemaining = 1;
      s.tickBossPulse(2);
      const pulse = before - s.paladog.getHealth().current;
      s.fx.baseHit();
      s.fx.phaseFlash();
      s.fx.hit(e, 'enemy', 4);
      s.syncHud?.();
      return {
        difficulty: s.experience.difficulty,
        effects: s.experience.effects,
        enemyHp: e.getHealth().max,
        enemyAttack: e.baseStats.attackDamage,
        bossHp: s.boss.getHealth().max,
        phaseAttack: s.boss.activePhase().stats.attackDamage,
        pulse,
        flashes: s.children.list.filter((o) => o.name === 'fx-flash').length,
        shake: s.fx.world.shakeEffect.isRunning,
        flash: s.fx.world.flashEffect.isRunning,
        settlement: s.settleBattle('victory'),
      };
    });
    assert.equal(actual.difficulty, difficulty);
    assert.equal(actual.effects, 'light');
    assert.equal(actual.bossHp, Math.round(1400 * hp));
    assert.equal(actual.phaseAttack, Math.round(15 * damage));
    assert.equal(actual.pulse, Math.round(26 * damage));
    assert.equal(actual.flashes, 0);
    assert.equal(actual.shake, false);
    assert.equal(actual.flash, false);
    assert.equal(actual.settlement, Math.round(120 * reward));
    reports.push(actual);
    await p.close();
  }
  assert.ok(reports[0].enemyHp < reports[1].enemyHp && reports[1].enemyHp < reports[2].enemyHp);
  assert.ok(
    reports[0].enemyAttack < reports[1].enemyAttack &&
      reports[1].enemyAttack < reports[2].enemyAttack,
  );
  const p = await openPage();
  await p.evaluate(async () => {
    const { defaultPersistedState } = await import('/src/systems/SaveSystem.ts');
    const state = defaultPersistedState();
    state.unlocked = [
      'tanker',
      'dealer',
      'archer',
      'guardian',
      'bannerman',
      'mage',
      'cleric',
      'lancer',
    ];
    localStorage.setItem('paladogweb:save', JSON.stringify(state));
  });
  await p.locator('#play').click();
  await p.locator('#mode-0').click();
  await p.locator('#stage-0').click();
  await p.locator('#resume').click();
  await p.locator('#help').click();
  const before = await p.evaluate(() => window.__game.scene.getScene('Battle').elapsedMs);
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__game.scene.getScene('Battle').elapsedMs), before);
  assert.match(await p.locator('.info-body').innerText(), /동료 소환/);
  await p.screenshot({ path: `${output}/polish-help.png` });
  await p.locator('.info-close').click();
  const caps = await p.evaluate(async () => {
    const g = window.__game,
      s = g.scene.getScene('Battle');
    g.loop.stop();
    const { initialBattleEconomy } = await import('/src/systems/EconomySystem.ts');
    s.economy = initialBattleEconomy(999, 12);
    s.enemies.clear(true, true);
    s.allyUnits.clear(true, true);
    for (const type of ['cleric', 'mage', 'tanker', 'dealer', 'archer', 'guardian'])
      s.pendingSummons.add(type);
    s.handleSummonInput();
    const units = s.allyUnits.getChildren();
    s.paladog.x = 300;
    for (const u of units) {
      u.x = 1000;
      u.takeDamage(u.getHealth().max / 2);
    }
    const health = units.map((u) => u.getHealth().current);
    s.tickSupport(0);
    const healed = units.map((u, i) => u.getHealth().current - health[i]);
    s.spawnGroup({ enemyKind: 'brute', count: 7 });
    const enemies = s.enemies.getChildren();
    for (let i = 0; i < enemies.length; i++) enemies[i].x = 1200 + i * 8;
    const mage = units.find((u) => u.unitType === 'mage');
    mage.engage(enemies[0]);
    s.fireAllyProjectile(mage, 10);
    const shot = s.projectiles.getChildren().at(-1),
      hp = enemies.map((e) => e.getHealth().current);
    s.impactProjectile(shot, enemies[0], false);
    const damaged = enemies.map((e, i) => hp[i] - e.getHealth().current);
    // Actual scene queue: followers pause without changing any positions.
    const lanes = [0, 0, 1];
    for (let i = 0; i < 3; i++) {
      enemies[i].x = 1000 + i * 20;
      enemies[i].setData('formationLane', lanes[i]);
      enemies[i].setVelocityX(-50);
    }
    for (let i = 3; i < enemies.length; i++) enemies[i].x = 1500 + i * 60;
    s.arrangeFormation();
    const queue = enemies.slice(0, 3).map((u) => ({ x: u.x, v: u.body.velocity.x }));
    enemies[0].x -= 100;
    enemies[1].setVelocityX(-50);
    s.arrangeFormation();
    const released = enemies[1].body.velocity.x;
    const { STAGE_4 } = await import('/src/data/stages/stage-4.ts');
    s.stage = STAGE_4;
    s.elapsedMs = 75000;
    s.defeatedEnemies = 11;
    s.checkOutcome();
    const holdBefore = s.battleOver;
    s.applyStrikeDamage(enemies[6], 999);
    s.checkOutcome();
    return {
      healed,
      damaged,
      queue,
      released,
      holdBefore,
      holdAfter: s.battleOver,
      counted: s.defeatedEnemies,
    };
  });
  assert.equal(caps.healed.filter((n) => n > 0).length, 3);
  assert.ok(caps.healed.every((n) => n === 0 || n === 8));
  assert.equal(caps.damaged.filter((n) => n > 0).length, 4);
  assert.equal(caps.queue[1].v, 0);
  assert.equal(caps.queue[2].v, -50);
  assert.equal(caps.released, -50);
  assert.equal(caps.holdBefore, false);
  assert.equal(caps.holdAfter, true);
  assert.equal(caps.counted, 12);
  await p.close();
  const refused = await openPage();
  await refused.locator('#play').click();
  await refused.locator('#mode-0').click();
  await refused.locator('#stage-0').click();
  await refused.locator('#resume').click();
  await refused.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'paladogweb:save') throw Error('quota fixture');
      write.call(this, key, value);
    };
    const s = window.__game.scene.getScene('Battle');
    s.paladog.takeDamage(9999);
    s.checkOutcome();
  });
  await refused.waitForFunction(() => window.__game.scene.isActive('Result'));
  assert.match(await refused.locator('.save-warning').innerText(), /저장/);
  await refused.locator('#result-info').click();
  assert.match(await refused.locator('.info-body').innerText(), /루미가 쓰러졌습니다/);
  await refused.close();
  const mobile = await openPage(true);
  await mobile.locator('#play').tap();
  await mobile.locator('#mode-0').tap();
  await mobile.locator('#stage-0').tap();
  await mobile.locator('#resume').tap();
  const controls = await mobile.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    return {
      buttons: [...document.querySelectorAll('.summon-card,#left,#right,#fire,#nova,#help')].map(
        (e) => {
          const r = e.getBoundingClientRect();
          return { id: e.id, x: r.x, y: r.y, w: r.width, h: r.height };
        },
      ),
      paused: s.paused,
    };
  });
  assert.equal(controls.paused, false);
  assert.ok(
    controls.buttons.every((r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= 844.5 && r.y + r.h <= 390.5),
  );
  await mobile.locator('#summon-tanker').tap();
  const cdp = await mobile.context().newCDPSession(mobile);
  const right = await mobile.locator('#right').boundingBox(),
    fire = await mobile.locator('#fire').boundingBox();
  const start = await mobile.evaluate(() => window.__game.scene.getScene('Battle').paladog.x);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: right.x + right.width / 2, y: right.y + right.height / 2, id: 1 },
      { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2, id: 2 },
    ],
  });
  await mobile.waitForTimeout(700);
  const held = await mobile.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    return {
      right: s.controls.right,
      fire: s.controls.fire,
      x: s.paladog.x,
      mana: s.attackState.mana,
    };
  });
  assert.equal(held.right, true);
  assert.equal(held.fire, true);
  assert.ok(held.x > start + 80);
  assert.ok(held.mana < 100);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.deepEqual(
    await mobile.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      return [s.controls.right, s.controls.fire];
    }),
    [false, false],
  );
  await mobile.screenshot({ path: `${output}/polish-mobile.png` });
  await mobile.close();
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/polish-features.json`,
    JSON.stringify({ pass: true, reports, caps, controls, held, errors }, null, 2),
  );
  console.log(
    'PASS: difficulty persistence + boss/enemy/pulse/rewards, reduced FX, paused help, splash/heal caps, queue release, real CDP multitouch and viewport',
  );
} finally {
  await browser.close();
}
