/* ============================================================
   Shared Import & Parser Carousel UI
   ============================================================ */

// --------------------------------------------------
// Global State
// --------------------------------------------------
window.IMPORT_SOURCES = [];
window.importSelectedIndex = 0;
window.selectedParserIndex = 0;
window.selectedParserKey = null;

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getParserList() {
  return window.ScheduleParser?.getParserList?.() || [];
}

function getScheduleStore() {
  return window.ScheduleStoreV2;
}

function isCustomGenericParser(parser) {
  if (!parser || typeof parser.key !== "string") return false;

  if (parser.key === "generic") return true;
  if (parser.key === "generic-mapper") return true;
  if (parser.key.startsWith("generic-mapper:")) return true;

  return false;
}

// ============================================================
// PARSER CAROUSEL
// ============================================================

function refreshParserCarousel() {
  const nameEl = document.getElementById("parserName");
  const descEl = document.getElementById("parserDescription");
  const rawInput = document.getElementById("rawInput");

  const parsers = getParserList();
  if (!parsers.length) {
    if (nameEl) nameEl.textContent = "(No parsers available)";
    if (descEl) descEl.textContent = "";
    return;
  }

  if (
    window.selectedParserIndex < 0 ||
    window.selectedParserIndex >= parsers.length
  ) {
    window.selectedParserIndex = 0;
  }

  const parser = parsers[window.selectedParserIndex];
  window.selectedParserKey = parser.key;

  if (nameEl) nameEl.textContent = parser.name || parser.key;
  if (descEl) descEl.textContent = parser.description || "";

  if (rawInput) {
    rawInput.dataset.parserKey = parser.key;
  }

  localStorage.setItem("selectedScheduleParserKey", parser.key);

  updateMappingButtons();
}

window.refreshParserCarousel = refreshParserCarousel;

// --------------------------------------------------
// Arrow Controls
// --------------------------------------------------

window.initParserCarouselControls = function () {
  const prev = document.getElementById("prevParser");
  const next = document.getElementById("nextParser");

  if (!prev || !next) return;

  prev.addEventListener("click", () => {
    const count = getParserList().length;
    if (!count) return;

    window.selectedParserIndex =
      (window.selectedParserIndex - 1 + count) % count;

    refreshParserCarousel();
    window.updateParserSample?.();
  });

  next.addEventListener("click", () => {
    const count = getParserList().length;
    if (!count) return;

    window.selectedParserIndex =
      (window.selectedParserIndex + 1) % count;

    refreshParserCarousel();
    window.updateParserSample?.();
  });
};

// ============================================================
// MAPPING BUTTON BAR (below parser carousel)
// ============================================================

function updateMappingButtons() {
  const bar = document.getElementById("mappingActionBar");
  const editBtn = document.getElementById("editMappingBtn");
  const deleteBtn = document.getElementById("deleteMappingProfileBtn");

  if (!bar) return;

  const parsers = getParserList();
  const parser = parsers[window.selectedParserIndex];

  if (isCustomGenericParser(parser)) {
    bar.style.display = "flex";

    if (editBtn) {
      editBtn.onclick = function () {
        const profileKey = parser.key.replace("generic-mapper:", "");
        window.openMappingEditor?.(profileKey);
      };
    }

    if (deleteBtn) {
      deleteBtn.onclick = function () {
        const profileKey = parser.key.replace("generic-mapper:", "");
        const ok = confirm(`Delete mapping "${profileKey}"?`);
        if (!ok) return;

        localStorage.removeItem("mapping_" + profileKey);

        // Remove from parser registry
        window.ScheduleParser?.removeParserByKey?.(parser.key);

        refreshParserCarousel();
      };
    }
  } else {
    bar.style.display = "none";
  }
}

window.updateMappingButtons = updateMappingButtons;

// ============================================================
// IMPORT CAROUSEL
// ============================================================

function refreshImportCarousel() {
  const viewport = document.getElementById("carouselViewport");
  if (!viewport) return;

  viewport.innerHTML = "";
  window.IMPORT_SOURCES = [];

  const store = getScheduleStore();
  const schedules = store?.getSavedSchedules?.() || [];

  // Saved schedules
  schedules.forEach(s => {
    window.IMPORT_SOURCES.push({
      type: "savedSchedule",
      displayName: s.name,
      rawText: s.rawText,
      parserKey: s.parserKey || "generic"
    });
  });

  // Parsers
  getParserList().forEach(p => {
    window.IMPORT_SOURCES.push({
      type: "parser",
      parserKey: p.key,
      displayName: p.name || p.key
    });
  });

  // New parser
  window.IMPORT_SOURCES.push({
    type: "newParser",
    displayName: "✏️ New Parser"
  });

  window.IMPORT_SOURCES.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "carousel-item";
    el.textContent = item.displayName;

    if (i === window.importSelectedIndex) {
      el.classList.add("selected");
    }

    el.addEventListener("click", () => {
      window.importSelectedIndex = i;
      refreshImportCarousel();
      handleImportSelection(item);
    });

    viewport.appendChild(el);
  });
}

window.refreshImportCarousel = refreshImportCarousel;

// --------------------------------------------------
// Import selection
// --------------------------------------------------

function handleImportSelection(item) {
  const rawArea = document.getElementById("rawInput");

  if (item.type === "savedSchedule") {
    if (rawArea) {
      rawArea.value = item.rawText || "";
      rawArea.dataset.parserKey = item.parserKey || "generic";
    }

    window.selectedParserKey = item.parserKey || "generic";
    refreshParserCarousel();
    window.onSelectionChanged?.();
    return;
  }

  if (item.type === "parser") {
    window.selectedParserKey = item.parserKey;
    refreshParserCarousel();
    window.updateParserSample?.();
    return;
  }

  if (item.type === "newParser") {
    window.showParserEditor?.();
  }
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const list = getParserList();
  const saved = localStorage.getItem("selectedScheduleParserKey");

  if (saved && list.length) {
    const idx = list.findIndex(p => p.key === saved);
    if (idx >= 0) {
      window.selectedParserIndex = idx;
    }
  }

  window.initParserCarouselControls();
  refreshParserCarousel();
  refreshImportCarousel();
});
