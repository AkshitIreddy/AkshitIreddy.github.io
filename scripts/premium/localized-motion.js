/*
 * Localized Motion
 * ----------------
 * A component-owned pointer response engine for the museum portfolio.
 *
 * The engine intentionally never transforms a room, layout column, or generic
 * `.room__layer`. It writes independent `translate` / `rotate` properties and
 * diagnostic CSS custom properties only to explicitly registered thesis lines
 * and physical fixtures. This keeps layout stable while preserving expressive,
 * interruptible motion.
 *
 * Classic-script usage:
 *   const motion = LocalizedMotion.create({ root: ".museum-stage" });
 *
 * Authored hooks:
 *   <h1 data-motion-thesis>
 *     <span data-motion-line>I make software</span>
 *     <span data-motion-line>that refuses to</span>
 *   </h1>
 *   <span data-motion-fixture data-motion-mode="pendulum">...</span>
 */
(function bootstrapLocalizedMotion(global) {
  "use strict";

  const VERSION = "1.0.0";
  const DEFAULTS = Object.freeze({
    root: ".museum-stage",
    roomSelector: ".room",
    activeRoomSelector: ".room.is-current",
    lineSelector: "[data-motion-thesis] [data-motion-line], [data-restless-thesis] .thesis-line",
    fixtureSelector: "[data-motion-fixture]",
    pauseOwnerSelector: ".museum-shell",
    pausedClass: "is-motion-paused",
    fixedStep: 1 / 120,
    maxFrameDelta: 1 / 20,
    maxSubSteps: 8,
    settlePosition: 0.018,
    settleVelocity: 0.035,
    lineRadius: 138,
    lineSwitchHysteresis: 16,
    lineMaxX: 8,
    lineMaxY: 5,
    lineMaxRotate: 0.75,
    lineStiffness: 255,
    lineDamping: 28,
    fixtureRadius: 126,
    fixtureCollisionRadius: 30,
    fixtureMaxX: 20,
    fixtureMaxY: 15,
    fixtureMaxRotate: 8,
    fixtureStiffness: 145,
    fixtureDamping: 17,
    fixtureMass: 1,
    fixtureRestitution: 0.24,
    fixtureCollisionDebounce: 44,
    velocitySmoothing: 0.32,
    maximumPointerSpeed: 2200,
    pointerVelocityCoupling: 0.0055,
    collisionImpulse: 0.016,
    angularImpulse: 0.0045,
    useIndividualTransforms: true,
    debug: false,
  });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const hypot = (x, y) => Math.sqrt(x * x + y * y);
  const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / Math.max(edge1 - edge0, 0.00001), 0, 1);
    return t * t * (3 - 2 * t);
  };

  function numberFromDataset(element, key, fallback, minimum = -Infinity, maximum = Infinity) {
    const value = Number(element.dataset[key]);
    return clamp(finite(value, fallback), minimum, maximum);
  }

  function resolveElement(value, scope) {
    if (value && value.nodeType === 1) return value;
    if (typeof value === "string") return scope.querySelector(value);
    return null;
  }

  function pointToRectDistance(x, y, rect) {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    return hypot(dx, dy);
  }

  function centerOf(rect) {
    return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  }

  function closestPointOnSegment(pointX, pointY, startX, startY, endX, endY) {
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    const projection = lengthSquared > 0.0001
      ? clamp(((pointX - startX) * segmentX + (pointY - startY) * segmentY) / lengthSquared, 0, 1)
      : 1;
    return {
      x: startX + segmentX * projection,
      y: startY + segmentY * projection,
    };
  }

  function segmentCircleEntry(startX, startY, endX, endY, centerX, centerY, radius) {
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const offsetX = startX - centerX;
    const offsetY = startY - centerY;
    const a = segmentX * segmentX + segmentY * segmentY;
    const c = offsetX * offsetX + offsetY * offsetY - radius * radius;
    // Starting inside is not a new collision. Waiting for an outside-to-inside
    // crossing prevents a retreating pointer from injecting energy.
    if (a < 0.0001 || c <= 0) return null;
    const b = 2 * (offsetX * segmentX + offsetY * segmentY);
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    const time = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (time < 0 || time > 1) return null;
    return {
      x: startX + segmentX * time,
      y: startY + segmentY * time,
      time,
    };
  }

  function makeAxis() {
    return { position: 0, velocity: 0, target: 0 };
  }

  function makeBody(element, kind, settings) {
    const body = {
      element,
      kind,
      collider: element.dataset.motionCollider ? element.querySelector(element.dataset.motionCollider) : element,
      room: element.closest(settings.roomSelector),
      x: makeAxis(),
      y: makeAxis(),
      rotation: makeAxis(),
      rect: null,
      center: { x: 0, y: 0 },
      geometryAt: -Infinity,
      influenced: false,
      lastDistance: Infinity,
      lastPenetration: 0,
      lastImpactAt: -Infinity,
      lastCollisionSample: -1,
      collisionVisualUntil: -Infinity,
      priorInline: {
        translate: element.style.translate,
        rotate: element.style.rotate,
        willChange: element.style.willChange,
        motionX: element.style.getPropertyValue("--motion-x"),
        motionY: element.style.getPropertyValue("--motion-y"),
        motionR: element.style.getPropertyValue("--motion-r"),
        motionEnergy: element.style.getPropertyValue("--motion-energy"),
      },
    };

    if (kind === "line") {
      Object.assign(body, {
        radius: numberFromDataset(element, "motionRadius", settings.lineRadius, 24, 520),
        maxX: numberFromDataset(element, "motionMaxX", settings.lineMaxX, 0, 64),
        maxY: numberFromDataset(element, "motionMaxY", settings.lineMaxY, 0, 48),
        maxRotate: numberFromDataset(element, "motionMaxRotate", settings.lineMaxRotate, 0, 8),
        stiffness: numberFromDataset(element, "motionStiffness", settings.lineStiffness, 20, 1200),
        damping: numberFromDataset(element, "motionDamping", settings.lineDamping, 1, 140),
        mass: numberFromDataset(element, "motionMass", 1, 0.1, 20),
        polarity: element.dataset.motionPolarity === "attract" ? -1 : 1,
        velocityCoupling: numberFromDataset(element, "motionVelocityCoupling", 0.0016, 0, 0.04),
        restitution: 0.08,
        mode: "line",
      });
    } else {
      const mode = element.dataset.motionMode || "pendulum";
      const radius = numberFromDataset(element, "motionRadius", settings.fixtureRadius, 30, 640);
      const collisionRadius = numberFromDataset(element, "motionCollision", settings.fixtureCollisionRadius, 6, radius);
      Object.assign(body, {
        radius,
        collisionRadius,
        maxX: numberFromDataset(element, "motionMaxX", settings.fixtureMaxX, 0, 120),
        maxY: numberFromDataset(element, "motionMaxY", settings.fixtureMaxY, 0, 120),
        maxRotate: numberFromDataset(element, "motionMaxRotate", settings.fixtureMaxRotate, 0, 35),
        stiffness: numberFromDataset(element, "motionStiffness", settings.fixtureStiffness, 12, 900),
        damping: numberFromDataset(element, "motionDamping", settings.fixtureDamping, 0.5, 100),
        mass: numberFromDataset(element, "motionMass", settings.fixtureMass, 0.12, 30),
        polarity: element.dataset.motionPolarity === "attract" ? -1 : 1,
        velocityCoupling: numberFromDataset(element, "motionVelocityCoupling", settings.pointerVelocityCoupling, 0, 0.06),
        collisionImpulse: numberFromDataset(element, "motionCollisionImpulse", settings.collisionImpulse, 0, 0.2),
        angularImpulse: numberFromDataset(element, "motionAngularImpulse", settings.angularImpulse, 0, 0.1),
        collisionDebounce: numberFromDataset(element, "motionCollisionDebounce", settings.fixtureCollisionDebounce, 16, 180),
        restitution: numberFromDataset(element, "motionRestitution", settings.fixtureRestitution, 0, 0.9),
        mode,
      });
    }

    element.dataset.motionOwned = kind;
    element.style.willChange = "translate, rotate";
    return body;
  }

  function refreshGeometry(body, now, force = false) {
    // Do not periodically remeasure a moving body: getBoundingClientRect includes
    // its current transform, which would make the proximity field chase the
    // animation and introduce feedback jitter. Resize, scroll, room changes and
    // explicit refreshes mark geometry dirty and force the uncommon remeasure.
    if (!force && body.rect) return;
    const measured = (body.collider || body.element).getBoundingClientRect();
    body.rect = {
      top: measured.top - body.y.position,
      right: measured.right - body.x.position,
      bottom: measured.bottom - body.y.position,
      left: measured.left - body.x.position,
      width: measured.width,
      height: measured.height,
    };
    body.center = centerOf(body.rect);
    body.geometryAt = now;
  }

  function springAxis(axis, stiffness, damping, mass, dt) {
    // Closed-form damped harmonic integration. Unlike a variable-frame lerp or
    // explicit Euler, this remains stable across under-, critical-, and
    // over-damped authored parameters. Fixed stepping still makes collisions and
    // target changes deterministic across display refresh rates.
    const omega = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    const displacement = axis.position - axis.target;
    const velocity = axis.velocity;
    let nextDisplacement;
    let nextVelocity;

    if (zeta < 1 - 0.0001) {
      const dampedOmega = omega * Math.sqrt(1 - zeta * zeta);
      const decay = Math.exp(-zeta * omega * dt);
      const cosine = Math.cos(dampedOmega * dt);
      const sine = Math.sin(dampedOmega * dt);
      const a = displacement;
      const b = (velocity + zeta * omega * displacement) / dampedOmega;
      const oscillation = a * cosine + b * sine;
      nextDisplacement = decay * oscillation;
      nextVelocity = decay * (
        -zeta * omega * oscillation
        + (-a * dampedOmega * sine + b * dampedOmega * cosine)
      );
    } else if (zeta > 1 + 0.0001) {
      const root = Math.sqrt(zeta * zeta - 1);
      const rateA = -omega * (zeta - root);
      const rateB = -omega * (zeta + root);
      const coefficientA = (velocity - rateB * displacement) / (rateA - rateB);
      const coefficientB = displacement - coefficientA;
      const decayA = Math.exp(rateA * dt);
      const decayB = Math.exp(rateB * dt);
      nextDisplacement = coefficientA * decayA + coefficientB * decayB;
      nextVelocity = coefficientA * rateA * decayA + coefficientB * rateB * decayB;
    } else {
      const decay = Math.exp(-omega * dt);
      const a = displacement;
      const b = velocity + omega * displacement;
      nextDisplacement = (a + b * dt) * decay;
      nextVelocity = (b - omega * (a + b * dt)) * decay;
    }

    axis.position = axis.target + finite(nextDisplacement, 0);
    axis.velocity = finite(nextVelocity, 0);
  }

  function containAxis(axis, limit, restitution) {
    if (limit <= 0) {
      axis.position = 0;
      axis.velocity = 0;
      return;
    }
    if (axis.position > limit) {
      axis.position = limit;
      if (axis.velocity > 0) axis.velocity *= -restitution;
    } else if (axis.position < -limit) {
      axis.position = -limit;
      if (axis.velocity < 0) axis.velocity *= -restitution;
    }
  }

  function isAxisSettled(axis, settings) {
    return Math.abs(axis.position - axis.target) <= settings.settlePosition
      && Math.abs(axis.velocity) <= settings.settleVelocity;
  }

  function bodyEnergy(body) {
    return clamp((hypot(body.x.velocity, body.y.velocity) + Math.abs(body.rotation.velocity) * 0.35) / 220, 0, 1);
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
    const lines = [];
    const fixtures = [];
    const bodies = [];
    const visibleRooms = new WeakMap();
    const markedRoomActivity = new WeakMap();
    const observedRooms = new Set();
    let selectedLine = null;
    let frame = 0;
    let previousFrameTime = 0;
    let accumulator = 0;
    let manuallyPaused = false;
    let destroyed = false;
    let geometryDirty = true;

    const pointer = {
      active: false,
      id: null,
      type: "mouse",
      x: 0,
      y: 0,
      fromX: 0,
      fromY: 0,
      previousX: 0,
      previousY: 0,
      time: 0,
      activityAt: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      motionVx: 0,
      motionVy: 0,
      motionSpeed: 0,
      sampleIndex: 0,
    };

    function register() {
      root.querySelectorAll(settings.lineSelector).forEach((element) => {
        if (element.dataset.motionRegistered === "true") return;
        const body = makeBody(element, "line", settings);
        element.dataset.motionRegistered = "true";
        lines.push(body);
        bodies.push(body);
      });

      root.querySelectorAll(settings.fixtureSelector).forEach((element) => {
        if (element.dataset.motionRegistered === "true") return;
        const body = makeBody(element, "fixture", settings);
        element.dataset.motionRegistered = "true";
        fixtures.push(body);
        bodies.push(body);
      });
      geometryDirty = true;
    }

    function reconcileRegistrations() {
      for (let index = bodies.length - 1; index >= 0; index -= 1) {
        const body = bodies[index];
        if (root.contains(body.element)) continue;
        restoreBody(body);
        bodies.splice(index, 1);
        const collection = body.kind === "line" ? lines : fixtures;
        const collectionIndex = collection.indexOf(body);
        if (collectionIndex >= 0) collection.splice(collectionIndex, 1);
      }
      register();
      reconcileRooms();
    }

    function roomIsActive(body) {
      if (!body.room) return true;
      const markedActive = body.room.matches(settings.activeRoomSelector)
        && !body.room.hasAttribute("inert")
        && body.room.getAttribute("aria-hidden") !== "true";
      return markedActive && visibleRooms.get(body.room) !== false;
    }

    function inferredPaused() {
      return manuallyPaused
        || reducedMotion.matches
        || !finePointer.matches
        || global.document.hidden
        || pauseOwner.classList.contains(settings.pausedClass);
    }

    function zeroTargets(body) {
      body.x.target = 0;
      body.y.target = 0;
      body.rotation.target = 0;
      body.influenced = false;
    }

    function resetBody(body, immediate = false) {
      zeroTargets(body);
      body.lastDistance = Infinity;
      body.lastPenetration = 0;
      body.lastImpactAt = -Infinity;
      body.lastCollisionSample = -1;
      body.collisionVisualUntil = -Infinity;
      if (immediate) {
        body.x.position = body.x.velocity = 0;
        body.y.position = body.y.velocity = 0;
        body.rotation.position = body.rotation.velocity = 0;
        renderBody(body);
      }
      body.element.removeAttribute("data-motion-active");
      body.element.removeAttribute("data-motion-colliding");
    }

    function resetAll(immediate = false) {
      selectedLine = null;
      bodies.forEach((body) => resetBody(body, immediate));
      if (!immediate) requestTick();
    }

    function updatePointer(event) {
      const now = finite(event.timeStamp, global.performance.now());
      if (!pointer.active || pointer.id !== event.pointerId) {
        pointer.previousX = event.clientX;
        pointer.previousY = event.clientY;
        pointer.time = now;
        pointer.vx = 0;
        pointer.vy = 0;
        pointer.fromX = event.clientX;
        pointer.fromY = event.clientY;
      } else {
        pointer.fromX = pointer.x;
        pointer.fromY = pointer.y;
      }

      const elapsed = clamp((now - pointer.time) / 1000, 1 / 240, 0.08);
      const rawVx = clamp((event.clientX - pointer.previousX) / elapsed, -settings.maximumPointerSpeed, settings.maximumPointerSpeed);
      const rawVy = clamp((event.clientY - pointer.previousY) / elapsed, -settings.maximumPointerSpeed, settings.maximumPointerSpeed);
      pointer.vx = lerp(pointer.vx, rawVx, settings.velocitySmoothing);
      pointer.vy = lerp(pointer.vy, rawVy, settings.velocitySmoothing);
      pointer.speed = hypot(pointer.vx, pointer.vy);
      pointer.previousX = event.clientX;
      pointer.previousY = event.clientY;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.time = now;
      pointer.activityAt = global.performance.now();
      pointer.id = event.pointerId;
      pointer.type = event.pointerType || "mouse";
      pointer.active = true;
      pointer.sampleIndex += 1;
    }

    function updateEffectivePointerVelocity(now) {
      // Event velocity is an impulse sample, not a persistent force. Fade it
      // rapidly after the final sample so a stationary cursor cannot leave an
      // actor leaning in the direction it used to travel.
      const age = Math.max(now - pointer.activityAt, 0);
      const retention = Math.exp(-age / 52);
      pointer.motionVx = pointer.vx * retention;
      pointer.motionVy = pointer.vy * retention;
      pointer.motionSpeed = hypot(pointer.motionVx, pointer.motionVy);
    }

    function chooseLine(now) {
      let best = null;
      let bestScore = Infinity;
      for (const line of lines) {
        if (!roomIsActive(line)) continue;
        refreshGeometry(line, now, geometryDirty);
        const distance = pointToRectDistance(pointer.x, pointer.y, line.rect);
        if (distance > line.radius) continue;
        const centerDistance = hypot(pointer.x - line.center.x, pointer.y - line.center.y);
        const score = distance + centerDistance * 0.055;
        if (score < bestScore) {
          best = line;
          bestScore = score;
        }
      }

      if (selectedLine && best && selectedLine !== best && roomIsActive(selectedLine)) {
        refreshGeometry(selectedLine, now, geometryDirty);
        const retainedDistance = pointToRectDistance(pointer.x, pointer.y, selectedLine.rect);
        const retainedCenterDistance = hypot(pointer.x - selectedLine.center.x, pointer.y - selectedLine.center.y);
        const retainedScore = retainedDistance + retainedCenterDistance * 0.055;
        if (retainedDistance <= selectedLine.radius && retainedScore <= bestScore + settings.lineSwitchHysteresis) {
          return selectedLine;
        }
      }
      return best;
    }

    function influenceLine(line) {
      const distance = pointToRectDistance(pointer.x, pointer.y, line.rect);
      const strength = 1 - smoothstep(0, line.radius, distance);
      let dx = line.center.x - pointer.x;
      let dy = line.center.y - pointer.y;
      let length = hypot(dx, dy);
      if (length < 0.001) {
        dx = pointer.motionVx === 0 ? 1 : -pointer.motionVx;
        dy = pointer.motionVy === 0 ? -0.35 : -pointer.motionVy;
        length = Math.max(hypot(dx, dy), 1);
      }
      const nx = dx / length;
      const ny = dy / length;
      const kineticX = clamp(-pointer.motionVx * line.velocityCoupling, -line.maxX * 0.35, line.maxX * 0.35);
      const kineticY = clamp(-pointer.motionVy * line.velocityCoupling, -line.maxY * 0.35, line.maxY * 0.35);
      line.x.target = clamp((nx * line.maxX * strength + kineticX * strength) * line.polarity, -line.maxX, line.maxX);
      line.y.target = clamp((ny * line.maxY * strength + kineticY * strength) * line.polarity, -line.maxY, line.maxY);
      const horizontal = clamp((pointer.x - line.center.x) / Math.max(line.rect.width * 0.5, 1), -1, 1);
      line.rotation.target = clamp((-horizontal * line.maxRotate + pointer.motionVx * 0.00012) * strength, -line.maxRotate, line.maxRotate);
      line.influenced = true;
      line.element.dataset.motionActive = "true";
    }

    function fixtureNormal(fixture) {
      const physicalX = fixture.center.x + fixture.x.position;
      const physicalY = fixture.center.y + fixture.y.position;
      let dx = physicalX - pointer.x;
      let dy = physicalY - pointer.y;
      let distance = hypot(dx, dy);
      if (distance < 0.001) {
        dx = pointer.motionVx === 0 ? 1 : -pointer.motionVx;
        dy = pointer.motionVy === 0 ? 0 : -pointer.motionVy;
        distance = Math.max(hypot(dx, dy), 1);
      }
      return { x: dx / distance, y: dy / distance, distance };
    }

    function collideFixture(fixture, now) {
      const physicalX = fixture.center.x + fixture.x.position;
      const physicalY = fixture.center.y + fixture.y.position;
      const closest = closestPointOnSegment(
        physicalX,
        physicalY,
        pointer.fromX,
        pointer.fromY,
        pointer.x,
        pointer.y,
      );
      const entry = segmentCircleEntry(
        pointer.fromX,
        pointer.fromY,
        pointer.x,
        pointer.y,
        physicalX,
        physicalY,
        fixture.collisionRadius,
      );
      const closestDistance = hypot(physicalX - closest.x, physicalY - closest.y);
      let normalX = entry ? physicalX - entry.x : 0;
      let normalY = entry ? physicalY - entry.y : 0;
      const normalLength = hypot(normalX, normalY);
      if (normalLength > 0.0001) {
        normalX /= normalLength;
        normalY /= normalLength;
      }
      const penetration = Math.max(fixture.collisionRadius - closestDistance, 0);
      const isNewCollisionSample = fixture.lastCollisionSample !== pointer.sampleIndex;
      // Every fixture consumes each input sample exactly once. RAF ticks may
      // continue the spring but can never replay a stale swept segment.
      if (isNewCollisionSample) fixture.lastCollisionSample = pointer.sampleIndex;
      const canImpact = Boolean(entry)
        && isNewCollisionSample
        && now - fixture.lastImpactAt >= fixture.collisionDebounce;
      if (canImpact) {
        const projectedSpeed = Math.max(pointer.motionVx * normalX + pointer.motionVy * normalY, 0);
        const normalSpeed = Math.max(projectedSpeed, pointer.motionSpeed * 0.18);
        const impulse = Math.min(
          normalSpeed * fixture.collisionImpulse + penetration * 1.15,
          860,
        ) / fixture.mass;
        fixture.x.velocity += normalX * impulse;
        fixture.y.velocity += normalY * impulse;

        // Tangential pointer travel produces torque around the fixture center.
        const tangentSpeed = pointer.motionVx * -normalY + pointer.motionVy * normalX;
        fixture.rotation.velocity += clamp(tangentSpeed * fixture.angularImpulse, -85, 85) / fixture.mass;
        fixture.lastImpactAt = now;
        fixture.collisionVisualUntil = now + 110;
        fixture.influenced = true;
        fixture.element.dataset.motionActive = "true";
        fixture.element.dataset.motionColliding = "true";
      } else if (now >= fixture.collisionVisualUntil) {
        fixture.element.removeAttribute("data-motion-colliding");
      }
      fixture.lastPenetration = penetration;
      return canImpact;
    }

    function influenceFixture(fixture, now) {
      const normal = fixtureNormal(fixture);
      const strength = 1 - smoothstep(fixture.collisionRadius * 0.35, fixture.radius, normal.distance);
      const collided = collideFixture(fixture, now);
      if (normal.distance > fixture.radius) {
        zeroTargets(fixture);
        if (collided) fixture.influenced = true;
        fixture.lastDistance = normal.distance;
        fixture.lastPenetration = 0;
        if (!collided) fixture.element.removeAttribute("data-motion-active");
        return;
      }

      const velocityX = clamp(pointer.motionVx * fixture.velocityCoupling, -fixture.maxX * 0.58, fixture.maxX * 0.58);
      const velocityY = clamp(pointer.motionVy * fixture.velocityCoupling, -fixture.maxY * 0.58, fixture.maxY * 0.58);
      const direction = fixture.polarity;
      fixture.x.target = clamp((normal.x * fixture.maxX * strength + velocityX * 0.45) * direction, -fixture.maxX, fixture.maxX);
      fixture.y.target = clamp((normal.y * fixture.maxY * strength + velocityY * 0.45) * direction, -fixture.maxY, fixture.maxY);

      const lever = clamp((pointer.x - fixture.center.x) / Math.max(fixture.rect.width * 0.5, fixture.collisionRadius), -1.5, 1.5);
      const pendulumBias = fixture.mode === "pendulum" ? -lever : lever * -0.55;
      fixture.rotation.target = clamp(
        pendulumBias * fixture.maxRotate * strength + pointer.motionVx * 0.00045 * strength,
        -fixture.maxRotate,
        fixture.maxRotate,
      );
      fixture.influenced = true;
      fixture.element.dataset.motionActive = "true";
      fixture.lastDistance = normal.distance;
    }

    function evaluateFields(now) {
      if (!pointer.active || inferredPaused()) {
        bodies.forEach(zeroTargets);
        return;
      }

      updateEffectivePointerVelocity(now);

      selectedLine = chooseLine(now);
      lines.forEach((line) => {
        if (line === selectedLine && roomIsActive(line)) influenceLine(line);
        else {
          zeroTargets(line);
          line.element.removeAttribute("data-motion-active");
        }
      });
      fixtures.forEach((fixture) => {
        if (roomIsActive(fixture)) {
          refreshGeometry(fixture, now, geometryDirty);
          influenceFixture(fixture, now);
        } else {
          zeroTargets(fixture);
        }
      });
      geometryDirty = false;
    }

    function advanceBody(body, dt) {
      springAxis(body.x, body.stiffness, body.damping, body.mass, dt);
      springAxis(body.y, body.stiffness, body.damping, body.mass, dt);
      springAxis(body.rotation, body.stiffness * 0.72, body.damping * 0.9, body.mass, dt);
      containAxis(body.x, body.maxX, body.restitution);
      containAxis(body.y, body.maxY, body.restitution);
      containAxis(body.rotation, body.maxRotate, body.restitution);
    }

    function renderBody(body) {
      const x = Math.abs(body.x.position) < 0.0005 ? 0 : body.x.position;
      const y = Math.abs(body.y.position) < 0.0005 ? 0 : body.y.position;
      const rotation = Math.abs(body.rotation.position) < 0.0005 ? 0 : body.rotation.position;
      const xValue = `${x.toFixed(3)}px`;
      const yValue = `${y.toFixed(3)}px`;
      const rotationValue = `${rotation.toFixed(3)}deg`;
      body.element.style.setProperty("--motion-x", xValue);
      body.element.style.setProperty("--motion-y", yValue);
      body.element.style.setProperty("--motion-r", rotationValue);
      body.element.style.setProperty("--motion-energy", bodyEnergy(body).toFixed(3));
      if (settings.useIndividualTransforms) {
        body.element.style.translate = `${xValue} ${yValue}`;
        body.element.style.rotate = rotationValue;
      }
    }

    function bodyIsSettled(body) {
      return isAxisSettled(body.x, settings)
        && isAxisSettled(body.y, settings)
        && isAxisSettled(body.rotation, settings);
    }

    function dispatchState(name, detail = {}) {
      root.dispatchEvent(new CustomEvent(`localized-motion:${name}`, {
        bubbles: false,
        detail: { version: VERSION, ...detail },
      }));
    }

    function tick(timestamp) {
      frame = 0;
      if (destroyed) return;
      if (inferredPaused()) {
        previousFrameTime = 0;
        accumulator = 0;
        if (reducedMotion.matches || !finePointer.matches) resetAll(true);
        return;
      }

      if (!previousFrameTime) previousFrameTime = timestamp;
      const frameDelta = clamp((timestamp - previousFrameTime) / 1000, 0, settings.maxFrameDelta);
      previousFrameTime = timestamp;
      accumulator = Math.min(accumulator + frameDelta, settings.fixedStep * settings.maxSubSteps);
      evaluateFields(timestamp);

      let steps = 0;
      while (accumulator >= settings.fixedStep && steps < settings.maxSubSteps) {
        bodies.forEach((body) => {
          if (roomIsActive(body)) advanceBody(body, settings.fixedStep);
        });
        accumulator -= settings.fixedStep;
        steps += 1;
      }

      let unsettled = false;
      bodies.forEach((body) => {
        if (!roomIsActive(body)) return;
        renderBody(body);
        if (!bodyIsSettled(body)) unsettled = true;
      });

      const activeField = bodies.some((body) => body.influenced && roomIsActive(body));
      if (unsettled || activeField) frame = global.requestAnimationFrame(tick);
      else {
        previousFrameTime = 0;
        accumulator = 0;
        dispatchState("settled");
      }
    }

    function requestTick() {
      if (!frame && !destroyed && !inferredPaused()) frame = global.requestAnimationFrame(tick);
    }

    function handlePointerMove(event) {
      if (event.pointerType === "touch" || inferredPaused()) return;
      const coalesced = event.getCoalescedEvents?.();
      const samples = coalesced?.length ? coalesced.slice(-8) : [event];
      samples.forEach((sample) => {
        updatePointer(sample);
        evaluateFields(global.performance.now());
      });
      requestTick();
    }

    function releasePointer() {
      pointer.active = false;
      pointer.id = null;
      pointer.vx = 0;
      pointer.vy = 0;
      pointer.speed = 0;
      pointer.motionVx = 0;
      pointer.motionVy = 0;
      pointer.motionSpeed = 0;
      selectedLine = null;
      bodies.forEach((body) => {
        zeroTargets(body);
        body.lastDistance = Infinity;
        body.lastPenetration = 0;
        body.lastImpactAt = -Infinity;
        body.lastCollisionSample = -1;
        body.collisionVisualUntil = -Infinity;
        body.element.removeAttribute("data-motion-active");
        body.element.removeAttribute("data-motion-colliding");
      });
      requestTick();
    }

    function syncEnvironment() {
      geometryDirty = true;
      if (inferredPaused()) {
        if (frame) global.cancelAnimationFrame(frame);
        frame = 0;
        previousFrameTime = 0;
        accumulator = 0;
        resetAll(true);
      } else {
        requestTick();
      }
      dispatchState("environment", {
        paused: inferredPaused(),
        reduced: reducedMotion.matches,
        finePointer: finePointer.matches,
        hidden: global.document.hidden,
      });
    }

    function kickFixture(target, impulse = {}) {
      const element = resolveElement(target, root);
      const fixture = fixtures.find((candidate) => candidate.element === element);
      if (!fixture || inferredPaused() || !roomIsActive(fixture)) return false;
      fixture.x.velocity += clamp(finite(impulse.x, 0), -900, 900) / fixture.mass;
      fixture.y.velocity += clamp(finite(impulse.y, 0), -900, 900) / fixture.mass;
      fixture.rotation.velocity += clamp(finite(impulse.rotation, 0), -180, 180) / fixture.mass;
      requestTick();
      return true;
    }

    function refresh() {
      if (destroyed) return false;
      reconcileRegistrations();
      geometryDirty = true;
      bodies.forEach((body) => refreshGeometry(body, global.performance.now(), true));
      requestTick();
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
        paused: inferredPaused(),
        reducedMotion: reducedMotion.matches,
        finePointer: finePointer.matches,
        pointer: { ...pointer },
        selectedLine: selectedLine?.element || null,
        lines: lines.length,
        fixtures: fixtures.length,
        activeBodies: bodies.filter(roomIsActive).length,
        running: Boolean(frame),
      };
    }

    function restoreBody(body) {
      const { element, priorInline } = body;
      delete element.dataset.motionOwned;
      delete element.dataset.motionRegistered;
      element.removeAttribute("data-motion-active");
      element.removeAttribute("data-motion-colliding");
      element.style.translate = priorInline.translate;
      element.style.rotate = priorInline.rotate;
      element.style.willChange = priorInline.willChange;
      const properties = [
        ["--motion-x", priorInline.motionX],
        ["--motion-y", priorInline.motionY],
        ["--motion-r", priorInline.motionR],
        ["--motion-energy", priorInline.motionEnergy],
      ];
      properties.forEach(([name, value]) => value ? element.style.setProperty(name, value) : element.style.removeProperty(name));
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame) global.cancelAnimationFrame(frame);
      frame = 0;
      abortController.abort();
      resizeObserver?.disconnect();
      roomObserver?.disconnect();
      intersectionObserver?.disconnect();
      bodies.forEach(restoreBody);
      lines.length = 0;
      fixtures.length = 0;
      bodies.length = 0;
      dispatchState("destroyed");
    }

    root.addEventListener("pointermove", handlePointerMove, { passive: true, signal });
    root.addEventListener("pointerleave", releasePointer, { passive: true, signal });
    root.addEventListener("pointercancel", releasePointer, { passive: true, signal });
    global.addEventListener("blur", releasePointer, { passive: true, signal });
    global.addEventListener("resize", () => { geometryDirty = true; }, { passive: true, signal });
    global.addEventListener("scroll", () => { geometryDirty = true; }, { passive: true, capture: true, signal });
    global.document.addEventListener("visibilitychange", syncEnvironment, { signal });
    reducedMotion.addEventListener?.("change", syncEnvironment, { signal });
    finePointer.addEventListener?.("change", syncEnvironment, { signal });

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => { geometryDirty = true; })
      : null;
    resizeObserver?.observe(root);

    let pauseClassState = pauseOwner.classList.contains(settings.pausedClass);
    const roomObserver = typeof MutationObserver === "function"
      ? new MutationObserver((records) => {
        let activityChanged = false;
        records.forEach((record) => {
          if (record.target === pauseOwner && record.attributeName === "class") {
            const nextPaused = pauseOwner.classList.contains(settings.pausedClass);
            if (nextPaused !== pauseClassState) activityChanged = true;
            pauseClassState = nextPaused;
            return;
          }
          const room = record.target;
          if (!(room instanceof Element) || !room.matches(settings.roomSelector)) return;
          const nextActive = room.matches(settings.activeRoomSelector)
            && !room.hasAttribute("inert")
            && room.getAttribute("aria-hidden") !== "true";
          if (nextActive !== markedRoomActivity.get(room)) activityChanged = true;
          markedRoomActivity.set(room, nextActive);
        });
        if (!activityChanged) return;
        releasePointer();
        geometryDirty = true;
        syncEnvironment();
      })
      : null;
    roomObserver?.observe(pauseOwner, { attributes: true, attributeFilter: ["class"] });

    const intersectionObserver = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => visibleRooms.set(entry.target, entry.isIntersecting));
        if (entries.some((entry) => !entry.isIntersecting)) {
          selectedLine = null;
          bodies.filter((body) => entries.some((entry) => entry.target === body.room && !entry.isIntersecting))
            .forEach((body) => resetBody(body, false));
        }
      }, { root, threshold: 0.02 })
      : null;

    function observeRoom(room) {
      if (observedRooms.has(room)) return;
      observedRooms.add(room);
      markedRoomActivity.set(room, room.matches(settings.activeRoomSelector)
        && !room.hasAttribute("inert")
        && room.getAttribute("aria-hidden") !== "true");
      visibleRooms.set(room, true);
      roomObserver?.observe(room, { attributes: true, attributeFilter: ["class", "inert", "aria-hidden"] });
      intersectionObserver?.observe(room);
    }

    function reconcileRooms() {
      const currentRooms = new Set(root.querySelectorAll(settings.roomSelector));
      let removedRoom = false;
      observedRooms.forEach((room) => {
        if (currentRooms.has(room)) return;
        intersectionObserver?.unobserve(room);
        observedRooms.delete(room);
        removedRoom = true;
      });
      // MutationObserver has no per-target unobserve operation. Rebind its small
      // target set only when a room was actually removed.
      if (removedRoom) {
        roomObserver?.disconnect();
        roomObserver?.observe(pauseOwner, { attributes: true, attributeFilter: ["class"] });
        observedRooms.forEach((room) => {
          roomObserver?.observe(room, { attributes: true, attributeFilter: ["class", "inert", "aria-hidden"] });
        });
      }
      currentRooms.forEach(observeRoom);
    }

    reconcileRegistrations();
    syncEnvironment();

    const controller = Object.freeze({
      version: VERSION,
      root,
      destroy,
      refresh,
      reset: () => resetAll(true),
      setPaused,
      isPaused: inferredPaused,
      kickFixture,
      getDiagnostics,
    });
    dispatchState("ready", { controller, lines: lines.length, fixtures: fixtures.length });
    return controller;
  }

  const api = Object.freeze({ VERSION, DEFAULTS, create });
  global.LocalizedMotion = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
