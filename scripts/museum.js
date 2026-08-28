(() => {
  "use strict";

  const shell = document.querySelector(".museum-shell");
  const stage = document.querySelector(".museum-stage");
  const world = document.querySelector(".museum-world");
  const rooms = [...document.querySelectorAll(".room")];
  const mapButtons = [...document.querySelectorAll(".museum-map [data-room-target]")];
  const roomButtons = [...document.querySelectorAll(".room [data-room-target], .museum-masthead [data-room-target]")];
  const roomReading = document.querySelector("[data-room-reading]");
  const announcer = document.querySelector(".room-announcer");
  const mobileScrollHint = document.querySelector(".mobile-scroll-hint");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (!shell || !stage || !world || !rooms.length) return;

  const roomData = rooms.map((room, index) => ({
    index,
    id: room.id,
    shortName: mapButtons[index]?.querySelector("b")?.textContent.trim() || `Room ${index + 1}`,
    name: room.querySelector("h1, h2")?.textContent.trim().replace(/\s+/g, " ") || `Room ${index + 1}`,
    heading: room.querySelector("h1, h2"),
  }));

  const state = {
    room: 0,
    previousRoom: 0,
    pointerStart: null,
    wheelLockUntil: 0,
    walkingTimer: 0,
    headingFocusTimer: 0,
    keyboardNavigation: false,
    guideSpeech: 0,
    introTimer: 0,
    touchStart: null,
    lastSwipeAt: 0,
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;

  const frameColors = {
    foyer: "#f4ead4",
    alcove: "#ede1c6",
    pet: "#cfd9e0",
    keyscape: "#111722",
    "archive-npc": "#ded9ef",
    "archive-tutorial": "#efe2bd",
    "archive-cupcake": "#f0cfd8",
    "workbench-email": "#d3e6e3",
    "workbench-gifsmith": "#ead3bd",
    "workbench-compendium": "#d9dec5",
    "workbench-transparency": "#ded9ed",
  };

  function syncFrameTheme(index = state.room) {
    const room = rooms[index];
    if (!room) return;
    const frame = room.id === "archive"
      ? `archive-${room.dataset.archiveProject || "npc"}`
      : room.id === "workbench"
        ? `workbench-${room.dataset.tool || "email"}`
        : room.id;
    shell.dataset.frame = frame;
    if (themeColor) themeColor.content = frameColors[frame] || frameColors.foyer;

    if (room.id === "foyer") {
      document.title = "Akshit Ireddy — this page refuses to sit still";
      return;
    }
    const label = room.id === "archive"
      ? "Projects"
      : room.id === "workbench"
        ? "Tools"
        : roomData[index]?.shortName || "Projects";
    document.title = `${label} · Akshit`;
  }

  function getRoomFromHash() {
    const id = window.location.hash.slice(1).toLowerCase();
    const found = roomData.find((room) => room.id.toLowerCase() === id);
    return found ? found.index : 0;
  }

  function setSpatialVariables(index) {
    const compact = isMobile();
    const visitorStart = compact ? 2 : 4.5;
    const visitorStep = compact ? 18.2 : 17.2;
    // Leave enough room for the kitten's ears and the easing overshoot on
    // narrow screens; the final chapter should never push its face off-canvas.
    const visitorMax = compact ? 79 : 84;

    shell.style.setProperty("--room-index", String(index));
    shell.style.setProperty("--world-offset", `${index * -100}vw`);
    shell.style.setProperty("--visitor-left", `${Math.min(visitorStart + index * visitorStep, visitorMax)}vw`);
    shell.style.setProperty("--map-progress", `${((index + 1) / rooms.length) * 100}%`);
    shell.dataset.currentRoom = String(index);
    syncFrameTheme(index);
  }

  function updateRoomAccessibility(index) {
    rooms.forEach((room, roomIndex) => {
      const current = roomIndex === index;
      room.classList.toggle("is-current", current);
      room.toggleAttribute("inert", !current);
      room.setAttribute("aria-hidden", current ? "false" : "true");
    });

    mapButtons.forEach((button) => {
      const current = Number(button.dataset.roomTarget) === index;
      if (current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    if (roomReading) roomReading.textContent = `${String(index).padStart(2, "0")} — ${roomData[index].shortName}`;
  }

  function announceRoom(index) {
    if (!announcer) return;
    window.clearTimeout(announceRoom.timer);
    announceRoom.timer = window.setTimeout(() => {
      announcer.textContent = `Entered ${roomData[index].name}. Chapter ${index + 1} of ${rooms.length}.`;
    }, reduceMotion.matches ? 20 : 440);
  }

  function announceReaction(message) {
    if (!announcer) return;
    window.clearTimeout(announceRoom.timer);
    announcer.textContent = "";
    window.requestAnimationFrame(() => { announcer.textContent = message; });
  }

  function updateHash(index, push = false) {
    const hash = `#${roomData[index].id}`;
    if (window.location.hash === hash) return;
    window.history[push ? "pushState" : "replaceState"](null, "", hash);
  }

  function markWalking(from, to) {
    window.clearTimeout(state.walkingTimer);
    shell.classList.toggle("is-walking", from !== to && !reduceMotion.matches);
    shell.dataset.walkDirection = to >= from ? "forward" : "backward";
    state.walkingTimer = window.setTimeout(() => shell.classList.remove("is-walking"), reduceMotion.matches ? 20 : 940);
  }

  function focusRoomHeading(index) {
    const heading = roomData[index].heading;
    if (!heading) return;
    window.clearTimeout(state.headingFocusTimer);
    state.headingFocusTimer = window.setTimeout(() => {
      state.headingFocusTimer = 0;
      heading.focus({ preventScroll: true });
    }, reduceMotion.matches ? 10 : 500);
  }

  /* A delayed arrival announcement must never steal focus after the visitor has
     already moved into a control (for example, a Workbench drawer). */
  document.addEventListener("focusin", (event) => {
    if (!state.headingFocusTimer) return;
    const pendingHeading = roomData[state.room]?.heading;
    if (event.target === pendingHeading) return;
    window.clearTimeout(state.headingFocusTimer);
    state.headingFocusTimer = 0;
  });

  function ensureVideoSources(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    video.defaultPlaybackRate = 1;
    video.playbackRate = 1;
    ensureVideoPoster(video);
    let changed = false;
    video.querySelectorAll("source[data-src]").forEach((source) => {
      if (!source.getAttribute("src")) {
        source.setAttribute("src", source.dataset.src);
        changed = true;
      }
    });
    if (changed) video.load();
  }

  function ensureVideoPoster(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    if (video.dataset.poster && !video.getAttribute("poster")) video.poster = video.dataset.poster;
  }

  function syncFeaturePlayButton(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    const button = video.parentElement?.querySelector("[data-video-toggle]");
    if (!(button instanceof HTMLButtonElement)) return;
    const playing = !video.paused && !video.ended;
    const label = video.getAttribute("aria-label") || "project demo";
    button.classList.toggle("is-playing", playing);
    button.hidden = video.hidden;
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${label}`);
  }

  function syncMotionImages() {
    document.querySelectorAll("img[data-motion-src][data-still-src]").forEach((image) => {
      const active = image.closest(".room")?.classList.contains("is-current");
      if (!active) {
        image.removeAttribute("src");
        return;
      }
      const source = reduceMotion.matches ? image.dataset.stillSrc : image.dataset.motionSrc;
      if (source && image.getAttribute("src") !== source) image.setAttribute("src", source);
    });
  }

  function syncVideoPlayback() {
    syncMotionImages();
    document.querySelectorAll("[data-room-video]").forEach((video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      const room = video.closest(".room");
      const active = room?.classList.contains("is-current") && !video.hidden;
      if (active) ensureVideoPoster(video);
      const canPlay = active && video.dataset.userPaused !== "true" && !reduceMotion.matches && !document.hidden;
      if (canPlay) {
        ensureVideoSources(video);
        video.play().catch(() => {});
      }
      else video.pause();
      syncFeaturePlayButton(video);
    });

    const archiveVideo = document.querySelector("[data-archive-video]");
    if (!(archiveVideo instanceof HTMLVideoElement)) return;
    if (state.room === 4) ensureVideoPoster(archiveVideo);
    const canPlay = state.room === 4 && archiveVideo.dataset.userPaused !== "true" && !reduceMotion.matches && !document.hidden;
    if (canPlay) {
      ensureVideoSources(archiveVideo);
      archiveVideo.play().catch(() => {});
    } else {
      archiveVideo.pause();
    }
    syncArchivePlayButton(archiveVideo);
  }

  function syncMobileScrollHint() {
    if (!mobileScrollHint) return;
    const room = rooms[state.room];
    const hasMoreBelow = Boolean(
      (isMobile() || (window.innerWidth > 760 && window.innerHeight <= 780))
      && room
      && room.scrollHeight > room.clientHeight + 18
      && room.scrollTop < 56
    );
    mobileScrollHint.classList.toggle("is-visible", hasMoreBelow);
  }

  function goToRoom(target, options = {}) {
    const index = clamp(Number(target), 0, rooms.length - 1);
    if (!Number.isFinite(index)) return;

    const from = state.room;
    state.previousRoom = from;
    state.room = index;
    stage.scrollLeft = 0;
    setSpatialVariables(index);
    updateRoomAccessibility(index);
    markWalking(from, index);

    if (options.updateHash !== false) updateHash(index, Boolean(options.pushHistory));
    if (from !== index || options.forceAnnounce) announceRoom(index);
    if (options.focusHeading) focusRoomHeading(index);

    const room = rooms[index];
    if (room && options.resetScroll) room.scrollTo({ top: 0, behavior: "instant" });

    window.requestAnimationFrame(() => {
      stage.scrollLeft = 0;
      window.requestAnimationFrame(() => {
        stage.scrollLeft = 0;
        syncMobileScrollHint();
      });
    });

    syncVideoPlayback();
    window.dispatchEvent(new CustomEvent("museum:roomchange", { detail: { room: index, previousRoom: from, id: roomData[index].id } }));
  }

  function handleRoomButton(event) {
    const target = Number(event.currentTarget.dataset.roomTarget);
    const insideRoom = Boolean(event.currentTarget.closest(".room"));
    goToRoom(target, { pushHistory: true, focusHeading: insideRoom || state.keyboardNavigation, resetScroll: true });
  }

  [...mapButtons, ...roomButtons].forEach((button) => button.addEventListener("click", handleRoomButton));
  rooms.forEach((room) => room.addEventListener("scroll", syncMobileScrollHint, { passive: true }));

  function shouldIgnoreGlobalKey(event) {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    if (target.matches("input, textarea, select, [contenteditable='true']")) return true;
    return event.altKey || event.ctrlKey || event.metaKey;
  }

  function handleGlobalKeydown(event) {
    state.keyboardNavigation = true;
    if (shouldIgnoreGlobalKey(event)) return;
    if (event.target.closest?.("[role='tablist']") && ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;

    if (event.key === "ArrowRight") {
      if (event.target.closest?.("[role='tablist']")) return;
      event.preventDefault();
      goToRoom(state.room + 1, { pushHistory: true, focusHeading: true, resetScroll: true });
      return;
    }
    if (event.key === "ArrowLeft") {
      if (event.target.closest?.("[role='tablist']")) return;
      event.preventDefault();
      goToRoom(state.room - 1, { pushHistory: true, focusHeading: true, resetScroll: true });
      return;
    }
    const directRoom = Number(event.key) - 1;
    if (directRoom >= 0 && directRoom < rooms.length) {
      event.preventDefault();
      goToRoom(directRoom, { pushHistory: true, focusHeading: true, resetScroll: true });
    }
  }

  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("pointerdown", () => { state.keyboardNavigation = false; }, { passive: true });

  function isGestureSurface(target) {
    return target instanceof Element && !target.closest("button, a, video, [role='tab'], [data-no-swipe]");
  }

  function finishSwipe(start, endX, endY) {
    if (!start) return;
    const deltaX = endX - start.x;
    const deltaY = endY - start.y;
    const elapsed = performance.now() - start.time;
    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.35 || elapsed > 1100) return;
    if (performance.now() - state.lastSwipeAt < 350) return;
    state.lastSwipeAt = performance.now();
    goToRoom(deltaX < 0 ? state.room + 1 : state.room - 1, { pushHistory: true, resetScroll: true });
  }

  stage.addEventListener("pointerdown", (event) => {
    if (!isGestureSurface(event.target)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    state.pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, time: performance.now() };
  }, { passive: true });

  stage.addEventListener("pointermove", (event) => {
    if (!state.pointerStart || state.pointerStart.id !== event.pointerId) return;
    state.pointerStart.lastX = event.clientX;
    state.pointerStart.lastY = event.clientY;
  }, { passive: true });

  stage.addEventListener("pointerup", (event) => {
    if (!state.pointerStart || state.pointerStart.id !== event.pointerId) return;
    const start = state.pointerStart;
    state.pointerStart = null;
    finishSwipe(start, event.clientX, event.clientY);
  }, { passive: true });

  stage.addEventListener("pointercancel", (event) => {
    if (!state.pointerStart || state.pointerStart.id !== event.pointerId) return;
    const start = state.pointerStart;
    state.pointerStart = null;
    finishSwipe(start, start.lastX, start.lastY);
  }, { passive: true });

  stage.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || !isGestureSurface(event.target)) return;
    const touch = event.touches[0];
    state.touchStart = { id: touch.identifier, x: touch.clientX, y: touch.clientY, time: performance.now() };
  }, { passive: true });

  stage.addEventListener("touchend", (event) => {
    if (!state.touchStart) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === state.touchStart.id);
    if (!touch) return;
    const start = state.touchStart;
    state.touchStart = null;
    finishSwipe(start, touch.clientX, touch.clientY);
  }, { passive: true });

  stage.addEventListener("touchcancel", () => { state.touchStart = null; }, { passive: true });

  stage.addEventListener("wheel", (event) => {
    const now = performance.now();
    if (now < state.wheelLockUntil) return;
    const mostlyHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.2;
    const shiftedVertical = event.shiftKey && Math.abs(event.deltaY) > 20;
    const delta = mostlyHorizontal ? event.deltaX : shiftedVertical ? event.deltaY : 0;
    if (Math.abs(delta) < 30) return;
    event.preventDefault();
    state.wheelLockUntil = now + 740;
    goToRoom(delta > 0 ? state.room + 1 : state.room - 1, { pushHistory: true, resetScroll: true });
  }, { passive: false });

  /* One stable phrase follows the cursor. The title remains intact in normal
     document flow, so the interaction cannot tear words or change spacing. */

  const restlessThesis = document.querySelector("[data-restless-thesis]");
  const movingWord = restlessThesis?.querySelector(".moving-word");
  let restlessFrame = 0;
  const restlessCurrent = { x: 0, y: 0, r: -1.5 };
  const restlessTarget = { x: 0, y: 0, r: -1.5 };

  function renderRestlessThesis() {
    restlessFrame = 0;
    if (!movingWord || reduceMotion.matches) return;
    const ease = .18;
    restlessCurrent.x += (restlessTarget.x - restlessCurrent.x) * ease;
    restlessCurrent.y += (restlessTarget.y - restlessCurrent.y) * ease;
    restlessCurrent.r += (restlessTarget.r - restlessCurrent.r) * ease;
    movingWord.style.setProperty("--thesis-x", `${restlessCurrent.x.toFixed(2)}px`);
    movingWord.style.setProperty("--thesis-y", `${restlessCurrent.y.toFixed(2)}px`);
    movingWord.style.setProperty("--thesis-r", `${restlessCurrent.r.toFixed(2)}deg`);
    const unsettled = Math.abs(restlessTarget.x - restlessCurrent.x) > .04
      || Math.abs(restlessTarget.y - restlessCurrent.y) > .04
      || Math.abs(restlessTarget.r - restlessCurrent.r) > .02;
    if (unsettled) restlessFrame = window.requestAnimationFrame(renderRestlessThesis);
    else if (restlessTarget.x === 0 && restlessTarget.y === 0) restlessThesis?.classList.remove("is-restless");
  }

  function queueRestlessFrame() {
    if (!restlessFrame) restlessFrame = window.requestAnimationFrame(renderRestlessThesis);
  }

  restlessThesis?.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches) return;
    const bounds = restlessThesis.getBoundingClientRect();
    const nx = clamp(((event.clientX - bounds.left) / bounds.width - .5) * 2, -1, 1);
    const ny = clamp(((event.clientY - bounds.top) / bounds.height - .5) * 2, -1, 1);
    restlessTarget.x = nx * 7;
    restlessTarget.y = ny * 3.5;
    restlessTarget.r = -1.5 + nx * .8;
    restlessThesis.classList.add("is-restless");
    queueRestlessFrame();
  }, { passive: true });

  restlessThesis?.addEventListener("pointerleave", () => {
    restlessTarget.x = 0;
    restlessTarget.y = 0;
    restlessTarget.r = -1.5;
    queueRestlessFrame();
  });

  /* The studio kitten follows attention directly and reacts on touch. */

  const guide = document.querySelector("[data-guide]");
  const guideButton = document.querySelector("[data-guide-button]");
  const guideSpeech = document.querySelector("[data-guide-speech]");
  const guideTrackingSurface = document.querySelector("#foyer");
  const guideLines = [
    "Psst—almost everything here reacts.",
    "The good chapters move. Follow me.",
    "Room 01: the books breathe. Pages turn themselves.",
    "The pet in 02 chases cursors. I taught it how.",
    "I tested all fifty light keys in 03. Thoroughly.",
    "04 is older work—the NPCs still hold a conversation.",
    "The tools in 05 are practical. Mostly.",
    "Sit still? We filed a formal refusal.",
  ];
  let guideReactionTimer = 0;

  function resetGuideLook() {
    shell.style.setProperty("--look-x", "0px");
    shell.style.setProperty("--look-y", "0px");
    shell.style.setProperty("--guide-tilt-x", "0deg");
    shell.style.setProperty("--guide-tilt-y", "0deg");
  }

  guideTrackingSurface?.addEventListener("pointermove", (event) => {
    const bounds = guideButton?.getBoundingClientRect() || guide?.getBoundingClientRect();
    if (!bounds) return;
    const nx = Math.tanh((event.clientX - (bounds.left + bounds.width / 2)) / Math.max(bounds.width * .72, 1));
    const ny = Math.tanh((event.clientY - (bounds.top + bounds.height / 2)) / Math.max(bounds.height * .78, 1));
    shell.style.setProperty("--look-x", `${(nx * 8).toFixed(2)}px`);
    shell.style.setProperty("--look-y", `${(ny * 6).toFixed(2)}px`);
    if (!reduceMotion.matches) {
      shell.style.setProperty("--guide-tilt-x", `${(nx * 2.5).toFixed(2)}deg`);
      shell.style.setProperty("--guide-tilt-y", `${(ny * -1.8).toFixed(2)}deg`);
    }
  }, { passive: true });

  guideTrackingSurface?.addEventListener("pointerleave", resetGuideLook);

  function cycleGuideSpeech() {
    window.clearTimeout(guideReactionTimer);
    state.guideSpeech = (state.guideSpeech + 1) % guideLines.length;
    if (guideSpeech) guideSpeech.lastChild.textContent = guideLines[state.guideSpeech];
    guide?.classList.remove("is-greeting");
    void guide?.offsetWidth;
    guide?.classList.add("is-greeting");
    announceReaction(guideLines[state.guideSpeech]);
    guideReactionTimer = window.setTimeout(() => {
      guide?.classList.remove("is-greeting");
    }, 1250);
  }

  guideButton?.addEventListener("click", cycleGuideSpeech);
  guideSpeech?.addEventListener("click", cycleGuideSpeech);

  /* Room-specific behaviors */

  const alcoveBook = document.querySelector("[data-open-book]");
  alcoveBook?.setAttribute("aria-expanded", "false");
  alcoveBook?.addEventListener("click", () => {
    const open = !alcoveBook.classList.contains("is-open");
    alcoveBook.classList.toggle("is-open", open);
    alcoveBook.setAttribute("aria-expanded", String(open));
    announceReaction(open
      ? "The Welcome book slides off the shelf and opens on its first ruled page."
      : "The Welcome book closes and slides back onto the shelf.");
  });

  /* Pet room: one drawn creature answers the desk bell. It runs in along the
     slab's top edge, settles by the monitor, tracks the cursor while it visits
     (the real app chases cursors, so the gaze is on-theme), then wanders off. */

  const petRoom = document.querySelector(".room--pet");
  const petCreature = petRoom?.querySelector(".pet-creature");
  const petWindow = petRoom?.querySelector(".museum-window--pet");
  const petSlab = petRoom?.querySelector(".pet-slab");
  const callPetButton = document.querySelector("[data-call-pet]");
  let petTimers = [];

  const clearPetTimers = () => {
    petTimers.forEach((timer) => window.clearTimeout(timer));
    petTimers = [];
  };

  function measurePetStop() {
    if (!petRoom || !petWindow || !petSlab || !petCreature) return;
    const slabBox = petSlab.getBoundingClientRect();
    const windowBox = petWindow.getBoundingClientRect();
    const stop = windowBox.left - slabBox.left + windowBox.width * 0.16 - petCreature.offsetWidth * 0.5;
    petRoom.style.setProperty("--pet-stop-x", `${Math.max(12, stop).toFixed(1)}px`);
  }

  function resetPetLook() {
    if (!petCreature) return;
    ["--pet-look-x", "--pet-look-y", "--pet-look-r", "--pet-look-hx", "--pet-look-hy"].forEach((name) => petCreature.style.removeProperty(name));
  }

  petRoom?.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || !petCreature || !petRoom.classList.contains("is-visiting")) return;
    const box = petCreature.getBoundingClientRect();
    const nx = Math.tanh((event.clientX - (box.left + box.width * 0.62)) / 170);
    const ny = Math.tanh((event.clientY - (box.top + box.height * 0.3)) / 130);
    petCreature.style.setProperty("--pet-look-x", `${(nx * 3.1).toFixed(2)}px`);
    petCreature.style.setProperty("--pet-look-y", `${(ny * 2.1).toFixed(2)}px`);
    petCreature.style.setProperty("--pet-look-r", `${(nx * 6.5).toFixed(2)}deg`);
    petCreature.style.setProperty("--pet-look-hx", `${(nx * 1.4).toFixed(2)}px`);
    petCreature.style.setProperty("--pet-look-hy", `${(ny * 1).toFixed(2)}px`);
  }, { passive: true });

  petRoom?.addEventListener("pointerleave", resetPetLook);

  /* State changes follow the creature's actual animations (animationend), so a
     late-starting or slow frame can never snap the run short mid-stride. */
  petCreature?.addEventListener("animationend", (event) => {
    if (event.target !== petCreature || !petRoom) return;
    if (event.animationName === "pet-run-in" && petRoom.classList.contains("is-called")) {
      petRoom.classList.remove("is-called");
      petRoom.classList.add("is-visiting");
      announceReaction("It settles by the screen and watches your cursor.");
      petTimers.push(window.setTimeout(() => {
        petRoom.classList.remove("is-visiting");
        petRoom.classList.add("is-leaving");
      }, reduceMotion.matches ? 2400 : 5200));
    } else if (event.animationName === "pet-run-out" && petRoom.classList.contains("is-leaving")) {
      petRoom.classList.remove("is-leaving");
      callPetButton?.setAttribute("aria-pressed", "false");
      resetPetLook();
    }
  });

  callPetButton?.addEventListener("click", () => {
    if (!petRoom) return;
    const quick = reduceMotion.matches;
    if (petRoom.classList.contains("is-called") || petRoom.classList.contains("is-leaving")) return;
    if (petRoom.classList.contains("is-visiting")) {
      petRoom.classList.remove("is-delighted");
      void petRoom.offsetWidth;
      petRoom.classList.add("is-delighted");
      announceReaction("It is already here, watching your cursor.");
      petTimers.push(window.setTimeout(() => petRoom.classList.remove("is-delighted"), quick ? 30 : 620));
      return;
    }
    clearPetTimers();
    measurePetStop();
    callPetButton.setAttribute("aria-pressed", "true");
    petRoom.classList.add("is-called");
    announceReaction("The desktop pet comes running.");
  });

  /* Keyscape: one keypress, propagated. The demo window is the instrument;
     the wave leaves its center and reaches every surface with distance-based
     delay and physical falloff, the way a ripple crosses a keyboard. */

  const keyscapeRoom = document.querySelector(".room--keyscape");
  const rippleButton = document.querySelector("[data-play-ripple]");
  const RIPPLE_SPEED = 1.35; // px per ms — matches the wavefront ring's expansion
  const RIPPLE_FALLOFF = 560; // px at which the amplitude has halved
  let rippleTimer = 0;

  function playRipple() {
    if (!keyscapeRoom || !rippleButton || state.room !== 3) return;
    const still = reduceMotion.matches;
    const originEl = keyscapeRoom.querySelector(".museum-window--keyscape");
    const roomRect = keyscapeRoom.getBoundingClientRect();
    const originRect = originEl?.getBoundingClientRect();
    const origin = originRect
      ? { x: originRect.left + originRect.width / 2, y: originRect.top + originRect.height / 2 }
      : { x: roomRect.left + roomRect.width / 2, y: roomRect.top + roomRect.height / 2 };

    const targets = [
      originEl,
      keyscapeRoom.querySelector(".exhibit-copy--keyscape h2"),
      keyscapeRoom.querySelector(".exhibit-copy--keyscape .eyebrow span"),
      ...keyscapeRoom.querySelectorAll(".exhibit-copy--keyscape .project-facts li"),
      rippleButton,
      ...keyscapeRoom.querySelectorAll(".doorway"),
      ...keyscapeRoom.querySelectorAll(".keyscape-stars i"),
      ...keyscapeRoom.querySelectorAll(".keyscape-beam"),
      document.querySelector(".museum-map"),
    ].filter(Boolean);

    let maxDelay = 0;
    targets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.hypot(rect.left + rect.width / 2 - origin.x, rect.top + rect.height / 2 - origin.y);
      const delay = still ? 0 : distance / RIPPLE_SPEED;
      const amplitude = 1 / (1 + Math.pow(distance / RIPPLE_FALLOFF, 1.7));
      maxDelay = Math.max(maxDelay, delay);
      element.style.setProperty("--wave-delay", `${delay.toFixed(0)}ms`);
      element.style.setProperty("--wave-amp", amplitude.toFixed(3));
    });

    keyscapeRoom.style.setProperty("--wave-x", `${(origin.x - roomRect.left).toFixed(0)}px`);
    keyscapeRoom.style.setProperty("--wave-y", `${(origin.y - roomRect.top).toFixed(0)}px`);

    window.clearTimeout(rippleTimer);
    shell.classList.remove("is-rippling");
    keyscapeRoom.classList.remove("is-rippling");
    void keyscapeRoom.offsetWidth;
    shell.classList.add("is-rippling");
    keyscapeRoom.classList.add("is-rippling");
    rippleButton.setAttribute("aria-pressed", "true");
    announceReaction("A ripple leaves the keyboard and rolls across the room.");

    rippleTimer = window.setTimeout(() => {
      shell.classList.remove("is-rippling");
      keyscapeRoom.classList.remove("is-rippling");
      rippleButton.setAttribute("aria-pressed", "false");
    }, still ? 700 : maxDelay + 1500);
  }

  rippleButton?.addEventListener("click", playRipple);

  document.addEventListener("keydown", (event) => {
    if (state.room !== 3 || event.repeat || shouldIgnoreGlobalKey(event)) return;
    if (event.key.toLowerCase() !== "r") return;
    event.preventDefault();
    playRipple();
  });

  /* Archive: one real README-derived film at a time. */

  const archiveTabs = [...document.querySelectorAll(".archive-project-tab")];
  const archiveRoom = document.querySelector(".room--archive");
  const archiveVideo = document.querySelector("[data-archive-video]");
  const archivePlay = document.querySelector("[data-archive-play]");
  const archiveTitle = document.querySelector("[data-archive-title]");
  const archiveKicker = document.querySelector("[data-archive-kicker]");
  const archiveDescription = document.querySelector("[data-archive-description]");
  const archiveLink = document.querySelector("[data-archive-link]");
  const archiveCounter = document.querySelector("[data-archive-counter]");
  const archivePanel = document.querySelector("#archive-panel");

  function syncArchivePlayButton(video = archiveVideo) {
    if (!(video instanceof HTMLVideoElement) || !archivePlay) return;
    const playing = !video.paused && !video.ended;
    archivePlay.classList.toggle("is-playing", playing);
    archivePlay.setAttribute("aria-label", playing ? "Pause archive demo" : video.ended ? "Replay archive demo" : "Play archive demo");
  }

  function setArchiveProject(tab, focus = false) {
    if (!(tab instanceof HTMLButtonElement) || !(archiveVideo instanceof HTMLVideoElement)) return;
    const index = archiveTabs.indexOf(tab);
    archiveTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });

    if (archiveTitle) archiveTitle.textContent = tab.dataset.title || "";
    if (archiveKicker) archiveKicker.textContent = tab.dataset.kicker || "";
    if (archiveDescription) archiveDescription.textContent = tab.dataset.description || "";
    if (archiveLink) archiveLink.href = tab.dataset.repo || "#";
    if (archiveCounter) archiveCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(archiveTabs.length).padStart(2, "0")} · README FILM`;
    if (archivePanel && tab.id) archivePanel.setAttribute("aria-labelledby", tab.id);
    if (archiveRoom) archiveRoom.dataset.archiveProject = tab.dataset.archiveProject || "npc";
    if (state.room === 4) syncFrameTheme(4);

    archiveVideo.pause();
    archiveVideo.defaultPlaybackRate = 1;
    archiveVideo.playbackRate = 1;
    archiveVideo.poster = tab.dataset.poster || "";
    archiveVideo.setAttribute("aria-label", tab.dataset.alt || `${tab.dataset.title || "Project"} demo`);
    archiveVideo.replaceChildren();
    if (tab.dataset.webm) {
      const source = document.createElement("source");
      source.src = tab.dataset.webm;
      source.type = "video/webm";
      archiveVideo.append(source);
    }
    if (tab.dataset.mp4) {
      const source = document.createElement("source");
      source.src = tab.dataset.mp4;
      source.type = "video/mp4";
      archiveVideo.append(source);
    }
    archiveVideo.load();
    if (state.room === 4 && archiveVideo.dataset.userPaused !== "true" && !reduceMotion.matches) archiveVideo.play().catch(() => {});
    syncArchivePlayButton();
    if (focus) tab.focus();
  }

  archiveTabs.forEach((tab) => {
    tab.addEventListener("click", () => setArchiveProject(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const next = event.key === "Home"
        ? archiveTabs[0]
        : event.key === "End"
          ? archiveTabs.at(-1)
          : archiveTabs[(archiveTabs.indexOf(tab) + direction + archiveTabs.length) % archiveTabs.length];
      setArchiveProject(next, true);
    });
  });

  archivePlay?.addEventListener("click", () => {
    if (!(archiveVideo instanceof HTMLVideoElement)) return;
    if (archiveVideo.paused) {
      delete archiveVideo.dataset.userPaused;
      ensureVideoSources(archiveVideo);
      if (archiveVideo.ended) archiveVideo.currentTime = 0;
      archiveVideo.play().catch(() => {});
    } else {
      archiveVideo.dataset.userPaused = "true";
      archiveVideo.pause();
    }
  });
  archiveVideo?.addEventListener("play", () => syncArchivePlayButton());
  archiveVideo?.addEventListener("pause", () => syncArchivePlayButton());
  archiveVideo?.addEventListener("ended", () => syncArchivePlayButton());

  /* Workbench: four separate drawers, one useful object at a time. */

  const toolSelectors = [...document.querySelectorAll(".tool-selector")];
  const workbenchRoom = document.querySelector(".room--workbench");
  const toolFeature = document.querySelector(".workbench-feature__media");
  const toolMedia = document.querySelector("[data-tool-media]");
  const toolVideo = document.querySelector("[data-tool-video]");
  const toolIndex = document.querySelector("[data-tool-index]");
  const toolTitle = document.querySelector(".workbench-feature h3");
  const toolDescription = document.querySelector("[data-tool-description]");
  const toolLink = document.querySelector("[data-tool-link]");
  const toolPlay = document.querySelector("[data-tool-play]");
  const workbenchPanel = document.querySelector("#workbench-panel");

  function setTool(selector, focus = false) {
    if (!(selector instanceof HTMLButtonElement) || !(toolMedia instanceof HTMLImageElement) || !(toolVideo instanceof HTMLVideoElement)) return;
    toolSelectors.forEach((item) => {
      const active = item === selector;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    toolFeature?.classList.add("is-changing");
    if (workbenchRoom) workbenchRoom.dataset.tool = selector.dataset.tool || "email";
    if (state.room === 5) syncFrameTheme(5);
    window.setTimeout(() => {
      const isVideo = selector.dataset.type === "video";
      toolVideo.pause();
      toolVideo.defaultPlaybackRate = 1;
      toolVideo.playbackRate = 1;
      toolVideo.hidden = !isVideo;
      toolMedia.hidden = isVideo;
      if (toolPlay) toolPlay.hidden = !isVideo;

      if (isVideo) {
        toolVideo.poster = selector.dataset.poster || "";
        toolVideo.setAttribute("aria-label", selector.dataset.alt || `${selector.dataset.title || "Utility"} demo`);
        toolVideo.replaceChildren();
        if (selector.dataset.webm) {
          const source = document.createElement("source");
          source.src = selector.dataset.webm;
          source.type = "video/webm";
          toolVideo.append(source);
        }
        if (selector.dataset.mp4) {
          const source = document.createElement("source");
          source.src = selector.dataset.mp4;
          source.type = "video/mp4";
          toolVideo.append(source);
        }
        toolVideo.load();
        if (state.room === 5 && toolVideo.dataset.userPaused !== "true" && !reduceMotion.matches && !document.hidden) toolVideo.play().catch(() => {});
      } else {
        toolMedia.src = selector.dataset.media || selector.dataset.poster || "";
        toolMedia.alt = selector.dataset.alt || `${selector.dataset.title || "Utility"} demo`;
      }
      if (toolIndex) toolIndex.textContent = selector.dataset.index || "";
      if (toolTitle) toolTitle.textContent = selector.dataset.title || "";
      if (toolDescription) toolDescription.textContent = selector.dataset.description || "";
      if (toolLink) toolLink.href = selector.dataset.repo || "#";
      if (workbenchPanel && selector.id) workbenchPanel.setAttribute("aria-labelledby", selector.id);
      toolFeature?.classList.remove("is-changing");
      syncVideoPlayback();
    }, reduceMotion.matches ? 0 : 130);
    if (focus) selector.focus();
  }

  toolSelectors.forEach((selector) => {
    selector.addEventListener("click", () => setTool(selector));
    selector.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const next = event.key === "Home"
        ? toolSelectors[0]
        : event.key === "End"
          ? toolSelectors.at(-1)
          : toolSelectors[(toolSelectors.indexOf(selector) + direction + toolSelectors.length) % toolSelectors.length];
      setTool(next, true);
    });
  });

  document.querySelectorAll("[data-video-toggle]").forEach((button) => {
    const video = button.parentElement?.querySelector("video");
    if (!(button instanceof HTMLButtonElement) || !(video instanceof HTMLVideoElement)) return;
    button.addEventListener("click", () => {
      if (video.paused) {
        delete video.dataset.userPaused;
        ensureVideoSources(video);
        video.play().catch(() => {});
      } else {
        video.dataset.userPaused = "true";
        video.pause();
      }
      syncFeaturePlayButton(video);
    });
    video.addEventListener("play", () => syncFeaturePlayButton(video));
    video.addEventListener("pause", () => syncFeaturePlayButton(video));
    video.addEventListener("ended", () => syncFeaturePlayButton(video));
    syncFeaturePlayButton(video);
  });

  /* Reduced motion uses honest stills instead of freezing animated files mid-frame. */

  function syncMotionPreference() {
    syncMotionImages();
    if (reduceMotion.matches) shell.classList.remove("is-intro");
    syncVideoPlayback();
  }

  reduceMotion.addEventListener?.("change", syncMotionPreference);

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      setSpatialVariables(state.room);
      syncMobileScrollHint();
      if (petRoom?.classList.contains("is-called") || petRoom?.classList.contains("is-visiting")) measurePetStop();
    });
  }, { passive: true });

  document.addEventListener("visibilitychange", syncVideoPlayback);
  window.addEventListener("popstate", () => goToRoom(getRoomFromHash(), { updateHash: false, forceAnnounce: true, focusHeading: true }));

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
    if (image.complete) image.classList.add("is-loaded");
  });

  state.introTimer = window.setTimeout(() => shell.classList.remove("is-intro"), reduceMotion.matches ? 0 : 4700);
  syncMotionPreference();
  const initialRoom = getRoomFromHash();
  // Keep the canonical foyer URL fragment-free. Writing #foyer during startup
  // makes browsers begin sequential keyboard focus after the room fragment,
  // skipping the skip link and masthead controls.
  goToRoom(initialRoom, { updateHash: Boolean(window.location.hash), forceAnnounce: false });
  window.addEventListener("load", () => {
    stage.scrollLeft = 0;
    syncMobileScrollHint();
  }, { once: true });
})();
