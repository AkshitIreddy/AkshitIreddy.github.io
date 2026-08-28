const { test, expect } = require('@playwright/test');

const rooms = ['foyer', 'alcove', 'pet', 'keyscape', 'archive', 'workbench'];
const roomIndex = Object.fromEntries(rooms.map((room, index) => [room, index]));
const expectedStylesheets = [
  'styles/site.css',
  'styles/rooms.css',
];
const expectedScripts = [
  'scripts/museum.js',
  'scripts/premium/localized-motion.js',
  'scripts/premium/alcove.js',
  'scripts/premium/pet.js',
  'scripts/premium/archive.js',
  'scripts/premium/bootstrap.js',
];
const expectedPublicAssets = [
  'public/favicon-aperture-16.png',
  'public/favicon-aperture-180.png',
  'public/favicon-aperture-32.png',
  'public/favicon-aperture-48.png',
  'public/favicon-aperture-mask.svg',
  'public/favicon-aperture.svg',
  'public/fonts/dm-sans-latin-variable.woff2',
  'public/fonts/fraunces-latin-variable.woff2',
  'public/fonts/ibm-plex-mono-400.woff2',
  'public/fonts/ibm-plex-mono-600.woff2',
  'public/fonts/ibm-plex-mono-700.woff2',
  'public/media/archive/cupcakeagi-poster.webp',
  'public/media/archive/cupcakeagi.mp4',
  'public/media/archive/cupcakeagi.webm',
  'public/media/archive/interactive-llm-npcs-poster.webp',
  'public/media/archive/interactive-llm-npcs.mp4',
  'public/media/archive/interactive-llm-npcs.webm',
  'public/media/archive/video-tutorial-poster.webp',
  'public/media/archive/video-tutorial.mp4',
  'public/media/archive/video-tutorial.webm',
  'public/media/features/alcove-poster.webp',
  'public/media/features/alcove.mp4',
  'public/media/features/alcove.webm',
  'public/media/features/compendium-poster.webp',
  'public/media/features/compendium.mp4',
  'public/media/features/compendium.webm',
  'public/media/features/email-poster.webp',
  'public/media/features/email.mp4',
  'public/media/features/email.webm',
  'public/media/features/gifsmith-poster.webp',
  'public/media/features/gifsmith.mp4',
  'public/media/features/gifsmith.webm',
  'public/media/features/keyscape-poster.webp',
  'public/media/features/keyscape.mp4',
  'public/media/features/keyscape.webm',
  'public/media/features/pet-poster.webp',
  'public/media/features/pet.mp4',
  'public/media/features/pet.webm',
  'public/media/features/transparency.webp',
  'public/media/generated/hero-studio-night-v1.webp',
  'public/site.webmanifest',
  'public/social-preview.png',
];
const deletedLegacySelectors = [
  '.ambient-canvas',
  '.visitor',
  '.visitor-rail',
  '.doorway',
  '.foyer-luminaires',
  '.foyer-luminaire',
  '[data-motion-fixture]',
  '[data-calm-fixture]',
  '.guide-plinth',
  '[data-guide]',
  '[data-guide-button]',
  '[data-guide-speech]',
  '.room-atmosphere',
  '.habitat-backdrop',
  '.glass-pane',
  '.desktop-companion',
  '.behavior-console',
  '.habitat-caption',
  '.system-rail',
  '.keyscape-stars',
  '.keyscape-beam',
  '.keyscape-signal-flow',
  '.keyscape-keyboard',
  '.keyscape-spectrum',
  '.archive-atmosphere',
  '.reliquary',
  '.cabinet-object__niche',
  '.instrument-tab__object',
  '[class*="-miniature"]',
];

async function openRoom(page, room, options = {}) {
  await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded', ...options });
  await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(roomIndex[room]));
  await expect(page.locator(`#${room}`)).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.room[aria-hidden="false"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate((index) => {
    const world = document.querySelector('.museum-world');
    if (!world) return Number.POSITIVE_INFINITY;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    return Math.abs(matrix.m41 + index * innerWidth);
  }, roomIndex[room]), { timeout: 5_000 }).toBeLessThan(1);
}

async function selectRoom(page, index) {
  await page.locator(`.museum-map [data-room-target="${index}"]`).click();
  await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(index));
  await expect(page.locator(`#${rooms[index]}`)).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(() => page.evaluate((target) => {
    const world = document.querySelector('.museum-world');
    if (!world) return Number.POSITIVE_INFINITY;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    return Math.abs(matrix.m41 + target * innerWidth);
  }, index), { timeout: 5_000 }).toBeLessThan(1);
}

async function expectImageReady(image) {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 0 && node.naturalHeight > 0), {
    timeout: 15_000,
    message: 'expected the real image asset to decode with non-zero dimensions',
  }).toBe(true);
}

async function expectVideoReady(video) {
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((node) => Boolean(node.currentSrc) && node.readyState >= 1 && node.videoWidth > 0 && node.videoHeight > 0), {
    timeout: 15_000,
    message: 'expected the real video asset to load metadata with non-zero dimensions',
  }).toBe(true);
}

async function expectNoHorizontalOverflow(page, room) {
  const overflow = await page.locator(`#${room}`).evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth, `${room} room overflows horizontally`).toBeLessThanOrEqual(overflow.clientWidth + 1);
  expect(overflow.documentWidth, `${room} document overflows horizontally`).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

async function supportingTextBelow(page, minimumPx) {
  return page.locator('.room[aria-hidden="false"], .museum-masthead, .museum-map').evaluateAll((roots, minimum) => {
    const ignored = 'script,style,svg,canvas,img,picture,video,h1,h2,h3,.sr-only,.room-announcer,[aria-hidden="true"]';
    const seen = new Set();
    const failures = [];

    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent.replace(/\s+/g, ' ').trim();
        const element = walker.currentNode.parentElement;
        if (!element || text.length <= 1 || element.closest(ignored) || seen.has(element)) continue;
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        const visible = style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity) > 0
          && bounds.width > 0
          && bounds.height > 0
          && bounds.right > 0
          && bounds.left < innerWidth
          && bounds.bottom > 0
          && bounds.top < innerHeight;
        if (!visible) continue;
        seen.add(element);
        let size = Number.parseFloat(style.fontSize);
        if (size === 0) {
          const pseudo = getComputedStyle(element, '::after');
          const content = pseudo.content;
          if (content === 'none' || content === 'normal' || content === '""') continue;
          size = Number.parseFloat(pseudo.fontSize);
        }
        if (size + 0.01 < minimum) {
          failures.push({
            text: text.slice(0, 70),
            selector: element.id ? `#${element.id}` : element.className ? `${element.tagName.toLowerCase()}.${String(element.className).trim().replace(/\s+/g, '.')}` : element.tagName.toLowerCase(),
            size,
          });
        }
      }
    }
    return failures;
  }, minimumPx);
}

test.describe('calm redesign production contract', () => {
  let runtimeErrors;

  test.beforeEach(async ({ page }) => {
    runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) runtimeErrors.push(`console: ${message.text()}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) runtimeErrors.push(`http ${response.status()}: ${response.url()}`);
    });
  });

  test.afterEach(async () => {
    expect(runtimeErrors, `unexpected browser errors:\n${runtimeErrors.join('\n')}`).toEqual([]);
  });

  test('preserves the thesis and exposes six direct routes through a complete responsive chapter nav', async ({ page }) => {
    test.setTimeout(40_000);

    await openRoom(page, 'foyer');
    expect(await page.locator('[data-room-video] source[src]').count(), 'cold videos must not fetch on the foyer').toBe(0);

    for (const room of rooms) {
      await openRoom(page, room);
      await expect(page).toHaveURL(new RegExp(`#${room}$`));
      await expectNoHorizontalOverflow(page, room);
    }

    await openRoom(page, 'foyer');
    const thesis = page.locator('#foyer-title');
    await expect(thesis).toHaveAttribute('aria-label', 'I make software that refuses to sit still.');
    expect((await thesis.innerText()).replace(/\s+/g, ' ').trim()).toBe('I make software that refuses to sit still.');

    const mapButtons = page.locator('.museum-map [data-room-target]');
    await expect(mapButtons).toHaveCount(6);
    for (let index = 0; index < rooms.length; index += 1) await expect(mapButtons.nth(index)).toBeVisible();

    await expect(
      page.locator(deletedLegacySelectors.join(',')),
      'deleted museum ornaments and fake project art must be absent from the production DOM, not hidden with CSS',
    ).toHaveCount(0);

    const dependencies = await page.evaluate(async () => {
      const localPath = (value) => {
        const url = new URL(value, location.href);
        return url.origin === location.origin ? url.pathname.replace(/^\//, '') : value;
      };
      const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"][href]')].map((link) => localPath(link.getAttribute('href')));
      const scripts = [...document.querySelectorAll('script[src]')].map((script) => localPath(script.getAttribute('src')));
      const publicAssets = new Set();
      const recordAsset = (value) => {
        if (!value || !value.includes('public/')) return;
        try {
          const pathname = new URL(value, location.href).pathname;
          const publicIndex = pathname.indexOf('/public/');
          if (publicIndex >= 0) publicAssets.add(pathname.slice(publicIndex + 1));
        } catch {
          const match = value.match(/(?:\.\.\/)?(public\/[A-Za-z0-9_./-]+)/);
          if (match) publicAssets.add(match[1]);
        }
      };
      document.querySelectorAll('*').forEach((element) => {
        for (const attribute of element.attributes) recordAsset(attribute.value);
      });
      const dependencySources = await Promise.all([...stylesheets, ...scripts].map(async (dependency) => {
        const response = await fetch(dependency);
        if (!response.ok) throw new Error(`failed to inspect ${dependency}: ${response.status}`);
        return response.text();
      }));
      for (const source of dependencySources) {
        for (const match of source.matchAll(/(?:\.\.\/)?public\/[A-Za-z0-9_./-]+/g)) recordAsset(match[0]);
      }
      return {
        stylesheets,
        scripts,
        publicAssets: [...publicAssets].sort(),
      };
    });
    expect(dependencies.stylesheets, 'production stylesheet ownership changed without updating the calm contract').toEqual(expectedStylesheets);
    expect(dependencies.scripts, 'production script ownership changed without updating the calm contract').toEqual(expectedScripts);
    expect(dependencies.publicAssets, 'production public asset ownership changed without updating the calm contract').toEqual(expectedPublicAssets);

    const hero = page.locator('.calm-hero-art img');
    await expectImageReady(hero);
    const desktopArt = await hero.boundingBox();
    expect(desktopArt.width).toBeGreaterThan(600);
    expect(desktopArt.x).toBeGreaterThanOrEqual(-1);
    expect(desktopArt.x + desktopArt.width).toBeLessThanOrEqual(1441);

    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => ({
      href: anchor.getAttribute('href'),
      target: anchor.getAttribute('target'),
      rel: anchor.getAttribute('rel') || '',
    })));
    for (const link of links) {
      if (link.href.startsWith('#')) continue;
      const url = new URL(link.href, 'http://127.0.0.1:49173/');
      expect(['http:', 'https:']).toContain(url.protocol);
      expect(url.hostname).not.toBe('');
      if (link.target === '_blank') expect(link.rel.split(/\s+/)).toContain('noreferrer');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await openRoom(page, 'foyer');
    await expectImageReady(hero);
    const mobileArt = await hero.boundingBox();
    expect(mobileArt.x).toBeGreaterThanOrEqual(-1);
    expect(mobileArt.x + mobileArt.width).toBeLessThanOrEqual(391);
    for (let index = 0; index < rooms.length; index += 1) {
      await expect(mapButtons.nth(index)).toBeVisible();
      await selectRoom(page, index);
      await expectNoHorizontalOverflow(page, rooms[index]);
    }
  });

  test('limits pointer motion to the sit-still phrase and keeps it bounded, pausable, and reduced-motion safe', async ({ page }) => {
    test.setTimeout(30_000);
    await openRoom(page, 'foyer');
    await page.waitForFunction(() => window.__portfolioLocalizedMotion);

    const calmTargets = page.locator('[data-calm-motion]');
    await expect(calmTargets).toHaveCount(1);
    await expect(calmTargets).toHaveText('sit still.');
    await expect(page.locator('[data-calm-fixture]')).toHaveCount(0);
    const initialMotionContract = await page.evaluate(() => {
      const controller = window.__portfolioLocalizedMotion;
      return {
        diagnostics: controller.getDiagnostics(),
        hasFixtureImpulseApi: typeof controller.kickFixture === 'function',
      };
    });
    expect(initialMotionContract.hasFixtureImpulseApi, 'phrase-only motion must not expose a fixture impulse API').toBe(false);
    expect(initialMotionContract.diagnostics.lines, 'motion diagnostics must own exactly one phrase target').toBe(1);
    expect(initialMotionContract.diagnostics.fixtures, 'the phrase-only engine must have no fixture surface').toBe(0);
    expect(initialMotionContract.diagnostics.activeBodies).toBe(1);

    const phrase = calmTargets.first();
    const phraseBox = await phrase.boundingBox();
    const copyBefore = await page.locator('.foyer-copy').boundingBox();
    await page.mouse.move(phraseBox.x - 80, phraseBox.y + phraseBox.height / 2);
    await page.mouse.move(phraseBox.x + phraseBox.width / 2, phraseBox.y + phraseBox.height / 2, { steps: 5 });
    await expect.poll(() => phrase.evaluate((node) => getComputedStyle(node).translate), { timeout: 3_000 }).not.toMatch(/^(none|0px(?: 0px)?)$/);

    const displacement = await phrase.evaluate((node) => {
      const parts = getComputedStyle(node).translate.split(/\s+/).map(Number.parseFloat);
      return { x: Math.abs(parts[0] || 0), y: Math.abs(parts[1] || 0), rotate: Math.abs(Number.parseFloat(getComputedStyle(node).rotate) || 0) };
    });
    expect(displacement.x).toBeLessThanOrEqual(3.05);
    expect(displacement.y).toBeLessThanOrEqual(1.55);
    expect(displacement.rotate).toBeLessThanOrEqual(0.125);
    const copyAfter = await page.locator('.foyer-copy').boundingBox();
    expect(copyAfter.x).toBeCloseTo(copyBefore.x, 2);
    expect(copyAfter.y).toBeCloseTo(copyBefore.y, 2);

    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => phrase.evaluate((node) => ({ translate: getComputedStyle(node).translate, rotate: getComputedStyle(node).rotate }))).toEqual({ translate: '0px', rotate: '0deg' });
    await page.mouse.move(phraseBox.x + 5, phraseBox.y + 5);
    await expect(phrase).toHaveCSS('translate', '0px');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__portfolioLocalizedMotion);
    await expect(page.locator('[data-motion-toggle]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-calm-motion]')).toHaveCSS('translate', '0px');
    expect(await page.evaluate(() => window.__portfolioLocalizedMotion.getDiagnostics().running)).toBe(false);
  });

  test('makes every room primary control and tabset operable while loading only real selected media', async ({ page }) => {
    test.setTimeout(55_000);
    await openRoom(page, 'foyer');
    await page.locator('.calm-primary-action').click();
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '1');

    const alcoveVideo = page.locator('.alcove-folio__recess video');
    await expectVideoReady(alcoveVideo);
    const alcoveTabs = page.locator('[data-alcove-spines] [role="tab"]');
    await alcoveTabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(alcoveTabs.nth(1)).toBeFocused();
    await expect(alcoveTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#alcove-panel-book')).toBeVisible();
    await page.keyboard.press('End');
    await expect(alcoveTabs.last()).toBeFocused();
    await expect(page.locator('#alcove-panel-agent')).toBeVisible();

    await selectRoom(page, 2);
    const petVideo = page.locator('[data-pet-video]');
    await expectVideoReady(petVideo);
    expect(await page.locator('#pet source[src]').count()).toBeGreaterThan(0);
    expect(await page.locator('#keyscape source[src]').count(), 'later room remains cold').toBe(0);
    const petPlay = page.locator('[data-video-control]');
    await petPlay.click();
    await expect(petVideo).toHaveJSProperty('paused', true);
    await petPlay.click();
    await expect.poll(() => petVideo.evaluate((node) => node.paused)).toBe(false);

    await selectRoom(page, 3);
    const keyscapeVideo = page.locator('#keyscape [data-room-video]');
    await expectVideoReady(keyscapeVideo);
    const magneticPoles = page.locator('#keyscape [data-keyscape-demo-toggle], #keyscape [data-light-key="physics"]').first();
    await expect(magneticPoles).toBeVisible();
    if (await magneticPoles.getAttribute('data-keyscape-demo-toggle') !== null) {
      await expect.poll(() => keyscapeVideo.evaluate((node) => node.paused)).toBe(false);
      await expect(magneticPoles).toHaveAttribute('aria-pressed', 'true');
      await expect(magneticPoles).toHaveAttribute('aria-label', 'Pause Magnetic Poles demo');
      const controlMaterial = await magneticPoles.evaluate((node) => ({
        background: getComputedStyle(node).backgroundColor,
        color: getComputedStyle(node).color,
        radius: getComputedStyle(node).borderRadius,
      }));
      expect(controlMaterial.background).toBe('rgba(8, 15, 19, 0.82)');
      expect(controlMaterial.color).toBe('rgb(255, 255, 255)');
      expect(controlMaterial.radius).toBe('999px');
      const pausedBefore = await keyscapeVideo.evaluate((node) => node.paused);
      await magneticPoles.click();
      await expect.poll(() => keyscapeVideo.evaluate((node) => node.paused)).toBe(!pausedBefore);
    } else {
      await magneticPoles.click();
      await expect(magneticPoles).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'physics');
    }

    await selectRoom(page, 4);
    const archiveVideo = page.locator('[data-cabinet-video]');
    await expectVideoReady(archiveVideo);
    const archiveTabs = page.locator('.archive-cabinet [role="tab"]');
    await archiveTabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(archiveTabs.nth(1)).toBeFocused();
    await expect(archiveTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-cabinet-title]')).toHaveText('AI Video Tutorial Generator');
    await expectVideoReady(archiveVideo);

    await selectRoom(page, 5);
    const toolTabs = page.locator('.tool-drawers [role="tab"]');
    await toolTabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(toolTabs.nth(1)).toBeFocused();
    await expect(toolTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.workbench-feature h3')).toHaveText('Gifsmith');
    await expectVideoReady(page.locator('[data-tool-video]'));
    await page.keyboard.press('End');
    await expect(toolTabs.last()).toBeFocused();
    await expect(toolTabs.last()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.workbench-feature h3')).toHaveText('Transparency App');
    await expectImageReady(page.locator('[data-tool-media]'));
  });

  test('keeps visible supporting copy legible and every room inside the viewport at desktop and mobile sizes', async ({ page }) => {
    test.setTimeout(45_000);
    const undersized = [];
    const checks = [
      { width: 1440, height: 900, minimum: 12 },
      { width: 390, height: 844, minimum: 11 },
    ];

    for (const check of checks) {
      await page.setViewportSize({ width: check.width, height: check.height });
      for (const room of rooms) {
        await openRoom(page, room);
        await expectNoHorizontalOverflow(page, room);
        const failures = await supportingTextBelow(page, check.minimum);
        if (failures.length) undersized.push({ viewport: `${check.width}x${check.height}`, room, minimum: check.minimum, failures });
      }
    }
    const grouped = new Map();
    for (const result of undersized) {
      for (const failure of result.failures) {
        const key = `${result.viewport}|${result.minimum}|${failure.selector}|${failure.size}|${failure.text}`;
        const existing = grouped.get(key) || { ...failure, viewport: result.viewport, minimum: result.minimum, rooms: [] };
        existing.rooms.push(result.room);
        grouped.set(key, existing);
      }
    }
    const report = [...grouped.values()].map((failure) =>
      `${failure.viewport} [${failure.rooms.join(', ')}] ${failure.size}px < ${failure.minimum}px ${failure.selector} “${failure.text}”`,
    ).join('\n');
    expect(undersized.length, `visible supporting text is undersized:\n${report}`).toBe(0);
  });

  test('keeps stacked tablet chapters scrollable and uses the short viewport intentionally', async ({ page }) => {
    test.setTimeout(25_000);
    await page.setViewportSize({ width: 768, height: 1024 });

    for (const room of ['archive', 'workbench']) {
      await openRoom(page, room);
      const scroller = page.locator(`#${room}`);
      const metrics = await scroller.evaluate((node) => ({ clientHeight: node.clientHeight, scrollHeight: node.scrollHeight }));
      expect(metrics.scrollHeight, `${room} should exercise its stacked scrolling layout`).toBeGreaterThan(metrics.clientHeight);
      await scroller.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: 'instant' }));
      await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBeGreaterThan(20);
      const source = room === 'archive' ? page.locator('[data-cabinet-link]') : page.locator('[data-tool-link]');
      await expect(source).toBeVisible();
      const sourceBox = await source.boundingBox();
      const mapBox = await page.locator('.museum-map').boundingBox();
      expect(sourceBox.y).toBeLessThan(mapBox.y);
      if (room === 'archive') {
        const selectorBottom = await page.locator('.archive-cabinet [role="tab"]').evaluateAll((nodes) => Math.max(...nodes.map((node) => node.getBoundingClientRect().bottom)));
        expect(selectorBottom).toBeLessThanOrEqual(mapBox.y - 4);
      }
    }

    await openRoom(page, 'workbench');
    const toolBoxes = await page.locator('.tool-selector').evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width };
    }));
    expect(Math.abs(toolBoxes[0].y - toolBoxes[1].y)).toBeLessThan(2);
    expect(toolBoxes[2].y).toBeGreaterThan(toolBoxes[0].y + 20);
    expect(toolBoxes[0].width).toBeGreaterThan(200);
    const separators = await page.locator('.workbench-process li + li').evaluateAll((nodes) => nodes.map((node) => ({
      content: getComputedStyle(node, '::before').content,
      display: getComputedStyle(node, '::before').display,
      position: getComputedStyle(node, '::before').position,
    })));
    for (const separator of separators) {
      expect(separator.content).toContain('·');
      expect(separator.display).not.toBe('none');
      expect(separator.position).toBe('static');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await openRoom(page, 'workbench');
    const workbenchRoom = page.locator('#workbench');
    await workbenchRoom.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: 'instant' }));
    await expect.poll(() => workbenchRoom.evaluate((node) => node.scrollTop)).toBeGreaterThan(20);
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect.poll(() => workbenchRoom.evaluate((node) => node.scrollTop)).toBe(0);
    await expect.poll(() => page.evaluate(() => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.museum-world')).transform);
      return Math.abs(matrix.m41 + 5 * innerWidth);
    })).toBeLessThan(1);
    const workbenchHeading = await page.locator('#workbench-title').boundingBox();
    const masthead = await page.locator('.museum-masthead').boundingBox();
    expect(workbenchHeading.y).toBeGreaterThanOrEqual(masthead.y + masthead.height);

    await page.setViewportSize({ width: 720, height: 450 });
    await openRoom(page, 'alcove');
    const bookplate = await page.locator('.alcove-bookplate').boundingBox();
    expect(bookplate.x).toBeLessThanOrEqual(20);
    expect(bookplate.width).toBeGreaterThan(670);
  });
});
