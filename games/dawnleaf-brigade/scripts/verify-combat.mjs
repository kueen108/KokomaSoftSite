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
  await page.locator('#mode-2').click();
  await page.locator('#resume').click();
  const report = await page.evaluate(async () => {
    const g = window.__game,
      s = g.scene.getScene('Battle');
    g.loop.stop();
    const { initialBattleEconomy } = await import('/src/systems/EconomySystem.ts');
    s.enemies.clear(true, true);
    s.allyUnits.clear(true, true);
    s.persisted.unlocked = [
      'tanker',
      'dealer',
      'archer',
      'guardian',
      'bannerman',
      'mage',
      'cleric',
      'lancer',
    ];
    s.economy = initialBattleEconomy(999, 12);
    for (const type of s.persisted.unlocked) s.pendingSummons.add(type);
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
    const units = [s.paladog, ...s.allyUnits.getChildren(), ...s.enemies.getChildren(), s.boss];
    for (const unit of units) unit.setVelocityX(0);
    for (const u of s.allyUnits.getChildren()) u.x = 500;
    for (const u of s.enemies.getChildren()) u.x = 900;
    s.boss.x = 1000;
    s.motion.update(units);
    const label = (u) => u.unitType ?? u.enemyKind ?? (u === s.paladog ? 'hero' : 'boss');
    const geometry = (u) => [
      u.body.width,
      u.body.height,
      u.body.offset.x - u.displayOriginX,
      u.body.offset.y - u.displayOriginY,
      u.height - u.displayOriginY,
    ];
    const initial = units.map(geometry);
    s.motion.update(units);
    const sequences = [];
    for (const state of ['attack', 'hurt', 'guard']) {
      for (const u of units) {
        if (state === 'attack')
          s.motion.attack(u, u.x + (u.enemyKind || u === s.boss ? -100 : 100));
        else if (state === 'hurt') s.motion.hurt(u);
        else s.motion.defend(u);
      }
      const frames = units.map(() => []);
      for (let f = 0; f < 4; f++) {
        s.motion.update(units);
        units.forEach((u, i) =>
          frames[i].push({
            frame: u.frame.name,
            key: u.texture.key,
            state: s.motion.stateOf(u),
            geometry: geometry(u),
          }),
        );
        s.motion.advance(state === 'hurt' ? 80 : 90);
      }
      s.motion.update(units);
      sequences.push({
        state,
        actors: units.map((u, i) => ({
          name: label(u),
          initial: initial[i],
          frames: frames[i],
          after: s.motion.stateOf(u),
        })),
      });
    }
    const textures = g.textures
      .getTextureKeys()
      .filter((k) => /^tex-.*-(attack|hurt|guard)$/.test(k))
      .map((key) => {
        const t = g.textures.get(key),
          c = t.getSourceImage().getContext('2d');
        const hashes = t.getFrameNames().map((n) => {
          const f = t.get(n),
            p = c.getImageData(f.cutX, 0, f.cutWidth, f.cutHeight).data;
          let h = 2166136261;
          for (const v of p) h = Math.imul(h ^ v, 16777619);
          return h;
        });
        return {
          key,
          count: hashes.length,
          distinct: new Set(hashes).size,
          alpha: c.getImageData(0, 0, 1, 1).data[3],
        };
      });
    const tanker = units.find((u) => u.unitType === 'tanker'),
      brute = units.find((u) => u.enemyKind === 'brute'),
      archer = units.find((u) => u.unitType === 'archer'),
      guardian = units.find((u) => u.unitType === 'guardian');
    tanker.x = 1000;
    brute.x = 1055;
    tanker.engage(brute);
    const hp = brute.getHealth().current;
    s.tickAllyUnits(2000);
    const windup = s.motion.stateOf(tanker);
    s.motion.advance(89);
    const before = brute.getHealth().current;
    s.motion.advance(1);
    s.motion.update(units);
    const after = brute.getHealth().current,
      impactFrame = tanker.frame.name,
      hurt = s.motion.stateOf(brute);
    s.motion.advance(500);
    archer.x = 800;
    archer.engage(brute);
    const bolts = s.projectiles.countActive();
    s.tickAllyUnits(2000);
    const boltsBefore = s.projectiles.countActive();
    s.motion.advance(90);
    const boltsAfter = s.projectiles.countActive();
    guardian.takeDamage(10);
    s.hitFx(guardian, 10);
    const block = s.motion.stateOf(guardian);
    s.motion.advance(400);
    guardian.takeDamage(50);
    s.hitFx(guardian, 50);
    const heavy = s.motion.stateOf(guardian);
    s.motion.advance(500);
    s.paladog.x = s.boss.x + 60;
    s.bossPulseRemaining = 50;
    s.tickBossPulse(60);
    const heroHurt = s.motion.stateOf(s.paladog);
    s.motion.advance(500);
    s.novaCooldown = 0;
    s.attackState.mana = 100;
    s.castNova();
    const heroGuard = s.motion.stateOf(s.paladog);
    let canceled = 0;
    s.motion.attack(brute, 1000, () => canceled++);
    brute.destroy();
    s.motion.advance(400);
    const start = s.paladog.x;
    s.motion.attack(s.paladog, start + 200);
    s.paladog.move(false, true, 100);
    s.motion.advance(100);
    s.motion.update([s.paladog]);
    const movingCast = s.paladog.x > start;
    s.motion.advance(400);
    s.motion.hurt(s.paladog);
    const repeated = [];
    for (let i = 0; i < 20; i++) {
      s.motion.hurt(s.paladog);
      s.motion.update([s.paladog]);
      repeated.push(s.paladog.frame.name);
      s.motion.advance(16);
    }
    // Preserve references only inside this isolated test page for the pause/visual checks.
    window.__combatActors = units.filter((u) => u.active);
    return {
      sequences,
      textures,
      events: {
        hp,
        before,
        after,
        windup,
        impactFrame,
        hurt,
        bolts,
        boltsBefore,
        boltsAfter,
        block,
        heavy,
        heroHurt,
        heroGuard,
        canceled,
        movingCast,
        repeated,
      },
    };
  });
  assert.equal(report.textures.length, 54);
  for (const t of report.textures) {
    assert.equal(t.count, 4);
    assert.equal(t.distinct, 4);
    assert.equal(t.alpha, 0);
  }
  for (const seq of report.sequences)
    for (const a of seq.actors) {
      assert.deepEqual(
        a.frames.map((f) => f.frame),
        ['0', '1', '2', '3'],
        `${a.name} ${seq.state}`,
      );
      for (const f of a.frames) {
        assert.equal(f.state, seq.state);
        f.geometry.forEach((n, i) =>
          assert.ok(Math.abs(n - a.initial[i]) < 0.001, `${a.name} ${seq.state} retains geometry`),
        );
      }
      assert.equal(a.after, 'idle');
    }
  const e = report.events;
  assert.equal(e.before, e.hp);
  assert.ok(e.after < e.hp);
  assert.equal(e.windup, 'attack');
  assert.equal(e.impactFrame, '1');
  assert.equal(e.hurt, 'hurt');
  assert.equal(e.boltsBefore, e.bolts);
  assert.ok(e.boltsAfter > e.bolts);
  assert.equal(e.block, 'guard');
  assert.equal(e.heavy, 'hurt');
  assert.equal(e.heroHurt, 'hurt');
  assert.equal(e.heroGuard, 'guard');
  assert.equal(e.canceled, 0);
  assert.equal(e.movingCast, true);
  assert.deepEqual([...new Set(e.repeated)], ['0', '1', '2', '3']);
  // Real scene updates while paused must leave a pending hit and its pose untouched.
  const pause = await page.evaluate(() => {
    const s = window.__game.scene.getScene('Battle');
    s.motion.advance(500);
    window.__impacts = 0;
    s.motion.attack(s.paladog, s.paladog.x + 100, () => window.__impacts++);
    s.setPaused(true);
    for (let i = 0; i < 20; i++) s.update(i * 16, 16);
    const before = { frame: s.paladog.frame.name, impacts: window.__impacts };
    s.setPaused(false);
    s.update(400, 60);
    const middle = window.__impacts;
    s.update(460, 40);
    return { before, middle, after: window.__impacts };
  });
  assert.deepEqual(pause, { before: { frame: '0', impacts: 0 }, middle: 0, after: 1 });
  // Render a contact sheet from the exact runtime texture frames for visual inspection.
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.evaluate(() => {
    const g = window.__game;
    const c = document.createElement('canvas');
    c.id = 'combat-sheet';
    c.width = 1280;
    c.height = 1000;
    const x = c.getContext('2d');
    x.fillStyle = '#10251f';
    x.fillRect(0, 0, 1280, 1000);
    x.font = '22px sans-serif';
    x.fillStyle = '#efdb9e';
    x.fillText('공격 · 피격 · 방어 — 게임 런타임 프레임', 24, 35);
    const keys = ['tex-paladog', 'tex-ally-dealer', 'tex-ally-guardian', 'tex-boss-grave-warden'];
    const actual = g.textures.getTextureKeys();
    const fixed = keys.map((k, i) =>
      actual.includes(k + '-attack')
        ? k
        : i === 1
          ? actual.find((k) => k.includes('dealer-attack'))?.replace('-attack', '')
          : actual.find((k) => k.includes('guardian-attack'))?.replace('-attack', ''),
    );
    ['attack', 'hurt', 'guard'].forEach((state, row) => {
      x.font = '18px sans-serif';
      x.fillStyle = '#efdb9e';
      x.fillText(state.toUpperCase(), 24, 75 + row * 300);
      fixed.forEach((key, column) => {
        const t = g.textures.get(key + '-' + state);
        for (let n = 0; n < 4; n++) {
          const f = t.get(String(n));
          const scale = Math.min(75 / f.cutWidth, 160 / f.cutHeight);
          const w = f.cutWidth * scale,
            h = f.cutHeight * scale;
          x.drawImage(
            t.getSourceImage(),
            f.cutX,
            0,
            f.cutWidth,
            f.cutHeight,
            column * 310 + n * 76 + 24,
            280 + row * 300 - h,
            w,
            h,
          );
        }
      });
    });
    document.body.replaceChildren(c);
  });
  await page.locator('#combat-sheet').screenshot({ path: `${output}/combat-poses.png` });
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/combat-report.json`,
    JSON.stringify({ pass: true, ...report, pause, errors }, null, 2),
  );
  console.log(
    'PASS: 216 combat poses, all 18 actors, attack impact timing, hit/guard events, hitboxes, movement, pause and death cancellation',
  );
} finally {
  await browser.close();
}
