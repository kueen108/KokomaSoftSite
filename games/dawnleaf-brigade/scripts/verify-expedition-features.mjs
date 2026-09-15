/* global window, document, localStorage, console */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
await mkdir('artifacts/runtime', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, locale: 'ko-KR' }),
    errors = [],
    failed = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  await page.goto(
    process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
  );
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  // Isolated rich save tests purchase and gating UI, not campaign balance.
  await page.evaluate(async () => {
    const { defaultPersistedState } = await import('/src/systems/SaveSystem.ts');
    const s = defaultPersistedState();
    s.settlementGold = 2000;
    s.clearedStages = Array.from({ length: 9 }, (_, i) => `stage-${i + 1}`);
    s.unlocked = [
      'tanker',
      'dealer',
      'archer',
      'guardian',
      'bannerman',
      'mage',
      'cleric',
      'lancer',
    ];
    localStorage.setItem('paladogweb:save', JSON.stringify(s));
  });
  await page.locator('#upgrade').click();
  await page.locator('#hero-upgrades').click();
  for (let i = 0; i < 4; i++) await page.locator('#aura-upgrade').click();
  assert.equal(await page.locator('#aura-upgrade').isDisabled(), true);
  for (const id of [
    'weapon-frost',
    'weapon-storm',
    'armor-bulwark',
    'armor-renewal',
    'weapon-frost',
    'armor-bulwark',
  ])
    await page.locator('#' + id).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('paladogweb:save')));
  assert.equal(saved.settlementGold, 700);
  assert.equal(saved.hero.auraLevel, 4);
  assert.equal(saved.hero.weapon, 'frost');
  assert.equal(saved.hero.armor, 'bulwark');
  await page.locator('.unit-detail').evaluate((e) => (e.scrollTop = 0));
  await page.screenshot({ path: 'artifacts/runtime/expedition-workshop.png' });
  await page.locator('.unit-detail').evaluate((e) => (e.scrollTop = e.scrollHeight));
  await page.screenshot({ path: 'artifacts/runtime/expedition-equipment.png' });
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
  await page.locator('#play').click();
  await page.locator('#mode-0').click();
  await page.locator('#region-3').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/runtime/expedition-map.png' });
  await page.locator('#stage-10').click();
  assert.ok((await page.locator('.info-body').innerText()).includes('이전 전장'));
  await page.locator('.info-close').click();
  await page.locator('#stage-9').click();
  assert.ok((await page.locator('#paused').innerText()).includes('회랑'));
  await page.locator('#resume').click();
  const result = await page.evaluate(async () => {
    const g = window.__game,
      s = g.scene.getScene('Battle');
    g.loop.stop();
    const { initialBattleEconomy } = await import('/src/systems/EconomySystem.ts');
    s.enemies.clear(true, true);
    s.allyUnits.clear(true, true);
    s.economy = initialBattleEconomy(999, 12);
    for (const type of ['mage', 'cleric', 'lancer', 'guardian']) s.pendingSummons.add(type);
    s.handleSummonInput();
    for (const enemyKind of ['bomber', 'wraith', 'sentinel', 'brute', 'grunt'])
      s.spawnGroup({ enemyKind, count: 1 });
    const allies = s.allyUnits.getChildren(),
      enemies = s.enemies.getChildren(),
      hero = s.paladog;
    const mage = allies.find((u) => u.unitType === 'mage'),
      lancer = allies.find((u) => u.unitType === 'lancer'),
      guardian = allies.find((u) => u.unitType === 'guardian');
    const bomber = enemies.find((e) => e.enemyKind === 'bomber'),
      wraith = enemies.find((e) => e.enemyKind === 'wraith'),
      sentinel = enemies.find((e) => e.enemyKind === 'sentinel'),
      brute = enemies.find((e) => e.enemyKind === 'brute'),
      grunt = enemies.find((e) => e.enemyKind === 'grunt');
    for (const u of [...allies, ...enemies]) {
      u.x = 1500;
      u.setVelocityX(0);
    }
    hero.x = 1400;
    s.refreshAura();
    s.refreshEnemyAura();
    const aura = s.auraEllipse(),
      auraStats = {
        radius: s.aura.radius,
        attack: mage.stats.attackDamage,
        speed: mage.stats.speed,
        defense: guardian.receivedDamage(40),
        enemyAttack: sentinel.stats.attackDamage,
        enemyDefense: sentinel.receivedDamage(40),
      };
    const armor = { max: hero.getHealth().max, damage: hero.receivedDamage(40) };
    const tiers = [];
    for (let level = 0; level < 6; level++) {
      s.persisted = { ...s.persisted, hero: { ...s.persisted.hero, auraLevel: level } };
      s.refreshAura();
      s.refreshEnemyAura();
      tiers.push({
        radius: s.auraEllipse()?.rx ?? 0,
        attack: mage.stats.attackDamage,
        speed: mage.stats.speed,
        incoming: guardian.receivedDamage(40),
        enemyAttack: sentinel.stats.attackDamage,
        enemyIncoming: sentinel.receivedDamage(40),
      });
    }
    s.persisted = { ...s.persisted, hero: { ...s.persisted.hero, auraLevel: 5 } };
    s.refreshAura();
    s.refreshEnemyAura();
    const textureKeys = g.textures
      .getTextureKeys()
      .filter((k) =>
        /tex-(ally-(mage|cleric|lancer)|enemy-(bomber|wraith|sentinel))-(locomotion|attack|hurt|guard)$/.test(
          k,
        ),
      );
    const textures = textureKeys.map((k) => {
      const t = g.textures.get(k),
        c = t.getSourceImage().getContext('2d'),
        hashes = t.getFrameNames().map((n) => {
          const f = t.get(n),
            p = c.getImageData(f.cutX, 0, f.cutWidth, f.cutHeight).data;
          let h = 2166136261;
          for (const v of p) h = Math.imul(h ^ v, 16777619);
          return h;
        });
      return {
        key: k,
        count: hashes.length,
        distinct: new Set(hashes).size,
        alpha: c.getImageData(0, 0, 1, 1).data[3],
      };
    });
    // Heal actual HP with the support timer and the level-IV aura.
    hero.takeDamage(50);
    guardian.takeDamage(40);
    const beforeHeal = [hero.getHealth().current, guardian.getHealth().current];
    s.tickSupport(1000);
    const afterHeal = [hero.getHealth().current, guardian.getHealth().current];
    // Fire explosion reaches a second enemy, while a distant target is unaffected.
    hero.x = 500;
    mage.x = 1000;
    brute.x = 1200;
    grunt.x = 1240;
    sentinel.x = 1600;
    wraith.x = 1900;
    bomber.x = 2100;
    s.refreshAura();
    s.refreshEnemyAura();
    mage.engage(brute);
    s.fireAllyProjectile(mage, 20);
    let shot = s.projectiles.getChildren().at(-1);
    const fireBefore = [
      brute.getHealth().current,
      grunt.getHealth().current,
      sentinel.getHealth().current,
    ];
    s.impactProjectile(shot, brute, false);
    const fireAfter = [
      brute.getHealth().current,
      grunt.getHealth().current,
      sentinel.getHealth().current,
    ];
    // One spear hits each of two targets once and is consumed on the second.
    lancer.x = 1100;
    lancer.engage(brute);
    s.fireAllyProjectile(lancer, 10);
    shot = s.projectiles.getChildren().at(-1);
    const spearBefore = brute.getHealth().current;
    s.impactProjectile(shot, brute, false);
    const first = brute.getHealth().current,
      aliveAfterFirst = shot.active;
    s.impactProjectile(shot, brute, false);
    const repeat = brute.getHealth().current;
    s.impactProjectile(shot, sentinel, false);
    const aliveAfterSecond = shot.active;
    // Equipped frost weapon really produces a slow projectile at its paid mana/cooldown.
    hero.x = 1050;
    s.attackState.mana = 100;
    s.attackState.cooldownRemainingMs = 0;
    s.controls.fire = true;
    s.handleAttackInput();
    s.motion.advance(90);
    s.controls.fire = false;
    shot = s.projectiles.getChildren().at(-1);
    const frostEffect = shot.effect;
    s.impactProjectile(shot, brute, false);
    s.refreshEnemyAura();
    const slowed = brute.stats.speed;
    brute.tickStatus(2000);
    s.refreshEnemyAura();
    const restored = brute.stats.speed;
    // Enemy bombs damage nearby hero and ally, frost affects hero movement too.
    hero.x = 1500;
    guardian.x = 1530;
    bomber.x = 1700;
    bomber.engageUnit(hero);
    s.fireEnemyProjectile(bomber, 20);
    shot = s.enemyProjectiles.getChildren().at(-1);
    const bombBefore = [hero.getHealth().current, guardian.getHealth().current];
    s.impactProjectile(shot, hero, true);
    const bombAfter = [hero.getHealth().current, guardian.getHealth().current];
    wraith.engageUnit(hero);
    s.fireEnemyProjectile(wraith, 8);
    shot = s.enemyProjectiles.getChildren().at(-1);
    s.impactProjectile(shot, hero, true);
    let start = hero.x;
    hero.move(false, true, 1000);
    const slowDistance = hero.x - start;
    hero.regenerate(2000);
    start = hero.x;
    hero.move(false, true, 1000);
    const normalDistance = hero.x - start;
    // Showcase all new actors away from contact, without changing textures or stats.
    hero.x = 1700;
    for (let i = 0; i < allies.length; i++) {
      allies[i].x = 1650 + i * 65;
      allies[i].setVelocityX(0);
    }
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].x = 2030 + i * 65;
      enemies[i].setVelocityX(0);
    }
    s.refreshAura();
    s.refreshEnemyAura();
    s.refreshHud();
    return {
      aura,
      auraStats,
      armor,
      tiers,
      textures,
      beforeHeal,
      afterHeal,
      fireBefore,
      fireAfter,
      spear: { spearBefore, first, repeat, aliveAfterFirst, aliveAfterSecond },
      frost: { effect: frostEffect, slowed, restored },
      bombBefore,
      bombAfter,
      slowDistance,
      normalDistance,
    };
  });
  assert.deepEqual(
    result.tiers.map((t) => t.radius),
    [0, 145, 190, 235, 280, 325],
  );
  for (let i = 1; i < 6; i++) {
    assert.ok(result.tiers[i].attack > result.tiers[i - 1].attack);
    assert.ok(result.tiers[i].speed > result.tiers[i - 1].speed);
    assert.ok(result.tiers[i].incoming <= result.tiers[i - 1].incoming);
    assert.ok(result.tiers[i].enemyAttack <= result.tiers[i - 1].enemyAttack);
    assert.ok(result.tiers[i].enemyIncoming >= result.tiers[i - 1].enemyIncoming);
  }
  assert.equal(result.aura.rx, 280);
  assert.equal(result.armor.max, 355);
  assert.equal(result.armor.damage, 30);
  assert.equal(result.textures.length, 24);
  for (const t of result.textures) {
    assert.equal(t.count, t.key.endsWith('locomotion') ? 6 : 4);
    assert.equal(t.distinct, t.count);
    assert.equal(t.alpha, 0);
  }
  assert.equal(result.afterHeal[0] - result.beforeHeal[0], 8);
  assert.ok(result.afterHeal[1] > result.beforeHeal[1]);
  assert.ok(result.fireAfter[0] < result.fireBefore[0]);
  assert.ok(result.fireAfter[1] < result.fireBefore[1]);
  assert.equal(result.fireAfter[2], result.fireBefore[2]);
  assert.ok(result.spear.first < result.spear.spearBefore);
  assert.equal(result.spear.first, result.spear.repeat);
  assert.equal(result.spear.aliveAfterFirst, true);
  assert.equal(result.spear.aliveAfterSecond, false);
  assert.equal(result.frost.effect, 'frost');
  assert.ok(result.frost.slowed < result.frost.restored);
  assert.ok(result.bombAfter[0] < result.bombBefore[0]);
  assert.ok(result.bombAfter[1] < result.bombBefore[1]);
  assert.ok(result.slowDistance < result.normalDistance);
  await page.evaluate(() => window.__game.loop.start(window.__game.step.bind(window.__game)));
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'artifacts/runtime/expedition-battle.png' });
  const animation = await page.evaluate(async () => {
    const s = window.__game.scene.getScene('Battle'),
      first = JSON.stringify(s.auraGraphics.commandBuffer);
    await new Promise((r) => window.setTimeout(r, 250));
    const second = JSON.stringify(s.auraGraphics.commandBuffer);
    s.setPaused(true);
    const paused = JSON.stringify(s.auraGraphics.commandBuffer);
    await new Promise((r) => window.setTimeout(r, 200));
    return {
      moves: first !== second,
      freezes: paused === JSON.stringify(s.auraGraphics.commandBuffer),
      radius: s.auraEllipse().rx,
    };
  });
  assert.deepEqual(animation, { moves: true, freezes: true, radius: 325 });
  await page.locator('#resume').click();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'artifacts/runtime/expedition-mobile.png' });
  // All eight summon buttons remain entirely in the scaled game viewport.
  const layout = await page.evaluate(() => {
    const game = document.querySelector('canvas').getBoundingClientRect();
    return [...document.querySelectorAll('.summon-card')].map((e) => {
      const r = e.getBoundingClientRect();
      return r.left >= game.left && r.right <= game.right && r.bottom <= game.bottom;
    });
  });
  assert.equal(layout.length, 8);
  assert.ok(layout.every(Boolean));
  await page.locator('#pause').click();
  await page.locator('#retreat').click();
  await page.locator('#upgrade').click();
  await page.locator('#hero-upgrades').click();
  await page.locator('#weapon-storm').click();
  await page.locator('#armor-renewal').click();
  await page.locator('#back').click();
  await page.locator('#play').click();
  await page.locator('#mode-0').click();
  await page.locator('#region-3').click();
  await page.locator('#stage-9').click();
  await page.locator('#resume').click();
  const alternative = await page.evaluate(() => {
    const g = window.__game,
      s = g.scene.getScene('Battle');
    g.loop.stop();
    s.enemies.clear(true, true);
    s.spawnGroup({ enemyKind: 'brute', count: 2 });
    const [a, b] = s.enemies.getChildren();
    s.paladog.x = 1000;
    a.x = 1200;
    b.x = 1240;
    s.paladog.takeDamage(40);
    s.paladog.regenerate(1999);
    const waiting = s.paladog.getHealth().current;
    s.paladog.regenerate(1001);
    const healed = s.paladog.getHealth().current;
    s.controls.fire = true;
    s.handleAttackInput();
    s.motion.advance(90);
    s.controls.fire = false;
    const shot = s.projectiles.getChildren().at(-1),
      effect = shot.effect,
      damage = shot.damage,
      before = [a.getHealth().current, b.getHealth().current];
    s.impactProjectile(shot, a, false);
    const after = [a.getHealth().current, b.getHealth().current];
    return {
      max: s.paladog.getHealth().max,
      waiting,
      healed,
      effect,
      damage,
      before,
      after,
      cost: s.attackState.attackCost,
      cooldown: s.attackState.cooldownMs,
    };
  });
  assert.equal(alternative.max, 266);
  assert.equal(alternative.waiting, 226);
  assert.equal(alternative.healed, 230);
  assert.equal(alternative.effect, 'storm');
  assert.equal(alternative.damage, 53);
  assert.equal(alternative.cost, 28);
  assert.equal(alternative.cooldown, 850);
  assert.ok(alternative.after[0] < alternative.before[0]);
  assert.ok(alternative.after[1] < alternative.before[1]);
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  await writeFile(
    'artifacts/runtime/expedition-features.json',
    JSON.stringify(
      { pass: true, saved, result, animation, layout, alternative, errors, failed },
      null,
      2,
    ),
  );
  console.log(
    'PASS: armory purchase/equip/reload, six aura tiers, growth-scaled health/damage, healing, explosions, piercing, frost, animated aura pause and mobile layout',
  );
} finally {
  await browser.close();
}
