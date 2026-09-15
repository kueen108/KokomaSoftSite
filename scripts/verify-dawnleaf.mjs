import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../games/dawnleaf-brigade/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const base =
  process.env.DAWNLEAF_URL || "http://127.0.0.1:4322/games/dawnleaf-brigade/";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "darwin" ? { channel: "chrome" } : {}),
});
try {
  for (const [locale, expected] of [
    ["en-US", "en"],
    ["ko-KR", "ko"],
    ["ja-JP", "ja"],
    ["zh-CN", "zh-Hans"],
    ["fr-FR", "fr"],
    ["es-ES", "es"],
    ["de-DE", "en"],
  ]) {
    const page = await browser.newPage({
      locale,
      viewport: { width: 1280, height: 720 },
    });
    const errors = [],
      failed = [],
      loaded = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.url().startsWith(base)) {
        if (r.status() >= 400) failed.push([r.status(), r.url()]);
        else loaded.push(r.url());
      }
    });
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    await page.waitForSelector("#play", { timeout: 60000 });
    assert.equal(await page.locator("html").getAttribute("lang"), expected);
    assert.equal(
      await page.evaluate(() => typeof window.__game),
      "undefined",
      "production must not expose dev handle",
    );
    await page.click("#upgrade");
    await page.waitForSelector("#hero-upgrades");
    await page.click("#back");
    await page.waitForSelector("#play");
    await page.click("#play");
    await page.waitForSelector("#mode-0");
    await page.click("#mode-0");
    await page.waitForSelector("#region-0");
    await page.click("#region-0");
    await page.waitForSelector("#stage-0");
    const art = await page.locator("#stage-0").getAttribute("style");
    assert.ok(art.includes("/games/dawnleaf-brigade/assets/images/"));
    await page.click("#stage-0");
    await page.waitForSelector("#resume");
    await page.click("#resume");
    await page.waitForTimeout(1500);
    for (const image of [
      "party-portraits-novice-v2.png",
      "party-portraits-trained-v2.png",
      "expedition-portraits-v2.png",
      "forest-battle.webp",
    ])
      assert.ok(
        loaded.some((u) => u.endsWith(image)),
        `missing ${image}`,
      );
    assert.ok(
      loaded.some((u) => u.endsWith("Galmuri11.woff2")),
      "game font loads from subdirectory",
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    console.log(
      JSON.stringify({
        locale,
        expected,
        loadedAssets: loaded.length,
        pass: true,
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
