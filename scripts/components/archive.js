(() => {
  "use strict";

  const root = document.querySelector(".archive-cabinet-demo");
  if (!(root instanceof HTMLElement)) return;

  const tabs = [...root.querySelectorAll('[role="tab"][data-project]')];
  const panel = root.querySelector('[role="tabpanel"]');
  const video = root.querySelector("[data-cabinet-video]");
  const filmControl = root.querySelector("[data-film-control]");
  const title = root.querySelector("[data-cabinet-title]");
  const kicker = root.querySelector("[data-cabinet-kicker]");
  const description = root.querySelector("[data-cabinet-description]");
  const sourceLink = root.querySelector("[data-cabinet-link]");
  const status = root.querySelector("[data-cabinet-status]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const museumRoom = root.closest(".room--archive");
  const museumShell = root.closest(".museum-shell");

  if (!(panel instanceof HTMLElement) || !(video instanceof HTMLVideoElement)) return;

  const clamp = (minimum, value, maximum) => Math.min(maximum, Math.max(minimum, value));

  function setFilmControlState() {
    if (!(filmControl instanceof HTMLButtonElement)) return;
    const isPlaying = !video.paused && !video.ended;
    const projectTitle = title?.textContent?.trim() || "selected project";
    const verb = isPlaying ? "Pause" : video.ended ? "Replay" : "Play";
    filmControl.setAttribute("aria-label", `${verb} ${projectTitle} demo`);
    const visibleLabel = filmControl.querySelector("span");
    if (visibleLabel) visibleLabel.textContent = verb;
    filmControl.classList.toggle("is-playing", isPlaying);
  }

  function replaceVideoSources(tab) {
    const wasPlaying = !video.paused && !video.ended;
    video.pause();
    video.poster = tab.dataset.poster || "";
    video.setAttribute("aria-label", `${tab.dataset.title || "Selected project"} demo`);
    video.replaceChildren();

    const sources = [
      [tab.dataset.webm, "video/webm"],
      [tab.dataset.mp4, "video/mp4"],
    ];

    for (const [src, type] of sources) {
      if (!src) continue;
      const source = document.createElement("source");
      source.src = src;
      source.type = type;
      video.append(source);
    }

    video.load();
    if (wasPlaying && !reduceMotion.matches) video.play().catch(() => {});
  }

  function selectProject(tab, { focus = false, announce = true } = {}) {
    if (!(tab instanceof HTMLButtonElement)) return;
    const project = tab.dataset.project || "npc";
    const alreadySelected = tab.getAttribute("aria-selected") === "true";

    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.classList.toggle("is-active", selected);
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    }

    root.dataset.archiveProject = project;
    if (museumRoom) museumRoom.dataset.archiveProject = project;
    if (museumShell && museumRoom?.classList.contains("is-current")) museumShell.dataset.frame = `archive-${project}`;
    if (tab.id) panel.setAttribute("aria-labelledby", tab.id);
    if (title) title.textContent = tab.dataset.title || "";
    if (kicker) kicker.textContent = tab.dataset.kicker || "";
    if (description) description.textContent = tab.dataset.description || "";
    if (sourceLink instanceof HTMLAnchorElement) sourceLink.href = tab.dataset.repo || "#";
    if (!alreadySelected) replaceVideoSources(tab);
    if (focus) tab.focus();
    if (announce && status) status.textContent = `${tab.dataset.title || "Project"} is on view.`;
    setFilmControlState();
  }

  function adjacentTab(tab, key) {
    const index = tabs.indexOf(tab);
    if (key === "Home") return tabs[0];
    if (key === "End") return tabs.at(-1);
    const delta = key === "ArrowUp" || key === "ArrowLeft" ? -1 : 1;
    return tabs[(index + delta + tabs.length) % tabs.length];
  }

  function moveObjectLocally(event, tab) {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    const bounds = tab.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - .5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - .5;
    tab.style.setProperty("--object-x", `${clamp(-7, normalizedX * 10, 7).toFixed(2)}px`);
    tab.style.setProperty("--object-y", `${clamp(-5, normalizedY * 8, 5).toFixed(2)}px`);
  }

  function settleObject(tab) {
    tab.style.setProperty("--object-x", "0px");
    tab.style.setProperty("--object-y", "0px");
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => selectProject(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = adjacentTab(tab, event.key);
      if (next) selectProject(next, { focus: true });
    });
    tab.addEventListener("pointermove", (event) => moveObjectLocally(event, tab));
    tab.addEventListener("pointerleave", () => settleObject(tab));
    tab.addEventListener("pointercancel", () => settleObject(tab));
  }

  filmControl?.addEventListener("click", () => {
    if (video.paused || video.ended) {
      delete video.dataset.userPaused;
      if (video.ended) video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.dataset.userPaused = "true";
      video.pause();
    }
  });

  video.addEventListener("play", setFilmControlState);
  video.addEventListener("pause", setFilmControlState);
  video.addEventListener("ended", setFilmControlState);
  reduceMotion.addEventListener?.("change", () => {
    for (const tab of tabs) settleObject(tab);
    if (reduceMotion.matches) video.pause();
  });

  const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
  if (selected) selectProject(selected, { announce: false });
})();
