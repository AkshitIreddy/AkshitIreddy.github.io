(() => {
  "use strict";

  const start = () => {
    if (!window.LocalizedMotion || window.__portfolioLocalizedMotion) return;
    window.__portfolioLocalizedMotion = window.LocalizedMotion.create({
      root: ".museum-stage",
      lineSelector: "[data-calm-motion]",
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
