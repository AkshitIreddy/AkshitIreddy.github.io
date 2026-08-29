// Capture all six rooms at responsive breakpoints for scroll-depth review.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const outRoot = path.join('qa', 'rooms-responsive');
fs.mkdirSync(outRoot, { recursive: true });

const BASE = 'http://127.0.0.1:49173/index.html';
const rooms = [
  ['foyer', '00-foyer'],
  ['alcove', '01-alcove'],
  ['pet', '02-pet'],
  ['keyscape', '03-keyscape'],
  ['archive', '04-archive'],
  ['workbench', '05-workbench'],
];
const viewports = [
  ['390x844', { width: 390, height: 844 }],
  ['768x1024', { width: 768, height: 1024 }],
  ['1440x900', { width: 1440, height: 900 }],
  ['2560x1080', { width: 2560, height: 1080 }],
];

(async () => {
  const browser = await chromium.launch();
  const metrics = [];

  for (const [label, viewport] of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    for (const [hash, name] of rooms) {
      await page.goto(`${BASE}#${hash}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const scrollHeight = await page.locator(`#${hash} .room-canvas`).evaluate((el) => el.scrollHeight);
      metrics.push({ label, room: name, scrollHeight });
      await page.screenshot({ path: path.join(outRoot, `${name}-${label}.png`), fullPage: false });
    }
    await page.close();
  }

  const alcovePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await alcovePage.goto(`${BASE}#alcove`, { waitUntil: 'domcontentloaded' });
  await alcovePage.waitForTimeout(900);
  await alcovePage.locator('[data-open-book]').click();
  await alcovePage.waitForTimeout(900);
  await alcovePage.screenshot({ path: path.join(outRoot, '01-alcove-book-open-390x844.png') });
  await alcovePage.close();

  await browser.close();
  fs.writeFileSync(path.join(outRoot, 'scroll-metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`);
  console.log('captured responsive room frames to', outRoot);
})();
