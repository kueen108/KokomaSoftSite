/* global window, localStorage, performance, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';

const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
const url = process.env.DAWNLEAF_TEST_URL || 'http://localhost:5173';
const directory = 'artifacts/runtime/growth';
await mkdir(directory, { recursive: true });
const reports = [];
try {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 844, height: 390 },
  ]) {
    for (const level of [0, 1, 2, 3, 4, 5]) {
      const page = await browser.newPage({ viewport, locale: 'ko-KR' });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(url);
      await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
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
      await page.waitForSelector('#upgrade');
      await page.click('#upgrade');
      await page.click('#hero-upgrades');
      await page.screenshot({ path: `${directory}/${viewport.width}-level${level}-workshop.png` });
      assert.equal(
        await page.locator('.growth-preview b').first().textContent(),
        `Lv.${level + 1}`,
      );
      assert.equal(await page.locator('#aura-upgrade').isDisabled(), level === 5);
      await page.click('#back');
      await page.click('#play');
      await page.click('#mode-0');
      await page.click('#region-0');
      await page.click('#stage-0');
      await page.click('#resume');
      const initial = await page.evaluate(() => {
        const g = window.__game,
          s = g.scene.getScene('Battle');
        g.loop.stop();
        s.economy = { ...s.economy, gold: 5000 };
        for (const slot of s.summonSlots()) s.pendingSummons.add(slot.definition.type);
        s.handleSummonInput();
        s.paused = true;
        const units = [s.paladog, ...s.allyUnits.getChildren()];
        units.forEach((u, i) => {
          u.setVelocity(0, 0);
          u.x = 150 + i * 120;
          u.y = 500;
          u.setData('laneOffset', 0);
        });
        s.fx.world.scrollX = 0;
        s.motion.update(units);
        s.refreshAura();
        const body = (u) => ({
          w: u.body.width,
          h: u.body.height,
          x: u.body.offset.x - u.displayOriginX,
          y: u.body.offset.y - u.displayOriginY,
          foot: u.height - u.displayOriginY,
        });
        return {
          aura: s.auraEllipse(),
          health: s.paladog.getHealth(),
          actors: units.map((u) => ({
            name: u.unitType ?? 'hero',
            texture: u.texture.key,
            body: body(u),
          })),
        };
      });
      assert.equal(initial.actors.length, 9);
      if (level === 0) assert.equal(initial.aura, null);
      else assert.ok(initial.aura.rx > 0);
      const rank = ['novice', 'novice', 'trained', 'trained', 'elite', 'elite'][level];
      for (const actor of initial.actors) {
        if (rank !== 'elite') assert.ok(actor.texture.includes(`-${rank}`), actor.texture);
      }
      for (const motion of ['idle', 'walk', 'attack', 'hurt', 'guard']) {
        const actors = await page.evaluate((motion) => {
          const g = window.__game,
            s = g.scene.getScene('Battle'),
            units = [s.paladog, ...s.allyUnits.getChildren()];
          s.motion.advance(1000);
          units.forEach((u) => {
            u.setVelocity(0, 0);
            if (motion === 'walk') u.x += 12;
            if (motion === 'attack') s.motion.attack(u, u.x + 100);
            if (motion === 'hurt') s.motion.hurt(u);
            if (motion === 'guard') s.motion.defend(u);
          });
          s.motion.advance(120);
          s.motion.update(units);
          s.drawUnitDetails();
          g.step(performance.now(), 0);
          return units.map((u) => ({
            texture: u.texture.key,
            state: s.motion.stateOf(u),
            body: {
              w: u.body.width,
              h: u.body.height,
              x: u.body.offset.x - u.displayOriginX,
              y: u.body.offset.y - u.displayOriginY,
              foot: u.height - u.displayOriginY,
            },
          }));
        }, motion);
        for (const [i, actor] of actors.entries()) {
          assert.equal(actor.state, motion, `${initial.actors[i].name} level ${level}`);
          for (const key of Object.keys(actor.body))
            assert.ok(
              Math.abs(actor.body[key] - initial.actors[i].body[key]) < 0.001,
              `${motion}: hitbox ${key}`,
            );
          if (rank !== 'elite') assert.ok(actor.texture.includes(`-${rank}-`), actor.texture);
        }
        if ([0, 2, 5].includes(level))
          await page.screenshot({
            path: `${directory}/${viewport.width}-level${level}-${motion}.png`,
          });
      }
      const recoil = await page.evaluate(() => {
        const s = window.__game.scene.getScene('Battle');
        const units = [s.paladog, ...s.allyUnits.getChildren()];
        for (const unit of units) s.fx.hit(unit, 'ally', 1);
        const actorTweens = units.reduce((n, unit) => n + s.tweens.getTweensOf(unit).length, 0);
        s.paladog.x = 600; // Away from lane boundaries; test recoil, not edge clamping.
        const before = s.paladog.x;
        s.paladog.move(true, false, 200);
        return { actorTweens, retreat: before - s.paladog.x };
      });
      assert.equal(recoil.actorTweens, 0, 'Cosmetic hit effects must not tween actor positions');
      assert.ok(
        Math.abs(recoil.retreat - 52) < 0.001,
        'Retreat input remains effective immediately after a hit',
      );
      const power = await page.evaluate(() => {
        const s = window.__game.scene.getScene('Battle');
        s.spawnGroup({ enemyKind: 'wraith', count: 1 });
        const target = s.enemies.getChildren().at(-1);
        target.x = s.paladog.x + 500;
        s.controls.fire = true;
        s.handleAttackInput();
        s.motion.advance(100);
        s.controls.fire = false;
        const shot = s.projectiles.getChildren().at(-1);
        const before = target.getHealth().current;
        const damage = shot.damage;
        s.impactProjectile(shot, target, false);
        return {
          damage,
          dealt: before - target.getHealth().current,
          health: s.paladog.getHealth().max,
        };
      });
      assert.equal(power.damage, Math.round(20 * (1 + level * 0.22)));
      assert.equal(power.dealt, power.damage, 'Growth damage reaches actual enemy HP');
      assert.equal(power.health, Math.round(200 * (1 + level * 0.12)));
      assert.deepEqual(errors, []);
      reports.push({ viewport, level, rank, ...initial, recoil, power, errors });
      console.log(
        JSON.stringify({ viewport: viewport.width, level, rank, actors: initial.actors.length }),
      );
      await page.close();
    }
  }
  await writeFile(
    `${directory}/report.json`,
    JSON.stringify(
      { pass: true, scope: 'Isolated visual fixtures, not earned progression or balance', reports },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
