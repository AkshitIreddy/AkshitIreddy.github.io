# Motion and pointer physics research — premium pass

**Research date:** 2026-08-28
**Scope:** localized pointer-proximity typography, physically convincing DOM/SVG
motion, constraints and springs, interruption behavior, performance, and
reduced-motion fallbacks.
**Repository fit:** the shipped site is dependency-free vanilla HTML/CSS/JS, so
the recommendation is a small native motion kernel rather than adding a general
animation runtime.

## Executive decision

The current stage-wide parallax must be removed. It is the direct architectural
cause of the reported “the page jiggles when the cursor moves” feeling: one
pointer sample changes every depth layer in the active room. Smoothing that
global transform would make the same interaction slower, not better.

Replace it with **local, opt-in physical actors**:

1. One shared pointer sampler records input; it never writes styles.
2. One display-synchronized scheduler advances only actors that are close to the
   pointer or still settling.
3. Every actor owns its own radius, material, mass, damping, amplitude and
   reduced-motion representation.
4. The hero phrase is one stable inline box that shifts by at most 8–10 px. The
   rest of the heading and room remain fixed.
5. The top lights become an authored SVG kinetic chandelier/constellation: fixed
   ceiling anchors, jointed stems, small luminous prisms, and pointer-segment
   collision impulses. They move because the pointer physically intersects
   them, not because the page maps cursor position to parallax.
6. A moving actor preserves position and velocity when its target changes. Do
   not restart a CSS transition/tween for every `pointermove`.
7. Motion is disabled when the OS asks for reduced motion, when the site's motion
   control is paused, for coarse/non-hover pointers, or when the room/document is
   inactive. The ornament remains visually complete as a static composition.

This gives the requested “individual component thing”: the phrase evades, glass
pendants collide and swing, the kitten can look, and nothing unrelated moves.

## Evidence synthesis

The sources converge on five production rules.

- **Sample once, render once.** Pointer events may be coalesced. Process either
  the parent event or its coalesced list, store input state, and do visual writes
  in a single `requestAnimationFrame` loop. A 120 Hz screen leaves about 8.3 ms
  for the entire frame, so pointer callbacks cannot become mini render loops.
- **Continuous state beats restarted animation.** Maintained Motion, React
  Spring, Android and UIKit implementations all model mass/stiffness/damping and
  initial/current velocity. Web Animations explicitly warns that creating a new
  forwards-filling animation for every mouse move can accumulate hundreds or
  thousands of effects. A physical actor should update its target while keeping
  its velocity.
- **Transform the visual, not layout.** Transforms/opacity are the safest common
  compositor properties. Repeated `left`, `top`, width, geometry reads, or
  read-write-read cycles can force layout. SVG filters operate on image buffers;
  broad animated blur/turbulence regions should therefore not be the physics
  mechanism.
- **Motion is local and bounded.** Containment, asynchronous observers and
  active-room gating limit how far a change propagates. `will-change` is a scarce
  hint, not a global stylesheet default.
- **Reduced motion is a distinct design, not a near-zero-duration hack.** WCAG
  asks that interaction-triggered nonessential motion be disableable. The media
  query communicates a request to remove or replace motion. A static chandelier,
  color/opacity response, and intact text preserve craft without spatial motion.

There is one useful disagreement in the ecosystem. GSAP's `quickTo()` is an
excellent optimized retargetable tween, while spring systems preserve physical
velocity. `quickTo()` is appropriate for a cursor halo or simple eased meter,
but the hero phrase and collision lights need momentum continuity and therefore
should use the spring/impulse kernel. Likewise, D3 Force is a proven constraint
system but brings annealing and graph-layout behavior that this tiny authored
mechanism does not need.

## Recommended architecture

### 1. Input hub — no DOM writes

Attach one passive `pointermove` listener to the foyer/active room, plus
`pointerleave`, `pointercancel`, `blur`, and `visibilitychange` cleanup.

Gate activation with both capabilities:

```js
const canHoverPrecisely = matchMedia("(hover: hover) and (pointer: fine)");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
```

Do not use `pointerrawupdate` for this UI. It can arrive at device rate and is
valuable for ink, not for a handful of DOM actors. For the pendants, use
`getCoalescedEvents()` when available to reconstruct a swept pointer segment:

```js
function onPointerMove(event) {
  const batch = event.getCoalescedEvents?.();
  const samples = batch?.length ? batch : [event]; // never process both
  for (const sample of samples.slice(-8)) pointer.push(sample);
  wakeMotionLoop();
}
```

Limit the history to recent samples (for example 8) and derive velocity from
event timestamps, clamped to a sane maximum. Predicted events are deliberately
excluded: the Pointer Events spec says predictions are valid only until the next
event, and a wrong prediction looks like overshoot in a directly manipulated
ornament.

### 2. Actor registry and one scheduler

Use a tiny registry rather than separate perpetual RAF loops:

```js
const actors = new Set();
let frameId = 0;
let previousTime = 0;

function tick(time) {
  frameId = 0;
  const elapsed = previousTime ? (time - previousTime) / 1000 : 0;
  previousTime = time;
  const dt = Math.min(elapsed, 0.032);

  readPhase();                 // only cached measurements/observer results
  const moving = stepActors(dt); // math only
  writePhase();                // transforms/attributes only

  if (moving) frameId = requestAnimationFrame(tick);
}
```

The loop sleeps when every actor is inside its position and velocity thresholds.
`ResizeObserver` refreshes cached actor bounds after actual size changes;
navigation/room changes refresh them once. Do not call
`getBoundingClientRect()` for every actor on every pointer event. Use
`IntersectionObserver` or existing room state to deactivate non-current rooms.

Keep physics and presentation separate:

- physics state: `position`, `previousPosition` or `velocity`, `target`, `rest`;
- geometry state: cached rect/anchor/constraint lengths;
- presentation state: CSS custom properties or one SVG group transform;
- lifecycle: `wake`, `step`, `render`, `reset`, `destroy`.

Use an `AbortController` signal for all listeners belonging to the kernel so
navigation/reinitialization cannot duplicate handlers.

### 3. Local hero phrase

Keep “i make software that refuses to” as normal, selectable heading content.
Wrap only the intended moving fragment in a stable `inline-block`; its wrapper
retains layout space while an inner element receives the transform. Never split
the whole heading into individually jittering letters.

Distance is measured to the nearest point on the phrase's cached rectangle, not
to the viewport and not merely to its center:

```text
q.x = clamp(pointer.x, rect.left, rect.right)
q.y = clamp(pointer.y, rect.top,  rect.bottom)
d   = length(pointer - q)
u   = clamp(1 - d / R, 0, 1)
w   = u*u*(3 - 2*u)            // smoothstep, zero slope at both ends
```

For an evasive phrase, the direction is from pointer to phrase center. If the
pointer exactly crosses the center, fall back to the opposite normalized pointer
velocity so direction does not become undefined:

```text
n       = safeNormalize(center - pointer, -pointerVelocity)
targetX = n.x * Ax * w
targetY = n.y * Ay * w
targetR = clamp(-n.x * 0.65deg * w, -0.65deg, 0.65deg)
```

Recommended first tuning:

| Property | Value | Rationale |
|---|---:|---|
| activation radius `R` | 150–190 px | “Near” is legible without owning the room |
| `Ax`, `Ay` | 9 px, 5 px | visible but never reflows or abandons its line |
| natural frequency | 4.5–5.5 Hz | direct response in roughly 100–160 ms |
| damping ratio `zeta` | 0.88–1.0 | weight without rubbery headline bounce |
| rest position/speed | 0.03 px / 0.03 px·s⁻¹ | lets RAF genuinely stop |

Remove the CSS `transition` from the JS-driven transform. The current
interpolation plus `transition: transform ...` double-smooths the same value,
adds lag, and makes direction changes feel detached. Also replace the current
frame-dependent `current += (target-current)*.18` with the time-based spring
below; its feel currently changes between 60 Hz and 120 Hz.

### 4. Intricate top lights with real collision

Build one inline SVG with 8–12 authored pendants rather than generic glowing
circles. Each pendant can include:

- a ceiling rosette and fixed anchor;
- one or two thin jointed stems/wires;
- a cut-glass prism or enamel shade made from two to four vector facets;
- a small opaque core plus a restrained static halo;
- asymmetrical lengths, materials and resting angles that share one art
  language but do not repeat mechanically.

Keep the visual hierarchy static. Physics moves only the pendant groups and
their wire endpoints. Avoid animating `feTurbulence`, blur radius, or a viewport-
sized filter. If glow is needed, reuse one tightly bounded filter with modest
blur and render the bright core separately so reduced motion still looks crisp.

To prevent the cursor tunneling through a small light between sparse pointer
events, collide each bob against the **pointer's swept segment**, not just the
latest point. Given prior/current pointer positions `a`, `b` and bob position
`x`:

```text
t = clamp(dot(x-a, b-a) / dot(b-a, b-a), 0, 1)
q = a + t*(b-a)                  // closest point on pointer segment
d = length(x-q)
```

When `d < collisionRadius`, apply one bounded impulse:

```text
n       = safeNormalize(x-q, perpendicular(b-a))
speed   = clamp(length(b-a) / sampleDt, 0, 1800)
falloff = (1 - d/collisionRadius)^2
v      += n * impulseScale * speed * falloff / mass
v      += tangent(b-a) * 0.08 * speed * falloff / mass
```

The tangential term makes a diagonal pass set the light swinging rather than
only popping it away. Debounce each pointer/bob pair for 35–50 ms so multiple
coalesced samples do not inject the same collision repeatedly. Use a 26–42 px
collision radius, tuned to the drawn shade, and cap resulting speed.

For a single-stem pendant, a 2D bob with an anchor spring is sufficient. For
two-segment stems, use particles plus distance constraints. A small sequential
impulse constraint solver is stable and understandable here:

1. Integrate free nodes.
2. For each distance constraint, compute
   `error = length(p2-p1) - restLength`.
3. Move the two free nodes along the normalized edge in inverse-mass proportion.
4. Repeat constraints 3–4 times per substep.
5. Re-pin ceiling anchors exactly after each iteration.

Do not add all-pairs collisions. The authored pendants have known lanes; only
pointer-vs-bob collision and structural constraints are needed.

### 5. Spring integration and frame-rate independence

For each scalar component use the damped harmonic oscillator:

```text
x'' + 2*zeta*omega*x' + omega^2*(x - target) = 0

acceleration = omega^2*(target - x) - 2*zeta*omega*velocity
```

where `omega = 2*pi*frequencyHz`. `zeta = 1` is critically damped; below 1
overshoots; above 1 returns without overshoot more slowly. This mapping is easier
to tune consistently than unexplained “tension 170 / friction 26” presets.

Use a fixed/semi-fixed step inside RAF:

```js
const h = 1 / 120;
accumulator = Math.min(accumulator + dt, h * 4);
while (accumulator >= h) {
  velocity += acceleration(position, velocity, target) * h;
  position += velocity * h; // semi-implicit Euler
  solveConstraints(3);
  accumulator -= h;
}
```

This is adequate for fewer than 24 small decorative bodies. It is substantially
more stable than applying a fixed percentage per rendered frame. Clamp incoming
wall-clock delta to 32 ms and run at most four substeps; after a tab suspension,
reset the accumulator instead of “catching up” several seconds of physics.

Suggested material presets:

| Actor | Frequency | `zeta` | Mass | Max displacement |
|---|---:|---:|---:|---:|
| headline phrase | 5.0 Hz | 0.92 | 1.0 | 9×5 px |
| small glass prism | 2.7 Hz | 0.56 | 0.75 | 18 px |
| enamel shade | 2.2 Hz | 0.68 | 1.25 | 15 px |
| long hanging mobile | 1.55 Hz | 0.48 | 1.0 | 24 px |
| kitten eye/pupil look | 7 Hz | 1.0 | 1.0 | 2–4 px |

These are starting points, not acceptance evidence. Tune from high-speed
recordings at both 60 and 120 Hz and keep amplitude low enough that text and
controls stay visually stable.

### 6. Interruption and lifecycle behavior

Every interruption should have an explicit rule:

| Interruption | Required behavior |
|---|---|
| target changes mid-flight | update target only; preserve position and velocity |
| pointer leaves actor | target returns to rest; velocity decays naturally |
| pointer leaves viewport / `pointercancel` | all non-drag targets return to rest |
| room navigation begins | stop input, let ≤120 ms settle or snap non-visible actors, then sleep |
| document becomes hidden | cancel RAF, clear accumulator and pointer velocity |
| document becomes visible | remeasure once; start from current/rest state with no catch-up |
| resize/font load | observer marks bounds dirty; read them before the next physics step |
| reduced-motion changes live | stop RAF immediately, zero velocities, clear inline transforms |
| motion toggle pauses | same as reduced motion; preserve a static authored state |
| destroy/reinitialize | abort all listeners, disconnect observers, cancel the one RAF |

Pointer capture is for actual dragging after `pointerdown`; do not capture a
hover-proximity effect. Capturing hover would keep the interaction alive beyond
its spatial boundary and make the local effect feel global again.

For finite state transitions elsewhere, reuse one WAAPI `Animation` instance or
cancel/replace it cleanly. Never call `element.animate(..., {fill:'forwards'})`
on every pointer sample. Web Animations documents this exact unbounded-animation
failure. Prefer setting the final inline/class state and animating from the old
visual state; use `commitStyles()` only where that persistence model is genuinely
needed.

## Reduced-motion design

Reduced motion is the logical OR of system preference, the existing site motion
pause, unavailable precise hover, and inactive document/room.

In reduced mode:

- phrase transform is exactly its authored resting transform; no evasion;
- pendants stay at deliberately varied resting angles; wires and facets remain;
- pointer proximity may change a small core's color/opacity without position,
  scale, blur, flicker, or traveling light;
- kitten can change expression on explicit activation, but does not track the
  cursor spatially;
- all autonomous loops stop, not merely run for `0.001ms`;
- no content, affordance or explanation is available only through motion.

Keep the CSS media-query fallback even though JS also checks `matchMedia`, and
listen for preference changes at runtime. If decorative movement runs for more
than five seconds beside readable content, retain the global Pause Motion
control. Do not flash intricate lights more than three times per second; avoid
rapid high-contrast luminance reversals entirely.

## Performance contract

These are ship gates, not aspirations:

| Budget / check | Target |
|---|---:|
| active JS physics + render work | < 2 ms p95 at 60 Hz; < 1.5 ms p95 at 120 Hz |
| entire frame on a 120 Hz display | < 8.33 ms p95 during continuous pointer sweep |
| long animation frames | zero >50 ms entries during the interaction test |
| forced style/layout in animation callbacks | zero |
| layout shifts caused by motion | CLS contribution 0 |
| simultaneous physical bodies | ≤24 active; target 8–12 |
| constraint iterations | 3 normally; max 4 |
| physics catch-up | max 32 ms wall delta, max four 1/120 s steps |
| CSS `will-change` | only active phrase/pendant groups; remove or limit when asleep |
| animated properties | transform/opacity first; bounded SVG attributes only after profiling |
| SVG filter area | tight object-local regions; no room/viewport-sized animated filter |

Batch reads before writes. Geometry comes from cached rects refreshed by
observers/navigation, not from repeated synchronous queries. Render a single
`transform` string or CSS custom-property tuple per actor. A transform applied
through several CSS variables may not always receive hardware acceleration in
every engine, so profile the actual implementation; do not infer compositing
from the source alone.

Use the Long Animation Frames observer when supported and a DevTools performance
trace as the cross-check. Validate on a modest integrated-GPU Windows laptop,
not only a fast development machine. Test at DPR 1 and 2, 60 and 120 Hz, and with
CPU throttling. A screenshot cannot prove motion quality; record the interaction
and inspect frames plus the trace.

## Failure modes and review checklist

### High-risk failures

- **Global jostle:** a room/world/layer transform changes from generic pointer
  movement. Delete the stage-wide parallax path rather than retuning it.
- **Double smoothing:** JS interpolation feeds a CSS transition on the same
  transform. It feels floaty and lags reversals.
- **Frame-rate-dependent lerp:** `x += (target-x)*constant` runs faster at 120 Hz
  than 60 Hz.
- **Tween storm:** a new WAAPI/GSAP/CSS effect is created on every pointer event.
- **Tunneling:** collision checks only the latest pointer point, so a fast pass
  skips small lights. Use the swept segment.
- **Impulse explosion:** every coalesced sample applies the same full collision.
  Debounce per bob and clamp pointer/result velocity.
- **Catch-up explosion:** a hidden tab resumes with seconds of `dt`. Clear the
  accumulator on visibility loss and clamp ordinary stalls.
- **Layout thrash:** style writes are followed by rect/offset reads in the same
  frame or inside a loop.
- **Layer explosion:** `will-change` is applied to every ornament or the whole
  site. It can consume memory and degrade performance.
- **Filter tax:** large animated blur, shadow or turbulence buffers repaint the
  room. Keep effects static and tightly bounded.
- **Transform ownership collision:** hover CSS, entrance animation, global
  parallax and physics all write `transform` on the same node. Give each concern
  a nested wrapper or a composed transform owner.
- **Hover capture leak:** pointer capture or document-level tracking keeps a
  supposedly local actor moving after the cursor leaves its region.
- **Motion-only meaning:** a project fact or control state is conveyed only by
  swinging/glowing behavior.
- **Fake reduced motion:** durations become `0.001ms`, but JS loops, pointer
  tracking, transforms or flickering filters continue.
- **Dead RAF:** the loop continues forever for subpixel noise because no paired
  position-and-speed rest thresholds exist.

### Acceptance scenarios

1. Sweep the pointer across empty hero space: no visible object moves.
2. Approach the chosen phrase from all four sides: only that fragment moves;
   its line box and surrounding text never shift.
3. Reverse direction rapidly: the phrase changes course without a discontinuity,
   queued animation, or lagging CSS transition.
4. Cross a pendant at low and high speed: both contacts register; fast contact
   produces more bounded momentum, not a missed hit.
5. Move through two lights: only struck lights react; neighbors move only through
   an authored physical constraint.
6. Leave the viewport mid-swing: actors settle and the RAF stops.
7. Switch rooms and return: no duplicated handlers, jump, stale pointer, or
   offscreen physics consumption.
8. Hide the tab for ten seconds and return: no catch-up explosion.
9. Toggle reduced motion while actors move: motion stops immediately and the
   static composition remains polished.
10. Use touch/coarse pointer and keyboard: no hover tracking is required; all
    controls and content remain usable.
11. Record a trace at 120 Hz: no forced layout, no >50 ms frame, and transform
    ownership is clear.
12. Repeatedly resize/navigate for five minutes: listener/animation counts remain
    stable and memory does not climb.

## Evidence ledger

All sources were opened and assessed on 2026-08-28. “Continuous” means a
maintained documentation page without a stable publication date; the access date
is therefore the relevant snapshot date. Specifications are treated as primary
even when they are Working Drafts; vendor/library documentation is treated as
implementation evidence, not a browser interoperability guarantee.

| # | Source and date | Type | Claim used |
|---:|---|---|---|
| 1 | [W3C Pointer Events Level 4](https://www.w3.org/TR/pointerevents4/), WD 2026-08-26 | primary spec | Unified pointer input; event coalescing/prediction; process parent or coalesced events, not both; predictions expire at the next event; pointer capture semantics. |
| 2 | [WHATWG HTML: animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames), Living Standard, accessed 2026-08-28 | primary spec | Animation-frame callbacks belong to the browser rendering update; use one display-synchronized writer. |
| 3 | [W3C Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/), WD 2026-02-19 | primary spec | `prefers-reduced-motion` means minimize nonessential motion; `hover`/`pointer` capabilities can gate proximity interaction. |
| 4 | [W3C WCAG: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), updated 2025-09-16 | standards guidance | Interaction-triggered nonessential motion must be disableable; user preference or a site-wide control are accepted approaches. |
| 5 | [W3C WCAG: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), current 2026 page | standards guidance | Automatic parallel motion beyond five seconds needs a pause/stop/hide mechanism. |
| 6 | [W3C WCAG: Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), updated 2025-09-17 | standards guidance | Avoid more than three flashes per second and large/high-risk luminance reversals. |
| 7 | [W3C WCAG: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), current 2026 page | standards guidance | Functional dragging needs a non-drag single-pointer alternative; decorative hover physics must not become required input. |
| 8 | [W3C Web Animations Level 1](https://www.w3.org/TR/web-animations-1/), WD 2023-06-05 | primary spec | Repeated forwards-filling animations on mousemove can accumulate unbounded effects; defines cancellation, replacement and composition. |
| 9 | [MDN `Animation.commitStyles()`](https://developer.mozilla.org/en-US/docs/Web/API/Animation/commitStyles), updated 2025-11 snapshot | maintained reference | Commit final styles then release the animation when persistence is actually required; indefinite fill can retain resources and override normal styles. |
| 10 | [W3C CSS Transforms Level 2](https://www.w3.org/TR/css-transforms-2/), WD 2021-11-09 | primary spec | Transform matrices, interpolation, individual transforms and stacking/rendering implications. |
| 11 | [W3C CSS Will Change Level 1](https://www.w3.org/TR/css-will-change/), CRD 2022-05-05 | primary spec | Layer setup has cost; `will-change` is useful for a small number of persistent actors and harmful when spammed. |
| 12 | [W3C CSS Containment Level 1](https://www.w3.org/TR/css-contain-1/), Recommendation 2024-06-25 | primary spec | Containment limits how far descendant changes affect the document and enables browser optimization. |
| 13 | [W3C Resize Observer](https://www.w3.org/TR/resize-observer/), FPWD 2020-02-11 | primary spec | Observe element size changes and refresh cached actor geometry instead of polling every frame. |
| 14 | [W3C Intersection Observer](https://www.w3.org/TR/intersection-observer/), WD 2023-10-18 | primary spec | Asynchronous visibility/position observation avoids continuous synchronous layout polling; deactivate offscreen actors. |
| 15 | [W3C Long Animation Frames API](https://www.w3.org/TR/long-animation-frames/), FPWD 2026-04-28 | primary spec | Detect frames over 50 ms, blocking duration, rendering and style/layout attribution during real interactions. |
| 16 | [W3C Event Timing API](https://www.w3.org/TR/event-timing/), latest draft accessed 2026-08-28 | primary spec | Interaction latency spans input timestamp through the next rendered update; pointer work competes with responsiveness. |
| 17 | [W3C CSS Fonts Level 4](https://www.w3.org/TR/css-fonts-4/), WD 2026-08-25 | primary spec | Variable-font axes can interpolate only under compatible declarations; prefer higher-level font properties for registered axes. |
| 18 | [OpenType 1.9.1 Font Variations overview](https://learn.microsoft.com/en-us/typography/opentype/spec/otvaroverview), 2024 specification snapshot | primary format spec | Variable fonts define min/default/max variation spaces and custom axes; typography variation is possible but is not a substitute for local spatial physics. |
| 19 | [W3C Filter Effects Level 1](https://www.w3.org/TR/filter-effects-1/), WD 2018-12-18 | primary spec | Filters render into buffers before compositing and create grouping/stacking behavior; keep expensive animated regions bounded. |
| 20 | [W3C SVG 2: Animating SVG Documents](https://www.w3.org/TR/SVG/animate.html), SVG 2 snapshot accessed 2026-08-28 | primary spec | SVG supports CSS, DOM, animation-frame and Web Animations approaches; scripted DOM/SVG transforms are valid for the authored kinetic ornament. |
| 21 | [web.dev: High-performance CSS animations](https://web.dev/articles/animations-guide), published 2020, maintained snapshot 2026 | browser-team guidance | Transform and opacity are the reliable animation fast path; verify with tooling. |
| 22 | [web.dev: Avoid layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing), updated 2025-05-07 | browser-team guidance | Layout affects interaction latency; batch reads before writes and avoid synchronous read-write loops. |
| 23 | [Chrome DevTools: Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance), Chrome 129 guide, accessed 2026-08-28 | vendor tooling docs | Inspect FPS, CPU, animation frames, forced reflow and initiating code rather than judging performance from source. |
| 24 | [Motion: `springValue`](https://motion.dev/docs/spring-value), v13 docs accessed 2026-08-28 | maintained implementation | Retargetable springs preserve velocity; physics parameters are recommended for smooth reactive motion. |
| 25 | [Motion: spring generator](https://motion.dev/docs/spring), v13 docs accessed 2026-08-28 | maintained implementation | Defines mass, stiffness, damping, velocity and paired rest-speed/rest-distance termination; zero damping never settles. |
| 26 | [Motion: frame scheduler](https://motion.dev/docs/frame), v13 docs accessed 2026-08-28 | maintained implementation | One animation loop with read/update/render phases prevents layout thrashing and multiple-RAF overhead. |
| 27 | [Motion: animation performance](https://motion.dev/docs/performance), v13 docs accessed 2026-08-28 | maintained implementation | 120 Hz reduces the frame window to about 8 ms; transforms/opacity are safest; actual hardware acceleration varies and must be profiled. |
| 28 | [GSAP `quickTo()`](https://gsap.com/docs/v3/GSAP/gsap.quickTo%28%29/), continuous docs accessed 2026-08-28 | maintained implementation | Reuse a retargetable tween for high-frequency pointer values instead of constructing a new general tween each event. |
| 29 | [GSAP ticker](https://gsap.com/docs/v3/GSAP/gsap.ticker/), continuous docs accessed 2026-08-28 | maintained implementation | RAF-synchronized central ticker, delta-time handling, 120 Hz awareness and lag smoothing demonstrate production interruption policy. |
| 30 | [React Spring: spring configs](https://www.react-spring.dev/docs/advanced/config), continuous docs accessed 2026-08-28 | maintained implementation | Mass/tension/friction presets show per-property physical tuning; not all actors should share one spring. |
| 31 | [D3 Force simulation](https://d3js.org/d3-force/simulation), continuous docs accessed 2026-08-28 | maintained implementation | Velocity decay, force application, manual ticks and cooling are proven for constraint systems; full annealing is excessive for this authored micro-scene. |
| 32 | [Android `SpringForce`](https://developer.android.com/reference/androidx/dynamicanimation/animation/SpringForce), updated 2026-06 snapshot | primary platform implementation | Damping ratio below/equal/above one maps to under/critical/over damping; critical damping is the fastest return without overshoot. |
| 33 | [Apple `UISpringTimingParameters`](https://developer.apple.com/documentation/uikit/uispringtimingparameters), continuous platform docs accessed 2026-08-28 | primary platform implementation | Spring motion is defined by mass, stiffness, damping and initial velocity. |
| 34 | [Apple spring initial velocity](https://developer.apple.com/documentation/uikit/uispringtimingparameters/initialvelocity), continuous platform docs accessed 2026-08-28 | primary platform implementation | Matching existing gesture velocity creates a smooth transition into a spring; interruption should preserve momentum. |

## Implementation order

1. Delete/disable room-wide pointer parallax and confirm an empty-space sweep is
   completely still.
2. Introduce the input hub, scheduler, lifecycle gates and performance
   instrumentation with no visual actors.
3. Convert the hero phrase to the time-based local spring; remove its competing
   transform transition.
4. Build the chandelier as static authored SVG first and approve its composition.
5. Add swept-segment impulses to one pendant, tune and trace it, then expand to
   the remaining pendants with material variation.
6. Add complete reduced-motion/static behavior and live preference switching.
7. Run the 12 acceptance scenarios, record desktop/mobile/reduced-motion evidence,
   and reject the pass if empty-space movement, forced layout, or double transform
   ownership remains.
