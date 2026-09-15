/* global window, localStorage, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
const prior = JSON.parse(await readFile('artifacts/runtime/expedition-campaign.json', 'utf8'));
assert.ok(prior.pass, 'Run the earned-progression campaign verification first');
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
const cases = [
  { stage: 12, policy: 'reckless', difficulty: 'normal' },
  ...[1, 4, 7, 10].map((stage) => ({ stage, policy: 'idle', difficulty: 'normal' })),
  ...['story', 'normal', 'veteran'].map((difficulty) => ({
    stage: 12,
    policy: 'mixed',
    difficulty,
  })),
  ...['tanker', 'mage'].map((policy) => ({ stage: 12, policy, difficulty: 'normal' })),
];
const reports = [];
try {
  for (const scenario of cases.filter(
    (c) => !process.env.BALANCE_POLICY || c.policy === process.env.BALANCE_POLICY,
  )) {
    const p = await browser.newPage(),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(
      process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
    );
    await p.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
    await p.evaluate(
      ({ save, difficulty }) => {
        localStorage.setItem('paladogweb:save', JSON.stringify(save));
        localStorage.setItem(
          'paladogweb:experience',
          JSON.stringify({ difficulty, effects: 'full' }),
        );
      },
      { save: prior.save, difficulty: scenario.difficulty },
    );
    await p.locator('#play').click();
    await p.locator('#mode-0').click();
    await p.locator(`#region-${Math.floor((scenario.stage - 1) / 3)}`).click();
    await p.locator(`#stage-${scenario.stage - 1}`).click();
    await p.locator('#resume').click();
    const result = await p.evaluate(({ policy }) => {
      const g = window.__game,
        s = g.scene.getScene('Battle');
      g.loop.stop();
      let time = 100,
        peak = 0,
        minHp = s.paladog.getHealth().current;
      for (let frame = 0; frame < 36000 && !s.battleOver; frame++) {
        const enemies = s.enemies
            .getChildren()
            .filter((e) => e.active)
            .sort((a, b) => a.x - b.x),
          near = enemies[0],
          allies = s.allyUnits.getChildren().filter((u) => u.active);
        if (policy !== 'idle') {
          const front = allies.reduce((x, u) => Math.max(x, u.x), 260),
            spacing = s.paladog.getHealth().current < 100 ? 400 : 200;
          const goal = near
            ? Math.max(140, Math.min(3600, near.x - spacing, front - 60))
            : Math.min(3540, 300 + s.elapsedMs / 20);
          s.controls.left = s.paladog.x > goal + 10;
          s.controls.right = s.paladog.x < goal - 10;
          s.controls.fire = !!near || !s.enemyBase?.shielded;
          if (policy === 'reckless') {
            s.controls.left = false;
            s.controls.right = true;
          }
          if (
            enemies.filter((e) => Math.abs(e.x - s.paladog.x) <= 300).length >= 3 &&
            s.novaCooldown <= 0
          ) {
            if (s.attackState.mana >= 40) s.castNova();
            else s.controls.fire = false;
          }
          if (frame % 20 === 0) {
            const counts = Object.fromEntries(
              ['tanker', 'cleric', 'mage', 'archer', 'lancer'].map((t) => [
                t,
                allies.filter((u) => u.unitType === t).length,
              ]),
            );
            const type =
              policy === 'mixed' || policy === 'reckless'
                ? counts.tanker < 2
                  ? 'tanker'
                  : counts.cleric < 1
                    ? 'cleric'
                    : counts.mage < 3
                      ? 'mage'
                      : counts.archer < 3
                        ? 'archer'
                        : counts.lancer < 2
                          ? 'lancer'
                          : 'dealer'
                : policy;
            if (s.summonSlots().find((q) => q.definition.type === type).summonable)
              s.controls.summon(type);
          }
        }
        g.headlessStep(time, 1000 / 60);
        time += 1000 / 60;
        peak = Math.max(peak, enemies.length);
        minHp = Math.min(minHp, s.paladog.getHealth().current);
      }
      return {
        over: s.battleOver,
        seconds: Math.round(s.elapsedMs / 1000),
        base: s.allyBase.getHealth().current,
        hero: s.paladog.getHealth().current,
        minHp,
        target: s.enemyBase.getHealth().current,
        remaining: s.enemies.countActive(),
        peak,
        win:
          s.battleOver && s.paladog.getHealth().current > 0 && s.allyBase.getHealth().current > 0,
      };
    }, scenario);
    reports.push({ ...scenario, ...result });
    console.log(JSON.stringify(reports.at(-1)));
    assert.deepEqual(errors, []);
    assert.ok(result.over, 'battle must resolve');
    if (scenario.policy === 'idle')
      assert.equal(result.win, false, 'doing nothing must fail even with campaign-earned upgrades');
    if (scenario.policy === 'reckless')
      assert.equal(
        result.win,
        false,
        'charging into the whole army must fail despite earned upgrades and summoning',
      );
    if (scenario.policy === 'mixed')
      assert.equal(result.win, true, 'mixed army must have a viable path on every difficulty');
    await writeFile(
      `artifacts/runtime/polish-balance${process.env.BALANCE_POLICY ? '-' + process.env.BALANCE_POLICY : ''}.json`,
      JSON.stringify({ pass: false, reports }, null, 2),
    );
    await p.close();
  }
  await writeFile(
    `artifacts/runtime/polish-balance${process.env.BALANCE_POLICY ? '-' + process.env.BALANCE_POLICY : ''}.json`,
    JSON.stringify({ pass: true, reports }, null, 2),
  );
  console.log('PASS: idle loss gates and earned-progression army/difficulty comparisons');
} finally {
  await browser.close();
}
