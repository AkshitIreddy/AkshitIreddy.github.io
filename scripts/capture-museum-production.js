const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.PORTFOLIO_URL || 'http://127.0.0.1:49173/';
const rooms = ['foyer', 'alcove', 'pet', 'keyscape', 'archive', 'workbench'];
const viewports = [
  ['phone-320', 320, 700],
  ['phone-390', 390, 844],
  ['tablet-768', 768, 1024],
  ['split-1024', 1024, 768],
  ['desktop-1440', 1440, 900],
  ['desktop-1920', 1920, 1080],
  ['ultrawide-2560', 2560, 1080],
  ['short-768x500', 768, 500],
  ['short-1024x480', 1024, 480],
  ['short-1440x600', 1440, 600],
];

const settle = (page, milliseconds = 1150) => page.waitForTimeout(milliseconds);

async function waitForVisibleVideo(page) {
  const video = page.locator('.room.is-current video:visible').first();
  if (!await video.count()) return;
  await video.evaluate((element) => {
    if (element.readyState >= 2) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      element.addEventListener('loadeddata', done, { once: true });
      element.addEventListener('error', done, { once: true });
      window.setTimeout(done, 2500);
    });
  });
}

async function waitForRoomSettled(page, index) {
  await page.waitForFunction((roomIndex) => {
    const shell = document.querySelector('.museum-shell');
    const world = document.querySelector('.museum-world');
    if (!shell || !world || shell.dataset.currentRoom !== String(roomIndex)) return false;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    return Math.abs(matrix.m41 + roomIndex * window.innerWidth) < 1;
  }, index, { timeout: 5_000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const outRoot = path.resolve(process.env.PORTFOLIO_OUTPUT || 'qa/production-final');
  fs.mkdirSync(outRoot, { recursive: true });
  const errors = [];

  for (const [name, width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`${name}: ${message.text()}`);
    });

    for (let index = 0; index < rooms.length; index += 1) {
      const room = rooms[index];
      await page.goto(`${baseUrl}#${room}`, { waitUntil: 'domcontentloaded' });
      await waitForRoomSettled(page, index);
      await waitForVisibleVideo(page);
      await settle(page);
      const prefix = `${name}-${String(index).padStart(2, '0')}-${room}`;
      await page.screenshot({ path: path.join(outRoot, `${prefix}-top.png`), fullPage: false });

      if (width <= 390 || height <= 620) {
        const currentRoom = page.locator('.room.is-current');
        const scrollable = await currentRoom.evaluate((element) => element.scrollHeight > element.clientHeight + 18);
        if (scrollable) {
          await currentRoom.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }));
          await settle(page, 260);
          await page.screenshot({ path: path.join(outRoot, `${prefix}-detail.png`), fullPage: false });
        }
      }
    }
    await context.close();
  }

  const interactionContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await interactionContext.newPage();
  page.on('pageerror', (error) => errors.push(`interactions: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`interactions: ${message.text()}`);
  });

  const captureInteraction = async (name, hash, action) => {
    await page.goto(`${baseUrl}#${hash}`, { waitUntil: 'domcontentloaded' });
    await waitForRoomSettled(page, rooms.indexOf(hash));
    await action();
    await waitForVisibleVideo(page);
    await settle(page, 420);
    await page.screenshot({ path: path.join(outRoot, `interaction-${name}.png`), fullPage: false });
  };

  await captureInteraction('guide-greeting', 'foyer', async () => page.locator('[data-guide-button]').click());
  await captureInteraction('alcove-annotated', 'alcove', async () => page.locator('[data-alcove-notes]').click());
  await captureInteraction('pet-called', 'pet', async () => page.locator('[data-call-pet]').click());
  await captureInteraction('keyscape-physics', 'keyscape', async () => page.locator('[data-light-key="physics"]').click());
  await captureInteraction('archive-cupcake', 'archive', async () => page.locator('[data-archive-project="cupcake"]').click());
  await captureInteraction('workbench-gifsmith', 'workbench', async () => page.locator('[data-tool="gifsmith"]').click());
  await captureInteraction('workbench-transparency', 'workbench', async () => page.locator('[data-tool="transparency"]').click());

  await interactionContext.close();
  await browser.close();

  if (errors.length) {
    console.error([...new Set(errors)].join('\n'));
    process.exitCode = 1;
  }
})();
