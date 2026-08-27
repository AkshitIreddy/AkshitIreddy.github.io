# Software in Motion

Akshit Ireddy's personal open-source portfolio, built around one idea:

> I make software that refuses to sit still.

The site moves through six interactive chapters. Alcove, AI Desktop Pet, and
Keyscape receive full feature spaces; three earlier AI experiments are kept for
the ideas and audiences they found; practical projects each get their own
drawer rather than being compressed into one generic tools card.

## Selected projects

1. **Alcove** — a local-first storybook notebook, shown with its complete README demo.
2. **AI Desktop Pet** — an embodied conversational character that lives on the desktop.
3. **Keyscape** — a Rust/Tauri per-key RGB engine with 50 hand-built effects.
4. **Earlier experiments** — Interactive LLM-powered NPCs (719★), AI Video Tutorial Generator (310★), and CupcakeAGI (127★).
5. **Useful things** — Email Briefing, Gifsmith, Compendium, and Transparency App as individual, selectable projects.

Star counts are a GitHub snapshot from 2026-08-27 and will naturally drift.

## Local development

Node 20 or newer is required by the Playwright QA dependency.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:49173`. The site is framework-free HTML, CSS, and
JavaScript, with no compilation step. `npm run build` assembles the exact,
allow-listed GitHub Pages artifact in the ignored `dist/` directory.

## Verification

```bash
npm run qa:production
npm run capture
npm run capture:closeups -- foyer 1440 900 start-desktop
```

The QA suite covers seven viewport widths from 320 to 2560 pixels, chapter
isolation, overflow, media decoding and timing, selected-project switching,
keyboard navigation, touch swipes, reduced motion, and page errors. The
close-up capture creates six overlapping crops first and the full frame
afterward, so every visual sign-off is based on rendered evidence rather than
DOM measurements.

## Media

- Project demos are self-hosted and presented full-frame with `object-fit: contain`.
- Videos use VP9 WebM with H.264 MP4 fallback, loop continuously, and are fixed to normal 1× playback.
- Alcove uses the complete animated README recording rather than a short excerpt.
- Reduced-motion mode swaps Alcove to a still and pauses every video.
- Source clones, downloads, and visual QA evidence stay in ignored local folders.

Font copyright and license details are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
The separate treatment of project demo media is explained in
[MEDIA_NOTICE.md](MEDIA_NOTICE.md).
Media provenance and encoding notes are in [research/feature-media.md](research/feature-media.md),
[research/archive-media.md](research/archive-media.md), and
[research/revision-2026-08-27.md](research/revision-2026-08-27.md).

## Deployment

The site is prepared for **GitHub Pages** and is intended to live in the
`AkshitIreddy.github.io` repository. Once publishing is explicitly requested,
a push to `main` can run the Pages workflow, which packages only the runtime
HTML, CSS, JavaScript, fonts, media, notices, and `.nojekyll` file. Tests,
research notes, source clones, and local evidence stay out of the website
artifact.

GitHub Pages is the deliberate choice here: this is a static personal site,
the source and hosting stay together, and maintenance is simply pushing to
`main`—there is no separate Vercel project or build configuration to keep in
sync.

## License

Code in this repository is released under the [MIT License](LICENSE). Bundled
fonts retain their upstream licenses as described in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); demo media is governed by
[MEDIA_NOTICE.md](MEDIA_NOTICE.md).
