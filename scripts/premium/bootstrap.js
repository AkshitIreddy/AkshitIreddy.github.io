(function bootPremiumPortfolio() {
  "use strict";

  const setupKeyscapeDemo = () => {
    const button = document.querySelector("[data-keyscape-demo-toggle]");
    const label = document.querySelector("[data-keyscape-demo-label]");
    const video = document.querySelector("#keyscape [data-room-video]");
    if (!button || !video || button.dataset.bound === "true") return;
    button.dataset.bound = "true";

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
    window.addEventListener("museum:roomchange", () => {
      window.requestAnimationFrame(sync);
      window.setTimeout(sync, 180);
    });
    window.setTimeout(sync, 180);
    sync();
  };

  const start = () => {
    setupKeyscapeDemo();
    if (!window.LocalizedMotion || window.__portfolioLocalizedMotion) return;
    window.__portfolioLocalizedMotion = window.LocalizedMotion.create({
      root: ".museum-stage",
      lineSelector: "[data-calm-motion]",
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
