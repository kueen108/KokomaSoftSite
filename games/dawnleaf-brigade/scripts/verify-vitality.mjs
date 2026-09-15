/* global window, document, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : process.platform === 'darwin'
      ? { channel: 'chrome' }
      : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: 'ko-KR' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
  );
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  await page.locator('#play').click();
  await page.locator('#mode-2').click();
  await page.locator('#resume').click();
  const report = await page.evaluate(async () => {
    const g = window.__game,
      s = g.scene.getScene('Battle');
    g.loop.stop();
    // Aura mechanics fixture; hero health growth is verified separately in verify-growth.
    s.persisted.hero = { ...s.persisted.hero, auraLevel: 5 };
    const { initialBattleEconomy } = await import('/src/systems/EconomySystem.ts');
    const hero = s.paladog,
      boss = s.boss;
    s.enemies.clear(true, true);
    s.allyUnits.clear(true, true);
    s.persisted.unlocked = ['tanker', 'dealer', 'archer', 'guardian', 'bannerman'];
    s.economy = initialBattleEconomy(999, 12);
    for (const type of s.persisted.unlocked) s.pendingSummons.add(type);
    s.handleSummonInput();
    for (const enemyKind of ['grunt', 'brute', 'skirmisher', 'juggernaut', 'overseer'])
      s.spawnGroup({ enemyKind, count: 1 });
    hero.x = 1200;
    boss.x = 1300;
    for (const u of [...s.allyUnits.getChildren(), ...s.enemies.getChildren()]) u.x = 1300;
    const sample = () => ({
      allies: s.allyUnits.getChildren().map((u) => ({
        type: u.unitType,
        stats: { ...u.stats },
        damage: u.receivedDamage(40),
        hp: u.getHealth().current,
      })),
      enemies: s.enemies.getChildren().map((u) => ({
        type: u.enemyKind,
        stats: { ...u.stats },
        damage: u.receivedDamage(40),
        hp: u.getHealth().current,
      })),
      boss: {
        damage: boss.receivedDamage(40),
        attack: boss.outgoingDamage(40),
        speed: boss.body.velocity.x,
      },
    });
    s.refreshAura();
    s.refreshEnemyAura();
    boss.refreshTarget();
    const inside = sample();
    for (let i = 0; i < 100; i++) {
      s.refreshAura();
      s.refreshEnemyAura();
    }
    const repeated = sample();
    hero.x = 900;
    s.refreshAura();
    s.refreshEnemyAura();
    boss.refreshTarget();
    const outside = sample();
    // Exact radius boundary applies, one pixel past it does not.
    hero.x = 975;
    s.refreshAura();
    s.refreshEnemyAura();
    const boundary = sample();
    hero.x = 974;
    s.refreshAura();
    s.refreshEnemyAura();
    const pastBoundary = sample();
    // Actual damage combines inherent armor with the aura, without changing max HP.
    hero.x = 1200;
    s.refreshAura();
    s.refreshEnemyAura();
    const guardian = s.allyUnits.getChildren().find((u) => u.unitType === 'guardian');
    const armored = s.enemies.getChildren().find((u) => u.enemyKind === 'juggernaut');
    const losses = [guardian, armored, boss].map((u) => {
      const before = u.getHealth().current,
        expected = u.receivedDamage(40);
      u.takeDamage(40);
      return { expected, actual: before - u.getHealth().current };
    });
    // Boss phase changes retain the debuff and restore the new phase outside the aura.
    boss.health = { current: 300, max: boss.getHealth().max };
    boss.refreshTarget();
    const phaseInside = { speed: boss.body.velocity.x, base: boss.activePhase().stats.speed };
    hero.x = 900;
    s.refreshEnemyAura();
    boss.refreshTarget();
    const phaseOutside = boss.body.velocity.x;
    hero.takeDamage(50);
    const hurt = hero.getHealth().current;
    hero.regenerate(2999);
    const delayed = hero.getHealth().current;
    hero.regenerate(501);
    const healing = hero.getHealth().current;
    hero.takeDamage(10);
    hero.regenerate(3000);
    const resetDelay = hero.getHealth().current;
    hero.regenerate(50000);
    const capped = hero.getHealth().current;
    hero.takeDamage(40);
    hero.regenerate(4000);
    const prePause = hero.getHealth().current;
    s.setPaused(true);
    for (let i = 0; i < 100; i++) s.update(i * 60, 60);
    const postPause = hero.getHealth().current;
    s.setPaused(false);
    // Use the live Phaser collision callbacks and timed attacks, not direct hero damage calls.
    s.allyUnits.clear(true, true);
    s.enemies.clear(true, true);
    s.projectiles.clear(true, true);
    s.enemyProjectiles.clear(true, true);
    let time = 100;
    const reset = () => {
      s.enemies.clear(true, true);
      s.projectiles.clear(true, true);
      s.enemyProjectiles.clear(true, true);
      hero.health = { current: 200, max: 200 };
      hero.regenDelayMs = 0;
      hero.body.reset(1200, 470);
      boss.body.reset(3000, 470);
      boss.health = { current: 1400, max: 1400 };
      boss.unitTarget = null;
      boss.engaged = false;
      boss.attackTimerMs = 0;
      s.nextBossPulseAt = Infinity;
      s.bossPulseRemaining = 0;
    };
    const step = (ms) => {
      for (let i = 0; i < Math.ceil(ms / (1000 / 60)); i++) {
        g.headlessStep(time, 1000 / 60);
        time += 1000 / 60;
      }
    };
    reset();
    s.spawnGroup({ enemyKind: 'grunt', count: 1 });
    let enemy = s.enemies.getChildren()[0];
    enemy.body.reset(1240, 470);
    step(2200);
    const melee = { hp: hero.getHealth().current, target: enemy.currentUnitTarget() === hero };
    reset();
    s.spawnGroup({ enemyKind: 'skirmisher', count: 1 });
    enemy = s.enemies.getChildren()[0];
    enemy.body.reset(1370, 470);
    step(3000);
    const ranged = {
      hp: hero.getHealth().current,
      target: enemy.currentUnitTarget() === hero,
      range: enemy.attackRange,
    };
    reset();
    boss.body.reset(1250, 470);
    step(2200);
    const bossMelee = { hp: hero.getHealth().current, target: boss.currentUnitTarget() === hero };
    reset();
    boss.body.reset(1350, 470);
    s.refreshEnemyAura();
    s.bossPulseRemaining = 50;
    s.tickBossPulse(60);
    const pulse = hero.getHealth().current;
    reset();
    boss.body.reset(1500, 470);
    s.refreshEnemyAura();
    s.bossPulseRemaining = 50;
    s.tickBossPulse(60);
    const missedPulse = hero.getHealth().current;
    hero.takeDamage(50);
    s.refreshHud();
    g.renderer.preRender();
    g.scene.render(g.renderer);
    g.renderer.postRender();
    const hud = document.getElementById('hero-hp').textContent;
    window.__vitalityStep = step;
    return {
      inside,
      repeated,
      outside,
      boundary,
      pastBoundary,
      losses,
      phaseInside,
      phaseOutside,
      regen: { hurt, delayed, healing, resetDelay, capped, prePause, postPause },
      melee,
      ranged,
      bossMelee,
      pulse,
      missedPulse,
      hud,
    };
  });
  assert.deepEqual(report.inside, report.repeated, 'auras never compound');
  assert.deepEqual(report.inside.allies, report.boundary.allies);
  assert.deepEqual(report.outside.allies, report.pastBoundary.allies);
  for (let i = 0; i < 5; i++) {
    const a = report.inside.allies[i],
      b = report.outside.allies[i];
    assert.ok(a.stats.attackDamage >= b.stats.attackDamage);
    assert.ok(a.stats.speed > b.stats.speed);
    assert.ok(a.damage < b.damage);
    const e = report.inside.enemies[i],
      f = report.outside.enemies[i];
    assert.equal(e.stats.attackDamage, Math.round(f.stats.attackDamage * 0.8));
    assert.equal(e.stats.speed, Math.round(f.stats.speed * 0.9));
    assert.ok(e.damage > f.damage);
  }
  for (const loss of report.losses) assert.equal(loss.actual, loss.expected);
  assert.ok(
    report.inside.allies.some(
      (a, i) => a.stats.attackDamage > report.outside.allies[i].stats.attackDamage,
    ),
    'High-tier aura improves attack beyond the banner despite low-stat rounding',
  );
  assert.equal(report.phaseInside.speed, -report.phaseInside.base * 0.9);
  assert.equal(report.phaseOutside, -report.phaseInside.base);
  assert.deepEqual(report.regen, {
    hurt: 150,
    delayed: 150,
    healing: 151,
    resetDelay: 141,
    capped: 200,
    prePause: 162,
    postPause: 162,
  });
  for (const kind of ['melee', 'ranged', 'bossMelee']) {
    assert.equal(report[kind].target, true, kind);
    assert.ok(report[kind].hp < 200, `${kind} damages hero`);
  }
  assert.equal(report.pulse, 179);
  assert.equal(report.missedPulse, 200);
  assert.equal(report.hud, '150');
  await mkdir('artifacts/runtime', { recursive: true });
  await page.evaluate(() => window.__game.loop.start(window.__game.step.bind(window.__game)));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/runtime/vitality-desktop.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'artifacts/runtime/vitality-mobile.png' });
  const death = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    s.paladog.takeDamage(1000);
    s.paladog.regenerate(60000);
    const hp = s.paladog.getHealth().current;
    s.checkOutcome();
    return { hp, over: s.battleOver, base: s.allyBase.getHealth().current };
  });
  assert.equal(death.hp, 0);
  assert.equal(death.over, true);
  assert.ok(death.base > 0);
  await page.evaluate(() => window.__game.loop.start(window.__game.step.bind(window.__game)));
  await page.waitForFunction(() => window.__game.scene.isActive('Result'));
  assert.ok((await page.locator('body').innerText()).includes('패배'));
  await page.locator('#next').click();
  await page.waitForFunction(() => window.__game.scene.isActive('Battle'));
  assert.equal(
    await page.evaluate(() => window.__game.scene.getScene('Battle').paladog.getHealth().current),
    320,
    'retry restores full growth-adjusted hero HP',
  );
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/runtime/vitality-report.json',
    JSON.stringify({ pass: true, ...report, death, errors }, null, 2),
  );
  console.log(
    'PASS: hero melee/ranged/boss damage, timed regeneration, pause, death, aura stats/armor/boundaries/reset, boss phases, HUD',
  );
} finally {
  await browser.close();
}
