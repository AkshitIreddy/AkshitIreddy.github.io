// Assert Welcome book open state on mobile: cover hidden, page copy aligned and in bounds.
const { chromium } = require('@playwright/test');

const BASE = 'http://127.0.0.1:49173/index.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}#alcove`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-open-book]').click();
  await page.waitForTimeout(900);

  const alcoveScrollHeight = await page.locator('#alcove .room-canvas').evaluate((el) => el.scrollHeight);
  const coverState = await page.locator('.alcove-book.is-open .alcove-book__cover').evaluate((el) => {
    const style = getComputedStyle(el);
    return { opacity: Number(style.opacity), visibility: style.visibility };
  });
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

  const failures = [];
  if (coverState.opacity > 0.01) failures.push(`cover opacity ${coverState.opacity}`);
  if (coverState.visibility !== 'hidden') failures.push(`cover visibility ${coverState.visibility}`);
  if (!pageMetrics.withinBounds) failures.push('page copy out of bounds');
  if (!pageMetrics.titleAligned) failures.push('title not on ruled line');
  if (!pageMetrics.noteAligned) failures.push('marginalia not on ruled line');

  await browser.close();

  if (failures.length) {
    console.error('alcove-book-mobile checks failed:', failures.join('; '));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, alcoveScrollHeight, coverState, pageMetrics }, null, 2));
})();
