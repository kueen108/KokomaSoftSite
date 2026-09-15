/* global window, localStorage, console */
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
const url =
  process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173';
await mkdir('artifacts/runtime', { recursive: true });
let save = null;
const reports = [];
try {
  for (let stage = 1; stage <= 12; stage++) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
    if (save)
      await page.evaluate((s) => localStorage.setItem('paladogweb:save', JSON.stringify(s)), save);
    const purchases = await page.evaluate(async () => {
      const { loadState, saveState } = await import('/src/systems/SaveSystem.ts');
      const { heroProgress, upgradeAura, chooseArmor } =
        await import('/src/systems/HeroProgressSystem.ts');
      const { applyUpgrade } = await import('/src/systems/UpgradeSystem.ts');
      const { unitDefinition } = await import('/src/data/units/index.ts');
      let state = loadState(localStorage),
        before = state.settlementGold;
      // Spend only rewards earned in preceding simulated battles.
      state = upgradeAura(state);
      if (state.clearedStages.length >= 3) state = chooseArmor(state, 'bulwark');
      const cap =
        state.clearedStages.length >= 9
          ? 3
          : state.clearedStages.length >= 6
            ? 2
            : state.clearedStages.length >= 2
              ? 1
              : 0;
      for (const type of ['tanker', 'mage', 'archer', 'lancer'])
        if (state.unlocked.includes(type) && state.upgradeLevels[type] < cap)
          state = applyUpgrade(state, unitDefinition(type)).state;
      saveState(localStorage, state);
      return {
        spent: before - state.settlementGold,
        aura: heroProgress(state).auraLevel,
        levels: state.upgradeLevels,
        armor: heroProgress(state).armor,
      };
    });
    await page.locator('#play').click();
    await page.locator('#mode-0').click();
    await page.locator(`#region-${Math.floor((stage - 1) / 3)}`).click();
    await page.locator(`#stage-${stage - 1}`).click();
    await page.locator('#resume').click();
    const result = await page.evaluate(() => {
      const g = window.__game,
        s = g.scene.getScene('Battle');
      g.loop.stop();
      let time = 100,
        peak = 0,
        casts = 0,
        minHp = s.paladog.getHealth().current;
      for (let frame = 0; frame < 36000 && !s.battleOver; frame++) {
        const enemies = s.enemies
            .getChildren()
            .filter((e) => e.active)
            .sort((a, b) => a.x - b.x),
          nearest = enemies[0];
        const allies = s.allyUnits.getChildren().filter((u) => u.active),
          front = allies.reduce((x, u) => Math.max(x, u.x), 260);
        const spacing = s.paladog.getHealth().current < 100 ? 400 : 200;
        const goal = nearest
          ? Math.max(140, Math.min(3600, nearest.x - spacing, front - 60))
          : Math.min(3540, 300 + s.elapsedMs / 20);
        s.controls.left = s.paladog.x > goal + 10;
        s.controls.right = s.paladog.x < goal - 10;
        s.controls.fire = !!nearest || !s.enemyBase?.shielded;
        const reserve = enemies.filter((e) => Math.abs(e.x - s.paladog.x) <= 300).length >= 3;
        if (reserve && s.novaCooldown <= 0) {
          if (s.attackState.mana >= 40) {
            s.castNova();
            casts++;
          } else s.controls.fire = false;
        }
        if (frame % 20 === 0) {
          const counts = Object.fromEntries(
            ['tanker', 'dealer', 'archer', 'cleric', 'mage', 'lancer'].map((t) => [
              t,
              allies.filter((u) => u.unitType === t).length,
            ]),
          );
          const wanted =
            counts.tanker < 2
              ? 'tanker'
              : s.persisted.unlocked.includes('cleric') && counts.cleric < 1
                ? 'cleric'
                : s.persisted.unlocked.includes('mage') && counts.mage < 3
                  ? 'mage'
                  : counts.archer < 3
                    ? 'archer'
                    : s.persisted.unlocked.includes('lancer') && counts.lancer < 2
                      ? 'lancer'
                      : 'dealer';
          if (s.summonSlots().find((slot) => slot.definition.type === wanted).summonable)
            s.controls.summon(wanted);
        }
        g.headlessStep(time, 1000 / 60);
        time += 1000 / 60;
        peak = Math.max(peak, s.enemies.countActive());
        minHp = Math.min(minHp, s.paladog.getHealth().current);
      }
      return {
        stage: s.stage.id,
        over: s.battleOver,
        seconds: Math.round(s.elapsedMs / 1000),
        base: s.allyBase.getHealth().current,
        hero: s.paladog.getHealth().current,
        minHp,
        target: s.enemyBase.getHealth().current,
        remaining: s.enemies.countActive(),
        peak,
        casts,
        save: JSON.parse(localStorage.getItem('paladogweb:save')),
      };
    });
    console.log(
      JSON.stringify({
        stage,
        ...purchases,
        seconds: result.seconds,
        hero: result.hero,
        base: result.base,
        remaining: result.remaining,
        cleared: result.save.clearedStages.includes(`stage-${stage}`),
      }),
    );
    reports.push({ ...result, purchases });
    await writeFile(
      'artifacts/runtime/expedition-campaign.json',
      JSON.stringify({ pass: false, reports }, null, 2),
    );
    assert.equal(result.over, true, `stage ${stage} finishes`);
    assert.ok(
      result.save.clearedStages.includes(`stage-${stage}`),
      `stage ${stage} victory with earned progression`,
    );
    assert.ok(result.hero > 0);
    assert.ok(result.base > 0);
    assert.deepEqual(errors, []);
    save = result.save;
    await page.evaluate(() => window.__game.loop.start(window.__game.step.bind(window.__game)));
    await page.waitForFunction(() => window.__game.scene.isActive('Result'));
    if (stage % 3 === 0)
      await page.screenshot({
        path: `artifacts/runtime/expedition-chapter-${stage / 3}-result.png`,
      });
    await page.close();
  }
  assert.equal(save.clearedStages.length, 12);
  assert.ok(
    save.unlocked.includes('mage') &&
      save.unlocked.includes('cleric') &&
      save.unlocked.includes('lancer'),
  );
  await writeFile(
    'artifacts/runtime/expedition-campaign.json',
    JSON.stringify({ pass: true, reports, save }, null, 2),
  );
  console.log(
    'PASS: twelve campaign victories from a fresh save, earned equipment/upgrades, story, rewards and persistence',
  );
} finally {
  await browser.close();
}
