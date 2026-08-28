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

  const setupToolCopy = () => {
    const copy = {
      email: {
        label: "Newsletter briefings",
        description: "Email Briefing clusters and deduplicates newsletter stories into topic dashboards, then adds current web context and imagery to make one inbox readable at a glance.",
      },
      gifsmith: {
        label: "Product demo capture",
        description: "Describe browser actions, timing, cursor motion, and the loop anchor in a declarative timeline. Gifsmith runs the real interface and exports GIF, WebP, or video.",
      },
      compendium: {
        label: "Cited technique search",
        description: "Describe a technical problem in plain English, search curated knowledge packs for relevant techniques, and open the cited source material behind each result.",
      },
      transparency: {
        label: "Windows display controls",
      },
    };

    for (const tab of document.querySelectorAll(".tool-selector[data-tool]")) {
      const entry = copy[tab.dataset.tool];
      if (!entry) continue;
      const label = tab.querySelector(".instrument-tab__label small");
      if (label) label.textContent = entry.label;
      if (entry.description) tab.dataset.description = entry.description;
      if (tab.getAttribute("aria-selected") === "true" && entry.description) {
        const description = document.querySelector("[data-tool-description]");
        if (description) description.textContent = entry.description;
      }
    }
  };

  const start = () => {
    setupToolCopy();
    setupKeyscapeDemo();
    if (!window.LocalizedMotion || window.__portfolioLocalizedMotion) return;
    window.__portfolioLocalizedMotion = window.LocalizedMotion.create({
      root: ".museum-stage",
      lineSelector: "[data-calm-motion]",
      fixtureSelector: "[data-calm-fixture]",
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
