# Interaction and motion evidence ledger — 2026-08-27

This pass keeps the horizontal one-page portfolio and increases authored motion
without turning every surface into an unrelated loop. The implementation rule
is: **shared timing and accessibility, individual physical behavior**.

## Decisions

1. Every major object gets one continuous low-amplitude behavior and one direct
   reaction. The behavior comes from its subject: paper edges riffle, a desktop
   pet patrols, keys propagate light, film advances, and drawers reveal tools.
2. Direct feedback lands in 70–150ms; room/object transformations use
   240–620ms; expressive arrival motion is occasional. Transform and opacity
   own continuous motion instead of `left`, `top`, or layout sizes.
3. Moving rails use a real path (`offset-path` or SVG path sampling), continuous
   wraparound, staggered phases, and no endpoint jump. Reduced motion keeps the
   selected state but removes travel.
4. The site gets one persistent motion pause because several automatic loops
   run beside readable content. Individual media controls remain available.
5. Feature copy is not placed in generic bubbles. Alcove uses a colophon and
   page ledger; Pet uses a behavior trace; Keyscape uses a signal score;
   Archive uses artifact slates; Tools use their own work surfaces.
6. Keyscape exposes the real chain: key position → effect field → LED matrix →
   HID output. Effects use physical key coordinates and recognisable modes
   (reactive pulse, heatmap, river/field), not four unmotivated color swatches.
7. Scroll-driven animation is not the primary technique here because the site
   is an intentional fixed horizontal world. It remains useful only inside
   genuinely scrollable short-height/mobile room detail.
8. Higher-resolution media must come from original app/render frames. CSS
   enlargement or AI-upscaling an already compressed demo is not accepted.

## Sources assessed

| # | Source | Applied finding |
|---:|---|---|
| 1 | [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Automatic motion beyond five seconds needs a usable pause; one page-level control is the better experience. |
| 2 | [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Interaction motion must be disableable when non-essential; avoid vestibular parallax. |
| 3 | [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Preserve practical touch geometry as controls become more illustrative. |
| 4 | [W3C: Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) | Motion and material changes cannot erase the two-color focus treatment. |
| 5 | [W3C: Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | Hover-revealed information must remain hoverable/persistent and have keyboard parity. |
| 6 | [MDN: Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) | WAAPI provides inspectable/cancellable timing and supports a coordinated motion pause. |
| 7 | [MDN: Using Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API) | Prefer named finite animations and explicit playback control over timer piles. |
| 8 | [MDN: `offset-path`](https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path) | Rail objects can follow the exact authored route instead of interpolating endpoints. |
| 9 | [MDN: Scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) | Use scroll timelines only where a real scroll container conveys progress. |
| 10 | [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Replace spatial travel with static state and honest still media. |
| 11 | [MDN: `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) | JS-driven effects share one display-synchronised owner and stop while hidden. |
| 12 | [MDN: `AnalyserNode`](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) | Keyscape music mode can expose actual frequency energy rather than decorative noise. |
| 13 | [MDN: WebHID](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API) | Keyscape storytelling should acknowledge the direct device/HID boundary. |
| 14 | [web.dev: High-performance CSS animations](https://web.dev/articles/animations-guide) | Continuous motion stays on transform/opacity and is verified with real traces. |
| 15 | [web.dev: Video and source tags](https://web.dev/articles/video-and-source-tags) | Preserve WebM/MP4 fallbacks, posters, dimensions, lazy loading, and explicit controls. |
| 16 | [Chrome: Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) | Progressive enhancement only; fixed-world navigation must not depend on it. |
| 17 | [Carbon: Motion overview](https://carbondesignsystem.com/elements/motion/overview/) | Separate productive microinteraction from occasional expressive brand motion. |
| 18 | [Carbon: Choreography](https://carbondesignsystem.com/elements/motion/choreography/) | Related objects move coherently, sequences finish on important content, and stagger stays bounded. |
| 19 | [Atlassian: Motion](https://atlassian.design/foundations/motion) | Motion must be human, clarifying, accessible, and performant; small feedback is fast. |
| 20 | [Atlassian: Applying motion](https://atlassian.design/foundations/motion/applying-motion) | Choose timing by function/size and test the complete interaction flow for friction. |
| 21 | [Fluent 2: Motion](https://fluent2.microsoft.design/motion) | Use inertia, weight, and velocity to make movement feel physical rather than mechanical. |
| 22 | [Material 3: Motion](https://m3.material.io/styles/motion/overview) | Preserve continuity and hierarchy during state transformation. |
| 23 | [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Motion stays brief, optional, precise, and anchored to a stable frame of reference. |
| 24 | [Figma: Motion timing](https://help.figma.com/hc/en-us/articles/41238756222615-Motion-design-fundamentals-Timing) | Duration communicates weight, distance, and frequency; repeated actions need restraint. |
| 25 | [QMK: RGB Matrix Lighting](https://docs.qmk.fm/features/rgb_matrix) | Real lighting effects use physical LED coordinates, flags, heatmaps, reactive splashes, waves, and speed/hue controls. |
| 26 | [WebHID specification](https://wicg.github.io/webhid/) | Keep device access explicit and user-mediated; the portfolio demo remains illustrative. |
| 27 | [Stamen: SFMOMA Artscope](https://stamen.com/work/sfmoma-artscope/) | A collection can become a navigable authored landscape made from the actual work. |
| 28 | [FWA current feed](https://thefwa.com/rss/) | Current experimental sites are strongest when one coherent interaction metaphor owns the experience. |

## Rejected patterns

- A universal card/bubble component for all project information.
- Independent infinite wiggle, pulse, glint, and drift on the same object.
- A second navigation layer that competes with the main horizontal world.
- Center-cropping demos to hide borders when the crop removes product context.
- Upscaling compressed portfolio assets and calling them higher resolution.

## Gifsmith high-resolution capability gate

Verified 2026-08-28 against the local `gifsmith` 0.3.4 source/build using the
real bundled Hello Web app:

- viewport: `1180×720`, `deviceScaleFactor: 2`;
- capture: deterministic PNG frames;
- encode width: `1800`;
- outputs: 1800×1098 GIF, WebP and MP4;
- loop: five frames, anchor seam MSE `0`, no warnings.

This proves that the existing package already supports the required DPR and
encode-width controls. No Gifsmith source change or npm release is required for
the portfolio media rerenders.
