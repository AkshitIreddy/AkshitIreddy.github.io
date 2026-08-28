(() => {
  "use strict";

  const root = document.querySelector("#keyscape");
  const button = root?.querySelector("[data-keyscape-demo-toggle]");
  const label = root?.querySelector("[data-keyscape-demo-label]");
  const video = root?.querySelector("[data-room-video]");
  if (!(button instanceof HTMLButtonElement) || !(video instanceof HTMLVideoElement)) return;

  const sync = () => {
    const playing = !video.paused && !video.ended;
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} Magnetic Poles demo`);
    button.setAttribute("aria-pressed", String(playing));
    if (label) label.textContent = playing ? "Pause demo" : "Play demo";
  };

  button.addEventListener("click", async () => {
    if (!video.paused && !video.ended) {
      video.dataset.userPaused = "true";
      video.pause();
      return;
    }

    try {
      delete video.dataset.userPaused;
      await video.play();
    } catch {
      button.setAttribute("aria-label", "Magnetic Poles demo could not start");
    }
  });

  video.addEventListener("play", sync);
  video.addEventListener("playing", sync);
  video.addEventListener("pause", sync);
  video.addEventListener("ended", sync);
  window.addEventListener("museum:roomchange", () => window.requestAnimationFrame(sync));
  sync();
})();
