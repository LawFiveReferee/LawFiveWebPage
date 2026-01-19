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

import { loadSavedParsers } from "./parser-store.js";
import { showParserEditor } from "./parser-ui.js";
import { ScheduleStore } from "./schedule-store.js";
import { getSavedSchedules } from "./schedule-store.js";
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
  IMPORT_SOURCES = [];

  // ───────────────────────────────────────────
  // 1) Saved Schedules
  // ───────────────────────────────────────────
  let savedSchedules = [];
  try {
    savedSchedules = ScheduleStore.getSavedSchedules() || [];
  } catch (err) {
    console.error("Error reading saved schedules:", err);
  }

  console.log("📁 Saved schedules:", savedSchedules);

  savedSchedules.forEach(s => {
    IMPORT_SOURCES.push({
      type: "savedSchedule",
      id: s.id,
      displayName: s.name || "(Unnamed Schedule)",
      rawText: s.rawText
    });
  });

  // ───────────────────────────────────────────
  // 2) Built‑in Parsers
  // ───────────────────────────────────────────
  const builtInParsers = [
    { parserKey: "generic", displayName: "Generic Parser" }
    // add more built‑in definitions here as needed
  ];
  console.log("📦 Built‑in parsers:", builtInParsers);

  builtInParsers.forEach(p => {
    IMPORT_SOURCES.push({
      type: "parser",
      parserKey: p.parserKey,
      displayName: p.displayName || p.parserKey
    });
  });

  // ───────────────────────────────────────────
  // 3) Saved Custom Parsers
  // ───────────────────────────────────────────
  let customParsers = [];
  try {
    customParsers = loadSavedParsers() || [];
  } catch (err) {
    console.error("Error reading custom parsers:", err);
  }

  console.log("🛠 Custom parsers:", customParsers);

  customParsers.forEach(p => {
    IMPORT_SOURCES.push({
      type: "customParser",
      parserKey: p.key,
      displayName: p.name || p.key
    });
  });

  // ───────────────────────────────────────────
  // 4) New Parser
  // ───────────────────────────────────────────
  IMPORT_SOURCES.push({
    type: "newParser",
    displayName: "✏️ New Parser"
  });

  console.log("🧠 Total import sources:", IMPORT_SOURCES);

  // ───────────────────────────────────────────
  // Set default selection if none
  // ───────────────────────────────────────────
  if (importSelectedIndex === null && IMPORT_SOURCES.length > 0) {
    importSelectedIndex = 0;
  }

  // ───────────────────────────────────────────
  // Render carousel items
  // ───────────────────────────────────────────
  IMPORT_SOURCES.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "carousel-item";
    div.textContent = item.displayName || `Item ${idx + 1}`;

    if (idx === importSelectedIndex) {
      div.classList.add("selected");
    }

    div.addEventListener("click", () => {
      importSelectedIndex = idx;
      console.log("➡️ Carousel item clicked:", item);
      refreshImportCarousel();
      handleImportSelection(item);
    });

    viewport.appendChild(div);
  });

  // Update status line
  if (statusEl) {
    statusEl.textContent =
      IMPORT_SOURCES.length > 0
        ? `Imported sources: ${IMPORT_SOURCES.length}`
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
