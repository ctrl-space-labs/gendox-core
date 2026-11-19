// Regenerate the transparent GIF from the SVG, sampling a complete six-second loop.
// Requires the e2e suite's Playwright/Chromium and Python 3 with Pillow.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('../../gendox-e2e-tests/node_modules/playwright');

const assets = path.resolve(__dirname, '../public/images/gendox-face');
const fps = 20;
const seconds = 6;

async function main() {
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'gendox-face-loader-'));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 360, height: 180 } });
    const svg = fs.readFileSync(path.join(assets, 'gendox-loader.svg'), 'utf8');
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.locator('svg').evaluate(element => element.pauseAnimations());
    for (let frame = 0; frame < fps * seconds; frame++) {
      await page.locator('svg').evaluate((element, time) => element.setCurrentTime(time), frame / fps);
      await page.screenshot({
        path: path.join(frames, `${String(frame).padStart(3, '0')}.png`),
        omitBackground: true,
      });
    }
    const result = spawnSync('python3', [
      path.join(__dirname, 'encode-face-loader.py'), frames,
      path.join(assets, 'gendox-loader.gif'), String(fps),
    ], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`GIF encoder exited with ${result.status}`);
    console.log(`Generated ${fps * seconds} frames at ${fps} fps: ${path.join(assets, 'gendox-loader.gif')}`);
  } finally {
    if (browser) await browser.close();
    fs.rmSync(frames, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
