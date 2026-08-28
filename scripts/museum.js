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
  const canvas = document.querySelector(".ambient-canvas");
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
    previousRoom: 0,
    pointerStart: null,
    wheelLockUntil: 0,
    walkingTimer: 0,
    headingFocusTimer: 0,
    keyboardNavigation: false,
    guideSpeech: 0,
    motionPaused: false,
    introTimer: 0,
    touchStart: null,
    lastSwipeAt: 0,
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hasFinePointer = () => window.matchMedia("(pointer: fine)").matches;
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
      const source = reduceMotion.matches || state.motionPaused ? image.dataset.stillSrc : image.dataset.motionSrc;
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
      const canPlay = active && video.dataset.userPaused !== "true" && !reduceMotion.matches && !state.motionPaused && !document.hidden;
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
    const canPlay = state.room === 4 && archiveVideo.dataset.userPaused !== "true" && !reduceMotion.matches && !state.motionPaused && !document.hidden;
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

  /* Pointer motion is deliberately component-owned. The premium motion kernel
     registers only authored thesis lines and physical fixtures; room layers,
     columns, media, and page chrome never receive pointer transforms. */

  /* The studio kitten follows attention directly and reacts on touch. */

  const guide = document.querySelector("[data-guide]");
  const guideButton = document.querySelector("[data-guide-button]");
  const guideSpeech = document.querySelector("[data-guide-speech]");
  const guideSpeechButton = document.querySelector("[data-guide-speech-button]");
  const guideMessage = document.querySelector("[data-guide-message]");
  const guideTrackingSurface = document.querySelector("[data-guide]");
  const guideLines = [
    "The lights remember how you passed.",
    "In Alcove, the shelf really is the file browser.",
    "Press A, S, D, F in Keyscape—the room answers in light.",
    "The little traveller keeps your place between rooms.",
    "Every moving demo here comes from the real project.",
    "Ask again—I keep the odd details close.",
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

  function advanceGuideSpeech() {
    window.clearTimeout(guideReactionTimer);
    state.guideSpeech = (state.guideSpeech + 1) % guideLines.length;
    if (guideMessage) guideMessage.textContent = guideLines[state.guideSpeech];
    guide?.classList.remove("is-greeting");
    void guide?.offsetWidth;
    guide?.classList.add("is-greeting");
    announceReaction(guideLines[state.guideSpeech]);
    guideReactionTimer = window.setTimeout(() => {
      guide?.classList.remove("is-greeting");
    }, 1250);
  }

  guideButton?.addEventListener("click", advanceGuideSpeech);
  guideSpeechButton?.addEventListener("click", advanceGuideSpeech);

  /* Room-specific behaviors */

  const alcoveNotesButton = document.querySelector("[data-alcove-notes]");
  const alcoveRoom = document.querySelector(".room--alcove");
  const shelves = [...document.querySelectorAll(".edge-shelf")];
  alcoveNotesButton?.addEventListener("click", () => {
    const annotated = !alcoveRoom?.classList.contains("is-annotated");
    alcoveRoom?.classList.toggle("is-annotated", annotated);
    shelves.forEach((shelf, index) => shelf.classList.toggle("is-consulting", annotated && index % 2 === 0));
    alcoveNotesButton.setAttribute("aria-expanded", String(annotated));
    alcoveNotesButton.firstChild.textContent = annotated ? "Hide demo notes " : "Annotate the demo ";
    announceReaction(annotated ? "Three Alcove demo notes are visible." : "Alcove demo notes are hidden.");
  });

  const petRoom = document.querySelector(".room--pet");
  let petTimer = 0;
  const callPetButton = document.querySelector("[data-call-pet]");
  callPetButton?.addEventListener("click", () => {
    window.clearTimeout(petTimer);
    petRoom?.classList.remove("is-called");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => petRoom?.classList.add("is-called")));
    announceReaction("The desktop pet comes running.");
    petTimer = window.setTimeout(() => {
      petRoom?.classList.remove("is-called");
    }, 1050);
  });

  const keyscapeRoom = document.querySelector(".room--keyscape");
  const lightKeys = [...document.querySelectorAll("[data-light-key]")];
  const keyboardKeys = ["a", "s", "d", "f"];
  const keyboardLights = ["organic", "physics", "typing", "music"];
  let lightTimer = 0;
  lightKeys.forEach((button) => button.setAttribute("aria-pressed", "false"));

  function playLight(light, button) {
    if (!keyscapeRoom) return;
    keyscapeRoom.dataset.light = light;
    lightKeys.forEach((item) => item.classList.toggle("is-lit", item === button));
    lightKeys.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    announceReaction(`${light[0].toUpperCase()}${light.slice(1)} light activated.`);
    window.clearTimeout(lightTimer);
  }

  lightKeys.forEach((button) => button.addEventListener("click", () => playLight(button.dataset.lightKey, button)));

  document.addEventListener("keydown", (event) => {
    if (state.room !== 3 || event.repeat || shouldIgnoreGlobalKey(event)) return;
    const index = keyboardKeys.indexOf(event.key.toLowerCase());
    if (index === -1) return;
    event.preventDefault();
    playLight(keyboardLights[index], lightKeys[index]);
  });

  /* Archive: one real README-derived film at a time. */

  const archiveTabs = [...document.querySelectorAll(".archive-project-tab")];
  const archiveRoom = document.querySelector(".room--archive");
  const archiveVideo = document.querySelector("[data-archive-video]");
  const archivePlay = document.querySelector("[data-archive-play]");
  const archiveTitle = document.querySelector("[data-archive-title]");
  const archiveKicker = document.querySelector("[data-archive-kicker]");
  const archiveDescription = document.querySelector("[data-archive-description]");
  const archiveTech = document.querySelector("[data-archive-tech]");
  const archiveLink = document.querySelector("[data-archive-link]");
  const archiveCounter = document.querySelector("[data-archive-counter]");
  const archivePanel = document.querySelector("#archive-panel");

  function syncArchivePlayButton(video = archiveVideo) {
    if (!(video instanceof HTMLVideoElement) || !archivePlay) return;
    const playing = !video.paused && !video.ended;
    archivePlay.classList.toggle("is-playing", playing);
    const project = archiveTitle?.textContent?.trim() || "selected project";
    archivePlay.setAttribute("aria-label", `${playing ? "Pause" : video.ended ? "Replay" : "Play"} ${project} demo`);
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
    if (archiveTech) archiveTech.textContent = tab.dataset.stack || "";
    if (archiveLink) archiveLink.href = tab.dataset.repo || "#";
    if (archiveCounter) archiveCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(archiveTabs.length).padStart(2, "0")} · ${tab.dataset.mediaLabel || "PROJECT DEMO"}`;
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
    if (state.room === 4 && archiveVideo.dataset.userPaused !== "true" && !reduceMotion.matches && !state.motionPaused) archiveVideo.play().catch(() => {});
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
  const toolPlatform = document.querySelector("[data-tool-platform]");
  const toolSteps = [...document.querySelectorAll("[data-tool-step]")];
  const toolMediaLabel = document.querySelector("[data-tool-media-label]");
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
        if (state.room === 5 && toolVideo.dataset.userPaused !== "true" && !reduceMotion.matches && !state.motionPaused && !document.hidden) toolVideo.play().catch(() => {});
      } else {
        toolMedia.src = selector.dataset.media || selector.dataset.poster || "";
        toolMedia.alt = selector.dataset.alt || `${selector.dataset.title || "Utility"} demo`;
      }
      if (toolIndex) toolIndex.textContent = selector.dataset.index || "";
      if (toolTitle) toolTitle.textContent = selector.dataset.title || "";
      if (toolDescription) toolDescription.textContent = selector.dataset.description || "";
      if (toolPlatform) toolPlatform.textContent = selector.dataset.platform || "";
      const process = (selector.dataset.process || "").split("|");
      toolSteps.forEach((step, index) => { step.textContent = process[index] || ""; });
      if (toolMediaLabel) toolMediaLabel.textContent = selector.dataset.mediaLabel || "PROJECT DEMO";
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

  function syncMotionControl() {
    const paused = reduceMotion.matches || state.motionPaused;
    shell.classList.toggle("is-motion-paused", paused);
    motionToggle?.setAttribute("aria-pressed", String(paused));
    if (motionLabel) motionLabel.textContent = reduceMotion.matches ? "Motion reduced" : paused ? "Resume motion" : "Pause motion";
    document.querySelectorAll("svg").forEach((svg) => {
      if (paused) svg.pauseAnimations?.();
      else svg.unpauseAnimations?.();
    });
    syncMotionImages();
    syncVideoPlayback();
    ambientField?.sync();
  }

  motionToggle?.addEventListener("click", () => {
    if (reduceMotion.matches) {
      announceReaction("Motion is reduced by your system preference.");
      return;
    }
    state.motionPaused = !state.motionPaused;
    syncMotionControl();
    announceReaction(state.motionPaused ? "Ambient motion paused." : "Ambient motion resumed.");
  });

  function syncMotionPreference() {
    if (reduceMotion.matches) shell.classList.remove("is-intro");
    syncMotionControl();
  }

  reduceMotion.addEventListener?.("change", syncMotionPreference);

  /* Ambient hand-drawn dust; direct interactions remain available when it is disabled. */

  class AmbientField {
    constructor(element) {
      this.canvas = element;
      this.context = element?.getContext("2d", { alpha: true });
      this.particles = [];
      this.frame = 0;
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.lastTime = 0;
      this.seed = 7319;
      this.palette = ["#172326", "#c54234", "#46776a"];
      this.resize = this.resize.bind(this);
      this.draw = this.draw.bind(this);
      if (!this.context) return;
      this.resize();
      window.addEventListener("resize", this.resize, { passive: true });
      document.addEventListener("visibilitychange", () => this.sync());
      window.addEventListener("museum:roomchange", (event) => this.changeRoom(event.detail.room));
      reduceMotion.addEventListener?.("change", () => this.sync());
      this.sync();
    }

    random() {
      this.seed = (this.seed * 16807) % 2147483647;
      return (this.seed - 1) / 2147483646;
    }

    makeParticle(index) {
      const shapes = ["dot", "dash", "curl", "cross"];
      return { x: this.random() * this.width, y: this.random() * this.height, size: .7 + this.random() * 2.1, vx: (-.5 + this.random()) * .052, vy: -.025 - this.random() * .07, phase: this.random() * Math.PI * 2, angle: this.random() * Math.PI * 2, spin: (-.5 + this.random()) * .003, alpha: .07 + this.random() * .18, color: this.palette[index % this.palette.length], shape: shapes[Math.floor(this.random() * shapes.length)] };
    }

    resize() {
      if (!this.context) return;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      const pixelBudgetDpr = Math.sqrt(5_000_000 / Math.max(1, this.width * this.height));
      this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, pixelBudgetDpr));
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const count = clamp(Math.round((this.width * this.height) / 34000), 16, 46);
      this.particles = Array.from({ length: count }, (_, index) => this.makeParticle(index));
    }

    changeRoom(room) {
      const palettes = [
        ["#172326", "#c54234", "#e5b845"], ["#1f4c45", "#c54234", "#8c79ff"],
        ["#172326", "#c54234", "#46776a"], ["#8dd9e2", "#8c79ff", "#d9ee72"],
        ["#172326", "#c54234", "#46776a"], ["#172326", "#e5b845", "#c54234"],
      ];
      this.palette = palettes[room] || palettes[0];
      this.particles.forEach((particle, index) => { particle.color = this.palette[index % this.palette.length]; });
    }

    sync() {
      const run = !reduceMotion.matches && !state.motionPaused && !document.hidden;
      if (run && !this.frame) {
        this.lastTime = performance.now();
        this.frame = window.requestAnimationFrame(this.draw);
      } else if (!run && this.frame) {
        window.cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.context?.clearRect(0, 0, this.width, this.height);
      }
    }

    drawParticle(particle, time) {
      const ctx = this.context;
      const wave = Math.sin(time * .0006 + particle.phase) * 2.5;
      ctx.save();
      ctx.translate(particle.x + wave, particle.y);
      ctx.rotate(particle.angle);
      ctx.strokeStyle = particle.color;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;
      ctx.lineWidth = .8;
      ctx.lineCap = "round";
      if (particle.shape === "dot") {
        ctx.beginPath(); ctx.arc(0, 0, particle.size, 0, Math.PI * 2); ctx.fill();
      } else if (particle.shape === "dash") {
        ctx.beginPath(); ctx.moveTo(-particle.size * 2.1, 0); ctx.quadraticCurveTo(0, particle.size * .7, particle.size * 2.1, 0); ctx.stroke();
      } else if (particle.shape === "cross") {
        ctx.beginPath(); ctx.moveTo(-particle.size, 0); ctx.lineTo(particle.size, 0); ctx.moveTo(0, -particle.size); ctx.lineTo(0, particle.size); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, particle.size * 1.5, .4, Math.PI * 1.8); ctx.stroke();
      }
      ctx.restore();
    }

    draw(time) {
      this.frame = 0;
      if (reduceMotion.matches || state.motionPaused || document.hidden) return;
      if (time - this.lastTime < 30) {
        this.frame = window.requestAnimationFrame(this.draw);
        return;
      }
      const delta = clamp(time - this.lastTime, 0, 34);
      this.lastTime = time;
      this.context.clearRect(0, 0, this.width, this.height);
      this.particles.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.angle += particle.spin * delta;
        if (particle.y < -12) { particle.y = this.height + 12; particle.x = this.random() * this.width; }
        if (particle.x < -12) particle.x = this.width + 12;
        if (particle.x > this.width + 12) particle.x = -12;
        this.drawParticle(particle, time);
      });
      this.frame = window.requestAnimationFrame(this.draw);
    }
  }

  const ambientField = canvas ? new AmbientField(canvas) : null;

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      setSpatialVariables(state.room);
      syncMobileScrollHint();
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
  ambientField?.changeRoom(state.room);
  window.addEventListener("load", () => {
    stage.scrollLeft = 0;
    syncMobileScrollHint();
  }, { once: true });
})();
