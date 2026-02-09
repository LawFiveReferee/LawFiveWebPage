//Filtering.js

document.getElementById("selectMatchingBtn")?.addEventListener("click", () => {
  if (!window.GAME_LIST) return;
  window.GAME_LIST.forEach(g => {
    if (g.visible !== false) g.selected = true;
  });
  updateSelectedCountUI?.();
  renderCards?.();
});

document.getElementById("deselectMatchingBtn")?.addEventListener("click", () => {
  if (!window.GAME_LIST) return;
  window.GAME_LIST.forEach(g => {
    if (g.visible !== false) g.selected = false;
  });
  updateSelectedCountUI?.();
  renderCards?.();
});

window.getSelectionStatus = function () {
  const total = Array.isArray(window.GAME_LIST) ? window.GAME_LIST.length : 0;
  const selected = window.GAME_LIST?.filter(g => g.selected)?.length || 0;
  return { selected, total };
};
