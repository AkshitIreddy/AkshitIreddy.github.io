/*
 * Localized Motion
 * ----------------
 * A deliberately small, phrase-only pointer response. It owns only elements
 * selected by `lineSelector`; rooms, columns, and page layers are never moved.
 */
(function bootstrapLocalizedMotion(global) {
  "use strict";

  const VERSION = "2.0.0";
  const HARD_LIMITS = Object.freeze({ x: 3, y: 1.5, rotation: 0.12 });
  const DEFAULTS = Object.freeze({
    root: ".museum-stage",
    roomSelector: ".room",
    activeRoomSelector: ".room.is-current",
    lineSelector: "[data-calm-motion]",
    pauseOwnerSelector: ".museum-shell",
    pausedClass: "is-motion-paused",
    radius: 72,
    maxX: HARD_LIMITS.x,
    maxY: HARD_LIMITS.y,
    maxRotate: HARD_LIMITS.rotation,
    stiffness: 144,
    damping: 24,
    fixedStep: 1 / 120,
    maxFrameDelta: 1 / 20,
    maxSubSteps: 8,
    settlePosition: 0.002,
    settleVelocity: 0.004,
  });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
  const length = (x, y) => Math.hypot(x, y);

  function datasetNumber(element, key, fallback, minimum, maximum) {
    return clamp(finite(Number(element.dataset[key]), fallback), minimum, maximum);
  }

  function resolveElement(value, scope) {
    if (value?.nodeType === 1) return value;
    return typeof value === "string" ? scope.querySelector(value) : null;
  }

  function rectDistance(x, y, rect) {
    return length(
      Math.max(rect.left - x, 0, x - rect.right),
      Math.max(rect.top - y, 0, y - rect.bottom),
    );
  }

  function makeAxis() {
    return { position: 0, velocity: 0, target: 0 };
  }

  function create(userOptions = {}) {
    if (!global.document) throw new Error("LocalizedMotion requires a browser document.");

    const settings = { ...DEFAULTS, ...userOptions };
    const root = resolveElement(settings.root, global.document);
    if (!root) throw new Error(`LocalizedMotion could not find root: ${String(settings.root)}`);

    const pauseOwner = resolveElement(settings.pauseOwnerSelector, global.document) || root;
    const reducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = global.matchMedia("(pointer: fine)");
    const abortController = new AbortController();
    const signal = abortController.signal;
    const bodies = [];
    let frame = 0;
    let previousFrameTime = 0;
    let accumulator = 0;
    let geometryDirty = true;
    let manuallyPaused = false;
    let destroyed = false;
    let selectedBody = null;
    const pointer = { active: false, x: 0, y: 0, type: "mouse" };

    function makeBody(element) {
      const body = {
        element,
        room: element.closest(settings.roomSelector),
        rect: null,
        centerX: 0,
        centerY: 0,
        x: makeAxis(),
        y: makeAxis(),
        rotation: makeAxis(),
        radius: datasetNumber(element, "motionRadius", settings.radius, 32, 240),
        maxX: datasetNumber(element, "motionMaxX", settings.maxX, 0, HARD_LIMITS.x),
        maxY: datasetNumber(element, "motionMaxY", settings.maxY, 0, HARD_LIMITS.y),
        maxRotate: datasetNumber(element, "motionMaxRotate", settings.maxRotate, 0, HARD_LIMITS.rotation),
        stiffness: datasetNumber(element, "motionStiffness", settings.stiffness, 40, 400),
        damping: datasetNumber(element, "motionDamping", settings.damping, 8, 80),
        prior: {
          translate: element.style.translate,
          rotate: element.style.rotate,
          willChange: element.style.willChange,
          motionX: element.style.getPropertyValue("--motion-x"),
          motionY: element.style.getPropertyValue("--motion-y"),
          motionR: element.style.getPropertyValue("--motion-r"),
        },
      };
      element.dataset.motionOwned = "phrase";
      element.dataset.motionRegistered = "true";
      element.style.willChange = "translate, rotate";
      render(body);
      return body;
    }

    function roomIsActive(body) {
      if (!body.room) return true;
      return body.room.matches(settings.activeRoomSelector)
        && !body.room.hasAttribute("inert")
        && body.room.getAttribute("aria-hidden") !== "true";
    }

    function isPaused() {
      return manuallyPaused
        || reducedMotion.matches
        || !finePointer.matches
        || global.document.hidden
        || pauseOwner.classList.contains(settings.pausedClass);
    }

    function measure(body) {
      if (body.rect && !geometryDirty) return;
      const measured = body.element.getBoundingClientRect();
      body.rect = {
        left: measured.left - body.x.position,
        right: measured.right - body.x.position,
        top: measured.top - body.y.position,
        bottom: measured.bottom - body.y.position,
        width: measured.width,
        height: measured.height,
      };
      body.centerX = (body.rect.left + body.rect.right) / 2;
      body.centerY = (body.rect.top + body.rect.bottom) / 2;
    }

    function zeroTarget(body) {
      body.x.target = 0;
      body.y.target = 0;
      body.rotation.target = 0;
      body.element.removeAttribute("data-motion-active");
    }

    function setTargets() {
      selectedBody = null;
      if (!pointer.active || isPaused()) {
        bodies.forEach(zeroTarget);
        return;
      }

      let closestDistance = Infinity;
      for (const body of bodies) {
        if (!roomIsActive(body)) {
          zeroTarget(body);
          continue;
        }
        measure(body);
        const distance = rectDistance(pointer.x, pointer.y, body.rect);
        if (distance <= body.radius && distance < closestDistance) {
          closestDistance = distance;
          selectedBody = body;
        }
      }
      geometryDirty = false;

      for (const body of bodies) {
        if (body !== selectedBody) {
          zeroTarget(body);
          continue;
        }

        const distance = rectDistance(pointer.x, pointer.y, body.rect);
        const proximity = 1 - clamp(distance / body.radius, 0, 1);
        const strength = proximity * proximity * (3 - 2 * proximity);
        let awayX = body.centerX - pointer.x;
        let awayY = body.centerY - pointer.y;
        let magnitude = length(awayX, awayY);
        if (magnitude < 0.001) {
          awayX = 1;
          awayY = -0.25;
          magnitude = length(awayX, awayY);
        }
        const horizontal = clamp((pointer.x - body.centerX) / Math.max(body.rect.width / 2, 1), -1, 1);
        body.x.target = clamp((awayX / magnitude) * body.maxX * strength, -body.maxX, body.maxX);
        body.y.target = clamp((awayY / magnitude) * body.maxY * strength, -body.maxY, body.maxY);
        body.rotation.target = clamp(-horizontal * body.maxRotate * strength, -body.maxRotate, body.maxRotate);
        body.element.dataset.motionActive = "true";
      }
    }

    function advance(axis, stiffness, damping, dt, limit) {
      const acceleration = stiffness * (axis.target - axis.position) - damping * axis.velocity;
      axis.velocity += acceleration * dt;
      axis.position = clamp(axis.position + axis.velocity * dt, -limit, limit);
      if (Math.abs(axis.position - axis.target) <= settings.settlePosition
        && Math.abs(axis.velocity) <= settings.settleVelocity) {
        axis.position = axis.target;
        axis.velocity = 0;
      }
    }

    function settled(axis) {
      return Math.abs(axis.position - axis.target) <= settings.settlePosition
        && Math.abs(axis.velocity) <= settings.settleVelocity;
    }

    function bodyIsSettled(body) {
      return settled(body.x) && settled(body.y) && settled(body.rotation);
    }

    function render(body) {
      const x = Math.abs(body.x.position) < 0.0005 ? 0 : clamp(body.x.position, -body.maxX, body.maxX);
      const y = Math.abs(body.y.position) < 0.0005 ? 0 : clamp(body.y.position, -body.maxY, body.maxY);
      const rotation = Math.abs(body.rotation.position) < 0.0005
        ? 0
        : clamp(body.rotation.position, -body.maxRotate, body.maxRotate);
      const xValue = `${x.toFixed(3)}px`;
      const yValue = `${y.toFixed(3)}px`;
      const rotationValue = `${rotation.toFixed(3)}deg`;
      body.element.style.setProperty("--motion-x", xValue);
      body.element.style.setProperty("--motion-y", yValue);
      body.element.style.setProperty("--motion-r", rotationValue);
      body.element.style.translate = `${xValue} ${yValue}`;
      body.element.style.rotate = rotationValue;
    }

    function stopFrame() {
      if (frame) global.cancelAnimationFrame(frame);
      frame = 0;
      previousFrameTime = 0;
      accumulator = 0;
    }

    function reset(immediate = true) {
      selectedBody = null;
      pointer.active = false;
      for (const body of bodies) {
        zeroTarget(body);
        if (immediate) {
          for (const axis of [body.x, body.y, body.rotation]) {
            axis.position = 0;
            axis.velocity = 0;
          }
          render(body);
        }
      }
      if (immediate) stopFrame();
      else requestTick();
    }

    function tick(timestamp) {
      frame = 0;
      if (destroyed || isPaused()) {
        reset(true);
        return;
      }

      const frameDelta = previousFrameTime
        ? clamp((timestamp - previousFrameTime) / 1000, 0, settings.maxFrameDelta)
        : settings.fixedStep;
      previousFrameTime = timestamp;
      accumulator = Math.min(accumulator + frameDelta, settings.fixedStep * settings.maxSubSteps);

      let steps = 0;
      while (accumulator >= settings.fixedStep && steps < settings.maxSubSteps) {
        for (const body of bodies) {
          if (!roomIsActive(body)) continue;
          advance(body.x, body.stiffness, body.damping, settings.fixedStep, body.maxX);
          advance(body.y, body.stiffness, body.damping, settings.fixedStep, body.maxY);
          advance(body.rotation, body.stiffness, body.damping, settings.fixedStep, body.maxRotate);
        }
        accumulator -= settings.fixedStep;
        steps += 1;
      }

      let hasWork = false;
      for (const body of bodies) {
        if (!roomIsActive(body)) continue;
        render(body);
        if (!bodyIsSettled(body)) hasWork = true;
      }

      // A stationary pointer may leave a non-zero target. Once the spring has
      // reached it, sleep; the next pointer event starts a fresh frame.
      if (hasWork) frame = global.requestAnimationFrame(tick);
      else {
        previousFrameTime = 0;
        accumulator = 0;
        dispatch("settled");
      }
    }

    function requestTick() {
      if (!frame && !destroyed && !isPaused()) frame = global.requestAnimationFrame(tick);
    }

    function handlePointerMove(event) {
      if (event.pointerType === "touch" || isPaused()) return;
      pointer.active = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.type = event.pointerType || "mouse";
      setTargets();
      requestTick();
    }

    function handlePointerExit() {
      pointer.active = false;
      selectedBody = null;
      bodies.forEach(zeroTarget);
      requestTick();
    }

    function dispatch(name, detail = {}) {
      root.dispatchEvent(new CustomEvent(`localized-motion:${name}`, {
        detail: { version: VERSION, ...detail },
      }));
    }

    function restoreBody(body) {
      const { element, prior } = body;
      delete element.dataset.motionOwned;
      delete element.dataset.motionRegistered;
      element.removeAttribute("data-motion-active");
      element.style.translate = prior.translate;
      element.style.rotate = prior.rotate;
      element.style.willChange = prior.willChange;
      [["--motion-x", prior.motionX], ["--motion-y", prior.motionY], ["--motion-r", prior.motionR]]
        .forEach(([property, value]) => value
          ? element.style.setProperty(property, value)
          : element.style.removeProperty(property));
    }

    function register() {
      for (let index = bodies.length - 1; index >= 0; index -= 1) {
        if (root.contains(bodies[index].element)) continue;
        restoreBody(bodies[index]);
        bodies.splice(index, 1);
      }
      root.querySelectorAll(settings.lineSelector).forEach((element) => {
        if (!bodies.some((body) => body.element === element)) bodies.push(makeBody(element));
      });
      geometryDirty = true;
    }

    function syncEnvironment() {
      geometryDirty = true;
      selectedBody = null;
      pointer.active = false;
      if (isPaused()) reset(true);
      else {
        bodies.filter((body) => !roomIsActive(body)).forEach((body) => {
          zeroTarget(body);
          for (const axis of [body.x, body.y, body.rotation]) {
            axis.position = 0;
            axis.velocity = 0;
          }
          render(body);
        });
        requestTick();
      }
      dispatch("environment", { paused: isPaused(), reduced: reducedMotion.matches, hidden: global.document.hidden });
    }

    function refresh() {
      if (destroyed) return false;
      register();
      syncEnvironment();
      return true;
    }

    function setPaused(value) {
      if (destroyed) return false;
      manuallyPaused = Boolean(value);
      syncEnvironment();
      return true;
    }

    function getDiagnostics() {
      return {
        version: VERSION,
        destroyed,
        paused: isPaused(),
        reducedMotion: reducedMotion.matches,
        finePointer: finePointer.matches,
        pointer: { ...pointer },
        selectedLine: selectedBody?.element || null,
        lines: bodies.length,
        fixtures: 0,
        activeBodies: bodies.filter(roomIsActive).length,
        running: Boolean(frame),
      };
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      stopFrame();
      abortController.abort();
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      removeMediaListener(reducedMotion, syncEnvironment);
      removeMediaListener(finePointer, syncEnvironment);
      bodies.forEach(restoreBody);
      bodies.length = 0;
      selectedBody = null;
      dispatch("destroyed");
    }

    function addMediaListener(query, listener) {
      if (query.addEventListener) query.addEventListener("change", listener, { signal });
      else query.addListener?.(listener);
    }

    function removeMediaListener(query, listener) {
      if (!query.addEventListener) query.removeListener?.(listener);
    }

    root.addEventListener("pointermove", handlePointerMove, { passive: true, signal });
    root.addEventListener("pointerleave", handlePointerExit, { passive: true, signal });
    root.addEventListener("pointercancel", handlePointerExit, { passive: true, signal });
    global.addEventListener("blur", handlePointerExit, { passive: true, signal });
    global.addEventListener("resize", () => { geometryDirty = true; }, { passive: true, signal });
    global.addEventListener("scroll", () => { geometryDirty = true; }, { passive: true, capture: true, signal });
    global.document.addEventListener("visibilitychange", syncEnvironment, { signal });
    addMediaListener(reducedMotion, syncEnvironment);
    addMediaListener(finePointer, syncEnvironment);

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => { geometryDirty = true; })
      : null;
    resizeObserver?.observe(root);

    const mutationObserver = typeof MutationObserver === "function"
      ? new MutationObserver((records) => {
        if (records.some((record) => record.target === pauseOwner
          || record.target.matches?.(settings.roomSelector))) syncEnvironment();
      })
      : null;
    mutationObserver?.observe(pauseOwner, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class", "inert", "aria-hidden"],
    });

    register();
    syncEnvironment();

    const controller = Object.freeze({
      version: VERSION,
      root,
      destroy,
      refresh,
      reset: () => reset(true),
      setPaused,
      isPaused,
      getDiagnostics,
    });
    dispatch("ready", { controller, lines: bodies.length, fixtures: 0 });
    return controller;
  }

  const api = Object.freeze({ VERSION, DEFAULTS, create });
  global.LocalizedMotion = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
