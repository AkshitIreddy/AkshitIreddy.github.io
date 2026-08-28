# Software in Motion — live redesign TODO

This is the local source of truth for the active redesign work.
An item is complete only after implementation, rendered inspection, and
proportional regression checks. The opt-in adversarial loop is currently off;
normal collaboration continues through the remaining backlog.

## Current pass — 2026-08-27

- [x] Replace the letter-based favicon with a distinctive non-letter kinetic icon at 16/32/48/180px.
- [x] Make the studio-kitten speech bubble clickable and cycle through distinct messages.
- [x] Change the yellow profile-status dot to green on the hero.
- [x] Make every object riding a rail/path travel continuously in a seamless loop.
- [x] Replace “movement study / 01” with meaningful, non-meta copy.
- [x] Give every major object an individual, purposeful interaction or motion; audit all rooms and states.
- [x] Replace cheap feature bubbles/cards with room-native information surfaces.
- [x] Add materially more useful project information to every project room.
- [x] Replace Alcove’s “Disturb the shelves” with a richer, self-explanatory interaction.
- [x] Remove visible demo black borders without cropping project content.
- [x] Replace “complete README demo · continuous loop” with visitor-facing project copy.
- [x] Make the bottom navigation background/material follow the active room and selected project theme.
- [x] Redesign Keyscape’s composition and effects so the room feels authored rather than cheap.
- [x] Preserve horizontal one-page navigation, the side cat, keyboard/touch/reduced-motion behavior, and lazy media.
- [x] Make every room/subsection feel like a genuinely different authored environment, not one layout with new colors.
- [x] Rethink the travelling-cat ruler/navigation from first principles; keep only the idea if the new object trail is better.
- [x] Rerender Alcove, AI Desktop Pet, and Keyscape from original generators at materially higher resolution where source detail allows.
- [x] Prove Gifsmith’s current high-resolution controls with a real render; only if missing, implement, test, atomically commit, push, version, and publish the required npm update.
- [x] Create a public, conventionally named AI-agent skills repository with every safe custom skill, excluding private/company deployment skills, and publish a polished README/inventory.
- [x] Recut the Alcove loop: open Welcome book → flip ~2 pages → shelf → existing story, skip repeated Welcome pages later, and end exactly on the open-Welcome loop anchor.
- [x] Accept and ship the new Alcove demo only after high-resolution source render, no-black-bar framing, and first/last seam verification.
- [x] Make every Foyer orbit runner wrap continuously without clipping or endpoint disappearance.
- [x] Replace the current favicon again if the kinetic waypoint is not distinctive enough, and use a witty but compact browser-tab title.
- [x] Remove the generic MOVEMENT / STUDIES hero backdrop and give Foyer a richer palette/material distinct from Alcove.
- [x] Turn the three Foyer index panels into working navigation controls.
- [x] Make the thesis period unmistakably read as punctuation.
- [x] Add Alcove's AI agent to the visible project facts; remove `private by default` if space is needed.
- [x] Raise the typography floor for ledger, stack, caption, and supporting copy across Alcove, Pet, Keyscape, Archive, and Tools.
- [x] Force the Keyscape bottom route material to remain dark and room-native.
- [x] Make Archive selected environments substantially project-specific; add large authored SVG art and larger, unmistakable GitHub stars.
- [x] Give every Tools drawer large authored SVG art and a more bespoke selected environment.
- [x] Put the accepted Gifsmith demo first in the Gifsmith GitHub README and publish the README/asset in a new npm patch release.

## Operating constraints

- [x] Keep all website work, generated media, clones, and temporary review evidence inside this repository.
- [x] Do not push or publish the personal-website repository.
- [x] Keep one direct integration owner; use an occasional subagent only when the user explicitly requests it.
- [x] Research each active design problem online and record source → hypothesis → test → decision.
- [x] For every affected route, viewport, and state: inspect 4–6 overlapping closeups one at a time, then the full frame.
- [x] Preserve reduced-motion, keyboard, touch, responsive, and lazy-media behavior.
- [x] If higher-resolution demos require a missing Gifsmith feature, the separate Gifsmith repository and its explicitly requested GitHub/npm release are in scope only for that capability; verify the need before changing or publishing it.

## 1. Shared visual philosophy and motion system

- [x] Define one coherent redesign philosophy that feels artistic, custom, playful, design-focused, and unmistakably Akshit—not a collection of decorated cards.
- [x] Give every subsection a distinct, memorable interaction/material metaphor while retaining a shared typographic, mascot, and motion language.
- [x] Add more environmental motion and stateful reactivity across the page; keep hierarchy legible and avoid repetitive ambient effects.
- [x] Replace generic badges, bubbles, cards, labels, and frames with authored shapes/details when they currently look cheap.
- [x] Reconsider the travelling-kitten ruler/rail from first principles; prototype multiple navigation metaphors before choosing one.
- [x] Make the top and bottom chrome feel native to each room, not like unchanged furniture around a themed middle.
- [x] Audit animation ownership so connected art moves as coherent rigs rather than drifting pieces.
- [x] Keep the line “I make software that refuses to sit still” prominent, spacious, and smoothly reactive without a crosshair cursor or broken letter motion.

## 2. Browser identity and masthead

- [x] Shorten the browser tab title.
- [x] Replace the cheap tab cat with a genuinely custom favicon/icon family that remains recognizable at 16, 32, 48, and 180px.
- [x] Keep the profile portrait and maker identity legible across phone, tablet, split-screen, desktop, and ultrawide.
- [x] Fix maker-tagline contrast on every light frame and raise its smallest rendered size.
- [x] Review tab/subsection labels for truncation, density, and meaningful visible names while preserving full accessible names.

## 3. Foyer / hero experience

- [x] Replace the fragmented travelling-cat CSS sculpture with a connected SVG rig; remove the neck plate and drifting face.
- [x] Make the travelling kitten feel slimmer/catlike without returning to detached anatomy.
- [x] Redraw the large studio kitten with a rounded torso, contained chest tuft, tucked paws, off-centre kerchief, and non-tangent spark.
- [x] Move studio-kitten idle motion from the root SVG to a character rig so the shadow and ambient sparks stay grounded.
- [x] Replace the speech triangle with a detached, responsive connector that never enters the ears/face.
- [x] Make the kitten’s eyes follow the pointer over the speech bubble as reliably as over the kitten itself; add a direct regression test.
- [x] Redesign the kitten’s circle/orbit graphic to feel substantially more animated, artistic, dimensional, and fun.
- [x] Remove the dead/empty middle area in the hero composition across desktop and ultrawide without crowding the headline.
- [x] Rebalance the hero’s copy, CTA, companion, and moving index so the gaze has an intentional path through the whole screen.
- [x] Decide deliberately whether the tiny traveller should coexist with the large companion in room 00 or enter only after navigation.
- [x] Improve the speech-bubble layout, padding, placement, and greeting state at 320, 390, 768, 1024, 1440, and 2560px.

## 4. Alcove

- [x] Redesign the note bubbles/cards; current shapes and styling look cheap.
- [x] Simplify the “disturb the shelves” action so it feels inviting and self-explanatory.
- [x] Use the available space for more meaningful information: problem, creative premise, signature mechanics, what was built, and source/demo action.
- [x] Remove the demo’s side black bars through an honest higher-quality reframing or rerender.
- [x] Replace “complete README demo · continuous loop” with meaningful exhibit copy.
- [x] Keep the continuous README GIF/demo playing without a visibly short or broken loop.
- [x] Preserve the red/pink Alcove palette while improving contrast, alignment, shelf overlap, and responsive reading order.
- [x] Rework the portrait-tablet layout into a deliberate magazine composition with a near-full-width demo.

## 5. AI Desktop Pet

- [x] Preserve and build on the moving treatment at the top of the room.
- [x] Remove or substantially calm the repetitive shine/glint effect.
- [x] Add enough project information to explain the idea, system behavior, and design intent without cramming the layout.
- [x] Audit and rerender the demo at a higher resolution if the source allows it.
- [x] Verify the repository-facing name remains “AI Desktop Pet” wherever this portfolio controls it.
- [x] Rework the portrait-tablet composition so the title is not a cramped three-line column beside a small demo.

## 6. Keyscape

- [x] Research current best implementations for expressive music/light/keyboard interfaces and atmospheric interactive portfolios.
- [x] Prototype a materially stronger page composition rather than adding surface decoration to the current frame.
- [x] Preserve Keyscape’s strong contrast and atmosphere while adding authored motion, clearer project storytelling, and a more distinctive interaction.
- [x] Audit and rerender the demo at a higher resolution if the source allows it.
- [x] Keep generous title/subtitle padding and prevent dense label stacking at every breakpoint.

## 7. Earlier Experiments

- [x] Give each project tab/card a recognizable backdrop icon or illustration so the section is scannable before reading.
- [x] Make GitHub star counts conspicuous and verify the displayed counts/source freshness.
- [x] Remove “README film” and replace every label with meaningful project-specific language.
- [x] Keep Interactive LLM NPCs focused on the club/bar conversation and Rogue/Johnny demo moments, not code footage.
- [x] Keep AI Video Tutorial Generator at honest playback speed so lip-sync looks natural.
- [x] Ensure all selected films loop continuously and are long enough to communicate the project.
- [x] Strengthen the selected-card/stage relationship and make every project state visually distinct.
- [x] Rewrite “early signals” and audit every piece of archive copy for sense, accuracy, and tone.

## 8. Useful Things

- [x] Keep Gifsmith as its own project and Email Briefing as another project.
- [x] Preserve individual drawers/panels for Email Briefing, Gifsmith, Compendium, and Transparency App.
- [x] Give each utility state custom art/material/motion instead of sharing a generic card treatment.
- [x] Keep enough explanatory information visible without returning to the previous cramped all-in-one workbench.
- [x] Verify every demo crop, resolution, loop, label, repository link, and responsive state.

## 9. Media quality and Gifsmith capability audit

- [x] Trace source assets and README/demo links for Alcove, AI Desktop Pet, Keyscape, Interactive LLM NPCs, AI Video Tutorial Generator, and Cupcake AGI.
- [x] Measure current encoded dimensions, bitrate, frame rate, duration, cropping, black bars, and visible sharpness.
- [x] Prefer rerendering from original captures/repositories over upscaling already-compressed portfolio clips.
- [x] Audit Gifsmith’s actual viewport/device-scale/export-resolution options with a real experiment.
- [x] If required capability exists, use it to rerender the portfolio media and do not change/release Gifsmith.
- [x] N/A for capability work: Gifsmith already supports high-resolution output, so no rendering-capability code or capability release was needed. The separately requested README-first demo shipped in v0.3.5.
- [x] Replace portfolio assets only after visual comparison at actual display sizes and keep looping media seamless.

## 10. Responsive, accessibility, performance, and interaction correctness

- [x] Reflow portrait tablets instead of squeezing desktop two-column layouts.
- [x] Verify phone, small phone, portrait tablet, landscape tablet, split-screen, desktop, ultrawide, short-height, zoom, and reduced-motion modes.
- [x] Replace false “Scroll chapter” detection with a meaningful-content sentinel/observer.
- [x] Ensure all interactive objects visibly advertise click/touch affordance without instructional clutter.
- [x] Keep hit targets, focus rings, contrast, semantic tabs/panels, live announcements, and direct hash routes correct.
- [x] Verify videos remain lazy outside the active room, loop continuously when appropriate, and preserve the user’s pause choice.
- [x] Remove accidental crop, overlap, black bars, low-resolution scaling, and control collisions.
- [x] Run the full production suite, then perform a fresh blind adversarial visual review and start the next pass.
