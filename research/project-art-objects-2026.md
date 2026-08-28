# Art-object direction for Archive and Tools

Research date: 2026-08-28
Scope: project selection, object-based navigation, interactive-installation logic,
data artifacts, custom SVG illustration, motion, and accessibility.
Constraint: research only; no site implementation was changed and no browser UI was
launched.

## Decision

Do not polish the current Archive cards or Tools drawers. Replace them.

The Archive should become a **Cabinet of Origins**: three visibly different
specimens on individual plinths, each expressing the idea that project introduced.
The Tools page should become a **Bench of Instruments**: four working apparatuses,
each showing the transformation its software performs. The objects remain HTML
tabs/buttons underneath, but nothing about their visual presentation should resemble
a reusable dashboard card or an icon library.

The governing rule is:

> The object's silhouette says what the project is; its one local movement says what
> the project does; activation opens the real demo and evidence.

This is the difference between a decorative icon and a designed artifact. It follows
the strongest precedent in the review: Cooper Hewitt's Pen makes collection tangible;
musicBottles makes tracks feel bottled; Senseboard makes information feel movable;
Bruno Simon makes physics both the medium and the navigation. In each case, the
interaction metaphor carries meaning instead of sitting on top of it.

## What is weak in the current pages

### Archive

- The three selectors share the same tall rectangle, label position, border, and star
  badge. Their line drawings are thumbnail decoration, not identities.
- A very large real demo is paired with three much smaller selectors, so the selector
  rail feels like application chrome rather than a collection of artifacts.
- The selected state is mostly a dark fill and accent color. At a glance, the items
  differ more by copy than by form.
- The ambient cables and background dots imply a physical room, but the selectors do
  not belong to that room materially.

### Tools

- The four drawers are the same box repeated four times with a tiny outline symbol and
  arrow. This is precisely the generic-card/icon language the user rejected.
- Email Briefing, Gifsmith, Compendium, and Transparency App have radically different
  processes, yet their selectors have almost identical proportions and behavior.
- On mobile the repeated boxes form a dense control stack before the selected media;
  the user sees navigation furniture before seeing a memorable project object.
- Infinite ambient motion on the selected media frame does not add meaning to the
  selector and risks making the whole composition feel restless.

## Visual system: crafted artifacts, not illustrated cards

Each selector should consist of four separate layers:

1. **Object silhouette** — a project-specific outer form with recognizable negative
   space. No common rounded rectangle behind it.
2. **Working layer** — one mechanism that can move: a reel, shutter, lens, tray, page,
   waveform, or orbiting token.
3. **Evidence mark** — one truthful datum built into the exhibit: year/star count for
   Archive; input/output or format for Tools.
4. **Accession tag** — normal HTML text next to or below the object. It provides the
   project name and state; it is not baked into the SVG.

The site already owns an effective palette. Use it like workshop materials rather
than as flat fills:

- Ink / iron: `#172326`
- Museum paper / ivory: `#fffaf0`, `#efe7d3`
- Fired coral enamel: `#f06449`, `#c54234`
- Acid glass / status light: `#d9ee72`
- Brass: `#e5b845`
- Violet signal glass: `#8c79ff`
- Cyan optical glass: `#8dd9e2`
- Night chassis: `#111722`, `#17233b`

Every object needs at least three material readings—e.g. iron chassis, paper insert,
glass signal—not three arbitrary colors. Use an offset hand-inked shadow as part of
the geometry, not a generic blurred drop shadow applied to the whole object.

### SVG drawing standard

- Work at roughly `160 × 120` for Archive and `148 × 112` for Tools. Scale the button
  hit area independently from the art.
- Aim for 12–28 purposeful paths/groups per artifact. The present 3–6-path pictograms
  are too abstract; hundreds of tiny paths would turn into noise at selector size.
- Organize groups as `chassis`, `material`, `mechanism`, `signal`, `wear`, and
  `selected-mark`. Only `mechanism` and `signal` should normally animate.
- Give every artifact one unmistakable asymmetric feature. A strong silhouette must
  remain identifiable at 48 px and in monochrome.
- Use two stroke weights, not one monoline system: a strong structural contour and a
  finer working/detail line. Use `vector-effect="non-scaling-stroke"` where needed.
- Use clipped hatching, halftone, registration marks, tiny screws, paper edges, and
  enamel chips selectively. These details imply construction; random sparkles do not.
- Prefer actual SVG shapes, masks, patterns, and hard-edged translucent layers. Limit
  blur/turbulence filters to a small signal area; filters over an entire artifact can
  soften its silhouette and trigger expensive repaints.
- Keep all essential naming and metadata in HTML. Because the button already has a
  visible accessible name, the nested SVG should normally be `aria-hidden="true"`
  and `focusable="false"`; use `<title>/<desc>` only when an SVG is independently
  informative outside that named control.

## Archive: Cabinet of Origins

### Composition

Desktop should read like a small conservation table, not a sidebar:

```text
EARLY SIGNALS / short curator statement

      [ dialogue relay ]  [ storyboard orrery ]  [ dream specimen ]
       accession tag       accession tag          accession tag

  ┌──────────────── selected film lectern / real demo ────────────────┐
  │ full contained media                   title / premise / source    │
  └────────────────────────────────────────────────────────────────────┘
```

The artifacts should occupy a shallow, shared shelf with individual shadows and
plinth pins, but no boxes. Selecting one directs a narrow cable/light path from that
artifact to the film lectern. This makes the relationship between selector and demo
spatially legible.

On phone, use a horizontally scrollable specimen tray or a two-plus-one arrangement
above the panel. Each hit area remains large; labels are always visible. Do not shrink
the objects into icon buttons and do not hide names behind a first tap.

### A—01: Interactive LLM-powered NPCs — **Dialogue Relay**

**Artifact.** Two small, differently profiled theatrical portrait heads face away on
a club-stage base. Between them sits a violet waveform bridge; behind one head is a
visible acid-green memory spool, and a thin copper cable enters from the stage floor.
The base includes the honest `2023 · ★ 719` accession strip.

**Why it is distinctive.** It combines the project's actual ingredients—two embodied
characters, voice/facial animation, environmental context, and vector memory. A chat
bubble, robot head, or generic neural-network node would collapse this into ordinary
AI branding. The two-profile silhouette plus the physical memory spool could only
belong to this project.

**Motion.** Pointer proximity affects this artifact only. The nearer portrait turns
at most 3 degrees toward the cursor; the other turns toward it with a short delay.
The waveform gains one pulse and the spool advances one tooth, then settles. On
activation both portraits face the shared waveform and the cable to the film lectern
illuminates. No perpetual talking animation.

**SVG cues.** Deep night plinth; violet signal glass; acid memory reel; coral face
tracking ticks; two different facial profiles rather than mirrored duplicates.

### A—02: AI Video Tutorial Generator — **Storyboard Orrery**

**Artifact.** A hand-cranked brass projector supports five paper frames on an
off-center orbital arm: prompt card, outline, presenter portrait, slide, and final
play frame. The frames fan in sequence rather than forming a film-strip icon. The
base carries `2023 · ★ 310`.

**Why it is distinctive.** The artifact shows an authored pipeline turning one topic
into a planned, narrated visual lesson. A play triangle or cinema reel only says
“video”; the five staged frames say “generation becomes sequence.”

**Motion.** On proximity, the crank inclines by 4 degrees and the nearest frame shifts
2–3 px, as if the mechanism is ready. On activation the orrery performs one controlled
half-turn: prompt → plan → presenter/slides → assembled tutorial. The sequence lasts
under 900 ms and holds on the final frame.

**SVG cues.** Ivory paper leaves with visible deckle edges; coral registration marks;
cyan projection pane; brass axle; one black presenter silhouette. Do not use a generic
strip of equal rectangles.

### A—03: CupcakeAGI — **Dream Specimen**

**Artifact.** A slightly eccentric glass bell jar houses a pastel automaton: cupcake
pedestal below, a many-chambered “inner weather” mechanism above, and five mismatched
sensory/emotion tokens suspended around it. A narrow dream-paper curl exits the base.
The tag carries `2023 · ★ 127`.

**Why it is distinctive.** CupcakeAGI explored tools, persistent memory, emotions,
spontaneous thoughts, senses, and dreams. The bell jar frames it as an early living
experiment without turning it into either a sterile AI node icon or a childish cupcake
logo. The exposed inner weather and dream tape are specific to this project.

**Motion.** Only the token nearest the pointer leans toward it; the inner chamber makes
one soft compression. On activation the tokens align, the dream tape unrolls 8–12 px,
and the jar's label flips from `dormant` to `observing`. The movement settles. Avoid
continuous bobbing, blinking eyes, or orbit loops.

**SVG cues.** Irregular cyan glass contour with a hard white glint; coral/pink inner
chambers; acid status tab; violet dream marks; black iron base. The jar must keep a
strong silhouette even when internal details disappear at small size.

### Archive selected-state treatment

- Selected artifact rises only 3–4 px onto a visible registration pin; its accession
  tag unfolds to show the premise. Do not scale it dramatically.
- A short cable/light path connects it to the demo. The other objects remain fully
  legible and available; they do not fade to 20% opacity.
- The film lectern remains a real `<video>`/poster surface with a visible play/pause
  control. Selection changes the exhibit; it does not force playback.
- Preserve year, star count, premise, stack, and source link as normal text. The art
  provides memory; the evidence provides credibility.

## Tools: Bench of Instruments

### Composition

The four projects should read as tools laid on a working table, each with a different
footprint and material logic:

```text
USEFUL THINGS / four specific kinds of friction removed

 [sorting press]    [loop splicer]    [citation lens]    [optical rulebox]
  Email Briefing      Gifsmith          Compendium        Transparency
       ╲                  │                 │                 ╱
        └──────── selected tool routed to the work surface ──┘
                         [real full demo]
               input → operation → output / source
```

Do not put each object inside a drawer-shaped rectangle. The shared bench and object
shadows create grouping. Each object is itself the tab. On desktop, allow the selected
artifact's “power line” to reach the demo; on mobile, keep a two-column instrument tray
above a full-width detail panel.

### U—01: Email Briefing — **Newsletter Sorting Press**

**Artifact.** A tall inlet hopper holds visibly different newsletter sheets. Three
offset sorting drums route them into color-coded topic bundles, and one folded briefing
emerges from the output tray. The input and output profiles should make the silhouette
read left-to-right.

**Why it is distinctive.** The software clusters and deduplicates newsletters into a
browsable topic map. A closed envelope only means email; the sorting press visibly
communicates many messages becoming one organized briefing.

**Motion.** Proximity feeds a single sheet one notch. Activation rotates the drums once,
merges two duplicate slips, and advances the folded briefing into the tray. Selected
state holds with the output exposed.

**SVG cues.** Cyan paper hopper; moss drums; ivory sheets with non-linguistic line
patterns; coral duplicate-cancel mark; iron chassis.

### U—02: Gifsmith — **Loop Splicer**

**Artifact.** An angular black capture aperture feeds a coral-edged film ribbon around
two unequal rollers and through three small output dies labeled in HTML nearby as
GIF / WebP / video. A precise cursor witness mark and loop seam are visible on the
ribbon.

**Why it is distinctive.** Gifsmith is not merely a “video tool”; it performs real UI
actions from a declarative timeline and forges a paced loop. The capture aperture,
timeline perforations, cursor witness, and physical loop seam tell that story.

**Motion.** Proximity pulls the ribbon 2 px toward the pointer and inclines the crank.
Activation performs one capture cycle: witness mark advances → loop seam passes the
splicer → output dies stamp once. Hold on a perfectly aligned seam. No continuously
spinning reel.

**SVG cues.** Night chassis; acid capture light; coral splice tape; brass roller pins;
tiny numbered timeline notches. Avoid the familiar generic play button or film-reel
silhouette.

### U—03: Compendium — **Citation Lens**

**Artifact.** An open, uneven folio supports a large hinged optical lens. Beneath the
lens, one problem card aligns with three source tabs connected by fine colored threads;
the lens reveals denser source marks only inside its glass.

**Why it is distinctive.** Compendium maps plain-language problems to proven techniques
and cited source material. A book icon says only “documentation”; a movable lens that
aligns a problem with inspectable sources communicates retrieval plus provenance.

**Motion.** With a fine pointer, the lens follows the pointer within its own page by a
maximum of 4 px; threads tense locally, never pulling the page or surrounding bench.
Activation snaps the lens to the selected technique and turns three source tabs outward.

**SVG cues.** Moss cloth folio; cyan lens; violet/coral/brass source threads; ivory
problem card; dark page annotations visible only beneath the lens mask.

### U—04: Transparency App — **Optical Rulebox**

**Artifact.** Two offset monitor-shaped glass panes sit inside a compact optical bench.
One has a vertical neutral-density shutter; the other has an overlapping window mask.
A physical rule slider connects display dimming to per-window opacity without reducing
the design to two overlapping rectangles.

**Why it is distinctive.** The app owns two precise Windows concepts: per-monitor
dimming and per-app/window transparency rules. The paired optical panes and independent
shutter/mask controls make both concepts visible at once.

**Motion.** Proximity shifts only the top glass pane by 1–2 px, changing the overlap.
Activation lowers the shutter one measured stop, then slides the window mask to its
saved position. The movement is stepped and exact, unlike the elastic motions of the
other tools.

**SVG cues.** Violet/cyan translucent panes with hard contours; black metal rail;
acid rule index; paper label for display A/window B; no blur-heavy glassmorphism.

### Tools selected-state treatment

- Each tool has a different “ready” posture rather than a shared active fill: output
  tray exposed, loop seam aligned, source tabs opened, or shutter lowered.
- The selected tag includes `U—0x`, project name, and a plain-language input/output
  statement. Do not repeat the entire paragraph in the selector.
- Keep the real process list in the detail surface and tune its verbs to match the
  artifact's operation.
- The large demo should be full and uncropped. The artifact enriches navigation; it
  must not compete with or obscure the actual software.

## Motion behavior: local physics, not page jiggle

The user explicitly dislikes the page shifting in response to the cursor. Treat every
artifact as an isolated mechanical system.

### Interaction states

1. **Rest:** fully readable and still. A selected object may hold a mechanically
   meaningful pose, but it should not loop forever.
2. **Proximity (fine pointer only):** begin within the object's own hit box or a small
   20–32 px halo. Change one mechanism, not the whole object group.
3. **Hover/focus:** reveal the same visual affordance: accession tag rises, working
   part preloads, focus halo appears.
4. **Activation:** play one explanatory action lasting roughly 450–900 ms.
5. **Selected:** settle into a stable, non-color-only pose and update the panel.
6. **Leave:** critically damp back to rest within roughly 350–550 ms; no oscillation
   after the pointer has left.

### Implementation implications

- Compute local normalized pointer coordinates from the active artifact's bounding box.
  Do not write pointer variables on the room, document, header, demo, or page shell.
- Use one damped spring per moving sub-part. Suggested ceiling: translation 4 px,
  rotation 4 degrees, scale 1.015. The object base and accession label never drift.
- Request animation frames only while an artifact is hovered, activated, or settling;
  stop when displacement/velocity fall below a small epsilon and on hidden tabs.
- Animate `transform` and `opacity` where possible. Avoid animated filter blurs,
  shadows, SVG turbulence, layout properties, or a page-wide paint on every move.
- Hover motion is an affordance, not a game. The pointer remains the browser pointer;
  no magnetic cursor, cursor replacement, or hit-box that dodges the user.
- Do not apply collision physics between artifacts. The physical metaphor is visual;
  neighboring controls must remain stable targets.
- Under `(pointer: coarse)`, skip proximity behavior. One tap selects/activates with a
  short direct response. Do not require a preview tap followed by a second action.
- Under `prefers-reduced-motion: reduce`, remove proximity motion and spring travel.
  Use an immediate tag change, thicker contour, registration pin, and static selected
  mechanism pose. Opacity/color changes may remain when contrast is sufficient.

## Accessibility contract

The custom art must sit on a boringly reliable interaction model.

- Keep the existing `tablist` / `tab` / `tabpanel` semantics. Use roving `tabindex`,
  `aria-selected`, `aria-controls`, and an `aria-labelledby` relationship from the
  panel back to the selected artifact.
- Arrow keys move between artifacts; `Home`/`End` move to the first/last. Use manual
  activation with `Enter`/`Space` if changing media has noticeable latency; automatic
  activation is acceptable only when the panel updates immediately.
- The full selector button—not a tiny internal SVG path—is the target. Meet the WCAG
  24×24 CSS-pixel minimum and aim for at least 44×44 px because the artwork is irregular
  and the page is used on touch screens.
- Provide an always-visible HTML project name. Archive also keeps year/star count;
  Tools keeps its short input/output cue. No essential information appears only on
  hover, inside an SVG, or in motion.
- Nested SVGs are decorative when the button has visible text: `aria-hidden="true"`
  and `focusable="false"`. If a standalone diagram is ever used, give it `role="img"`,
  `<title>`, `<desc>`, and an explicit labelling relationship.
- Focus must be visible on paper, dark selected objects, and translucent glass. Use a
  two-part halo (ivory inner line + ink/room-accent outer line), not a color change alone.
- Selected state must combine at least two cues: stable mechanical pose plus tag/pin or
  contour change. Do not rely on violet/coral fill alone.
- Meaningful control boundaries, focus indicators, signal paths, and working parts
  should reach 3:1 contrast against adjacent material. Thin anti-aliased lines need
  extra contrast or weight.
- The actual demo retains independent play/pause controls and does not autoplay because
  an artifact was selected. An artifact's one-shot activation response should finish
  within five seconds; any longer automatic motion needs a shared pause mechanism.
- The panel's title and description update as text without moving keyboard focus.
  Announce selection succinctly only if necessary; do not put a long paragraph in an
  assertive live region.

## Anti-patterns to reject during review

- Same rectangle, same icon position, same arrow, new label.
- Monoline envelope / book / film / overlapping-window icons as the primary art.
- Generic AI motifs: sparkle, robot head, neural nodes, chat bubble, glowing orb.
- Glassmorphism cards, floating gradient blobs, or 3D spheres unrelated to the project.
- Literal technology logos used as the artifact's identity.
- A shared hover animation applied to every object regardless of its mechanics.
- Infinite bobbing, pulsing, orbiting, wiggling, blinking, or reels that never stop.
- Whole-room parallax, scene tilt, demo-frame drift, or page translation from pointer
  movement.
- Pointer magnetism or physics that makes a target flee, overshoot, or keep oscillating.
- Essential label or state hidden until hover; hover-only explanations on touch.
- Selected state communicated only with color or a low-contrast glow.
- Morphing one artifact into another. It destroys the individual silhouettes users
  need to remember.
- Full-object blur/turbulence filters that make the drawing look synthetic and repaint
  large areas.
- “More detail” created from random bolts, sparkles, noise, or meaningless data marks.
- Miniature line art placed inside a still-generic bordered card.
- The art covering the real demo or becoming more prominent than the shipped software.
- Cropped UI videos. Project art can be theatrical; evidence must remain honest.

## Production acceptance checks

1. In a silhouette-only sheet, all seven artifacts are recognizable and no two share
   the same outer contour.
2. In grayscale at 48 px, each remains distinguishable without its text label.
3. A reviewer can state each project's input → transformation → output after seeing its
   one-shot motion, without reading the long description.
4. Pointer movement over one artifact produces zero transform delta on the room, text,
   other artifacts, selected demo frame, and fixed navigation.
5. Every one-shot action settles; there is no persistent movement after five seconds.
6. Keyboard, mouse, touch, coarse-pointer, and reduced-motion paths select the same
   projects and expose the same information.
7. The selected state remains obvious with color removed and animation disabled.
8. All control/state graphics and focus indicators pass non-text contrast checks.
9. At 320, 390, 768, 1024, 1440, 1920, and 2560 widths, no artifact or label overlaps
   media, copy, doorways, the masthead, or the bottom map.
10. Each real demo remains fully visible with `object-fit: contain`; selection never
    forces playback or causes layout shift.
11. A close-up visual review finds purposeful material details, not repeated decorative
    noise; remove any detail that does not communicate construction or process.
12. Archive reads as historical origins; Tools reads as four working instruments. If
    either still reads as a stack of cards, the pass is not complete.

## Source assessment

The set intentionally mixes production case studies, museum/installation work, HCI
research, and current standards. Older installation sources are used for interaction
principles, not as recommendations for current JavaScript stacks.

| # | Source | Date/type | Evidence used and limits |
|---:|---|---|---|
| 1 | [Bruno Simon portfolio](https://bruno-simon.com/) | Current live portfolio; creator source | A portfolio can make its medium the proof of skill and keep the full source/process inspectable. It is a maximal 3D precedent, not a reason to convert these pages to WebGL. |
| 2 | [Bruno Simon portfolio case study](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b) | 2019 creator case study | Physics was introduced immediately, paths/walls/panels taught navigation, and interactive zones expanded on hover. The later need for added jump instructions is a warning that spectacle still requires discoverable controls. |
| 3 | [Cooper Hewitt mass digitization and Collection Browser](https://www.cooperhewitt.org/2016/08/31/unprecedented-access-to-cooper-hewitts-collection-following-18-month-mass-digitization-effort/) | 2016 museum case study | The “object river” makes objects primary, then connects selection to high-resolution detail and metadata. Strong precedent for artifacts first, evidence panel second. |
| 4 | [Designing the Cooper Hewitt Pen](https://www.cooperhewitt.org/new-experience/designing-pen/) | 2014 museum/industrial-design case study | One authored physical tool collects, retrieves, explores, and sketches with objects. The device embodies the museum's design message rather than looking like generic kiosk chrome. |
| 5 | [Getting lost in the collection](https://labs.cooperhewitt.org/2012/lost-collection-alpha/) | 2012 museum product post | Multiple browse paths and a surprising random-object entry made the collection explorable; durable IDs and metadata kept play connected to scholarship. Useful for Archive's accession tags and honest evidence. |
| 6 | [Anyang: China's Ancient City of Kings](https://www.unit9.com/project/anyang-chinas-ancient-city-kings) | 2023 production installation case study | A top-down excavation image became a nearly instructionless controller for a large content display, while the web translation retained an accessible mode. Subject-derived navigation beats generic controls. |
| 7 | [Schneider Electric: Wiser Interactive](https://www.unit9.com/project/schneider-electric-life) | 2018 production web case study | Layered seamless video loops responded to user commands to make control feel like the product. The important lesson is input-to-result continuity, not the use of WebGL itself. |
| 8 | [Telekom interactive advent calendar](https://www.unit9.com/project/telekom-der-magische-adventskalender/) | 2017 production case study | An attic and 24 bespoke layered illustrations served as chapter portals. Custom, content-specific objects rewarded exploration; a common UI skin would have weakened the premise. |
| 9 | [Mercedes-Benz NOW](https://www.unit9.com/project/mercedes-now/) | 2016 live installation case study | A pendulum, sand, hourglass, WebGL data, sunlight, and live feeds turned time/data into different physical phenomena. Supports giving each project its own material mechanism instead of one repeated icon system. |
| 10 | [Just A Reflektor](https://unit9.com/project/reflektor/) | 2013 interactive-film case study | A phone became a wand whose motion revealed deeper film layers; prototypes connected input data to a clear visual consequence. Useful for local cause-and-effect, but the site's camera/phone complexity is not needed here. |
| 11 | [Data Sculptures as a Playful and Low-Tech Introduction to Working with Data](https://www-prod.media.mit.edu/publications/data-sculptures-as-a-playful-and-low-tech-introduction-to-working-with-data/) | 2017 MIT publication | Mapping a variable onto a familiar physical artifact can make abstract process approachable; the principles emphasize familiar materials and a playground. Supports data-bearing accession marks and working mechanisms. |
| 12 | [HERMITS](https://tangible.media.mit.edu/project/hermits/) | MIT/UIST research case | Different mechanical shells give one robotic core distinct functions and expressions. Supports unique project shells and warns against letting a shared implementation dictate identical outward forms. |
| 13 | [Strata](https://tangible.media.mit.edu/project/strata/) | MIT tangible-interface research | Layered translucent acrylic, lights, and sensors embody building infrastructure. Supports layered SVG glass/chassis/signal construction in the Citation Lens and Optical Rulebox. |
| 14 | [(Dis)Appearables](https://www.media.mit.edu/projects/dis-appearables/overview/) | MIT research case | Frontstage/backstage mechanics focus attention by revealing the relevant tangible control when needed. Supports stable rest states and brief selected mechanisms rather than keeping every object animated. |
| 15 | [Senseboard](https://tangible.media.mit.edu/project/senseboard/) | MIT/CHI tangible-interface research | Magnetic pucks represent messages, citations, slides, and scenes so abstract knowledge can be grouped and manipulated physically. Directly relevant to Email Briefing and Compendium process metaphors. |
| 16 | [Illuminate](https://www.media.mit.edu/projects/illuminate/overview/) | 2023 MIT interactive-art case | Motion is meaningful because the person's speed, position, acceleration, and orientation directly shape a visible wake. Supports one-to-one local response and argues against unrelated page-wide jiggle. |
| 17 | [musicBottles](https://tangible.media.mit.edu/project/musicbottles/) | 2000 MIT/SIGGRAPH tangible-interface case | Opening a distinct bottle releases its track and the table visualizes pitch/volume. A near-perfect example of objects as both containers and controls for invisible information. |
| 18 | [BigBarChart](https://dataexperiences.media.mit.edu/projects/bigBarChart.html) | MIT data-experience prototype | Human-scale bars change height/color and expose metadata through direct physical action. Supports truthful data-as-form, but its room scale should be translated to restrained selector motion. |
| 19 | [MIT Object-Based Media: Open Water Data and Thermal Fishing Bob](https://object-based.media.mit.edu/) | 2018+ research/installation collection | Glowing lanterns and a color-changing fishing bob make invisible environmental data present and intuitive. Supports embedding one honest datum into each artifact rather than decorative faux telemetry. |
| 20 | [FOLIO spatial app library](https://www.artkolomatskyi.com/projects/folio) | 2025 designer case study | Apps become uniquely designed books with familiar pick-up/open/return logic. Useful evidence that a coherent shelf can contain individually authored objects without reverting to a flat grid. |
| 21 | [Arts Corporation animation refinement](https://tympanus.net/codrops/2025/04/22/designing-for-flow-not-frustration-the-transformation-of-arts-corporation/) | 2025 practitioner case study | Individually cursor-pushed construction lines risked blocking content; refinement centered on flow and frustration. Strong warning to isolate motion and keep reactive layers pointer-safe. |
| 22 | [MDN: SVG in HTML](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML) | Updated 2026; technical reference | `viewBox`, `preserveAspectRatio`, `role="img"`, `<title>`, `<desc>`, and explicit labelling support scalable, accessible custom illustration. For named buttons, redundant SVG announcements should still be avoided. |
| 23 | [WAI-ARIA APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) | Current W3C practice guide | Defines `tablist`/`tab`/`tabpanel`, roving focus, arrows, Home/End, and activation guidance. The visual artifact system should preserve this predictable contract. |
| 24 | [WAI-ARIA manual tabs example](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/) | Current W3C example | Manual activation is preferable when panel content cannot appear instantly; also cautions that APG examples need actual assistive-technology testing before production reuse. |
| 25 | [WCAG 2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Updated 2026; W3C guidance | Automatic or indirect-interaction movement lasting over five seconds needs control; a shared control is better than many local pause controls. Supports one-shot motion that settles. |
| 26 | [WCAG 2.2: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Updated 2025; W3C guidance | Non-essential interaction-triggered motion must be disableable; parallax is explicitly identified as a potential vestibular trigger. Supports eliminating page-wide pointer motion and honoring reduced motion. |
| 27 | [WCAG 2.2: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Current W3C guidance | Requires 24×24 CSS px or sufficient spacing and explains complex SVG bounding boxes. Supports generous invisible rectangular hit areas around irregular art objects. |
| 28 | [WCAG 2.2: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Current W3C guidance | Meaningful controls, states, graphics, and focus indicators need 3:1 contrast; thin antialiased lines can appear weaker than nominal values. Supports thicker structural contours and non-color state cues. |
| 29 | [WCAG 2.2: Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | Current W3C guidance | Hover/focus-disclosed content must be dismissible, hoverable, and persistent when applicable. The safer direction here is to keep names/evidence always visible and reserve hover for nonessential mechanism cues. |
| 30 | [MDN: `pointer` media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/pointer) | Updated 2026; technical reference | Distinguishes fine pointers from coarse primary inputs. Supports proximity reactions only for accurate pointers and larger/direct controls for touch. |
| 31 | [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) | Updated 2026; technical reference | Detects the user's request to remove, reduce, or replace nonessential motion and identifies scaling/panning as possible triggers. Supports static selected poses as the reduced-motion equivalent. |
| 32 | [web.dev: high-performance CSS animations](https://web.dev/articles/animations-guide) | Current production guidance | Recommends transforms/opacity, warns against layout/paint animation, and advises using `will-change` sparingly. Supports isolated SVG groups and rAF only while an artifact is active. |

## Synthesis

The sources converge on five points:

1. **A metaphor earns its place by carrying information.** Bottles contain tracks;
   pens collect objects; pucks organize information; artifacts here must expose the
   project's actual transformation.
2. **Distinct objects can still belong to one room.** Shared plinth, material palette,
   lighting, and accession typography create coherence without enforcing one card shape.
3. **Input and response must be spatially obvious.** Local pointer/tap/focus changes one
   nearby mechanism; it must never jostle the page or unrelated content.
4. **Stillness is part of craft.** One-shot action and stable selected poses feel more
   intentional than seven simultaneous ambient loops.
5. **Novel art should retain familiar control semantics.** Large targets, visible names,
   keyboard tabs, reduced motion, contrast, and real media controls keep the system
   usable while the artifacts carry the personality.

That combination—seven bespoke mechanisms, one quiet exhibit grammar—is the premium
direction most likely to make Archive and Tools feel authored rather than skinned.
