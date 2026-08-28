(() => {
  "use strict";

  const video = document.querySelector("[data-pet-video]");
  const button = document.querySelector("[data-video-control]");
  const icon = button?.querySelector(".video-control__icon");
  const label = document.querySelector("[data-video-label]");
  const status = document.querySelector("[data-live-status]");

  if (!video || !button) return;

  const announce = (message) => {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => { status.textContent = message; }, 20);
  };

  const sync = () => {
    const playing = !video.paused && !video.ended;
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} AI Desktop Pet demo`);
    if (icon) icon.textContent = playing ? "Ⅱ" : "▶";
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
      announce("The AI Desktop Pet demo could not start. Try the control again.");
    }
  });

  video.addEventListener("play", sync);
  video.addEventListener("pause", sync);
  video.addEventListener("ended", sync);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !video.paused) video.pause();
  });

  sync();
})();
