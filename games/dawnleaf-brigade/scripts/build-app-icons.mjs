import { chromium } from 'playwright';
import { URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
const svg = await readFile(new URL('../public/app-icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === 'darwin' ? { channel: 'chrome' } : {}),
});
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>body{margin:0;background:#0d3028}svg{width:100vw;height:100vh;display:block}</style>${svg}`,
    );
    await page.screenshot({
      path: new URL(`../public/app-icon-${size}.png`, import.meta.url).pathname,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
