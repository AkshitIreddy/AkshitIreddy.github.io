const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.PORTFOLIO_URL || 'http://127.0.0.1:49173/';
const hash = (process.argv[2] || 'foyer').replace(/^#/, '');
const width = Number(process.argv[3]) || 1440;
const height = Number(process.argv[4]) || 900;
const label = process.argv[5] || `${hash}-${width}x${height}`;
const selection = process.argv[6] || '';
const outputRoot = path.resolve('qa/closeup-review', label);

function closeupClips(viewportWidth, viewportHeight) {
  const clipWidth = Math.ceil(viewportWidth * 0.56);
  const clipHeight = Math.ceil(viewportHeight * 0.42);
  const middleY = Math.round((viewportHeight - clipHeight) / 2);
  return [
    { name: '01-top-left', x: 0, y: 0, width: clipWidth, height: clipHeight },
    { name: '02-top-right', x: viewportWidth - clipWidth, y: 0, width: clipWidth, height: clipHeight },
    { name: '03-middle-left', x: 0, y: middleY, width: clipWidth, height: clipHeight },
    { name: '04-middle-right', x: viewportWidth - clipWidth, y: middleY, width: clipWidth, height: clipHeight },
    { name: '05-bottom-left', x: 0, y: viewportHeight - clipHeight, width: clipWidth, height: clipHeight },
    { name: '06-bottom-right', x: viewportWidth - clipWidth, y: viewportHeight - clipHeight, width: clipWidth, height: clipHeight },
  ];
}

(async () => {
  fs.mkdirSync(outputRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto(`${baseUrl}#${hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction((roomId) => {
    const room = document.querySelector(`#${roomId}`);
    const world = document.querySelector('.museum-world');
    if (!room?.classList.contains('is-current') || !world) return false;
    const index = [...document.querySelectorAll('.room')].indexOf(room);
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    return Math.abs(matrix.m41 + index * window.innerWidth) < 1;
  }, hash, { timeout: 5_000 });
  if (selection && hash === 'archive') await page.locator(`.archive-project-tab[data-archive-project="${selection}"]`).click();
  if (selection && hash === 'workbench') await page.locator(`.tool-selector[data-tool="${selection}"]`).click();
  if (selection === 'restless' && hash === 'foyer') {
    const thesis = page.locator('[data-restless-thesis]');
    const bounds = await thesis.boundingBox();
    if (bounds) await page.mouse.move(bounds.x + bounds.width * .58, bounds.y + bounds.height * .52);
  }
  await page.waitForTimeout(550);

  for (const clip of closeupClips(width, height)) {
    await page.screenshot({ path: path.join(outputRoot, `${clip.name}.png`), clip });
  }
  await page.screenshot({ path: path.join(outputRoot, '07-full.png') });

  const currentRoom = page.locator('.room.is-current');
  const canScroll = await currentRoom.evaluate((room) => room.scrollHeight > room.clientHeight + 8);
  if (canScroll) {
    await currentRoom.evaluate((room) => room.scrollTo({ top: room.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(180);
    await page.screenshot({ path: path.join(outputRoot, '08-scroll-end.png') });
  }

  await browser.close();
  if (errors.length) {
    console.error([...new Set(errors)].join('\n'));
    process.exitCode = 1;
  } else {
    console.log(outputRoot);
  }
})();
