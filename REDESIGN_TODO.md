# Software in Motion — live redesign TODO

This is the local source of truth for the active redesign work.
An item is complete only after implementation, rendered inspection, and
proportional regression checks. The opt-in adversarial loop is currently off;
normal collaboration continues through the remaining backlog.

## Operating constraints

- [ ] Keep all website work, generated media, clones, and temporary review evidence inside this repository.
- [ ] Do not push or publish the personal-website repository.
- [ ] Use subagents heavily in coordinated read-only/research/verification waves; keep one integration owner per file.
- [ ] Research each active design problem online and record source → hypothesis → test → decision.
- [ ] For every affected route, viewport, and state: inspect 4–6 overlapping closeups one at a time, then the full frame.
- [ ] Preserve reduced-motion, keyboard, touch, responsive, and lazy-media behavior.
- [ ] If higher-resolution demos require a missing Gifsmith feature, the separate Gifsmith repository and its explicitly requested GitHub/npm release are in scope only for that capability; verify the need before changing or publishing it.

## 1. Shared visual philosophy and motion system

- [ ] Define one coherent redesign philosophy that feels artistic, custom, playful, design-focused, and unmistakably Akshit—not a collection of decorated cards.
- [ ] Give every subsection a distinct, memorable interaction/material metaphor while retaining a shared typographic, mascot, and motion language.
- [ ] Add more environmental motion and stateful reactivity across the page; keep hierarchy legible and avoid repetitive ambient effects.
- [ ] Replace generic badges, bubbles, cards, labels, and frames with authored shapes/details when they currently look cheap.
- [ ] Reconsider the travelling-kitten ruler/rail from first principles; prototype multiple navigation metaphors before choosing one.
- [ ] Make the top and bottom chrome feel native to each room, not like unchanged furniture around a themed middle.
- [ ] Audit animation ownership so connected art moves as coherent rigs rather than drifting pieces.
- [ ] Keep the line “I make software that refuses to sit still” prominent, spacious, and smoothly reactive without a crosshair cursor or broken letter motion.

## 2. Browser identity and masthead

- [x] Shorten the browser tab title.
- [x] Replace the cheap tab cat with a genuinely custom favicon/icon family that remains recognizable at 16, 32, 48, and 180px.
- [ ] Keep the profile portrait and maker identity legible across phone, tablet, split-screen, desktop, and ultrawide.
- [ ] Fix maker-tagline contrast on every light frame and raise its smallest rendered size.
- [ ] Review tab/subsection labels for truncation, density, and meaningful visible names while preserving full accessible names.

## 3. Foyer / hero experience

- [x] Replace the fragmented travelling-cat CSS sculpture with a connected SVG rig; remove the neck plate and drifting face.
- [x] Make the travelling kitten feel slimmer/catlike without returning to detached anatomy.
- [x] Redraw the large studio kitten with a rounded torso, contained chest tuft, tucked paws, off-centre kerchief, and non-tangent spark.
- [x] Move studio-kitten idle motion from the root SVG to a character rig so the shadow and ambient sparks stay grounded.
- [x] Replace the speech triangle with a detached, responsive connector that never enters the ears/face.
- [x] Make the kitten’s eyes follow the pointer over the speech bubble as reliably as over the kitten itself; add a direct regression test.
- [ ] Redesign the kitten’s circle/orbit graphic to feel substantially more animated, artistic, dimensional, and fun.
- [ ] Remove the dead/empty middle area in the hero composition across desktop and ultrawide without crowding the headline.
- [ ] Rebalance the hero’s copy, CTA, companion, and moving index so the gaze has an intentional path through the whole screen.
- [ ] Decide deliberately whether the tiny traveller should coexist with the large companion in room 00 or enter only after navigation.
- [x] Improve the speech-bubble layout, padding, placement, and greeting state at 320, 390, 768, 1024, 1440, and 2560px.

## 4. Alcove

- [ ] Redesign the note bubbles/cards; current shapes and styling look cheap.
- [ ] Simplify the “disturb the shelves” action so it feels inviting and self-explanatory.
- [ ] Use the available space for more meaningful information: problem, creative premise, signature mechanics, what was built, and source/demo action.
- [ ] Remove the demo’s side black bars through an honest higher-quality reframing or rerender.
- [ ] Replace “complete README demo · continuous loop” with meaningful exhibit copy.
- [ ] Keep the continuous README GIF/demo playing without a visibly short or broken loop.
- [ ] Preserve the red/pink Alcove palette while improving contrast, alignment, shelf overlap, and responsive reading order.
- [ ] Rework the portrait-tablet layout into a deliberate magazine composition with a near-full-width demo.

## 5. AI Desktop Pet

- [ ] Preserve and build on the moving treatment at the top of the room.
- [x] Remove or substantially calm the repetitive shine/glint effect.
- [ ] Add enough project information to explain the idea, system behavior, and design intent without cramming the layout.
- [ ] Audit and rerender the demo at a higher resolution if the source allows it.
- [ ] Verify the repository-facing name remains “AI Desktop Pet” wherever this portfolio controls it.
- [ ] Rework the portrait-tablet composition so the title is not a cramped three-line column beside a small demo.

## 6. Keyscape

- [ ] Research current best implementations for expressive music/light/keyboard interfaces and atmospheric interactive portfolios.
- [ ] Prototype a materially stronger page composition rather than adding surface decoration to the current frame.
- [ ] Preserve Keyscape’s strong contrast and atmosphere while adding authored motion, clearer project storytelling, and a more distinctive interaction.
- [ ] Audit and rerender the demo at a higher resolution if the source allows it.
- [ ] Keep generous title/subtitle padding and prevent dense label stacking at every breakpoint.

## 7. Earlier Experiments

- [ ] Give each project tab/card a recognizable backdrop icon or illustration so the section is scannable before reading.
- [ ] Make GitHub star counts conspicuous and verify the displayed counts/source freshness.
- [ ] Remove “README film” and replace every label with meaningful project-specific language.
- [ ] Keep Interactive LLM NPCs focused on the club/bar conversation and Rogue/Johnny demo moments, not code footage.
- [ ] Keep AI Video Tutorial Generator at honest playback speed so lip-sync looks natural.
- [ ] Ensure all selected films loop continuously and are long enough to communicate the project.
- [ ] Strengthen the selected-card/stage relationship and make every project state visually distinct.
- [ ] Rewrite “early signals” and audit every piece of archive copy for sense, accuracy, and tone.

## 8. Useful Things

- [ ] Keep Gifsmith as its own project and Email Briefing as another project.
- [ ] Preserve individual drawers/panels for Email Briefing, Gifsmith, Compendium, and Transparency App.
- [ ] Give each utility state custom art/material/motion instead of sharing a generic card treatment.
- [ ] Keep enough explanatory information visible without returning to the previous cramped all-in-one workbench.
- [ ] Verify every demo crop, resolution, loop, label, repository link, and responsive state.

## 9. Media quality and Gifsmith capability audit

- [ ] Trace source assets and README/demo links for Alcove, AI Desktop Pet, Keyscape, Interactive LLM NPCs, AI Video Tutorial Generator, and Cupcake AGI.
- [ ] Measure current encoded dimensions, bitrate, frame rate, duration, cropping, black bars, and visible sharpness.
- [ ] Prefer rerendering from original captures/repositories over upscaling already-compressed portfolio clips.
- [ ] Audit Gifsmith’s actual viewport/device-scale/export-resolution options with a real experiment.
- [ ] If required capability exists, use it to rerender the portfolio media and do not change/release Gifsmith.
- [ ] If required capability is missing, implement it production-grade in the separate Gifsmith repository, add tests/docs, validate a real high-resolution capture, make atomic commits, then perform the explicitly requested GitHub/npm version release.
- [ ] Replace portfolio assets only after visual comparison at actual display sizes and keep looping media seamless.

## 10. Responsive, accessibility, performance, and interaction correctness

- [ ] Reflow portrait tablets instead of squeezing desktop two-column layouts.
- [ ] Verify phone, small phone, portrait tablet, landscape tablet, split-screen, desktop, ultrawide, short-height, zoom, and reduced-motion modes.
- [ ] Replace false “Scroll chapter” detection with a meaningful-content sentinel/observer.
- [ ] Ensure all interactive objects visibly advertise click/touch affordance without instructional clutter.
- [ ] Keep hit targets, focus rings, contrast, semantic tabs/panels, live announcements, and direct hash routes correct.
- [ ] Verify videos remain lazy outside the active room, loop continuously when appropriate, and preserve the user’s pause choice.
- [ ] Remove accidental crop, overlap, black bars, low-resolution scaling, and control collisions.
- [ ] Run the full production suite, then perform a fresh blind adversarial visual review and start the next pass.
