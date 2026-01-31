/* ============================================================
   Shared Import Carousel UI
   Shows:
     • Saved schedules
     • Built‑in parsers
     • Saved custom parsers
     • New parser slot
   Works with:
     • parser-store.js
     • parser-ui.js
     • schedule-store.js
 ============================================================ */



// =========================================================================
// carousel-ui.js
// Provides the shared import carousel UI
// =========================================================================


// carousel-ui.js (below the IMPORT_SOURCES + importSelectedIndex initialization)

window.handleImportSelection = function(item) {
  console.log("🎯 handleImportSelection called:", item);

  // If this is a saved schedule
  if (item.type === "savedSchedule") {
    const rawText = item.rawText || "";
    const parserKey = item.parserKey || "generic";

    const { parseAndImport } = window.ScheduleImport || {};
    if (typeof parseAndImport === "function") {
      const games = parseAndImport(rawText, parserKey);
      window.GAME_LIST = games || [];

      console.log(`🎉 Loaded schedule '${item.displayName}' with ${games.length} games.`);
    } else {
      console.warn("⚠️ ScheduleImport.parseAndImport not available.");
    }

    // If you’re in the Game Card Factory:
    if (typeof renderPreviewCards === "function") {
      renderPreviewCards();
    }
    if (typeof updateStatusLines === "function") {
      updateStatusLines();
    }

    return;
  }

  // If this is a built‑in or custom parser
  if (item.type === "parser" || item.type === "customParser") {
    const parserKey = item.parserKey;
    window.selectedParserKey = parserKey;

    console.log(`✨ Parser selected: ${parserKey}`);

    // Update parser UI if present
    if (typeof refreshParserCarousel === "function") {
      refreshParserCarousel();
    }

    return;
  }

  // If “New Parser”
  if (item.type === "newParser") {
    if (typeof window.showParserEditor === "function") {
      window.showParserEditor();
    } else {
      console.warn("⚠️ showParserEditor() not available.");
    }
    return;
  }

  // Fallback
  console.warn("⚠️ Unknown import item type:", item);
};
// Lazy getters for shared store functions
function getParserStore() {
  return window.ParserStore || {};
}

function getLoadSavedParsers() {
  const store = getParserStore();
  return typeof store.loadSavedParsers === "function"
    ? store.loadSavedParsers
    : function() { return []; };
}

function getScheduleStore() {
  return ScheduleStoreV2 || {
    getSavedSchedules: function() { return []; }
  };
}

function getShowParserEditor() {
  return typeof window.showParserEditor === "function"
    ? window.showParserEditor
    : function() {};
}

// Main carousel state
window.IMPORT_SOURCES = [];
window.importSelectedIndex = null;
/**
 * Refreshes the import carousel items.
 * This must be called after any change to schedules or parsers.
 */

export function refreshImportCarousel() {
  const viewport = document.getElementById("carouselViewport");
  const statusEl = document.getElementById("importStatus");

  console.log("🔄 refreshImportCarousel() called…");

  if (!viewport) {
    console.warn("⚠️ carouselViewport not found in DOM");
    if (statusEl) statusEl.textContent = "No import carousel available.";
    return;
  }

  viewport.innerHTML = "";
  window.IMPORT_SOURCES = [];

  const ScheduleStore = ScheduleStoreV2;
  const ParserStore = window.ParserStore;

  // ───────────────────────────────────────────
  // 1) Saved Schedules
  // ───────────────────────────────────────────
  let savedSchedules = [];
  if (ScheduleStore?.getSavedSchedules) {
    try {
      savedSchedules = ScheduleStore.getSavedSchedules() || [];
    } catch (err) {
      console.error("❌ Error reading saved schedules:", err);
    }
  }

  console.log("📁 Saved schedules:", savedSchedules);

  savedSchedules.forEach(s => {
    window.IMPORT_SOURCES.push({
      type: "savedSchedule",
      id: s.id,
      displayName: s.name || "(Unnamed Schedule)",
      rawText: s.rawText,
      parserKey: s.parserKey || "generic"
    });
  });

  // ───────────────────────────────────────────
  // 2) Built‑in Parsers
  // ───────────────────────────────────────────
  const builtInParsers = [
    { key: "generic", name: "Generic Parser" }
    // add more built‑ins here later
  ];

  console.log("📦 Built‑in parsers:", builtInParsers);

  builtInParsers.forEach(p => {
    window.IMPORT_SOURCES.push({
      type: "parser",
      parserKey: p.key,
      displayName: p.name
    });
  });

  // ───────────────────────────────────────────
  // 3) Custom Parsers
  // ───────────────────────────────────────────
  let customParsers = [];
  if (ParserStore?.loadSavedParsers) {
    try {
      customParsers = ParserStore.loadSavedParsers() || [];
    } catch (err) {
      console.error("❌ Error reading custom parsers:", err);
    }
  }

  console.log("🛠 Custom parsers:", customParsers);

  customParsers.forEach(p => {
    window.IMPORT_SOURCES.push({
      type: "customParser",
      parserKey: p.key,
      displayName: p.name || p.key
    });
  });

  // ───────────────────────────────────────────
  // 4) New Parser Entry
  // ───────────────────────────────────────────
  window.IMPORT_SOURCES.push({
    type: "newParser",
    displayName: "✏️ New Parser"
  });

  console.log("🧠 Total import sources:", window.IMPORT_SOURCES);

  // ───────────────────────────────────────────
  // Default selection
  // ───────────────────────────────────────────
  if (
    window.importSelectedIndex == null ||
    window.importSelectedIndex >= window.IMPORT_SOURCES.length
  ) {
    window.importSelectedIndex = window.IMPORT_SOURCES.length ? 0 : null;
  }

  // ───────────────────────────────────────────
  // Render carousel
  // ───────────────────────────────────────────
  window.IMPORT_SOURCES.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "carousel-item";
    div.textContent = item.displayName || `Item ${idx + 1}`;

    if (idx === window.importSelectedIndex) {
      div.classList.add("selected");
    }

    div.addEventListener("click", () => {
      window.importSelectedIndex = idx;
      console.log("➡️ Carousel item clicked:", item);
      refreshImportCarousel();

      if (typeof window.handleImportSelection === "function") {
        window.handleImportSelection(item);
      } else {
        console.warn("⚠️ handleImportSelection() not defined");
      }
    });

    viewport.appendChild(div);
  });

  // ───────────────────────────────────────────
  // Status line
  // ───────────────────────────────────────────
  if (statusEl) {
    statusEl.textContent =
      window.IMPORT_SOURCES.length > 0
        ? `Available import sources: ${window.IMPORT_SOURCES.length}`
        : "No saved schedules or parsers available.";
  }
}
/**
 * Handle what happens when a user selects a carousel item.
 */
 function handleImportSelection(source) {
  const statusEl = document.getElementById("importStatus");
  const rawArea = document.getElementById("rawInput");

  // -----------------------------
  // SAVED SCHEDULE
  // -----------------------------
  if (source.type === "savedSchedule") {

    // 1️⃣ Show schedule text in textarea
    if (rawArea) {
      rawArea.value = source.rawText || "";
      rawArea.setAttribute("data-parser-key", source.parserKey || "generic");
    }

    // 2️⃣ Parse immediately (THIS replaces "Extract Games")
    if (rawArea && rawArea.value.trim()) {
      ScheduleStore.importSchedule({
        rawText: rawArea.value,
        parserKey: source.parserKey || "generic",
        name: source.displayName,
        source: "saved",
        save: false
      });

      // 3️⃣ Update UI downstream
	// Notify the host app that a schedule was selected/imported
	window.dispatchEvent(new CustomEvent("scheduleImported", {
	  detail: { sourceItem: source }
	}));

    }

    statusEl.textContent =
      `Selected schedule: ${source.displayName} (${window.GAME_LIST?.length || 0} games)`;

    return;
  }

  // -----------------------------
  // BUILT-IN PARSER
  // -----------------------------
  if (source.type === "parser") {
    if (rawArea) {
      rawArea.setAttribute("data-parser-key", source.parserKey);
    }

    statusEl.textContent =
      `Parser selected: ${source.displayName} — paste schedule text`;
    return;
  }

  // -----------------------------
  // CUSTOM PARSER
  // -----------------------------
  if (source.type === "customParser") {
    if (rawArea) {
      rawArea.setAttribute("data-parser-key", source.parserKey);
    }

    statusEl.textContent =
      `Custom parser selected: ${source.displayName}`;
    return;
  }

  // -----------------------------
  // NEW PARSER
  // -----------------------------
  if (source.type === "newParser") {
    openParserEditor();
    return;
  }
}
/**
 * Open the parser editor for a built‑in parser key.
 * For built‑ins we just seed the editor with the key;
 * the user can then define rules and save it.
 */
function openParserWithKey(parserKey) {
  showParserEditor({ key: parserKey, name: parserKey, description: "", rules: "" });

  // Also mark the textarea as using this parser
  const rawArea = document.getElementById("rawInput");
  if (rawArea) {
    rawArea.setAttribute("data‑parser‑key", parserKey);
  }
}


/**
 * Programmatically navigate carousel
 */
document.getElementById("carouselPrev")?.addEventListener("click", () => {
  if (!IMPORT_SOURCES.length) return;
  importSelectedIndex =
    (importSelectedIndex - 1 + IMPORT_SOURCES.length) % IMPORT_SOURCES.length;
  refreshImportCarousel();
});

document.getElementById("carouselNext")?.addEventListener("click", () => {
  if (!IMPORT_SOURCES.length) return;
  importSelectedIndex =
    (importSelectedIndex + 1) % IMPORT_SOURCES.length;
  refreshImportCarousel();
});

// ----- EXPOSE CAROUSEL HELPERS GLOBALLY -----

// Import Carousel
window.refreshImportCarousel = refreshImportCarousel;

// If you have a schedule carousel in this module,
// also expose them:
if (typeof refreshScheduleCarousel === "function") {
  window.refreshScheduleCarousel = refreshScheduleCarousel;
}
if (typeof updateScheduleStatus === "function") {
  window.updateScheduleStatus = updateScheduleStatus;
}
