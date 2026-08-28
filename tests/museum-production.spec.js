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

test.describe('Software in Motion production contract', () => {
  test('the root URL is the selected Software in Motion experience', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle('Akshit — Built to Move');
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', 'public/favicon-aperture.svg');
    await expect(page.locator('link[rel="icon"][sizes="16x16"]')).toHaveAttribute('href', 'public/favicon-aperture-16.png');
    await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', 'public/favicon-aperture-32.png');
    await expect(page.locator('link[rel="icon"][sizes="48x48"]')).toHaveAttribute('href', 'public/favicon-aperture-48.png');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', 'public/favicon-aperture-180.png');
    await expect(page.locator('link[rel="mask-icon"]')).toHaveAttribute('href', 'public/favicon-aperture-mask.svg');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'public/site.webmanifest');
    await expect(page.locator('.museum-shell')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/I make software\s*that refuses to\s*sit still/i);
  });

  test('the thesis gives only the nearest line a bounded local response', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__portfolioLocalizedMotion);
    const thesis = page.locator('[data-motion-thesis]');
    const lines = thesis.locator('[data-motion-line]');
    const bounds = await lines.first().boundingBox();
    expect(bounds).not.toBeNull();
    const copyBefore = await page.locator('.foyer-copy').boundingBox();
    const finePointer = await page.evaluate(() => matchMedia('(pointer: fine)').matches);
    await page.mouse.move(bounds.x - 150, bounds.y + bounds.height / 2);
    await page.mouse.move(bounds.x + bounds.width * .55, bounds.y + bounds.height / 2, { steps: 4 });
    if (finePointer) await expect.poll(() => lines.first().evaluate((element) => getComputedStyle(element).translate)).not.toBe('0px');
    else await expect(lines.first()).toHaveCSS('translate', '0px');
    await expect(lines.nth(1)).toHaveCSS('translate', '0px');
    await expect(lines.nth(2)).toHaveCSS('translate', '0px');
    await expect(thesis).not.toHaveCSS('cursor', 'crosshair');
    const copyAfter = await page.locator('.foyer-copy').boundingBox();
    expect(copyAfter.x).toBeCloseTo(copyBefore.x, 2);
    expect(copyAfter.y).toBeCloseTo(copyBefore.y, 2);
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
    await expect(page.locator('.museum-map__object')).toHaveCount(6);
    await expect(page.locator('.museum-map__courier')).toHaveCount(1);
    await expect(page.locator('[data-motion-toggle]')).toBeVisible();
  });

  test('all public-facing branding and navigation use the new language', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.masthead-exhibit')).toContainText('Software in Motion');
    await expect(page.locator('.museum-map')).toHaveAttribute('aria-label', 'Project chapters');
    const visibleCopy = await page.locator('body').innerText();
    expect(visibleCopy).not.toMatch(/museum/i);
    expect(visibleCopy).not.toMatch(/early signals/i);
    expect(visibleCopy).toMatch(/earlier\s+experiments/i);
  });

  test('the masthead backing fully surrounds its title', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const coverage = await page.locator('.masthead-exhibit').evaluate((element) => {
      const title = element.querySelector('span');
      const text = title.getBoundingClientRect();
      const label = element.querySelector('b').getBoundingClientRect();
      const host = element.getBoundingClientRect();
      const pseudo = getComputedStyle(element, '::before');
      const left = host.left + parseFloat(pseudo.left || 0);
      const right = host.right - parseFloat(pseudo.right || 0);
      return {
        compact: getComputedStyle(title).display === 'none',
        textLeft: text.left,
        textRight: text.right,
        labelLeft: label.left,
        labelRight: label.right,
        hostLeft: host.left,
        hostRight: host.right,
        backingLeft: left,
        backingRight: right,
      };
    });
    if (coverage.compact) {
      expect(coverage.labelLeft).toBeGreaterThanOrEqual(coverage.hostLeft);
      expect(coverage.labelRight).toBeLessThanOrEqual(coverage.hostRight);
    } else {
      expect(coverage.backingLeft).toBeLessThanOrEqual(coverage.textLeft - 8);
      expect(coverage.backingRight).toBeGreaterThanOrEqual(coverage.textRight + 8);
    }
  });

  test('the foyer uses an original kitten guide and kitten visitor with roomy speech', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-guide-button] svg')).toHaveAttribute('aria-label', /studio kitten/i);
    await expect(page.locator('.guide-pupil')).toHaveCount(2);
    await expect(page.locator('.guide-aureole')).toHaveCount(1);
    await expect(page.locator('.guide-aureole > i')).toHaveCount(11);
    await expect(page.locator('.foyer-luminaire')).toHaveCount(3);
    await expect(page.locator('.guide-signal,.foyer-motion-field')).toHaveCount(0);
    await expect(page.locator('.visitor > .visitor__art')).toHaveAttribute('viewBox', '0 0 84 60');
    await expect(page.locator('.visitor > .visitor__art')).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    await expect(page.locator('.visitor__head .visitor__ear')).toHaveCount(2);
    await expect(page.locator('.visitor__head .visitor__eye')).toHaveCount(2);
    await expect(page.locator('.visitor__head .visitor__pupil')).toHaveCount(2);
    await expect(page.locator('.visitor__body .visitor__paw')).toHaveCount(2);
    await expect(page.locator('.visitor__scarf, .visitor__charm')).toHaveCount(0);
    const [headBox, bodyBox, bandanaBox] = await Promise.all([
      page.locator('.visitor__head').boundingBox(),
      page.locator('.visitor__body').boundingBox(),
      page.locator('.visitor__bandana').boundingBox(),
    ]);
    expect(overlapArea(headBox, bodyBox)).toBeGreaterThan(0);
    expect(overlapArea(bandanaBox, headBox) + overlapArea(bandanaBox, bodyBox)).toBeGreaterThan(0);
    const independentlyAnimatedCore = await page.locator('.visitor__head, .visitor__body').evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationName),
    );
    expect(independentlyAnimatedCore).toEqual(['none', 'none']);
    const bubblePadding = await page.locator('.guide-speech').evaluate((element) => {
      const style = getComputedStyle(element);
      return [parseFloat(style.paddingTop), parseFloat(style.paddingRight), parseFloat(style.paddingBottom), parseFloat(style.paddingLeft)];
    });
    expect(Math.min(...bubblePadding)).toBeGreaterThanOrEqual(14);
  });

  test('the visitor rig has an intentional static pose when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const animationNames = await page.locator('.visitor__pose, .visitor__tail, .visitor__paw, .visitor__pupil').evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationName),
    );
    expect(new Set(animationNames)).toEqual(new Set(['none']));
    const fixtureTransforms = await page.locator('[data-motion-fixture]').evaluateAll((elements) => elements.map((element) => ({
      translate: getComputedStyle(element).translate,
      rotate: getComputedStyle(element).rotate,
    })));
    expect(fixtureTransforms.every(({ translate, rotate }) => (translate === '0px' || translate === 'none') && (rotate === '0deg' || rotate === 'none'))).toBe(true);
    const vaneAnimations = await page.locator('.guide-aureole > i').evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
    expect(new Set(vaneAnimations)).toEqual(new Set(['none']));
  });

  test('the studio companion owns a separate speech zone and follows the pointer through it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator('.guide-character > .guide-face')).toHaveCount(1);
    await expect(page.locator('.guide-character > .guide-body')).toHaveCount(1);
    await expect(page.locator('.kinetic-guide svg > .guide-shadow')).toHaveCount(1);
    await expect(page.locator('.kinetic-guide svg > .guide-sparks')).toHaveCount(1);

    const speech = await page.locator('.guide-speech').boundingBox();
    await expect(page.locator('.guide-speech')).toHaveCSS('pointer-events', 'auto');
    const face = await page.locator('.guide-face').boundingBox();
    const ears = await page.locator('.guide-ear').all();
    const dots = await page.locator('.guide-speech-trail i').all();
    for (const ear of ears) expect(overlapArea(speech, await ear.boundingBox())).toBe(0);
    expect(overlapArea(speech, face)).toBe(0);
    for (const dot of dots) {
      const dotBox = await dot.boundingBox();
      expect(overlapArea(dotBox, face)).toBe(0);
      for (const ear of ears) expect(overlapArea(dotBox, await ear.boundingBox())).toBe(0);
    }
    const firstNote = await page.locator('[data-guide-message]').textContent();
    await page.locator('[data-guide-speech-button]').click();
    await expect(page.locator('[data-guide-message]')).not.toHaveText(firstNote);
    expect(Math.min(speech.x, page.viewportSize().width - speech.x - speech.width)).toBeGreaterThanOrEqual(10);

    await page.mouse.move(speech.x + 10, speech.y + speech.height / 2);
    const leftLook = Number.parseFloat(await page.locator('.museum-shell').evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--look-x'),
    ));
    await page.mouse.move(speech.x + speech.width - 10, speech.y + speech.height / 2);
    const rightLook = Number.parseFloat(await page.locator('.museum-shell').evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--look-x'),
    ));
    if (await page.evaluate(() => matchMedia('(pointer: fine)').matches)) expect(rightLook - leftLook).toBeGreaterThan(1);
    else expect(Math.abs(rightLook - leftLook)).toBeLessThanOrEqual(.01);
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

  test('the foyer uses three working specimens and component-owned physical fixtures', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const shortcuts = page.locator('.foyer-index button');
    await expect(shortcuts).toHaveCount(3);
    if (await shortcuts.first().isVisible()) {
      await shortcuts.nth(1).click();
      await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '4');
    } else {
      await expect(shortcuts.first()).toBeHidden();
    }
    await page.goto('/#foyer');
    await expect(page.locator('.foyer-motion-field,.guide-signal')).toHaveCount(0);
    await expect(page.locator('.foyer-architecture')).toHaveCount(1);
    await expect(page.locator('[data-motion-fixture]')).toHaveCount(3);
    await expect(page.locator('.guide-aureole > i')).toHaveCount(11);
  });

  test('fixture physics is bounded, pausable, and sleeps outside the foyer', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__portfolioLocalizedMotion);
    const finePointer = await page.evaluate(() => matchMedia('(pointer: fine)').matches);
    const fixture = page.locator('[data-motion-fixture]').last();
    if (finePointer) {
      const shade = await fixture.locator('.foyer-luminaire__shade').boundingBox();
      await page.mouse.move(shade.x - 100, shade.y + shade.height / 2);
      await page.mouse.move(shade.x + shade.width + 100, shade.y + shade.height / 2, { steps: 2 });
      await expect.poll(async () => Math.abs(Number.parseFloat(await fixture.evaluate((element) => getComputedStyle(element).rotate)))).toBeGreaterThan(.15);
    }
    for (const layer of await page.locator('#foyer .room__layer').all()) {
      expect(await layer.evaluate((element) => getComputedStyle(element).getPropertyValue('--layer-x'))).toBe('');
    }
    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect.poll(() => fixture.evaluate((element) => getComputedStyle(element).rotate)).toMatch(/^(0deg|none)$/);
    await toggle.click();
    await page.locator('.museum-map [data-room-target="1"]').click();
    await expect.poll(() => page.evaluate(() => window.__portfolioLocalizedMotion.getDiagnostics().running)).toBe(false);
    expect(await page.evaluate(() => window.__portfolioLocalizedMotion.getDiagnostics().activeBodies)).toBe(0);
  });

  test('Alcove field notes remain separate from its uncropped demo', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
      const specimen = page.locator('.alcove-folio__recess');
      const media = page.locator('.alcove-folio__recess img');
      const notes = page.locator('.alcove-field-note');
      await expect(specimen).toBeVisible();
      await expect(notes).toBeVisible();
      const [specimenBox, notesBox, objectFit] = await Promise.all([
        media.boundingBox(),
        notes.boundingBox(),
        page.locator('.alcove-folio__recess img').evaluate((media) => getComputedStyle(media).objectFit),
      ]);
      expect(overlapArea(specimenBox, notesBox), viewport.name).toBe(0);
      expect(objectFit, viewport.name).toBe('contain');
    }
  });

  test('feature demos decode at their real intrinsic dimensions', async ({ page }) => {
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const alcoveImage = page.locator('#alcove [data-motion-src]');
    await expect(alcoveImage).toBeVisible();
    await expect.poll(() => alcoveImage.evaluate((image) => image.complete && image.naturalWidth)).toBeGreaterThan(0);
    await expect(alcoveImage).toHaveAttribute('src', 'public/media/features/alcove-full.webp');
    await expect(alcoveImage).toHaveCSS('object-fit', 'contain');
    const expectedVideoSizes = { pet: { width: 1920, height: 1080 }, keyscape: { width: 2080, height: 1302 } };
    for (const room of ['pet', 'keyscape']) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      const video = page.locator(`#${room} [data-room-video]`);
      await expectVideoReady(video);
      await expect(video).toHaveCSS('object-fit', 'contain');
      expect(await video.evaluate((element) => ({ width: element.videoWidth, height: element.videoHeight }))).toEqual(expectedVideoSizes[room]);
    }
  });

  test('the complete Alcove README animation changes frames while its layout stays fixed', async ({ page }) => {
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const image = page.locator('#alcove [data-motion-src]');
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth)).toBeGreaterThan(0);
    const dimensions = await image.evaluate((element) => ({ width: element.naturalWidth, height: element.naturalHeight }));
    expect(dimensions).toEqual({ width: 1200, height: 750 });
    const first = await image.screenshot();
    await expect.poll(async () => (await image.screenshot()).equals(first), { timeout: 8_000, intervals: [800, 1_200, 1_800] }).toBe(false);
    await expect(image).toHaveAttribute('src', 'public/media/features/alcove-full.webp');
  });

  test('every demo is configured as a persistent loop', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('video')).toHaveCount(4);
    await expect(page.locator('video:not([loop])')).toHaveCount(0);
    await expect(page.locator('#alcove [data-motion-src]')).toHaveAttribute('data-motion-src', 'public/media/features/alcove-full.webp');
  });

  test('cold rooms keep video bytes lazy until a visitor enters', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('video source[src]')).toHaveCount(0);
    await expect(page.locator('video source[data-src]')).toHaveCount(8);
    await expect(page.locator('video[poster]')).toHaveCount(0);
    await expect(page.locator('#alcove [data-motion-src]')).not.toHaveAttribute('src');
    await expect(page.locator('[data-tool-media]')).not.toHaveAttribute('src');

    await page.locator('.museum-map [data-room-target="1"]').click();
    await expect(page.locator('#alcove [data-motion-src]')).toHaveAttribute('src', 'public/media/features/alcove-full.webp');
    await expect(page.locator('#pet video source[src]')).toHaveCount(0);

    await page.locator('.museum-map [data-room-target="2"]').click();
    await expect(page.locator('#pet video')).toHaveAttribute('poster', /pet-poster\.webp$/);
  });

  test('the canonical root begins keyboard navigation at the skip link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
  });

  test('interactive focus uses a two-colour ring while room headings stay unframed', async ({ page }) => {
    await page.goto('/#keyscape', { waitUntil: 'domcontentloaded' });
    const key = page.locator('[data-light-key]').first();
    await key.focus();
    await expect(key).toHaveCSS('outline-style', 'solid');
    await expect.poll(() => key.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('6px');

    const heading = page.locator('#keyscape h2');
    await heading.focus();
    await expect(heading).toHaveCSS('outline-style', 'none');
    await expect(heading).toHaveCSS('box-shadow', 'none');
  });

  test('every moving feature has a persistent play and pause control', async ({ page }) => {
    await page.goto('/#pet', { waitUntil: 'domcontentloaded' });
    const video = page.locator('#pet [data-room-video]');
    const control = page.locator('#pet [data-video-control]');
    await expectVideoReady(video);
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
    await expect(control).toHaveAttribute('aria-label', /Pause AI Desktop Pet/i);

    await control.click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
    await expect(control).toHaveAttribute('aria-label', /Play AI Desktop Pet/i);

    await page.locator('.museum-map [data-room-target="1"]').click();
    await page.locator('.museum-map [data-room-target="2"]').click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);

    await control.click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  });

  test('the desktop companion reacts inside its habitat without moving the room', async ({ page }) => {
    await page.goto('/#pet', { waitUntil: 'domcontentloaded' });
    const room = page.locator('[data-pet-room]');
    const habitat = page.locator('[data-habitat]');
    const roomBefore = await room.boundingBox();
    const companionBefore = await page.locator('[data-desktop-companion]').evaluate((element) => getComputedStyle(element).transform);
    const bounds = await habitat.boundingBox();
    await page.mouse.move(bounds.x + bounds.width * .28, bounds.y + bounds.height * .34);
    await expect.poll(() => page.locator('[data-desktop-companion]').evaluate((element) => getComputedStyle(element).transform)).not.toBe(companionBefore);
    const roomAfter = await room.boundingBox();
    expect(roomAfter.x).toBeCloseTo(roomBefore.x, 2);
    expect(roomAfter.y).toBeCloseTo(roomBefore.y, 2);
  });

  test('interactive exhibits visibly announce and react to touch', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-guide-button]').click();
    await expect(page.locator('[data-guide]')).toHaveClass(/is-greeting/);
    await page.goto('/#alcove');
    await page.locator('[data-alcove-volume="page"]').click();
    await expect(page.locator('[data-alcove-volume="page"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#alcove-panel-page')).toBeVisible();
    await page.goto('/#pet');
    await page.locator('[data-companion-invite]').click();
    await expect(page.locator('[data-pet-room]')).toHaveAttribute('data-company', 'true');
    await page.goto('/#keyscape');
    await page.locator('[data-light-key="physics"]').click();
    await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'physics');
  });

  test('archive exposes stars and switches among three project-specific demos', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('.cabinet-object');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('#archive')).toContainText('719');
    await expect(page.locator('#archive')).toContainText('310');
    await expect(page.locator('#archive')).toContainText('127');
    await expect(page.locator('[data-cabinet-video]')).toHaveAttribute('loop', '');

    for (const [index, title] of [[0, /Interactive LLM/i], [1, /AI Video Tutorial/i], [2, /CupcakeAGI/i]]) {
      await tabs.nth(index).click();
      await expect(page.locator('[data-cabinet-title]')).toHaveText(title);
      await expect(page.locator('#archive')).toHaveAttribute('data-archive-project', ['npc', 'tutorial', 'cupcake'][index]);
      await expectVideoReady(page.locator('[data-cabinet-video]'));
      await expect.poll(() => page.locator('[data-cabinet-video]').evaluate((video) => video.duration)).toBeGreaterThan(30);
      await expect(page.locator('[data-cabinet-counter]')).toContainText(`0${index + 1} / 03`);
      await expect(page.locator('[data-cabinet-counter]')).not.toContainText(/README/i);
    }
  });

  test('archive and tool selectors carry authored diagrams with legible metadata', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.reliquary')).toHaveCount(3);
    for (const star of await page.locator('.cabinet-object__label > em').all()) {
      const size = Number.parseFloat(await star.evaluate((element) => getComputedStyle(element).fontSize));
      expect(size).toBeGreaterThanOrEqual(7);
    }
    await page.goto('/#workbench', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.instrument-tab__object')).toHaveCount(4);
  });

  test('supporting project type stays readable and Alcove names its AI agent', async ({ page }) => {
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.alcove-bookplate__facts')).toContainText('optional library agent');
    const ledgerSize = Number.parseFloat(await page.locator('.alcove-field-note__leaf p').last().evaluate((element) => getComputedStyle(element).fontSize));
    expect(ledgerSize).toBeGreaterThanOrEqual(10);
    await page.goto('/#keyscape');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-frame', 'keyscape');
    await page.waitForTimeout(500);
    const signalSize = Number.parseFloat(await page.locator('.keyscape-signal-flow small').first().evaluate((element) => getComputedStyle(element).fontSize));
    expect(signalSize).toBeGreaterThanOrEqual(8);
    const footerDeck = await page.locator('.museum-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--footer-deck').trim());
    expect(footerDeck).toBe('#101726');
  });

  test('the tutorial and every browser video stay at normal 1x playback', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-project="tutorial"]').click();
    const tutorial = page.locator('[data-cabinet-video]');
    await expectVideoReady(tutorial);
    await expect.poll(() => tutorial.evaluate((video) => video.playbackRate)).toBe(1);
    await expect.poll(() => tutorial.evaluate((video) => video.defaultPlaybackRate)).toBe(1);
    await expect.poll(() => tutorial.evaluate((video) => video.duration)).toBe(39);
    for (const video of await page.locator('video').all()) {
      expect(await video.evaluate((element) => element.playbackRate)).toBe(1);
    }
  });

  test('every project has substantial explanatory copy and deliberate title spacing', async ({ page }) => {
    for (const room of ['alcove', 'pet', 'keyscape']) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      const copy = page.locator(`#${room} .project-story`);
      expect((await copy.innerText()).length, room).toBeGreaterThan(130);
      const [titleBox, copyBox] = await Promise.all([
        page.locator(`#${room} h2`).boundingBox(),
        copy.boundingBox(),
      ]);
      expect(copyBox.y - (titleBox.y + titleBox.height), room).toBeGreaterThanOrEqual(18);
    }

    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    for (const tab of await page.locator('.cabinet-object').all()) {
      expect((await tab.getAttribute('data-description')).length).toBeGreaterThan(85);
    }
    await page.goto('/#workbench', { waitUntil: 'domcontentloaded' });
    for (const tab of await page.locator('.tool-selector').all()) {
      expect((await tab.getAttribute('data-description')).length).toBeGreaterThan(145);
    }
  });

  test('archive and workbench environments visibly retheme with their selected object', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const archive = page.locator('#archive');
    const cabinet = page.locator('.archive-cabinet-demo');
    const npcAccent = await cabinet.evaluate((element) => getComputedStyle(element).getPropertyValue('--room-accent').trim());
    await page.locator('[data-project="tutorial"]').click();
    const tutorialAccent = await cabinet.evaluate((element) => getComputedStyle(element).getPropertyValue('--room-accent').trim());
    expect(tutorialAccent).not.toBe(npcAccent);
    await expect(archive).toHaveAttribute('data-archive-project', 'tutorial');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-frame', 'archive-tutorial');
    await expect(page).toHaveTitle('Projects · Built to Move');

    await page.goto('/#workbench');
    const workbench = page.locator('#workbench');
    const emailAccent = await workbench.evaluate((element) => getComputedStyle(element).getPropertyValue('--tool-accent').trim());
    await page.locator('[data-tool="gifsmith"]').click();
    const gifsmithAccent = await workbench.evaluate((element) => getComputedStyle(element).getPropertyValue('--tool-accent').trim());
    expect(gifsmithAccent).not.toBe(emailAccent);
    await expect(workbench).toHaveAttribute('data-tool', 'gifsmith');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-frame', 'workbench-gifsmith');
    await expect(page).toHaveTitle('Tools · Built to Move');
  });

  test('the masthead and map inherit every room material, including a compact mobile room label', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const frameSurfaces = [];
    const mapColors = [];
    for (let index = 0; index < rooms.length; index += 1) {
      await page.locator(`.museum-map [data-room-target="${index}"]`).click();
      await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(index));
      await page.waitForTimeout(480);
      const [mastheadColor, mapColor] = await Promise.all([
        page.locator('.museum-masthead').evaluate((element) => getComputedStyle(element).backgroundColor),
        page.locator('.museum-map').evaluate((element) => getComputedStyle(element).backgroundColor),
      ]);
      expect(mapColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(mastheadColor).not.toBe('rgba(0, 0, 0, 0)');
      mapColors.push(mapColor);
      frameSurfaces.push(await page.locator('.museum-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--frame-surface').trim()));
    }
    expect(new Set(frameSurfaces).size).toBe(rooms.length);
    expect(new Set(mapColors).size).toBeGreaterThanOrEqual(4);

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
    const video = page.locator('[data-cabinet-video]');
    const control = page.locator('[data-film-control]');
    await expectVideoReady(video);
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
    await control.click();
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
    await page.locator('[data-project="tutorial"]').click();
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
    await page.keyboard.press('6');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '5');
    await page.keyboard.press('1');
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
    const archiveTabs = page.locator('.cabinet-object');
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
    const organic = page.locator('[data-light-key="organic"]');
    await organic.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'organic');
    await expect(organic).toHaveAttribute('aria-pressed', 'true');

    const typing = page.locator('[data-light-key="typing"]');
    await typing.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#keyscape')).toHaveAttribute('data-light', 'typing');
    await expect(typing).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.keyscape-keyboard i')).toHaveCount(24);
  });

  test('global motion control pauses and resumes ambient systems', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.museum-shell')).toHaveClass(/is-motion-paused/);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.museum-shell')).not.toHaveClass(/is-motion-paused/);
  });

  test('Alcove keeps the real 1200:750 demo plane without black side bars', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const geometry = await page.locator('.alcove-folio__recess').evaluate((windowElement) => {
      const image = windowElement.querySelector('img');
      const host = windowElement.getBoundingClientRect();
      const media = image.getBoundingClientRect();
      return { hostWidth: host.width, mediaWidth: media.width, ratio: media.width / media.height, background: getComputedStyle(windowElement).backgroundColor };
    });
    expect(geometry.ratio).toBeCloseTo(1200 / 750, 2);
    // The remaining width is the intentional conservator's recess and its
    // borders/page edges, not a letterboxed media plane.
    expect(Math.abs(geometry.hostWidth - geometry.mediaWidth)).toBeLessThan(44);
    expect(geometry.background).not.toBe('rgb(13, 20, 22)');
  });

  test('reduced motion removes the arrival sequence and pauses moving media', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.museum-shell')).not.toHaveClass(/is-intro/);
    await expect(page.locator('.ambient-canvas')).toHaveCSS('display', 'none');
    await expect(page.locator('#alcove [data-motion-src]')).toHaveAttribute('src', 'public/media/features/alcove-poster.webp');

    await page.goto('/#pet', { waitUntil: 'domcontentloaded' });
    const petVideo = page.locator('#pet [data-room-video]');
    await expect(petVideo).toHaveAttribute('poster', 'public/media/features/pet-poster.webp');
    await expect(petVideo.locator('source').first()).not.toHaveAttribute('src', /.+/);
    await expect(petVideo).toHaveJSProperty('paused', true);
  });

  test('native page scrolling keys stay inside a short-height chapter', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 620 });
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const alcove = page.locator('#alcove');
    await page.locator('#alcove-title').focus();
    await page.keyboard.press('PageDown');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', '1');
    await expect.poll(() => alcove.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
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

  test('a 200% zoom-equivalent viewport keeps every chapter readable without horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 900 });
    for (const [index, room] of rooms.entries()) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      await waitForRoomSettled(page, index);
      const geometry = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        body: document.body.scrollWidth,
        current: document.querySelector('.room.is-current')?.clientWidth || 0,
      }));
      expect(geometry.body, room).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.current, room).toBeLessThanOrEqual(geometry.viewport + 1);
      await expect(page.locator(`#${room} h1, #${room} h2`).first()).toBeVisible();
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
        const canvas = current?.querySelector('.room-canvas, .alcove-library, .pet-room')?.getBoundingClientRect();
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
