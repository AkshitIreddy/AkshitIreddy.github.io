(() => {
  "use strict";

  const root = document.querySelector("#workbench");
  if (!root) return;

  const selectors = [...root.querySelectorAll(".tool-selector")];
  const feature = root.querySelector(".workbench-feature__media");
  const media = root.querySelector("[data-tool-media]");
  const video = root.querySelector("[data-tool-video]");
  const indexLabel = root.querySelector("[data-tool-index]");
  const title = root.querySelector(".workbench-feature h3");
  const description = root.querySelector("[data-tool-description]");
  const platform = root.querySelector("[data-tool-platform]");
  const steps = [...root.querySelectorAll("[data-tool-step]")];
  const mediaLabel = root.querySelector("[data-tool-media-label]");
  const link = root.querySelector("[data-tool-link]");
  const playButton = root.querySelector("[data-tool-play]");
  const panel = root.querySelector("#workbench-panel");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!selectors.length || !(media instanceof HTMLImageElement) || !(video instanceof HTMLVideoElement)) return;

  let transitionTimer = 0;

  const refreshShellMedia = () => {
    window.dispatchEvent(new CustomEvent("museum:mediarefresh"));
  };

  const appendSource = (sourceUrl, type) => {
    if (!sourceUrl) return;
    const source = document.createElement("source");
    source.dataset.src = sourceUrl;
    source.type = type;
    video.append(source);
  };

  const commitSelection = (selector) => {
    const isVideo = selector.dataset.type === "video";
    video.defaultPlaybackRate = 1;
    video.playbackRate = 1;
    video.hidden = !isVideo;
    media.hidden = isVideo;
    if (playButton) playButton.hidden = !isVideo;

    if (isVideo) {
      video.poster = selector.dataset.poster || "";
      video.setAttribute("aria-label", selector.dataset.alt || `${selector.dataset.title || "Utility"} demo`);
      video.replaceChildren();
      appendSource(selector.dataset.webm, "video/webm");
      appendSource(selector.dataset.mp4, "video/mp4");
      video.load();
    } else {
      media.src = selector.dataset.media || selector.dataset.poster || "";
      media.alt = selector.dataset.alt || `${selector.dataset.title || "Utility"} demo`;
    }

    if (indexLabel) indexLabel.textContent = selector.dataset.index || "";
    if (title) title.textContent = selector.dataset.title || "";
    if (description) description.textContent = selector.dataset.description || "";
    if (platform) platform.textContent = selector.dataset.platform || "";
    const process = (selector.dataset.process || "").split("|");
    steps.forEach((step, stepIndex) => { step.textContent = process[stepIndex] || ""; });
    if (mediaLabel) mediaLabel.textContent = selector.dataset.mediaLabel || "PROJECT DEMO";
    if (link) link.href = selector.dataset.repo || "#";
    if (panel && selector.id) panel.setAttribute("aria-labelledby", selector.id);

    feature?.classList.remove("is-changing");
    refreshShellMedia();
  };

  const selectTool = (selector, focus = false) => {
    if (!(selector instanceof HTMLButtonElement)) return;
    window.clearTimeout(transitionTimer);
    video.pause();

    selectors.forEach((item) => {
      const active = item === selector;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });

    feature?.classList.add("is-changing");
    root.dataset.tool = selector.dataset.tool || "email";
    refreshShellMedia();
    transitionTimer = window.setTimeout(
      () => commitSelection(selector),
      reduceMotion.matches ? 0 : 130,
    );
    if (focus) selector.focus();
  };

  selectors.forEach((selector) => {
    selector.addEventListener("click", () => selectTool(selector));
    selector.addEventListener("keydown", (event) => {
      const navigationKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
      if (!navigationKeys.includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const next = event.key === "Home"
        ? selectors[0]
        : event.key === "End"
          ? selectors.at(-1)
          : selectors[(selectors.indexOf(selector) + direction + selectors.length) % selectors.length];
      selectTool(next, true);
    });
  });
})();
