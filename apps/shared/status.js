// shared/status.js


// ----------------------------------------
// Selection stats
// ----------------------------------------
window.getGameSelectionStats = function () {
  const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
  const total = games.length;
  const selected = games.filter(g => g.selected).length;
  return { total, selected };
};

// ----------------------------------------
// Status updater (single source of truth)
// ----------------------------------------
window.updateStatusLines = function () {
  const { total, selected } =
    window.getGameSelectionStats() || { total: 0, selected: 0 };

  const templateName =
    window.selectedTemplateName || "No template currently selected";

  // 1. Schedule import
  const scheduleParseStatus =
    document.getElementById("scheduleParseStatus");
  if (scheduleParseStatus) {
    scheduleParseStatus.textContent =
      total > 0
        ? `${total} game${total !== 1 ? "s" : ""} loaded`
        : "No schedule parsed";
  }

  // 2. Select & Filter (subtitle replacement)
  const filterSubtitle =
    document.querySelector("#section-filter .section-subtitle");
  if (filterSubtitle) {
    filterSubtitle.textContent =
      `${selected} of ${total} games currently selected. ` +
      "Build rules to select or deselect games.";
  }

  // 3. Card Preview
  const previewStatus =
    document.getElementById("previewStatus");
  if (previewStatus) {
    previewStatus.textContent =
      selected > 0
        ? `Previewing ${selected} selected game${selected !== 1 ? "s" : ""}.`
        : "No cards to preview.";
  }

  // 4. Template selector (combined text)
  const templateStatus =
    document.getElementById("templateStatus");
  if (templateStatus) {
    templateStatus.textContent =
      `Select lineup or roster template. ${templateName}.`;
  }

  // 5. PDF generator
  const generateStatus =
    document.getElementById("generateStatus");
  if (generateStatus) {
    generateStatus.textContent =
      `Export cards for ${selected} selected game${selected !== 1 ? "s" : ""}.`;
  }

  // 6. Bulk Edit (replaces subtitle)
  const bulkEditStatus =
    document.getElementById("bulkEditStatus");
  if (bulkEditStatus) {
    bulkEditStatus.textContent =
      selected === 0
        ? "Select one or more games to bulk edit fields."
        : `Edit fields in ${selected} selected game card${selected !== 1 ? "s" : ""}.`;
  }
};

// ----------------------------------------
// Shared hook: call whenever selection or data changes
// ----------------------------------------
 // ----------------------------------------
// Shared hook: call whenever selection or data changes
// ----------------------------------------
window.onSelectionChanged = function () {
  if (!Array.isArray(window.GAME_LIST) || window.GAME_LIST.length === 0) {
    window.updateStatusLines?.();
    return;
  }

  if (typeof window.renderGameCards === "function") {
    window.renderGameCards();
  }

  if (typeof window.renderLineupCards === "function") {
    window.renderLineupCards();
  }

  window.updateStatusLines?.();
};

// ----------------------------------------
// Initial paint (safe)
// ----------------------------------------
window.updateStatusLines?.();
// ----------------------------------------
// Initial paint (safe)
// ----------------------------------------
window.updateStatusLines?.();
