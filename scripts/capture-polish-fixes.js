// Capture polish-fix verification frames into qa/rooms-polish/.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const outRoot = path.join('qa', 'rooms-polish');
fs.mkdirSync(outRoot, { recursive: true });

const BASE = 'http://127.0.0.1:49173/index.html';

(async () => {
  const browser = await chromium.launch();
  for (const [label, viewport] of [
    ['1440', { width: 1440, height: 900 }],
    ['390', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.goto(`${BASE}#alcove`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outRoot, `alcove-book-closed-${label}.png`) });

    await page.locator('[data-open-book]').click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outRoot, `alcove-book-open-${label}.png`) });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [hash, name] of [['foyer', 'foyer'], ['alcove', 'alcove'], ['keyscape', 'keyscape']]) {
    await page.goto(`${BASE}#${hash}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(outRoot, `nav-theme-${name}-1440.png`) });
  }

  await page.goto(`${BASE}#pet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.locator('[data-call-pet]').click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outRoot, 'pet-creature-midvisit-1440.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#pet`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.locator('[data-call-pet]').click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outRoot, 'pet-creature-midvisit-390.png') });
  await page.close();

  await browser.close();
  console.log('captured polish frames to', outRoot);
})();
