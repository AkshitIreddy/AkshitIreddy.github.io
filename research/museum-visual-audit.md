# Museum of Behaviors — adversarial visual audit

Audit snapshot: 2026-08-27, against `http://127.0.0.1:49173/museum.html`.

This is a read-only audit. No implementation files were changed.

## Executive verdict

The museum direction is worth keeping. Its paper texture, gallery-floor map, tiny visitor, hand-drawn framing, and room-specific palettes already feel authored rather than templated. The best current specimens are the 390×844 foyer, 1024×768 Alcove, and 1440×900 rooms.

It is not yet safe to ship, principally because the portrait-tablet layout fails exactly where the user noticed it. At 768×1024 the project stays in its absolute-positioned desktop composition, producing text/media collisions in Alcove, Pet, Keyscape, Archive, and Workbench. There are also three content-completeness failures: no star counts, no real media for any archive project, and Email Briefing/Gifsmith are merged into one utility card.

The implementation successfully avoided document-level horizontal overflow at every tested width, emitted no console/page errors, and passed map, doorway, keyboard, and touch-swipe navigation. Those foundations should be preserved.

## Evidence captured

The audit contains 42 settled room screenshots (six rooms at seven viewport sizes), 10 narrow-screen detail screenshots, 10 interaction-state screenshots, and eight contact sheets.

| Viewport | Contact sheet | Summary |
| --- | --- | --- |
| 320×700 | [all rooms](../qa/audit/contact/320x700.png) | Foyer and navigation become crowded; project pages scroll, but floating doors cover exhibit content. |
| 390×844 | [all rooms](../qa/audit/contact/390x844.png) | Strong phone composition overall; hidden room interactions and number-only map remain problems. |
| 768×1024 | [all rooms](../qa/audit/contact/768x1024.png) | Critical breakpoint failure: text and media overlap across five rooms. |
| 1024×768 | [all rooms](../qa/audit/contact/1024x768.png) | Best compact-desktop density; room-specific Alcove interaction is nevertheless removed by CSS. |
| 1440×900 | [all rooms](../qa/audit/contact/1440x900.png) | Strongest general desktop state; small metadata and link type need refinement. |
| 1920×1080 | [all rooms](../qa/audit/contact/1920x1080.png) | Clean but increasingly dispersed; utility crops become more apparent. |
| 2560×1080 | [all rooms](../qa/audit/contact/2560x1080.png) | Art remains intact but related content becomes disconnected across the width. |
| Interactions | [state sheet](../qa/audit/contact/interactions.png) | Interactions execute, but most rely on tiny labels or hover rather than invitation. |

Additional evidence: [320px Alcove detail](../qa/audit/320x700/01-alcove-detail.png), [320px archive detail](../qa/audit/320x700/04-archive-detail.png), [320px workbench detail](../qa/audit/320x700/05-workbench-detail.png), [390px Pet detail](../qa/audit/390x844/02-pet-detail.png), [390px Keyscape detail](../qa/audit/390x844/03-keyscape-detail.png), and [verified touch-swipe arrival](../qa/audit/interactions/10-mobile-swipe-arrival.png).

## Ranked findings

### P0 — rebuild the responsive composition around content, not absolute percentages

The 768×1024 case reproduces the reported overlap and expands it to nearly every room:

- Alcove's description runs underneath the demo frame: [evidence](../qa/audit/768x1024/01-alcove-top.png).
- “Convai desktop pet” and its body copy run behind the vitrine: [evidence](../qa/audit/768x1024/02-pet-top.png).
- Keyscape's description is swallowed by the demo: [evidence](../qa/audit/768x1024/03-keyscape-top.png).
- The archive's first card covers the heading/body column: [evidence](../qa/audit/768x1024/04-archive-top.png).
- The workbench board cuts through “workbench”: [evidence](../qa/audit/768x1024/05-workbench-top.png).

Root cause: the compact tweaks at `styles/museum.css:2667` retain absolute placement; the robust document-flow layout only starts at `max-width: 760px` (`styles/museum.css:2712`). A 768px portrait tablet therefore gets neither a valid two-column grid nor the mobile stack. Pointer parallax can add another 4–9px of collision because each foreground layer translates independently (`scripts/museum.js:247-269`).

Recommended fix:

1. Put room content inside a centered composition frame and use named CSS Grid areas for `heading`, `media`, `notes`, and `controls`.
2. Switch to the stacked/document-flow composition based on available content width, no later than 900–980px; use a container query or an aspect-aware breakpoint rather than the current 760px cliff.
3. Give text and media separate grid cells. Decorative shelves may cross cell edges, but their painted bounds must never cross a live text box.
4. Cap the composition at roughly 1680–1800px on ultrawide screens; let wall/floor art fill the outer space. At 2560px, the Alcove heading, central demo, and right notes currently read as three distant islands: [evidence](../qa/audit/2560x1080/01-alcove-top.png).

### P0 — stop navigation chrome from covering mobile exhibits

On narrow screens the bottom room map is fixed while previous/next doorways remain absolutely positioned inside the scrolling room. When a user scrolls to a project, those doors float over content:

- Both doors cover the archive's first card at 320px: [evidence](../qa/audit/320x700/04-archive-detail.png).
- The previous door and red return control sit on top of utility cards: [evidence](../qa/audit/320x700/05-workbench-detail.png).
- At 320px, the foyer creature, ticket CTA, wayfinding line, and right doorway compete in the same lower region: [evidence](../qa/audit/320x700/00-foyer-top.png).

The current `padding-bottom: 88px` (`styles/museum.css:2745-2746`) reserves space for the map, not for both the map and two overlaid doorways. The door labels are then removed (`styles/museum.css:2879-2890`), turning them into context-poor arrows.

Recommended fix: use one mobile navigation system. Keep the room map, make its room names readable, and remove the floating room doors below the tablet breakpoint; alternatively place named previous/next controls in normal flow after each exhibit. Reserve explicit safe space for the bottom map plus device safe-area insets.

### P0 — preserve complete UI demos instead of cropping them to card shapes

The problem is not source resolution for the three featured projects: the tested assets are 900×562 (Alcove), 960×480 (Pet), and 1040×651 (Keyscape), and none is upscaled at the audited sizes. The problem is forced cropping. Alcove and Keyscape are forced into 16:9 with `object-fit: cover` (`styles/museum.css:1134-1140`), discarding about 8–9% of their source frames. UI demos are unlike photos: an 8% edge crop can remove navigation, labels, or window chrome.

The workbench is much worse because each image is stretched into a differently shaped grid cell and cropped with `object-fit: cover` (`styles/museum.css:2179-2186`). At 2560×1080 only about 49% of the Compendium source and 30% of the Transparency source is visible. The result is a largely black Compendium panel and a narrow Transparency slice: [evidence](../qa/audit/2560x1080/05-workbench-top.png).

Recommended fix:

- Render new demos at a deliberate browser viewport, preferably a consistent 16:9 capture such as 1280×720, with the important interaction centered during recording.
- Use `<video>` with WebM/MP4 plus a crisp poster frame, `object-fit: contain`, and a room-colored matte. Do not use CSS cropping as an editing tool for application interfaces.
- Author a separate mobile crop/poster where necessary rather than letting `cover` invent one.
- Load/animate only the current room's demo. The current page includes a 13MB Alcove WebP, 6.6MB Email GIF, 3.6MB Compendium WebP, 1.9MB Pet GIF, and 1.8MB Keyscape WebP; keeping all animated formats alive offscreen is unnecessary decode and battery work.

### P0 — complete the archive and utility information architecture

The archive says “starred experiments,” but there is no star value or star glyph anywhere in its DOM; all seven viewport audits returned zero star mentions. Its three “media” areas are CSS illustrations, not the videos linked from the project READMEs. The play triangle on Video Tutorial Generator looks actionable but is `aria-hidden` and does nothing (`museum.html:290-304`). This is both missing content and a false affordance.

Required archive treatment:

- Add an explicit star badge beside each dated title, with a restrained `★ 719`-style treatment and a generated-on date if values are baked at build time.
- Replace the generic NPC, reel, and cupcake illustrations with real poster/video surfaces extracted from each README-linked demo.
- Keep the year prominent so successful older work reads as origin history rather than current-status boasting.
- Make the whole media surface an obvious “watch demo” control; keep GitHub as a separate secondary action.

The workbench currently combines Email Briefing and Gifsmith into one large card and one demo (`museum.html:348-365`), while Compendium and Transparency are compressed into half-height slots. That is exactly the cram the user reported.

Required workbench treatment:

- Give Gifsmith its own bench/exhibit and its own product demo.
- Give Email Briefing its own exhibit and demo.
- Keep Compendium and Transparency as independent exhibits.
- Use a visible four-object bench, drawer, carousel, or nested room: selecting an object should expand one project into a full, uncropped demo and description. The board can remain as the overview, but it should not be the only detail surface.

### P1 — replace prototype chrome with the real portfolio masthead

The current top bar still says “other ways in” and links to Overview, Signal, Cinema, Field Manual, and Museum (`museum.html:32-44`). Those are design-review artifacts, not useful production navigation. Quiet Mode is also consuming the strongest action position even though the user explicitly wants the interactivity.

Recommended production masthead:

- Left: Akshit's real profile image in a hand-drawn 42–48px frame, his name, and the short identity line “I make software move.” Keep the current coral sigil as a small live-status badge or companion, not as a substitute portrait.
- Right: `Work`, `About`, `GitHub ↗`, and optionally `Resume`; on phones, use a compact museum ticket/drawer.
- Remove the visible Quiet Mode control. Preserve `prefers-reduced-motion`, visibility pausing, and a non-prominent accessibility setting if needed; removing the control must not remove motion safety.
- The current 320px prototype links render at `.52rem` and the room map hides every room name (`styles/museum.css:2925-2943`). Those are too small and too cryptic for primary navigation.

### P1 — turn ambient motion into wayfinding

The foyer does move: the creature breathes, its eye changes direction, orbit points rotate, and the ambient marks drift. Two frames 1.7 seconds apart show the change in [the interaction sheet](../qa/audit/contact/interactions.png). The problem is semantic: nothing that moves indicates what can be clicked.

Use a brief, non-blocking introduction:

1. After 600–900ms, the guide notices the visitor and glances toward the ticket.
2. The ticket lifts once and emits a short hand-drawn arrow/trail to room 01.
3. The tiny floor visitor walks one step toward the active map marker.
4. A temporary label says “Pick a room” or “Tap an exhibit”; it disappears after the first interaction and never becomes a tutorial modal.

The bottom map should react before click: room labels can rise on hover/focus, the guide can look toward the hovered room, and the corresponding exhibit color can wash faintly into the wall. On touch, the first tap may select/preview, with an explicit `Enter` action, or each room button can directly enter while showing a pressed transition.

Current discoverability defects:

- “Disturb the shelves” disappears at every width at or below 1050px because `.alcove-notes` is hidden (`styles/museum.css:2696-2697`).
- “Call the creature” disappears at 760px and below because `.pet-observation` is hidden (`styles/museum.css:2821`).
- Archive and workbench cards lift on hover, but the card is not clickable; only very small 17–21px-tall repository links act.
- At 430px and below, map names disappear and only `00`–`05` remain.
- The 390px Keyscape room is the one strong exception: “TOUCH THE LIGHT,” keyboard labels, and four physical-looking keys clearly invite action. Preserve that level of affordance: [evidence](../qa/audit/390x844/03-keyscape-detail.png).

### P1 — redesign the foyer creature as a guide, not merely a specimen

At 390px and desktop sizes the one-eyed yellow figure is charming and already reads somewhat like a minion. At 320px it is mostly buried beneath the ticket/wayfinding cluster and its orbit lines dominate its face. It reads as a decorative cyclops rather than a companion: [320px evidence](../qa/audit/320x700/00-foyer-top.png), [390px evidence](../qa/audit/390x844/00-foyer-top.png).

A museum kitten is the better fit for this site than a recognizable Minion-like character. Give it two responsive eyes, small ears, a tail that points toward the next room, cheek dots, and a simple two- or three-color silhouette derived from the existing coral/acid/gold palette. Keep the imperfect ink outline. Its expression should change with pointer position and room selection, so cuteness also becomes navigation feedback. At 320px, move it below the CTA in normal flow or reduce its orbit footprint; it must never sit behind instructional copy.

### P1 — make the typography authored and portable

The current display stack starts with `Arial Rounded MT Bold`, then `Trebuchet MS`, then generic UI fonts (`styles/museum.css:51-61`). That guarantees materially different proportions across Windows, macOS, Android, and Linux—the exact conditions under which this absolute layout is fragile. “Comic Sans MS”/“Segoe Print” introduces a second platform-dependent handwritten voice.

Self-host one expressive variable display face and one readable mono face. Preserve the current round/technical contrast, but use actual font metrics as part of the layout. Increase project metadata and repository actions from the current approximately 8–11px sizes to a readable 12–14px floor. Headings can remain oversized; supporting copy should not require zooming on a 1440px monitor.

### P2 — refine focus, motion, and performance without flattening the experience

- Keyboard navigation works (`Home → foyer`, `ArrowRight → Alcove`, `End → Workbench`), but the global `3px` focus outline paints a giant violet rectangle around an entire oversized heading after keyboard room changes. It is visible in the first two interaction frames. Keep a clear focus indicator, but render it as a small curator tab, underline, or left rail for room headings rather than outlining a 700px text block.
- The tested touch swipe correctly moved from Foyer to `#alcove`: [evidence](../qa/audit/interactions/10-mobile-swipe-arrival.png). Retain this and add a subtle first-use horizontal gesture cue.
- The 900ms room transition and 780ms wheel lock are coherent but slightly ceremonial for repeated traversal (`scripts/museum.js:91-99` and `228-242`). After the first room, a 550–700ms walk would make the museum feel more responsive while keeping character.
- Ambient canvas drawing runs continuously via `requestAnimationFrame` (`scripts/museum.js:560-585`). Keep it only while the page is visible and consider reducing particle count/DPR on mobile; preserve the existing reduced-motion branch.
- The Alcove disturbed state, Pet called state, archive hover, workbench hover, and Keyscape light response all executed without runtime errors. Their visual deltas are often too subtle to teach the next interaction. Pair the first response with a short label or reaction from the guide.

## Room-by-room visual notes

| Room | What already works | What must change |
| --- | --- | --- |
| Foyer | Strongest identity statement; 390px and 1440px compositions feel genuinely playful. | Use the preferred “I make software move” line, move the guide clear of the 320px CTA, and turn its first motion into a click cue. |
| Alcove | Excellent moss/paper palette, arched bookshelf architecture, and tactile framed demo. The 1024px and 1440px frames are especially successful. | Fix 768px text/media collision; stop shelf art crossing text at ultrawide (measured overlap: about 29,852px² with the left heading and 51,307px² with right notes); retain shelf interaction on tablet/mobile; show the full UI frame. |
| Desktop Pet | Vitrine and coral gallery-floor treatment communicate “character in a habitat” immediately. | Fix 768px title/body collision, replace the demo with a crisp authored capture, and keep the call interaction available on touch layouts. |
| Keyscape | Best interaction affordance; night-room contrast and physical light keys are memorable. | Fix 768px description collision and the mobile repository link that sits behind the light console; preserve full screenshot edges. |
| Archive | The “good shelf, not the attic” framing and curator note avoid bragging. Cards scan well at 1024–1440. | Add real demos and visible star counts; remove false play icon; prevent 768px heading/card collision; make media clickable. |
| Workbench | Pegboard/desk metaphor and utility palette fit the product category. | Split four projects, especially Email Briefing and Gifsmith; add a nested detail interaction; eliminate 30–51% media crops; prevent 768px title collision and mobile door overlays. |

## Recommended responsive modes

Do not solve this with more one-off percentages. Define four intentional compositions:

1. **Compact phone, 320–479px:** one-column room flow, full-width contained media, labeled scrollable room strip, no floating doors. The guide sits in normal flow.
2. **Phone/compact split, 480–767px:** one-column content with larger media; optional notes in collapsible curator cards.
3. **Portrait tablet and split screen, 768–1099px:** either a strict 38/62 grid with no overlap or a generous stacked flow. This is the missing mode today.
4. **Desktop, 1100–1919px:** current two-sided museum composition, rebuilt on a bounded grid rather than independent absolute offsets.
5. **Ultrawide, 1920px and above:** center the narrative in a max-width stage; extend only decorative architecture into the side galleries.

Each mode needs an explicit safe rectangle between the masthead and map. Decorative layers may leave it; readable text, project media, and controls may not.

## Acceptance checklist for the next visual pass

- No text/media or live-text/decorative-shelf intersections at all seven audited sizes.
- All six rooms captured at 320×700, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080, and 2560×1080 after implementation.
- No fixed doorway covers scrolled content on phone.
- Real avatar appears in the masthead; prototype links and visible Quiet Mode are gone.
- Every archive card shows a dated star count and a real playable poster/demo.
- Email Briefing, Gifsmith, Compendium, and Transparency each receive an independent exhibit state.
- Every UI demo uses a complete, readable frame; no `object-fit: cover` on application screenshots.
- Alcove disturb and Pet call interactions remain available on touch layouts.
- First-time motion points toward an action; all later motion remains interruptible and respects reduced motion.
- Room map, door, keyboard, swipe, light keys, archive media, and utility-selection interactions all receive a visible response.
- No console errors, document horizontal overflow, or unreadably small primary actions.

The visual north star should be the current museum at 1440px, not a redesign away from it. The work is to make that authored room language structurally reliable, content-complete, and more inviting to touch.
