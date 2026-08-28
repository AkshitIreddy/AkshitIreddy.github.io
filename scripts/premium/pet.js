(() => {
  "use strict";

  const room = document.querySelector("[data-pet-room]");
  const habitat = document.querySelector("[data-habitat]");
  const companion = document.querySelector("[data-desktop-companion]");
  const inviteButton = document.querySelector("[data-companion-invite]");
  const inviteLabel = document.querySelector("[data-company-label]");
  const inviteHint = document.querySelector("[data-company-hint]");
  const stateLabel = document.querySelector("[data-companion-state]");
  const modeTitle = document.querySelector("[data-mode-title]");
  const liveStatus = document.querySelector("[data-live-status]");
  const behaviorButtons = [...document.querySelectorAll("[data-pet-behavior]")];
  const localReactors = [...document.querySelectorAll("[data-local-react]")];
  const video = document.querySelector("[data-pet-video]");
  const videoButton = document.querySelector("[data-video-control]");
  const videoIcon = videoButton?.querySelector(".video-control__icon");
  const videoLabel = document.querySelector("[data-video-label]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!room || !habitat || !companion) return;

  const modeCopy = {
    roam: {
      title: "Autonomous roam",
      state: "Roaming between window edges",
      announcement: "Roam behavior selected. The companion explores window edges."
    },
    notice: {
      title: "Local awareness",
      state: "Noticing the pointer inside its habitat",
      announcement: "Notice behavior selected. Move near the companion inside the habitat."
    },
    remember: {
      title: "Invited memory",
      state: "Perched beside opt-in memory",
      announcement: "Remember behavior selected. Memory remains user controlled."
    },
    talk: {
      title: "Embodied voice",
      state: "Listening at the Convai voice link",
      announcement: "Talk behavior selected. Real-time conversation is powered by Convai."
    }
  };

  const motion = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0,
    ty: 0,
    width: 0,
    height: 0,
    companionWidth: 88,
    companionHeight: 79,
    initialized: false,
    lastTime: 0,
    roamIndex: 0,
    nextRoamAt: 0,
    company: false,
    behavior: "roam",
    pointer: {
      active: false,
      near: false,
      x: 0,
      y: 0
    }
  };
  const hostRoom = room.closest(".room");
  const shell = room.closest(".museum-shell");
  let frame = 0;

  function motionAllowed() {
    return Boolean(hostRoom?.classList.contains("is-current"))
      && !document.hidden
      && !reduceMotion.matches
      && !shell?.classList.contains("is-motion-paused");
  }

  function scheduleTick() {
    if (!frame && motionAllowed()) frame = window.requestAnimationFrame(tick);
  }

  const roamPerches = [
    [.15, .71],
    [.32, .78],
    [.58, .72],
    [.76, .77],
    [.49, .69]
  ];

  const behaviorPerches = {
    notice: [.30, .36],
    remember: [.76, .36],
    talk: [.70, .62],
    roam: [.15, .71],
    company: [.36, .73]
  };

  function announce(message) {
    if (!liveStatus) return;
    liveStatus.textContent = "";
    window.setTimeout(() => {
      liveStatus.textContent = message;
    }, 20);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function measureHabitat() {
    const bounds = habitat.getBoundingClientRect();
    const companionBounds = companion.getBoundingClientRect();
    motion.width = bounds.width;
    motion.height = bounds.height;
    motion.companionWidth = companionBounds.width || 88;
    motion.companionHeight = companionBounds.height || 79;

    if (!motion.initialized) {
      const first = pointFromRatio(behaviorPerches.roam);
      motion.x = first.x;
      motion.y = first.y;
      motion.tx = first.x;
      motion.ty = first.y;
      motion.initialized = true;
      paintCompanion();
    } else {
      motion.x = clamp(motion.x, 8, maxX());
      motion.y = clamp(motion.y, 18, maxY());
      selectTarget(performance.now(), true);
    }
  }

  function maxX() {
    return Math.max(8, motion.width - motion.companionWidth - 10);
  }

  function maxY() {
    return Math.max(18, motion.height - motion.companionHeight - 16);
  }

  function pointFromRatio(ratio) {
    return {
      x: clamp(motion.width * ratio[0] - motion.companionWidth * .5, 8, maxX()),
      y: clamp(motion.height * ratio[1] - motion.companionHeight * .72, 18, maxY())
    };
  }

  function setTarget(point) {
    motion.tx = clamp(point.x, 8, maxX());
    motion.ty = clamp(point.y, 18, maxY());

    if (reduceMotion.matches) {
      motion.x = motion.tx;
      motion.y = motion.ty;
      motion.vx = 0;
      motion.vy = 0;
      paintCompanion();
    }
  }

  function selectTarget(now, force = false) {
    if (!motion.initialized) return;

    if (motion.company) {
      setTarget(pointFromRatio(behaviorPerches.company));
      return;
    }

    if (motion.pointer.near) {
      setTarget({
        x: motion.pointer.x - motion.companionWidth * .55,
        y: motion.pointer.y - motion.companionHeight * .62
      });
      return;
    }

    if (motion.behavior !== "roam") {
      setTarget(pointFromRatio(behaviorPerches[motion.behavior]));
      return;
    }

    if (force || now >= motion.nextRoamAt) {
      const perch = roamPerches[motion.roamIndex % roamPerches.length];
      motion.roamIndex += 1;
      motion.nextRoamAt = now + 2600 + (motion.roamIndex % 3) * 630;
      setTarget(pointFromRatio(perch));
    }
  }

  function paintCompanion() {
    companion.style.setProperty("--pet-x", `${motion.x.toFixed(2)}px`);
    companion.style.setProperty("--pet-y", `${motion.y.toFixed(2)}px`);
  }

  function tick(now) {
    frame = 0;
    if (!motionAllowed()) {
      motion.lastTime = 0;
      return;
    }
    const elapsed = motion.lastTime ? Math.min(34, now - motion.lastTime) : 16.67;
    motion.lastTime = now;
    selectTarget(now);

    if (!reduceMotion.matches) {
      const timeScale = elapsed / 16.67;
      const spring = motion.pointer.near ? .072 : .045;
      const damping = motion.pointer.near ? .74 : .79;

      motion.vx += (motion.tx - motion.x) * spring * timeScale;
      motion.vy += (motion.ty - motion.y) * spring * timeScale;
      motion.vx *= Math.pow(damping, timeScale);
      motion.vy *= Math.pow(damping, timeScale);
      motion.x += motion.vx * timeScale;
      motion.y += motion.vy * timeScale;

      if (Math.abs(motion.tx - motion.x) < .02 && Math.abs(motion.vx) < .02) motion.x = motion.tx;
      if (Math.abs(motion.ty - motion.y) < .02 && Math.abs(motion.vy) < .02) motion.y = motion.ty;
      paintCompanion();
    }

    scheduleTick();
  }

  function updatePointer(event) {
    if (event.pointerType === "touch") return;
    const bounds = habitat.getBoundingClientRect();
    motion.pointer.active = true;
    motion.pointer.x = event.clientX - bounds.left;
    motion.pointer.y = event.clientY - bounds.top;

    const petCenterX = motion.x + motion.companionWidth * .5;
    const petCenterY = motion.y + motion.companionHeight * .52;
    const distance = Math.hypot(motion.pointer.x - petCenterX, motion.pointer.y - petCenterY);
    const sensitivity = motion.behavior === "notice" ? 275 : 165;
    motion.pointer.near = !motion.company && distance < sensitivity;

    if (!motion.pointer.near) selectTarget(performance.now(), true);
    scheduleTick();
  }

  function clearPointer() {
    motion.pointer.active = false;
    motion.pointer.near = false;
    selectTarget(performance.now(), true);
    scheduleTick();
  }

  function setBehavior(behavior, shouldAnnounce = true) {
    if (!modeCopy[behavior]) return;
    motion.behavior = behavior;
    room.dataset.behavior = behavior;
    behaviorButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.petBehavior === behavior));
    });
    if (modeTitle) modeTitle.textContent = modeCopy[behavior].title;
    if (!motion.company && stateLabel) stateLabel.textContent = modeCopy[behavior].state;
    motion.pointer.near = false;
    selectTarget(performance.now(), true);
    scheduleTick();
    if (shouldAnnounce) announce(modeCopy[behavior].announcement);
  }

  function setCompany(isKeepingCompany, shouldAnnounce = true) {
    motion.company = isKeepingCompany;
    room.dataset.company = String(isKeepingCompany);
    inviteButton?.setAttribute("aria-pressed", String(isKeepingCompany));

    if (inviteLabel) inviteLabel.textContent = isKeepingCompany ? "We’re hanging out" : "Keep me company";
    if (inviteHint) inviteHint.textContent = isKeepingCompany ? "Settled at the near window ledge" : "The companion will settle nearby";
    if (stateLabel) stateLabel.textContent = isKeepingCompany ? "Settled nearby — click the companion to say hello" : modeCopy[motion.behavior].state;

    motion.pointer.near = false;
    selectTarget(performance.now(), true);
    scheduleTick();
    if (shouldAnnounce) {
      announce(isKeepingCompany ? "The desktop companion settles nearby." : `${modeCopy[motion.behavior].state}.`);
    }
  }

  function greetCompanion() {
    companion.classList.remove("is-greeting");
    void companion.offsetWidth;
    companion.classList.add("is-greeting");
    window.setTimeout(() => companion.classList.remove("is-greeting"), 900);
    announce(motion.company ? "The companion looks up and waves." : "The roaming companion notices you and waves.");
  }

  function resetLocalReactor(element) {
    element.style.setProperty("--react-x", "0px");
    element.style.setProperty("--react-y", "0px");
  }

  function updateLocalReactor(element, event) {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    const bounds = element.getBoundingClientRect();
    const nx = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    const ny = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
    const strength = element.classList.contains("demo-window") ? 2.2 : 4;
    element.style.setProperty("--react-x", `${(nx * strength).toFixed(2)}px`);
    element.style.setProperty("--react-y", `${(ny * strength).toFixed(2)}px`);
  }

  function syncVideoControl() {
    if (!video || !videoButton) return;
    const playing = !video.paused && !video.ended;
    videoButton.setAttribute("aria-label", `${playing ? "Pause" : "Play"} AI Desktop Pet demo`);
    if (videoIcon) videoIcon.textContent = playing ? "Ⅱ" : "▶";
    if (videoLabel) videoLabel.textContent = playing ? "Pause the real app" : "Play the real app";
  }

  async function toggleVideo() {
    if (!video) return;
    if (!video.paused && !video.ended) {
      video.dataset.userPaused = "true";
      video.pause();
      return;
    }

    try {
      delete video.dataset.userPaused;
      await video.play();
    } catch {
      announce("The demo could not start. Use the browser video controls or try again.");
    }
  }

  behaviorButtons.forEach((button) => {
    button.addEventListener("click", () => setBehavior(button.dataset.petBehavior));
  });

  inviteButton?.addEventListener("click", () => setCompany(!motion.company));
  companion.addEventListener("click", greetCompanion);

  habitat.addEventListener("pointermove", updatePointer, { passive: true });
  habitat.addEventListener("pointerleave", clearPointer);
  habitat.addEventListener("pointercancel", clearPointer);

  localReactors.forEach((element) => {
    element.addEventListener("pointermove", (event) => updateLocalReactor(element, event), { passive: true });
    element.addEventListener("pointerleave", () => resetLocalReactor(element));
    element.addEventListener("pointercancel", () => resetLocalReactor(element));
  });

  videoButton?.addEventListener("click", toggleVideo);
  video?.addEventListener("play", syncVideoControl);
  video?.addEventListener("pause", syncVideoControl);
  video?.addEventListener("ended", syncVideoControl);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && video && !video.paused) video.pause();
    if (document.hidden && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      motion.lastTime = 0;
    } else scheduleTick();
  });

  window.addEventListener("museum:roomchange", () => {
    if (!motionAllowed()) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      motion.lastTime = 0;
      return;
    }
    measureHabitat();
    scheduleTick();
  });

  const resizeObserver = new ResizeObserver(measureHabitat);
  resizeObserver.observe(habitat);

  reduceMotion.addEventListener?.("change", () => {
    localReactors.forEach(resetLocalReactor);
    motion.vx = 0;
    motion.vy = 0;
    selectTarget(performance.now(), true);
    if (reduceMotion.matches && video && !video.paused) video.pause();
    scheduleTick();
  });

  measureHabitat();
  setBehavior("roam", false);
  setCompany(false, false);
  syncVideoControl();
  scheduleTick();
})();
