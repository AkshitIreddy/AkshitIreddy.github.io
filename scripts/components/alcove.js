/* Alcove: A Library in Four Volumes.
   Selection semantics live here; all visual expression remains in CSS. */

(() => {
  const room = document.querySelector(".alcove-library");
  if (!room) return;

  const shelf = room.querySelector("[data-alcove-spines]");
  const tabs = [...room.querySelectorAll('[role="tab"][data-alcove-volume]')];
  const panels = [...room.querySelectorAll('[role="tabpanel"]')];

  if (!shelf || tabs.length !== 4 || panels.length !== 4) return;

  function selectVolume(tab, { focus = false } = {}) {
    if (!tabs.includes(tab)) return;

    const targetId = tab.getAttribute("aria-controls");
    room.dataset.volume = tab.dataset.alcoveVolume;

    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    }

    for (const panel of panels) {
      const selected = panel.id === targetId;
      panel.hidden = !selected;
    }

    if (focus) tab.focus();

    room.dispatchEvent(new CustomEvent("alcove:volume", {
      bubbles: true,
      detail: { volume: tab.dataset.alcoveVolume },
    }));
  }

  shelf.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"][data-alcove-volume]');
    if (!tab || !shelf.contains(tab)) return;
    selectVolume(tab);
  });

  shelf.addEventListener("keydown", (event) => {
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    selectVolume(tabs[nextIndex], { focus: true });
  });

  const initial = tabs.find((tab) => tab.dataset.alcoveVolume === room.dataset.volume) || tabs[0];
  selectVolume(initial);
})();
