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
    await expect(page).toHaveTitle('Akshit Ireddy — Software in Motion');
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', 'public/favicon-motion.svg');
    await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', 'public/favicon-motion-32.png');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', 'public/favicon-motion-180.png');
    await expect(page.locator('link[rel="mask-icon"]')).toHaveAttribute('href', 'public/favicon-motion-mask.svg');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'public/site.webmanifest');
    await expect(page.locator('.museum-shell')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/I make software\s*that refuses to\s*sit still/i);
  });

  test('the thesis moves as one stable phrase with a normal cursor', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const thesis = page.locator('[data-restless-thesis]');
    const target = thesis.locator('.moving-word');
    const bounds = await thesis.boundingBox();
    expect(bounds).not.toBeNull();
    const before = await thesis.boundingBox();
    await thesis.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'mouse', clientX: bounds.x + bounds.width * .82, clientY: bounds.y + bounds.height * .72 });
    await expect(thesis).toHaveClass(/is-restless/);
    await expect.poll(() => target.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');
    await expect(thesis.locator('.restless-letter')).toHaveCount(0);
    await expect(thesis).not.toHaveCSS('cursor', 'crosshair');
    const after = await thesis.boundingBox();
    expect(after.width).toBeCloseTo(before.width, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
    await expect(thesis).toHaveAttribute('aria-label', 'I make software that refuses to sit still');
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
    await expect(page.locator('svg.guide-signal')).toHaveCount(1);
    await expect(page.locator('.guide-signal__path')).toHaveCount(3);
    await expect(page.locator('.foyer-motion-field__path')).toHaveCount(3);
    await expect(page.locator('.guide-signal__path').first()).toHaveCSS('animation-name', 'foyer-field-draw');
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
    for (const path of ['.guide-signal__path', '.foyer-motion-field__path']) {
      const duration = await page.locator(path).first().evaluate((element) => getComputedStyle(element).animationDuration);
      expect(parseFloat(duration), path).toBeLessThan(0.01);
    }
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
    expect(await page.locator('.guide-speech').evaluate((element) => element.tagName)).toBe('BUTTON');
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
    expect(Math.min(speech.x, page.viewportSize().width - speech.x - speech.width)).toBeGreaterThanOrEqual(10);

    await page.mouse.move(speech.x + 10, speech.y + speech.height / 2);
    const leftLook = Number.parseFloat(await page.locator('.museum-shell').evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--look-x'),
    ));
    await page.mouse.move(speech.x + speech.width - 10, speech.y + speech.height / 2);
    const rightLook = Number.parseFloat(await page.locator('.museum-shell').evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--look-x'),
    ));
    expect(rightLook - leftLook).toBeGreaterThan(1);
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
      const specimen = page.locator('.specimen-window--alcove');
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

  test('the Welcome book hides its cover and keeps ruled page copy in bounds at 390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const book = page.locator('[data-open-book]');
    await book.click();
    await expect(book).toHaveClass(/is-open/);
    await expect.poll(async () => page.locator('.alcove-book.is-open .alcove-book__cover').evaluate((el) => {
      const style = getComputedStyle(el);
      return { opacity: Number(style.opacity), visibility: style.visibility };
    })).toEqual({ opacity: 0, visibility: 'hidden' });

    const coverState = await page.locator('.alcove-book.is-open .alcove-book__cover').evaluate((el) => {
      const style = getComputedStyle(el);
      return { opacity: Number(style.opacity), visibility: style.visibility };
    });
    expect(coverState.opacity).toBeLessThanOrEqual(0.01);
    expect(coverState.visibility).toBe('hidden');

    const pageMetrics = await page.locator('.alcove-book__page').evaluate((pageEl) => {
      const rule = Number.parseFloat(getComputedStyle(pageEl).getPropertyValue('--book-rule')) || 9;
      const pageRect = pageEl.getBoundingClientRect();
      const title = pageEl.querySelector('b');
      const note = pageEl.querySelector('em');
      const titleRect = title.getBoundingClientRect();
      const noteRect = note.getBoundingClientRect();
      const titleOffset = titleRect.top - pageRect.top;
      const noteOffset = noteRect.top - pageRect.top;
      const inRuleBand = (offset) => {
        const pos = ((offset % rule) + rule) % rule;
        return pos >= 0.5 && pos <= rule - 1.5;
      };
      return {
        withinBounds: titleRect.left >= pageRect.left - 0.5
          && titleRect.right <= pageRect.right + 0.5
          && noteRect.left >= pageRect.left - 0.5
          && noteRect.bottom <= pageRect.bottom + 1.5,
        titleAligned: inRuleBand(titleOffset),
        noteAligned: inRuleBand(noteOffset),
      };
    });
    expect(pageMetrics.withinBounds).toBe(true);
    expect(pageMetrics.titleAligned).toBe(true);
    expect(pageMetrics.noteAligned).toBe(true);
  });

  test('feature demos decode at their real intrinsic dimensions', async ({ page }) => {
    const fits = { alcove: 'contain', pet: 'cover', keyscape: 'contain' };
    for (const room of ['alcove', 'pet', 'keyscape']) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      const video = page.locator(`#${room} [data-room-video]`);
      await expectVideoReady(video);
      await expect(video).toHaveCSS('object-fit', fits[room]);
    }
  });

  test('the Alcove guided tour plays as a living film while its layout stays fixed', async ({ page }) => {
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    const video = page.locator('#alcove [data-room-video]');
    await expectVideoReady(video);
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
    const before = await video.boundingBox();
    const first = await video.screenshot();
    await expect.poll(async () => (await video.screenshot()).equals(first), { timeout: 8_000, intervals: [800, 1_200, 1_800] }).toBe(false);
    const after = await video.boundingBox();
    expect(after.width).toBeCloseTo(before.width, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
    await expect(video).toHaveAttribute('loop', '');
  });

  test('every demo is configured as a persistent loop', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('video')).toHaveCount(5);
    await expect(page.locator('video:not([loop])')).toHaveCount(0);
    await expect(page.locator('#alcove [data-room-video]')).toHaveAttribute('data-poster', 'public/media/features/alcove-tour-poster.webp');
  });

  test('cold rooms keep video bytes lazy until a visitor enters', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('video source[src]')).toHaveCount(0);
    await expect(page.locator('video source[data-src]')).toHaveCount(10);
    await expect(page.locator('video[poster]')).toHaveCount(0);
    await expect(page.locator('#alcove [data-room-video] source[src]')).toHaveCount(0);
    await expect(page.locator('[data-tool-media]')).not.toHaveAttribute('src');

    await page.locator('.museum-map [data-room-target="1"]').click();
    await expect(page.locator('#alcove [data-room-video]')).toHaveAttribute('poster', 'public/media/features/alcove-tour-poster.webp');
    await expect(page.locator('#alcove [data-room-video] source[src]')).toHaveCount(2);
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
    const key = page.locator('[data-play-ripple]');
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
    const control = page.locator('#pet [data-video-toggle]');
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

  test('the desktop-pet glass highlight arrives once instead of looping forever', async ({ page }) => {
    await page.goto('/#pet', { waitUntil: 'domcontentloaded' });
    const glint = page.locator('#pet .glass-glint');
    await expect(glint).toHaveCSS('animation-name', 'glass-glint-arrive');
    await expect(glint).toHaveCSS('animation-iteration-count', '1');
    await expect(glint).toHaveCSS('animation-duration', '1.35s');
  });

  test('interactive exhibits visibly announce and react to touch', async ({ page }) => {
    test.setTimeout(60_000);
    const announcer = page.locator('.room-announcer');

    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.interaction-cue')).toHaveCount(4);
    await expect(page.locator('.interaction-cue').first()).toContainText(/try|touch|click|swipe|play|pull|ring|press/i);

    // Foyer: the kitten button and its speech bubble cycle the same 8 messages.
    const speech = page.locator('.guide-speech');
    await expect(speech).toContainText('Psst—almost everything here reacts.');
    await page.locator('[data-guide-button]').click();
    await expect(page.locator('[data-guide]')).toHaveClass(/is-greeting/);
    await expect(speech).toContainText('The good chapters move. Follow me.');
    await expect(announcer).toContainText('The good chapters move. Follow me.');
    await speech.click();
    await expect(speech).toContainText('Room 01: the books breathe.');
    for (let index = 0; index < 6; index += 1) {
      await (index % 2 === 0 ? page.locator('[data-guide-button]').click() : speech.click());
    }
    await expect(speech).toContainText('Psst—almost everything here reacts.');

    // Alcove: the Welcome book pulls off the shelf and opens.
    await page.goto('/#alcove');
    const book = page.locator('[data-open-book]');
    await expect(book).toHaveAttribute('aria-expanded', 'false');
    await book.click();
    await expect(book).toHaveClass(/is-open/);
    await expect(book).toHaveAttribute('aria-expanded', 'true');
    await expect(announcer).toContainText(/Welcome book slides off the shelf/i);
    await book.click();
    await expect(book).toHaveAttribute('aria-expanded', 'false');

    // Pet: the desk bell runs the full visit state machine.
    await page.goto('/#pet');
    const bell = page.locator('[data-call-pet]');
    await bell.click();
    await expect(page.locator('#pet')).toHaveClass(/is-called/);
    await expect(bell).toHaveAttribute('aria-pressed', 'true');
    await expect(announcer).toContainText(/comes running/i);
    await expect(page.locator('#pet')).toHaveClass(/is-visiting/, { timeout: 10_000 });
    await bell.click();
    await expect(announcer).toContainText(/already here/i);
    await expect(page.locator('#pet')).not.toHaveClass(/is-visiting|is-leaving|is-called/, { timeout: 15_000 });
    await expect(bell).toHaveAttribute('aria-pressed', 'false');

    // Keyscape: the ripple button and the R key both light the room.
    await page.goto('/#keyscape');
    const ripple = page.locator('[data-play-ripple]');
    await ripple.click();
    await expect(page.locator('#keyscape')).toHaveClass(/is-rippling/);
    await expect(ripple).toHaveAttribute('aria-pressed', 'true');
    await expect(announcer).toContainText(/ripple leaves the keyboard/i);
    await expect(page.locator('#keyscape')).not.toHaveClass(/is-rippling/, { timeout: 10_000 });
    await page.keyboard.press('r');
    await expect(page.locator('#keyscape')).toHaveClass(/is-rippling/);
  });

  test('archive exposes stars and switches among three real README films', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('.archive-project-tab');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('#archive')).toContainText('719');
    await expect(page.locator('#archive')).toContainText('310');
    await expect(page.locator('#archive')).toContainText('127');
    await expect(page.locator('[data-archive-video]')).toHaveAttribute('loop', '');

    for (const [index, title] of [[0, /Interactive LLM/i], [1, /AI Video Tutorial/i], [2, /CupcakeAGI/i]]) {
      await tabs.nth(index).click();
      await expect(page.locator('[data-archive-title]')).toHaveText(title);
      await expect(page.locator('#archive')).toHaveAttribute('data-archive-project', ['npc', 'tutorial', 'cupcake'][index]);
      await expectVideoReady(page.locator('[data-archive-video]'));
      await expect.poll(() => page.locator('[data-archive-video]').evaluate((video) => video.duration)).toBeGreaterThan(30);
      await expect(page.locator('[data-archive-counter]')).toContainText(`0${index + 1} / 03`);
    }
  });

  test('the tutorial and every browser video stay at normal 1x playback', async ({ page }) => {
    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-archive-project="tutorial"]').click();
    const tutorial = page.locator('[data-archive-video]');
    await expectVideoReady(tutorial);
    await expect.poll(() => tutorial.evaluate((video) => video.playbackRate)).toBe(1);
    await expect.poll(() => tutorial.evaluate((video) => video.defaultPlaybackRate)).toBe(1);
    await expect.poll(() => tutorial.evaluate((video) => video.duration)).toBe(39);
    for (const video of await page.locator('video').all()) {
      expect(await video.evaluate((element) => element.playbackRate)).toBe(1);
    }
  });

  test('every project has substantial explanatory copy and deliberate title spacing', async ({ page }) => {
    const stories = { alcove: '.project-story', pet: '.pet-note__story', keyscape: '.project-story' };
    for (const room of ['alcove', 'pet', 'keyscape']) {
      await page.goto(`/#${room}`, { waitUntil: 'domcontentloaded' });
      const copy = page.locator(`#${room} ${stories[room]}`);
      expect((await copy.innerText()).length, room).toBeGreaterThan(130);
      const [titleBox, copyBox] = await Promise.all([
        page.locator(`#${room} h2`).boundingBox(),
        copy.boundingBox(),
      ]);
      if (room === 'pet') {
        // The pet's story lives in its own field-note column beside the title.
        expect(overlapArea(titleBox, copyBox), room).toBe(0);
      } else {
        expect(copyBox.y - (titleBox.y + titleBox.height), room).toBeGreaterThanOrEqual(18);
      }
    }

    await page.goto('/#archive', { waitUntil: 'domcontentloaded' });
    for (const tab of await page.locator('.archive-project-tab').all()) {
      expect((await tab.getAttribute('data-description')).length).toBeGreaterThan(145);
    }
    await page.goto('/#workbench', { waitUntil: 'domcontentloaded' });
    for (const tab of await page.locator('.tool-selector').all()) {
      expect((await tab.getAttribute('data-description')).length).toBeGreaterThan(145);
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
    await expect(page).toHaveTitle('Projects · Akshit');

    await page.goto('/#workbench');
    const workbench = page.locator('#workbench');
    const emailAccent = await workbench.evaluate((element) => getComputedStyle(element).getPropertyValue('--tool-accent').trim());
    await page.locator('[data-tool="gifsmith"]').click();
    const gifsmithAccent = await workbench.evaluate((element) => getComputedStyle(element).getPropertyValue('--tool-accent').trim());
    expect(gifsmithAccent).not.toBe(emailAccent);
    await expect(workbench).toHaveAttribute('data-tool', 'gifsmith');
    await expect(page.locator('.museum-shell')).toHaveAttribute('data-frame', 'workbench-gifsmith');
    await expect(page).toHaveTitle('Tools · Akshit');
  });

  test('the masthead and map inherit every room material, including a compact mobile room label', async ({ page }) => {
    await page.goto('/#foyer', { waitUntil: 'domcontentloaded' });
    const frameSurfaces = [];
    for (let index = 0; index < rooms.length; index += 1) {
      await page.locator(`.museum-map [data-room-target="${index}"]`).click();
      await expect(page.locator('.museum-shell')).toHaveAttribute('data-current-room', String(index));
      // Both surfaces transition to the new room material; sample them together
      // until the transitions settle on the identical colour.
      await expect.poll(async () => {
        const [mastheadColor, mapColor] = await Promise.all([
          page.locator('.museum-masthead').evaluate((element) => getComputedStyle(element).backgroundColor),
          page.locator('.museum-map').evaluate((element) => getComputedStyle(element).backgroundColor),
        ]);
        return mapColor === mastheadColor;
      }, { timeout: 4_000 }).toBe(true);
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

  test('Keyscape ripple responds to native Enter and Space activation', async ({ page }) => {
    await page.goto('/#keyscape', { waitUntil: 'domcontentloaded' });
    const ripple = page.locator('[data-play-ripple]');
    await ripple.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#keyscape')).toHaveClass(/is-rippling/);
    await expect(ripple).toHaveAttribute('aria-pressed', 'true');

    await expect(page.locator('#keyscape')).not.toHaveClass(/is-rippling/);
    await expect(ripple).toHaveAttribute('aria-pressed', 'false');
    await ripple.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#keyscape')).toHaveClass(/is-rippling/);
    await expect(ripple).toHaveAttribute('aria-pressed', 'true');
  });

  test('reduced motion removes the arrival sequence and pauses moving media', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#alcove', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.museum-shell')).not.toHaveClass(/is-intro/);
    await expect(page.locator('.ambient-canvas')).toHaveCount(0);
    const alcoveVideo = page.locator('#alcove [data-room-video]');
    await expect(alcoveVideo).toHaveAttribute('poster', 'public/media/features/alcove-tour-poster.webp');
    await expect(alcoveVideo.locator('source').first()).not.toHaveAttribute('src', /.+/);
    await expect(alcoveVideo).toHaveJSProperty('paused', true);

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
