// Capture every room of the horizontal portfolio at desktop, tablet, and phone
// sizes into qa/rooms/<viewport>/ for visual review. Usage:
//   node scripts/capture-rooms.js [outDir]
// Requires the dev server on 127.0.0.1:49173 (node scripts/serve.js).
const { chromium } = require('@playwright/test');
const path = require('path');

const outRoot = process.argv[2] || path.join('qa', 'rooms');
const rooms = ['foyer', 'alcove', 'pet', 'keyscape', 'archive', 'workbench'];
const viewports = [
  ['desktop', { width: 1440, height: 900 }],
  ['tablet', { width: 768, height: 1024 }],
  ['phone', { width: 390, height: 844 }],
];

(async () => {
  const browser = await chromium.launch();
  for (const [vpName, viewport] of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on('pageerror', (err) => console.error(`[pageerror:${vpName}]`, err.message));
    await page.goto('http://127.0.0.1:49173/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);
    for (let i = 0; i < rooms.length; i++) {
      await page.evaluate((index) => {
        const btn = document.querySelector(`.museum-map [data-room-target="${index}"]`);
        if (btn) btn.click();
      }, i);
      await page.waitForTimeout(vpName === 'phone' ? 900 : 1100);
      await page.screenshot({ path: path.join(outRoot, vpName, `${String(i).padStart(2, '0')}-${rooms[i]}.png`) });
    }
    await page.close();
  }
  await browser.close();
  console.log('captured to', outRoot);
})();
