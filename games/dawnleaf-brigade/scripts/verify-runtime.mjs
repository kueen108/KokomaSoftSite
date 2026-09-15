/* global window, document, localStorage, fetch, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

// Runs an isolated browser and fixed-step Phaser simulation. It never uses the
// player's browser profile or save. Screenshots are review artifacts, not assertions.
const url =
  process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5179';
const output = 'artifacts/runtime';
await mkdir(output, { recursive: true });
const server =
  process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL
    ? null
    : spawn(
        process.execPath,
        ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'],
        { stdio: 'pipe' },
      );
let browser;
const reports = [];
await writeFile(`${output}/report.json`, JSON.stringify({ status: 'running', reports }));
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* server starting */
    }
    await delay(100);
  }
  assert.ok(ready, 'Vite test server must start');
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : process.platform === 'darwin'
        ? { channel: 'chrome' }
        : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  await page.screenshot({ path: `${output}/menu.png` });
  const click = async (id) => page.evaluate((id) => document.getElementById(id).click(), id);
  const scene = async (name) =>
    page.waitForFunction((name) => window.__game.scene.isActive(name), name);
  await click('play');
  await scene('ModeSelect');
  await page.screenshot({ path: `${output}/modes.png` });
  await click('mode-0');
  await scene('StageSelect');
  await click('stage-2');
  assert.equal(
    await page.evaluate(() => window.__game.scene.isActive('StageSelect')),
    true,
    'locked stage does not launch',
  );
  await page.screenshot({ path: `${output}/stages.png` });
  await page.locator('.info-close').click();
  await click('stage-0');
  await scene('Battle');
  assert.equal(
    await page.evaluate(() => window.__game.scene.getScene('Battle').paused),
    true,
    'first battle waits for tutorial',
  );
  await click('resume');
  await click('summon-tanker');
  await delay(100);
  assert.equal(
    await page.evaluate(() => window.__game.scene.getScene('Battle').allyUnits.countActive()),
    1,
    'summon card calls combat system',
  );
  const repeatedContact = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    const unit = s.allyUnits.getChildren()[0];
    unit.engage(s.enemyBase);
    unit.tick(700);
    unit.engage(s.enemyBase);
    const damage = unit.tick(700);
    unit.startAdvance();
    return damage;
  });
  assert.ok(
    repeatedContact > 0,
    'repeated contact with the same base must not reset the attack timer',
  );
  await click('pause');
  const paused = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    return {
      time: s.elapsedMs,
      gold: s.economy.gold,
      units: s.allyUnits.getChildren().map((u) => u.x),
    };
  });
  await delay(250);
  assert.deepEqual(
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      return {
        time: s.elapsedMs,
        gold: s.economy.gold,
        units: s.allyUnits.getChildren().map((u) => u.x),
      };
    }),
    paused,
    'pause freezes simulation and physics',
  );
  await click('resume');
  const nova = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    s.attackState = { ...s.attackState, mana: 100 };
    s.spawnGroup({ enemyKind: 'brute', count: 1 });
    const enemy = s.enemies.getChildren()[0];
    enemy.x = s.paladog.x - 80;
    const before = enemy.getHealth().current;
    s.castNova();
    const once = {
      hp: enemy.getHealth().current,
      mana: s.attackState.mana,
      cooldown: s.novaCooldown,
    };
    s.castNova();
    return {
      before,
      once,
      twice: { hp: enemy.getHealth().current, mana: s.attackState.mana, cooldown: s.novaCooldown },
    };
  });
  assert.equal(nova.before - nova.once.hp, 55, 'nova hits behind hero');
  assert.equal(nova.once.mana, 60);
  assert.deepEqual(nova.once, nova.twice, 'nova cannot bypass cooldown');
  const offscreen = await page.evaluate(async () => {
    const { ENEMY_SPAWN_X } = await import('/src/config/gameConfig.ts');
    const s = window.__game.scene.getScene('Battle');
    s.spawnGroup({ enemyKind: 'skirmisher', count: 3 });
    const enemy = s.enemies.getChildren().at(-1);
    const ally = s.allyUnits.getChildren()[0];
    ally.x = enemy.x - 100;
    s.tickEnemies(16);
    return {
      x: enemy.x,
      entry: ENEMY_SPAWN_X,
      velocity: enemy.body.velocity.x,
      engaged: enemy.isEngaged(),
    };
  });
  assert.ok(
    offscreen.x > offscreen.entry && offscreen.velocity < 0 && !offscreen.engaged,
    'ranged reinforcements enter the lane before attacking',
  );
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    s.enemies.clear(true, true);
    s.allyUnits.clear(true, true);
    s.elapsedMs = s.stage.waves.at(-1).spawnAtMs + 100;
    s.prevElapsedMs = s.elapsedMs;
    s.paladog.x = s.enemyBase.x - 150;
    s.attackState = { ...s.attackState, mana: 100, cooldownRemainingMs: 0 };
    s.controls.fire = true;
  });
  await page.waitForFunction(
    () => {
      const hp = window.__game.scene.getScene('Battle').enemyBase.getHealth();
      return hp.current < hp.max;
    },
    {},
    { timeout: 3000 },
  );

  await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    s.setPaused(true);
    s.scene.start('MainMenu');
  });
  await scene('MainMenu');
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('paladogweb:save') || 'null');
    if (save) throw Error('abandoning a battle must not settle rewards');
  });
  await page.evaluate(async () => {
    const { defaultPersistedState, saveState } = await import('/src/systems/SaveSystem.ts');
    saveState(localStorage, { ...defaultPersistedState(), settlementGold: 500 });
  });
  await click('upgrade');
  await scene('Upgrade');
  await click('purchase');
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('paladogweb:save')).upgradeLevels.tanker,
    ),
    1,
  );
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem('paladogweb:save')).settlementGold),
    440,
  );
  await page.screenshot({ path: `${output}/upgrade.png` });
  await click('back');
  await scene('MainMenu');
  await click('play');
  await scene('ModeSelect');
  await click('mode-0');
  await scene('StageSelect');
  await click('stage-0');
  await scene('Battle');
  const retry = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    return {
      gold: s.economy.gold,
      mana: s.attackState.mana,
      army: s.allyUnits.countActive(),
      hp: s.battleBaseStats.tanker.maxHp,
      overlays: document.querySelectorAll('.game-interface').length,
    };
  });
  assert.ok(retry.gold >= 100 && retry.gold < 102);
  assert.equal(retry.mana, 100);
  assert.equal(retry.army, 0);
  assert.equal(retry.hp, 108);
  assert.equal(retry.overlays, 1);
  await page.setViewportSize({ width: 844, height: 390 });
  await delay(100);
  const bounds = await page.evaluate(() => {
    const a = document.querySelector('.game-interface').getBoundingClientRect(),
      b = document.querySelector('canvas').getBoundingClientRect();
    return [a.x - b.x, a.y - b.y, a.width - b.width, a.height - b.height];
  });
  assert.ok(
    bounds.every((n) => Math.abs(n) < 1),
    'mobile landscape overlay matches canvas',
  );
  await page.screenshot({ path: `${output}/mobile-landscape.png` });
  assert.deepEqual(errors, []);
  reports.push({
    name: 'navigation, onboarding, economy, nova, pause, upgrade, retry, responsive layout',
    pass: true,
  });
  await page.close();

  for (const scenario of process.env.PALADOG_SCENARIO
    ? [process.env.PALADOG_SCENARIO]
    : ['stage-1', 'stage-2', 'stage-3', 'boss', 'survival', 'idle']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
    const result = await page.evaluate(async (scenario) => {
      const { CAMPAIGN_STAGES } = await import('/src/data/stages/index.ts');
      const { GRAVE_WARDEN } = await import('/src/data/bosses/grave-warden.ts');
      const { LANE_RIGHT_BOUND, ENEMY_BASE_X } = await import('/src/config/gameConfig.ts');
      const g = window.__game;
      g.registry.set('tutorialSeen', true);
      g.loop.stop();
      const launch =
        scenario === 'boss'
          ? { mode: 'boss', bossDefinition: GRAVE_WARDEN }
          : scenario === 'survival'
            ? { mode: 'survival' }
            : { stage: CAMPAIGN_STAGES.find((s) => s.id === scenario) || CAMPAIGN_STAGES[0] };
      g.scene.getScene('MainMenu').scene.start('Battle', launch);
      g.headlessStep(0, 1000 / 60);
      const s = g.scene.getScene('Battle');
      s.setPaused(false);
      let peak = 0,
        summons = 0,
        casts = 0,
        time = 1000 / 60;
      for (let frame = 0; frame < 36000 && !s.battleOver; frame++) {
        const enemies = s.enemies.getChildren().filter((e) => e.active);
        if (s.boss) enemies.push(s.boss);
        if (scenario !== 'idle') {
          const nearest = enemies.sort((a, b) => a.x - b.x)[0];
          const front = s.allyUnits
            .getChildren()
            .filter((u) => u.active)
            .reduce((x, u) => Math.max(x, u.x), 260);
          const spacing = s.paladog.getHealth().current < 100 ? 400 : 200;
          const goal = nearest
            ? Math.max(140, Math.min(LANE_RIGHT_BOUND - 40, nearest.x - spacing, front - 60))
            : Math.min(ENEMY_BASE_X - 160, 300 + s.elapsedMs / 20);
          s.controls.left = s.paladog.x > goal + 10;
          s.controls.right = s.paladog.x < goal - 10;
          const reserve =
            enemies.filter((e) => Math.abs(e.x - s.paladog.x) <= 300).length >= 3 ||
            s.bossPulseRemaining > 0;
          s.controls.fire = !!nearest || !s.enemyBase?.shielded;
          if (reserve && s.novaCooldown <= 0) {
            if (s.attackState.mana >= 40) {
              s.castNova();
              casts++;
            } else s.controls.fire = false;
          }
          if (frame % 20 === 0) {
            const counts = { tanker: 0, dealer: 0, archer: 0 };
            for (const u of s.allyUnits.getChildren())
              if (u.unitType in counts) counts[u.unitType]++;
            const desired = counts.tanker < 2 ? 'tanker' : counts.archer < 3 ? 'archer' : 'dealer';
            if (s.summonSlots().find((slot) => slot.definition.type === desired).summonable) {
              s.controls.summon(desired);
              summons++;
            }
          }
        }
        g.headlessStep(time, 1000 / 60);
        time += 1000 / 60;
        peak = Math.max(peak, s.enemies.countActive());
      }
      return {
        scenario,
        diagnostics: s.battleOver
          ? undefined
          : {
              hero: s.paladog.x,
              mana: s.attackState.mana,
              enemies: s.enemies.getChildren().map((e) => ({
                kind: e.enemyKind,
                x: e.x,
                hp: e.getHealth().current,
                vx: e.body?.velocity.x,
                target: e.currentUnitTarget()?.active,
                targetX: e.currentUnitTarget()?.x,
              })),
              allies: s.allyUnits.getChildren().map((e) => ({
                kind: e.unitType,
                x: e.x,
                hp: e.getHealth().current,
                vx: e.body?.velocity.x,
                target: e.currentTarget()?.active,
                targetX: e.currentTarget()?.x,
              })),
            },
        seconds: Math.round(s.elapsedMs / 1000),
        over: s.battleOver,
        base: s.allyBase.getHealth().current,
        heroHp: s.paladog.getHealth().current,
        target: s.boss?.getHealth().current ?? s.enemyBase?.getHealth().current ?? null,
        allies: s.allyUnits.countActive(),
        enemies: s.enemies.countActive(),
        leftmost: s.enemies.getChildren().reduce((x, e) => Math.min(x, e.x), Infinity),
        peak,
        summons,
        casts,
        wave: s.survivalWaveIndex,
        save: JSON.parse(localStorage.getItem('paladogweb:save') || 'null'),
      };
    }, scenario);
    console.log(
      `${scenario}: ${result.seconds}s, peak ${result.peak} enemies, ${result.summons} summons`,
    );
    if (!result.over) console.log(JSON.stringify(result.diagnostics));
    assert.equal(result.over, true, `${scenario} must reach an outcome`);
    if (scenario === 'idle' || scenario === 'survival') {
      assert.ok(
        result.base === 0 || result.heroHp === 0,
        'base or hero death ends a losing battle',
      );
      assert.equal(result.save.settlementGold, 40);
      if (scenario === 'survival') assert.equal(result.save.survivalBestWave, result.wave);
      if (scenario === 'survival')
        assert.ok(result.peak <= 96, 'survival remains within the active enemy budget');
    } else {
      assert.equal(result.target, 0);
      assert.equal(result.save.settlementGold, 120);
      if (scenario === 'boss') assert.ok(result.save.bossesCleared.includes('grave-warden'));
      else assert.ok(result.save.clearedStages.includes(scenario));
    }
    // Resume the real clock to verify the actual finish transition and render its result.
    await page.evaluate(() => window.__game.loop.start(window.__game.step.bind(window.__game)));
    await page.waitForFunction(() => window.__game.scene.isActive('Result'));
    assert.equal(await page.evaluate(() => document.querySelectorAll('.game-interface').length), 1);
    await page.screenshot({ path: `${output}/${scenario}-result.png` });
    assert.deepEqual(errors, []);
    reports.push({ ...result, pass: true });
    await page.close();
  }
  await writeFile(
    `${output}/report.json`,
    JSON.stringify({ createdAt: new Date().toISOString(), reports }, null, 2),
  );
  console.log(`PASS: ${reports.length} runtime checks. Evidence: ${output}/report.json`);
} catch (error) {
  await writeFile(
    `${output}/report.json`,
    JSON.stringify({ status: 'failed', error: String(error), reports }, null, 2),
  );
  throw error;
} finally {
  await browser?.close();
  server?.kill();
}
