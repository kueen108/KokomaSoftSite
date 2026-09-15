/* global window, document, localStorage */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
await mkdir('artifacts/runtime/visual-ui', { recursive: true });
const reports = [],
  errors = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      locale: 'ko-KR',
      viewport: mobile ? { width: 844, height: 390 } : { width: 1280, height: 720 },
      hasTouch: mobile,
    });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(
      process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
    );
    await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
    const suffix = mobile ? 'mobile' : 'desktop';
    const capture = async (name) => {
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `artifacts/runtime/visual-ui/${name}-${suffix}.png` });
      const text = await page.locator('.interface-content').innerText();
      reports.push({
        screen: name,
        mobile,
        koreanCharacters: (text.match(/[가-힣]/g) || []).length,
        visibleText: text,
      });
    };
    const popup = async (id, match, close = 'button') => {
      await page.locator('#' + id).click();
      await page.locator('.info-scrim').waitFor({ state: 'visible' });
      assert.match(await page.locator('.info-body').innerText(), match);
      assert.equal(await page.locator('.info-dialog').getAttribute('aria-modal'), 'true');
      assert.ok(await page.locator('.interface-content').evaluate((e) => e.inert));
      const rect = await page.locator('.info-dialog').boundingBox();
      assert.ok(
        rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x + rect.width <= page.viewportSize().width + 1 &&
          rect.y + rect.height <= page.viewportSize().height + 1,
        'popup within viewport',
      );
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.className), 'info-close');
      if (close === 'escape') await page.keyboard.press('Escape');
      else if (close === 'outside')
        await page.locator('.info-scrim').click({ position: { x: 5, y: 5 } });
      else await page.locator('.info-close').click();
      assert.equal(await page.locator('.info-scrim').isVisible(), false);
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        id,
        'focus restored to the information button',
      );
    };
    await capture('menu');
    await page.locator('#menu-info').click();
    await page.keyboard.press('Space');
    assert.ok(await page.evaluate(() => window.__game.scene.isActive('MainMenu')));
    await page.keyboard.press('Escape');
    await page.locator('#sound').click();
    await popup('settings-info', /난이도/);
    await page.locator('#close-sound').click();
    await page.locator('#play').click();
    await capture('modes');
    await popup('mode-info-1', /웨이브/, 'escape');
    assert.ok(await page.evaluate(() => window.__game.scene.isActive('ModeSelect')));
    await page.locator('#mode-0').click();
    await capture('map');
    await popup('stage-info-0', /첫 봉화/);
    await popup('difficulty-info', /승리 보상/, 'outside');
    await page.locator('#stage-0').click();
    await capture('intro');
    await popup('story-info', /첫 봉화/);
    assert.equal(
      await page.evaluate(() => window.__game.scene.getScene('Battle').paused),
      true,
      'intro remains paused after explanation',
    );
    await page.locator('#resume').click();
    await capture('battle');
    const battle = reports.at(-1);
    assert.ok(
      battle.koreanCharacters <= 15,
      `normal battle has only essential text: ${battle.koreanCharacters}`,
    );
    const before = await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      return { units: s.allyUnits.countActive(), save: localStorage.getItem('paladogweb:save') };
    });
    const infoIds = [
      'base-info',
      'hero-info',
      'resource-info',
      'map-info',
      'aura-info',
      'mission-info',
      'weapon-info',
      'nova-info',
      'help',
      ...['tanker', 'dealer', 'archer', 'guardian', 'bannerman', 'mage', 'cleric', 'lancer'].map(
        (t) => 'unit-info-' + t,
      ),
    ];
    for (const id of infoIds) {
      await page.locator('#' + id).click();
      const snapshot = () =>
        page.evaluate(() => {
          const s = window.__game.scene.getScene('Battle');
          return {
            time: s.elapsedMs,
            gold: s.economy.gold,
            hp: s.paladog.getHealth().current,
            paused: s.paused,
          };
        });
      const frozen = await snapshot();
      assert.equal(frozen.paused, true);
      await page.waitForTimeout(100);
      assert.deepEqual(await snapshot(), frozen, 'information freezes combat');
      assert.ok((await page.locator('.info-body').innerText()).length > 10);
      if (id === 'unit-info-mage')
        await page.screenshot({ path: `artifacts/runtime/visual-ui/unit-popup-${suffix}.png` });
      await page.keyboard.press('Escape');
      assert.equal(
        await page.evaluate(() => window.__game.scene.getScene('Battle').paused),
        false,
        'closing resumes battle once',
      );
    }
    const after = await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      return { units: s.allyUnits.countActive(), save: localStorage.getItem('paladogweb:save') };
    });
    assert.deepEqual(after, before, 'info buttons do not summon or spend');
    await page.evaluate(() =>
      window.__game.scene
        .getScene('Battle')
        .ui.toast('보호막이 사라졌습니다! 적 요새를 파괴하세요.'),
    );
    assert.equal((await page.locator('#toast').innerText()).replace(/\s/g, ''), 'i');
    await popup('event-info', /보호막/);
    await page.locator('#summon-tanker').click();
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(() => window.__game.scene.getScene('Battle').allyUnits.countActive()),
      1,
    );
    await page.locator('#pause').click();
    await popup('story-info', /첫 봉화/);
    assert.equal(await page.evaluate(() => window.__game.scene.getScene('Battle').paused), true);
    await page.locator('#retreat').click();
    await page.locator('#upgrade').click();
    await capture('unit');
    const saved = await page.evaluate(() => localStorage.getItem('paladogweb:save'));
    await popup('detail-info', /골드/);
    await popup('stats-info', /체력/);
    await page.locator('#hero-upgrades').click();
    await capture('armory');
    await popup('aura-upgrade-info', /다음 단계/);
    for (const id of [
      'weapon-info-sun',
      'weapon-info-frost',
      'weapon-info-storm',
      'armor-info-leather',
      'armor-info-bulwark',
      'armor-info-renewal',
    ])
      await popup(id, /장착/);
    assert.equal(
      await page.evaluate(() => localStorage.getItem('paladogweb:save')),
      saved,
      'equipment information never purchases/equips',
    );
    await page.locator('#back').click();
    await page.locator('#play').click();
    await page.locator('#mode-0').click();
    await page.locator('#stage-0').click();
    await page.locator('#resume').click();
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('Battle');
      s.paladog.takeDamage(9999);
      s.checkOutcome();
    });
    await page.waitForFunction(() => window.__game.scene.isActive('Result'));
    await capture('result');
    await popup('result-info', /루미가 쓰러졌습니다/);
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/runtime/visual-ui/report.json',
    JSON.stringify({ pass: true, reports, errors }, null, 2),
  );
  process.stdout.write(
    'PASS: visual text budgets, all contextual popups, freeze/resume, focus/Escape/backdrop, no unintended purchases/summons, desktop/mobile screens\n',
  );
} finally {
  await browser.close();
}
