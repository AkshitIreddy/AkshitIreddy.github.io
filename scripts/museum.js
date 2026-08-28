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
  const motionToggle = document.querySelector("[data-motion-toggle]");
  const motionLabel = document.querySelector("[data-motion-label]");

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
    pointerStart: null,
    wheelLockUntil: 0,
    headingFocusTimer: 0,
    keyboardNavigation: false,
    motionPaused: false,
    touchStart: null,
    lastSwipeAt: 0,
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;

  const frameColors = {
    foyer: "#f4ead4",
    alcove: "#f4d6dd",
    pet: "#efd8cc",
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
      document.title = "Akshit — Built to Move";
      return;
    }
    const label = room.id === "archive"
      ? "Projects"
      : room.id === "workbench"
        ? "Tools"
        : roomData[index]?.shortName || "Projects";
    document.title = `${label} · Built to Move`;
  }

  function getRoomFromHash() {
    const id = window.location.hash.slice(1).toLowerCase();
    const found = roomData.find((room) => room.id.toLowerCase() === id);
    return found ? found.index : 0;
  }

  function setSpatialVariables(index) {
    shell.style.setProperty("--room-index", String(index));
    shell.style.setProperty("--world-offset", `${index * -100}vw`);
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

    const requestedStart = Number.parseFloat(video.dataset.startTime || "");
    if (Number.isFinite(requestedStart) && video.dataset.startApplied !== "true") {
      const applyStart = () => {
        const finalFrame = Number.isFinite(video.duration) ? Math.max(0, video.duration - .05) : requestedStart;
        video.currentTime = Math.min(requestedStart, finalFrame);
        video.dataset.startApplied = "true";
      };
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) applyStart();
      else video.addEventListener("loadedmetadata", applyStart, { once: true });
    }
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

  function syncVideoPlayback() {
    document.querySelectorAll("[data-room-video]").forEach((video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      const room = video.closest(".room");
      const active = room?.classList.contains("is-current") && !video.hidden;
      if (active) ensureVideoPoster(video);
      const canPlay = active && video.dataset.userPaused !== "true" && !reduceMotion.matches && !state.motionPaused && !document.hidden;
      if (canPlay) {
        ensureVideoSources(video);
        video.play().catch(() => {});
      }
      else video.pause();
      syncFeaturePlayButton(video);
    });

  }

  function refreshComponentMedia() {
    syncFrameTheme();
    syncVideoPlayback();
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
    state.room = index;
    stage.scrollLeft = 0;
    setSpatialVariables(index);
    updateRoomAccessibility(index);
    if (options.updateHash !== false) updateHash(index, Boolean(options.pushHistory));
    if (from !== index || options.forceAnnounce) announceRoom(index);
    if (options.focusHeading) focusRoomHeading(index);

    const room = rooms[index];
    if (room && (options.resetScroll || from !== index)) room.scrollTo({ top: 0, behavior: "instant" });

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

  function syncMotionControl() {
    const paused = reduceMotion.matches || state.motionPaused;
    shell.classList.toggle("is-motion-paused", paused);
    motionToggle?.setAttribute("aria-pressed", String(paused));
    if (motionLabel) motionLabel.textContent = reduceMotion.matches ? "Motion reduced" : paused ? "Resume motion" : "Pause motion";
    document.querySelectorAll("svg").forEach((svg) => {
      if (paused) svg.pauseAnimations?.();
      else svg.unpauseAnimations?.();
    });
    syncVideoPlayback();
  }

  motionToggle?.addEventListener("click", () => {
    if (reduceMotion.matches) {
      announceReaction("Motion is reduced by your system preference.");
      return;
    }
    state.motionPaused = !state.motionPaused;
    syncMotionControl();
    announceReaction(state.motionPaused ? "Motion paused." : "Motion resumed.");
  });

  function syncMotionPreference() {
    if (reduceMotion.matches) shell.classList.remove("is-intro");
    syncMotionControl();
  }

  reduceMotion.addEventListener?.("change", syncMotionPreference);

  let resizeFrame = 0;
  let viewportBand = window.innerWidth <= 760 ? "mobile" : window.innerWidth <= 900 ? "tablet" : "desktop";
  window.addEventListener("resize", () => {
    shell.classList.add("is-resizing");
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      const nextBand = window.innerWidth <= 760 ? "mobile" : window.innerWidth <= 900 ? "tablet" : "desktop";
      if (nextBand !== viewportBand) {
        rooms[state.room]?.scrollTo({ top: 0, behavior: "instant" });
        viewportBand = nextBand;
      }
      setSpatialVariables(state.room);
      syncMobileScrollHint();
      window.requestAnimationFrame(() => shell.classList.remove("is-resizing"));
    });
  }, { passive: true });

  document.addEventListener("visibilitychange", syncVideoPlayback);
  window.addEventListener("museum:mediarefresh", refreshComponentMedia);
  window.addEventListener("popstate", () => goToRoom(getRoomFromHash(), { updateHash: false, forceAnnounce: true, focusHeading: true, resetScroll: true }));

  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
    if (image.complete) image.classList.add("is-loaded");
  });

  window.setTimeout(() => shell.classList.remove("is-intro"), reduceMotion.matches ? 0 : 4700);
  syncMotionPreference();
  const initialRoom = getRoomFromHash();
  // Keep the canonical foyer URL fragment-free. Writing #foyer during startup
  // makes browsers begin sequential keyboard focus after the room fragment,
  // skipping the skip link and masthead controls.
  goToRoom(initialRoom, { updateHash: Boolean(window.location.hash), forceAnnounce: false, resetScroll: true });
  window.addEventListener("load", () => {
    stage.scrollLeft = 0;
    syncMobileScrollHint();
  }, { once: true });
})();
