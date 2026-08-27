const { test, expect } = require('@playwright/test');

const rooms = ['foyer', 'alcove', 'pet', 'keyscape', 'archive', 'workbench'];
const viewports = [
  { name: 'narrow phone', width: 320, height: 700 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'portrait tablet', width: 768, height: 1024 },
  { name: 'split screen', width: 1024, height: 768 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1080 },
];

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

async function expectVideoReady(video) {
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((element) => element.readyState), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  const dimensions = await video.evaluate((element) => ({ width: element.videoWidth, height: element.videoHeight }));
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.height).toBeGreaterThan(0);
}

async function waitForRoomSettled(page, index) {
  await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(index));
  await expect.poll(() => page.evaluate((roomIndex) => {
    const world = document.querySelector('.museum-world');
    if (!world) return Number.POSITIVE_INFINITY;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    return Math.abs(matrix.m41 + roomIndex * window.innerWidth);
  }, index), { timeout: 5_000 }).toBeLessThan(1);
}

test.describe('Museum production contract', () => {
  test('the root URL is the selected Museum experience', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Museum of Behaviors/i);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'public/favicon-museum-kitten.svg');
    await expect(page.locator('.museum-shell')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/I make software\s*that refuses to\s*sit still/i);
  });

  test('the thesis physically evades a nearby pointer without changing its readable copy', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const thesis = page.locator('[data-restless-thesis]');
    const target = thesis.locator('.restless-word').filter({ hasText: 'software' });
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();
    await thesis.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'mouse', clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 });
    await expect(thesis).toHaveClass(/is-restless/);
    await expect.poll(() => target.locator('.restless-letter').first().evaluate((letter) => getComputedStyle(letter).transform)).not.toBe('none');
    await expect(thesis).toHaveAttribute('aria-label', 'I make software that refuses to sit still.');
  });

  test('the masthead carries Akshit’s identity without prototype or quiet-mode chrome', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.maker-mark__avatar')).toBeVisible();
    await expect(page.locator('.maker-mark')).toContainText(/I make software move/i);
    await expect(page.locator('.prototype-nav')).toHaveCount(0);
    await expect(page.locator('.quiet-toggle')).toHaveCount(0);
    await expect(page.locator('.masthead-exhibit img')).toHaveCount(0);
    await expect(page.locator('.museum-map button')).toHaveCount(6);
  });

  test('the foyer uses an original kitten guide and kitten visitor with roomy speech', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-guide-button] svg')).toHaveAttribute('aria-label', /museum kitten/i);
    await expect(page.locator('.guide-pupil')).toHaveCount(2);
    await expect(page.locator('.visitor__ear')).toHaveCount(2);
    await expect(page.locator('.visitor__paw')).toHaveCount(2);
    const bubblePadding = await page.locator('.guide-speech').evaluate((element) => {
      const style = getComputedStyle(element);
      return [parseFloat(style.paddingTop), parseFloat(style.paddingRight), parseFloat(style.paddingBottom), parseFloat(style.paddingLeft)];
    });
    expect(Math.min(...bubblePadding)).toBeGreaterThanOrEqual(14);
  });

  test('only the current room is exposed and every route remains directly reachable', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    for (let index = 0; index < rooms.length; index += 1) {
      await page.locator(`.museum-map [data-room-target="${index}"]`).click();
      await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(index));
      await expect(page.locator(`#${rooms[index]}`)).toHaveAttribute('aria-hidden', 'false');
      await expect(page.locator('.room[aria-hidden="false"]')).toHaveCount(1);
    }
  });

  test('Alcove notes never cover its uncropped demo', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
      const specimen = page.locator('.alcove-specimen');
      const notes = page.locator('.alcove-notes');
      await expect(specimen).toBeVisible();
      await expect(notes).toBeVisible();
      const [specimenBox, notesBox, objectFit] = await Promise.all([
        specimen.boundingBox(),
        notes.boundingBox(),
        page.locator('.specimen-window--alcove video').evaluate((media) => getComputedStyle(media).objectFit),
      ]);
      expect(overlapArea(specimenBox, notesBox), viewport.name).toBe(0);
      expect(objectFit, viewport.name).toBe('contain');
    }
  });

  test('feature demos decode at their real intrinsic dimensions', async ({ page }) => {
    for (const room of ['alcove', 'pet', 'keyscape']) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      await expectVideoReady(page.locator(`#${room} [data-room-video]`));
      await expect(page.locator(`#${room} [data-room-video]`)).toHaveCSS('object-fit', 'contain');
    }
  });

  test('every demo is configured as a persistent loop', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('video')).toHaveCount(5);
    await expect(page.locator('video:not([loop])')).toHaveCount(0);
  });

  test('cold rooms keep video bytes lazy until a visitor enters', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('video source[src]')).toHaveCount(0);
    await expect(page.locator('video source[data-src]')).toHaveCount(10);

    await page.locator('.museum-map [data-room-target="1"]').click();
    await expect.poll(() => page.locator('#alcove video source[src]').count()).toBeGreaterThan(0);
    await expect(page.locator('#pet video source[src]')).toHaveCount(0);
  });

  test('every moving feature has a persistent play and pause control', async ({ page }) => {
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const video = page.locator('#alcove [data-room-video]');
    const control = page.locator('#alcove [data-video-toggle]');
    await expectVideoReady(video);
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
    await expect(control).toHaveAttribute('aria-label', /Pause Alcove/i);

    await control.click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
    await expect(control).toHaveAttribute('aria-label', /Play Alcove/i);

    await page.locator('.museum-map [data-room-target="2"]').click();
    await page.locator('.museum-map [data-room-target="1"]').click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);

    await control.click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  });

  test('interactive exhibits visibly announce and react to touch', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.interaction-cue')).toHaveCount(4);
    await expect(page.locator('.interaction-cue').first()).toContainText(/try|touch|click|swipe|play/i);

    await page.locator('[data-guide-button]').click();
    await expect(page.locator('[data-guide]')).toHaveClass(/is-greeting/);
    await page.goto('/#alcove');
    await page.locator('[data-disturb-books]').click();
    await expect(page.locator('.edge-shelf').first()).toHaveClass(/is-disturbed/);
    await page.goto('/#pet');
    await page.locator('[data-call-pet]').click();
    await expect(page.locator('#pet')).toHaveClass(/is-called/);
    await page.goto('/#keyscape');
    await page.locator('[data-light-key="gold"]').click();
    await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'gold');
  });

  test('archive exposes stars and switches among three real README films', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('.archive-project-tab');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('#archive')).toContainText('719');
    await expect(page.locator('#archive')).toContainText('310');
    await expect(page.locator('#archive')).toContainText('127');
    await expect(page.locator('[data-archive-video]')).toHaveAttribute('loop', '');

    for (const [index, title] of [[0, /Interactive LLM/i], [1, /Video tutorial/i], [2, /CupcakeAGI/i]]) {
      await tabs.nth(index).click();
      await expect(page.locator('[data-archive-title]')).toHaveText(title);
      await expect(page.locator('#archive')).toHaveAttribute('data-archive-project', ['npc', 'tutorial', 'cupcake'][index]);
      await expectVideoReady(page.locator('[data-archive-video]'));
      await expect.poll(() => page.locator('[data-archive-video]').evaluate((video) => video.duration)).toBeGreaterThan(30);
      await expect(page.locator('[data-archive-counter]')).toContainText(`0${index + 1} / 03`);
    }
  });

  test('archive and workbench environments visibly retheme with their selected object', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const archive = page.locator('#archive');
    const npcAccent = await archive.evaluate((element) => getComputedStyle(element).getPropertyValue('--archive-accent').trim());
    await page.locator('[data-archive-project="tutorial"]').click();
    const tutorialAccent = await archive.evaluate((element) => getComputedStyle(element).getPropertyValue('--archive-accent').trim());
    expect(tutorialAccent).not.toBe(npcAccent);
    await expect(archive).toHaveAttribute('data-archive-project', 'tutorial');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-frame', 'archive-tutorial');
    await expect(page).toHaveTitle(/Video tutorial/i);

    await page.goto('/#workbench');
    const workbench = page.locator('#workbench');
    const emailAccent = await workbench.evaluate((element) => getComputedStyle(element).getPropertyValue('--tool-accent').trim());
    await page.locator('[data-tool="gifsmith"]').click();
    const gifsmithAccent = await workbench.evaluate((element) => getComputedStyle(element).getPropertyValue('--tool-accent').trim());
    expect(gifsmithAccent).not.toBe(emailAccent);
    await expect(workbench).toHaveAttribute('data-tool', 'gifsmith');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-frame', 'workbench-gifsmith');
    await expect(page).toHaveTitle(/Gifsmith/i);
  });

  test('the masthead and map inherit every room material, including a compact mobile room label', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const frameSurfaces = [];
    for (let index = 0; index < rooms.length; index += 1) {
      await page.locator(`.museum-map [data-room-target="${index}"]`).click();
      await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(index));
      await page.waitForTimeout(480);
      const [mastheadColor, mapColor] = await Promise.all([
        page.locator('.museum-masthead').evaluate((element) => getComputedStyle(element).backgroundColor),
        page.locator('.museum-map').evaluate((element) => getComputedStyle(element).backgroundColor),
      ]);
      expect(mapColor).toBe(mastheadColor);
      frameSurfaces.push(await page.locator('.museum-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--frame-surface').trim()));
    }
    expect(new Set(frameSurfaces).size).toBe(rooms.length);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#keyscape');
    await expect(page.locator('.masthead-exhibit')).toBeVisible();
    await expect(page.locator('[data-room-reading]')).toContainText('Keyscape');
  });

  test('map connectors reserve their own gap instead of entering the next button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const buttons = page.locator('.museum-map button');
    for (let index = 0; index < 5; index += 1) {
      const marker = buttons.nth(index).locator('i');
      const [markerBox, nextBox] = await Promise.all([marker.boundingBox(), buttons.nth(index + 1).boundingBox()]);
      expect(overlapArea(markerBox, nextBox), `connector ${index}`).toBe(0);
    }
  });

  test('the mobile kitten owns a navigation corridor instead of covering exhibit controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const room of ['alcove', 'pet', 'keyscape', 'archive', 'workbench']) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      await page.locator(`#${room}`).evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }));
      const visitorBox = await page.locator('.visitor').boundingBox();
      const controls = page.locator(`#${room} button:visible, #${room} a:visible`);
      for (let index = 0; index < await controls.count(); index += 1) {
        expect(overlapArea(visitorBox, await controls.nth(index).boundingBox()), `${room} control ${index}`).toBe(0);
      }
    }
  });

  test('archive pause choice survives film and room changes', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const video = page.locator('[data-archive-video]');
    const control = page.locator('[data-archive-play]');
    await expectVideoReady(video);
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
    await control.click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
    await page.locator('[data-archive-project="tutorial"]').click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
    await page.locator('.museum-map [data-room-target="3"]').click();
    await page.locator('.museum-map [data-room-target="4"]').click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
  });

  test('workbench keeps every utility separate and switches video and still media', async ({ page }) => {
    await page.goto('/#workbench', { waitUntil: 'domcontentloaded' });
    const selectors = page.locator('.tool-selector');
    await expect(selectors).toHaveCount(4);
    await expect(selectors.filter({ hasText: 'Email Briefing' })).toHaveCount(1);
    await expect(selectors.filter({ hasText: 'Gifsmith' })).toHaveCount(1);
    await expect(selectors.filter({ hasText: 'Compendium' })).toHaveCount(1);
    await expect(selectors.filter({ hasText: 'Transparency App' })).toHaveCount(1);

    await selectors.filter({ hasText: 'Gifsmith' }).click();
    await expect(page.locator('.workbench-feature h3')).toHaveText('Gifsmith');
    await expectVideoReady(page.locator('[data-tool-video]'));
    await expect(page.locator('[data-tool-video]')).not.toHaveAttribute('hidden', '');

    await selectors.filter({ hasText: 'Transparency App' }).click();
    await expect(page.locator('.workbench-feature h3')).toHaveText('Transparency App');
    await expect(page.locator('[data-tool-media]')).toBeVisible();
    await expect(page.locator('[data-tool-video]')).toBeHidden();
  });

  test('keyboard, touch swipe, and rapid direct navigation all land cleanly', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '1');
    await page.keyboard.press('End');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '5');
    await page.keyboard.press('Home');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '0');

    const room = page.locator('.room.is-current');
    await room.dispatchEvent('pointerdown', { pointerId: 9, pointerType: 'touch', clientX: 280, clientY: 420, button: 0 });
    await room.dispatchEvent('pointerup', { pointerId: 9, pointerType: 'touch', clientX: 70, clientY: 422, button: 0 });
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '1');

    for (const index of [5, 2, 4, 1, 3, 0, 5]) {
      await page.locator(`.museum-map [data-room-target="${index}"]`).click();
    }
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '5');
    await expect(page.locator('.room[aria-hidden="false"]')).toHaveCount(1);
  });

  test('tablists own their arrow, Home, and End keys without changing rooms', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const archiveTabs = page.locator('.archive-project-tab');
    await archiveTabs.first().focus();
    await page.keyboard.press('End');
    await expect(archiveTabs.last()).toBeFocused();
    await expect(archiveTabs.last()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '4');
    await page.keyboard.press('Home');
    await expect(archiveTabs.first()).toBeFocused();

    await page.goto('/#workbench');
    const toolTabs = page.locator('.tool-selector');
    await toolTabs.first().focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(650);
    await expect(toolTabs.last()).toBeFocused();
    await expect(toolTabs.last()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '5');
  });

  test('Keyscape lights respond to native Enter and Space activation', async ({ page }) => {
    await page.goto('/#keyscape', { waitUntil: 'domcontentloaded' });
    const gold = page.locator('[data-light-key="gold"]');
    await gold.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'gold');
    await expect(gold).toHaveAttribute('aria-pressed', 'true');

    const coral = page.locator('[data-light-key="coral"]');
    await coral.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'coral');
    await expect(coral).toHaveAttribute('aria-pressed', 'true');
  });

  test('reduced motion removes the arrival sequence and pauses moving media', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.museum-shell')).not.toHaveClass(/is-intro/);
    await expect(page.locator('.ambient-canvas')).toHaveCSS('display', 'none');
    await expect.poll(() => page.locator('#alcove [data-room-video]').evaluate((video) => video.paused)).toBe(true);
  });

  test('mobile scroll affordance appears only while more exhibit remains below', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const hint = page.locator('.mobile-scroll-hint');
    await expect(hint).toHaveClass(/is-visible/);
    await page.locator('#archive').evaluate((room) => room.scrollTo({ top: room.scrollHeight, behavior: 'instant' }));
    await expect(hint).not.toHaveClass(/is-visible/);
  });

  test('short split-screen heights expose every room through vertical scrolling', async ({ page }) => {
    for (const viewport of [
      { width: 768, height: 500 },
      { width: 1024, height: 480 },
      { width: 1440, height: 600 },
    ]) {
      await page.setViewportSize(viewport);
      for (const room of rooms) {
        await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
        const current = page.locator('.room.is-current');
        await expect.poll(() => current.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
        await current.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }));
        await expect.poll(() => current.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      }
    }
  });
});

for (const viewport of viewports) {
  test(`all rooms stay aligned without page errors at ${viewport.name}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const [roomIndex, room] of rooms.entries()) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      await waitForRoomSettled(page, roomIndex);
      const geometry = await page.evaluate(() => {
        const current = document.querySelector('.room.is-current');
        const canvas = current?.querySelector('.room-canvas')?.getBoundingClientRect();
        return {
          viewportWidth: document.documentElement.clientWidth,
          bodyWidth: document.body.scrollWidth,
          roomWidth: current?.clientWidth || 0,
          stageWidth: document.querySelector('.museum-stage')?.clientWidth || 0,
          canvas: canvas ? { left: canvas.left, right: canvas.right } : null,
        };
      });
      expect(geometry.bodyWidth, `${viewport.name} ${room}`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.roomWidth, `${viewport.name} ${room}`).toBeLessThanOrEqual(geometry.stageWidth + 1);
      expect(geometry.canvas.left, `${viewport.name} ${room}`).toBeGreaterThanOrEqual(-1);
      expect(geometry.canvas.right, `${viewport.name} ${room}`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    }
    expect(errors).toEqual([]);
  });
}
