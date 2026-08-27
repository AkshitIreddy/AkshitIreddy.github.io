# Museum of Behaviors

Akshit Ireddy's personal open-source portfolio, built around one thesis:

> I make software that refuses to sit still.

The site is a six-room, keyboard- and touch-navigable museum. Recent design-led work gets the largest rooms; three older projects appear only as a compact, evidence-backed archive; practical tools live in a one-at-a-time utility gallery.

## Rooms

1. **Foyer** — identity, thesis, and the animated museum kitten guide.
2. **Alcove** — a local-first storybook notebook.
3. **Convai Desktop Pet** — an AI character that inhabits the desktop.
4. **Keyscape** — a playable per-key light instrument.
5. **Early Signals** — Interactive LLM NPCs (719★), Video Tutorial Generator (310★), and CupcakeAGI (127★).
6. **Utility Workbench** — Email Briefing, Gifsmith, Compendium, and Transparency App as separate drawers.

Star counts are a GitHub snapshot from 2026-08-27 and will naturally drift.

## Local development

Node 20 or newer is required by the Playwright QA dependency.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:49173`. The site is framework-free HTML, CSS, and JavaScript; there is no production build step.

## Verification

```bash
npm run qa:production
npm run capture
npm run capture:closeups -- foyer 1440 900 foyer-desktop
```

The production suite currently contains 62 passing desktop/mobile checks across the seven required viewport widths (320, 390, 768, 1024, 1440, 1920, and 2560 pixels). It covers room isolation, overflow, Alcove overlap, real video decoding, archive stars and switching, utility switching, keyboard navigation, touch swipe, reduced motion, mobile scroll affordance, and page errors.

The production capture renders every room at every required width, mobile detail states, and the important interactive reactions into the ignored local `qa/production-final/` folder for human inspection. The close-up capture writes one full frame plus six overlapping crops to `qa/closeup-review/`; every final room and selected Archive/Workbench state was inspected this way at desktop and phone sizes. Append a project key such as `cupcake` or `gifsmith` after the label to audit a selected state yourself.

## Media

Only optimized shipping derivatives are committed:

- VP9 WebM first, H.264 MP4 fallback, and WebP posters.
- Full-frame `object-fit: contain` presentation—no UI crop disguised as a cinematic treatment.
- One room's media plays at a time; every demo is an intentional seamless loop, and reduced-motion mode pauses all video.
- Self-hosted fonts and no runtime analytics, trackers, frameworks, or third-party media requests.

Font copyright and license details are collected in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Exact source commits, README links, clip decisions, encoding commands, dimensions, and visual checks are recorded in [`research/feature-media.md`](research/feature-media.md) and [`research/archive-media.md`](research/archive-media.md). The large source downloads and cloned repositories remain local under ignored folders.

## Deployment: Vercel

Vercel is the selected host. It fits this visual site better than GitHub Pages because every branch and pull request can receive a reviewable preview deployment, while `main` remains the production source and can be rolled back quickly.

1. Create the GitHub repository and push this local `main` branch.
2. Import the repository in Vercel.
3. Keep the detected framework as **Other**.
4. Leave the build command empty; `index.html` is already the deployable root.

The small `vercel.json` deliberately pins the output directory to `.`. This is necessary because Vercel's **Other** preset otherwise prefers a directory named `public` when one exists, while this site's `index.html` correctly lives at the repository root. `.vercelignore` keeps tests, research, local evidence, and source material out of the public deployment. The site remains ordinary static output and can be moved to GitHub Pages later without a rewrite.

## Repository status

The local repository is prepared without a remote. Repository name, visibility, and code-license choice should be decided before creating the GitHub remote or pushing. Ignored prototype/source/QA files are retained locally and have not been deleted.
