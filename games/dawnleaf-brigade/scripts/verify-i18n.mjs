/* global window, document, localStorage */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';

const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
const output = 'artifacts/runtime/i18n';
await mkdir(output, { recursive: true });
const cases = [
  ['en-US', 'en', 'The Four Oaths', 'Campaign'],
  ['ja-JP', 'ja', '四つの誓い', '遠征'],
  ['zh-CN', 'zh-Hans', '四大誓约', '远征'],
  ['fr-FR', 'fr', 'Les quatre serments', 'Campagne'],
  ['es-ES', 'es', 'Los cuatro juramentos', 'Campaña'],
  ['ko-KR', 'ko', '네 개의 맹세', '원정'],
  ['de-DE', 'en', 'The Four Oaths', 'Campaign'],
];
const report = [],
  errors = [];
// Optional language arguments keep focused regression runs quick.
const selectedCases =
  process.argv.length > 2
    ? cases.filter(([language]) => process.argv.slice(2).includes(language))
    : cases;
assert.ok(selectedCases.length, 'Select at least one known browser locale');
try {
  for (const mobile of [false, true])
    for (const [language, expectedLang, subtitle, playLabel] of selectedCases) {
      const page = await browser.newPage({
        locale: language,
        viewport: mobile ? { width: 844, height: 390 } : { width: 1280, height: 720 },
        hasTouch: mobile,
      });
      page.on('pageerror', (error) => errors.push(`${language}: ${error.message}`));
      const tag = `${language}-${mobile ? 'mobile' : 'desktop'}`;
      const screens = [];
      const audit = async (screen, capture = false) => {
        const text = await page.evaluate(() => {
          const root = document.querySelector('.game-interface');
          const attributes = [...root.querySelectorAll('*')].flatMap((el) =>
            ['aria-label', 'data-info', 'data-info-title', 'title'].map(
              (name) => el.getAttribute(name) ?? '',
            ),
          );
          return [root.textContent, ...attributes].join('\n');
        });
        if (expectedLang !== 'ko')
          assert.doesNotMatch(text, /[가-힣]/, `${tag} ${screen}: untranslated Korean`);
        assert.doesNotMatch(
          text,
          /\{\d+\}|undefined|__V\d+__|__T\d+__/,
          `${tag} ${screen}: unresolved value`,
        );
        assert.doesNotMatch(
          text,
          /paladog|팔라독|パラドッグ|帕拉狗/i,
          `${tag} ${screen}: old branding`,
        );
        assert.equal(await page.locator('.game-interface').count(), 1);
        screens.push(screen);
        if (capture) await page.screenshot({ path: `${output}/${tag}-${screen}.png` });
      };
      const popup = async (id, capture = false) => {
        await page.locator('#' + id).click();
        await page.locator('.info-scrim').waitFor({ state: 'visible' });
        assert.ok((await page.locator('.info-body').innerText()).trim().length > 0, id);
        await audit(id, capture);
        const rect = await page.locator('.info-dialog').boundingBox();
        assert.ok(
          rect.x >= -1 &&
            rect.y >= -1 &&
            rect.x + rect.width <= page.viewportSize().width + 1 &&
            rect.y + rect.height <= page.viewportSize().height + 1,
          `${tag}: popup bounds`,
        );
        const overflow = await page
          .locator('.info-dialog')
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        assert.equal(overflow, false, `${tag}: popup horizontal overflow`);
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id), id);
      };
      await page.goto(
        process.env.DAWNLEAF_TEST_URL || process.env.PALADOG_TEST_URL || 'http://127.0.0.1:5173',
      );
      await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu'));
      assert.equal(await page.locator('html').getAttribute('lang'), expectedLang);
      assert.equal(await page.locator('.subtitle').innerText(), subtitle);
      assert.equal((await page.locator('#play').innerText()).trim(), playLabel);
      const title = {
        en: 'Dawnleaf Brigade',
        ja: '暁葉の遠征隊',
        'zh-Hans': '晓叶远征队',
        fr: 'Brigade Feuille d’Aube',
        es: 'Brigada Hoja del Alba',
        ko: '새벽잎 원정대',
      }[expectedLang];
      assert.equal(await page.title(), `${title} · ${subtitle}`);
      assert.equal(await page.locator('.menu-copy h1').innerText(), title);
      await audit('menu', true);
      await popup('menu-info');
      await page.locator('#sound').click();
      await audit('settings');
      await popup('settings-info', true);
      await page.locator('#setting-difficulty').click();
      await audit('difficulty-changed');
      await page.locator('#close-sound').click();
      await page.locator('#play').click();
      await audit('modes', true);
      for (let i = 0; i < 3; i++) await popup(`mode-info-${i}`);
      await page.locator('#mode-0').click();
      for (let region = 0; region < 4; region++) {
        await page.locator(`#region-${region}`).click();
        await audit(`map-${region}`, true);
        for (let stage = region * 3; stage < region * 3 + 3; stage++)
          await popup(`stage-info-${stage}`);
      }
      await popup('difficulty-info');
      await page.locator('#region-0').click();
      await page.locator('#stage-0').click();
      await page.waitForFunction(() => window.__game.scene.isActive('Battle'));
      await audit('intro', true);
      await popup('story-info');
      assert.equal(await page.evaluate(() => window.__game.scene.getScene('Battle').paused), true);
      await page.locator('#resume').click();
      await audit('battle', true);
      for (const id of [
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
      ]) {
        await popup(id, id === 'resource-info' || id === 'unit-info-cleric');
        assert.equal(
          await page.evaluate(() => window.__game.scene.getScene('Battle').paused),
          false,
        );
      }
      // Unavailable cards intentionally announce a reason on pointer clicks.
      // Playwright otherwise suppresses clicks on aria-disabled elements.
      await page.locator('#summon-cleric').click({ force: true });
      await page.locator('#toast.visible .glyph-lock').waitFor();
      await popup('event-info');
      await page.locator('#summon-tanker').click();
      await page.waitForFunction(
        () => window.__game.scene.getScene('Battle').allyUnits.countActive() > 0,
      );
      await page.locator('#pause').click();
      await audit('paused');
      await page.locator('#retreat').click();
      await page.locator('#upgrade').click();
      const saveBefore = await page.evaluate(() => localStorage.getItem('paladogweb:save'));
      await audit('workshop', true);
      await popup('detail-info');
      await popup('stats-info');
      await page.locator('#hero-upgrades').click();
      await audit('equipment', true);
      for (const id of [
        'aura-upgrade-info',
        'weapon-group-info',
        'armor-group-info',
        'weapon-info-sun',
        'weapon-info-frost',
        'weapon-info-storm',
        'armor-info-leather',
        'armor-info-bulwark',
        'armor-info-renewal',
      ])
        await popup(id, id === 'aura-upgrade-info');
      assert.equal(await page.evaluate(() => localStorage.getItem('paladogweb:save')), saveBefore);
      await page.locator('#back').click();
      await page.locator('#play').click();
      await page.locator('#mode-0').click();
      await page.locator('#stage-0').click();
      await page.locator('#resume').click();
      await page.evaluate(() => {
        const scene = window.__game.scene.getScene('Battle');
        scene.paladog.takeDamage(9999);
        scene.checkOutcome();
      });
      await page.waitForFunction(() => window.__game.scene.isActive('Result'));
      await audit('defeat', true);
      await popup('result-info');

      // Exercise live survival text and icons, whose semantics must not depend on language.
      await page.locator('#menu').click();
      await page.locator('#play').click();
      await page.locator('#mode-1').click();
      await page.waitForFunction(() => window.__game.scene.isActive('Battle'));
      if (await page.locator('#resume').isVisible()) await page.locator('#resume').click();
      await page.evaluate(() => {
        const scene = window.__game.scene.getScene('Battle');
        scene.nextSurvivalWaveAt = 0;
      });
      await page.locator('#toast.visible .glyph-flag').waitFor();
      assert.ok(Number(await page.locator('#toast b').innerText()) > 0);
      await popup('event-info');
      await audit('survival');
      await page.locator('#pause').click();
      await page.locator('#retreat').click();
      await page.locator('#play').click();
      await page.locator('#mode-2').click();
      await page.waitForFunction(() => window.__game.scene.isActive('Battle'));
      if (await page.locator('#resume').isVisible()) await page.locator('#resume').click();
      await popup('mission-info');
      await audit('boss');
      report.push({ language, expectedLang, mobile, screens });
      await page.close();
      process.stdout.write(`PASS ${tag}: ${screens.length} screen/popup checks\n`);
    }
  assert.deepEqual(errors, []);
  const reportName =
    process.argv.length > 2
      ? `report-${selectedCases.map(([language]) => language).join('-')}`
      : 'report';
  await writeFile(
    `${output}/${reportName}.json`,
    JSON.stringify({ pass: true, report, errors }, null, 2),
  );
} finally {
  await browser.close();
}
