/**schedule-import.js
 * Schedule Import Helper (ES5-compatible)
 * Handles parsing a raw schedule string using a selected parser
 */

(function(global) {
  "use strict";

  function parseAndImport(rawText, parserKey) {
    if (!rawText || !parserKey) {
      console.warn("parseAndImport called without required inputs.");
      return [];
    }

    var selectedParser = (global.BUILT_IN_PARSERS || []).find(function(p) {
      return p.key === parserKey;
    });

    if (!selectedParser || typeof selectedParser.parse !== "function") {
      console.error("Parser not found or invalid:", parserKey);
      return [];
    }

    try {
      var games = selectedParser.parse(rawText);
      console.log("✅ Parsed " + games.length + " games");
      return games;
    } catch (err) {
      console.error("Error while parsing with " + parserKey + ":", err);
      return [];
    }
  }
function renderPreviewCards() {
  const container = document.getElementById("previewCardContainer");
  console.log("🔄 renderPreviewCards() called…");
  console.log("📋 GAME_LIST:", window.GAME_LIST);

  if (!container) {
    console.warn("⚠️ previewCardContainer not found in DOM");
    return;
  }

  container.innerHTML = "";

  const games = window.GAME_LIST || [];
  games.forEach((g, idx) => {
    const card = document.createElement("div");
    card.className = "lineup-card";

    card.innerHTML = `
      <div class="card-header">
        <strong>Game ${idx + 1}</strong>
        <div class="card-buttons">
          <button class="btn edit-btn" data-id="${g.id}">Edit</button>
          <button class="btn pdf-btn" data-id="${g.id}">PDF</button>
        </div>
      </div>

      <div class="card-body">
        <div><strong>Date:</strong> ${g.date}</div>
        <div><strong>Time:</strong> ${g.time}</div>
        <div><strong>Home:</strong> ${g.homeTeam}</div>
        <div><strong>Away:</strong> ${g.awayTeam}</div>
        <div><strong>Location:</strong> ${g.location}</div>
        <div><strong>Raw:</strong> ${g.raw}</div>
      </div>
    `;

    container.appendChild(card);
  });

  initCardButtons();
}
  global.ScheduleImport = {
    parseAndImport: parseAndImport
  };

})(window);
function initCardButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", evt => {
      const gameId = evt.target.dataset.id;
      openEditModal(gameId);
    });
  });

  document.querySelectorAll(".pdf-btn").forEach(btn => {
    btn.addEventListener("click", evt => {
      const gameId = evt.target.dataset.id;
      exportGameToPDF(gameId);
    });
  });
}

function openEditModal(gameId) {
  const game = window.GAME_LIST.find(g => g.id === gameId);
  if (!game) return;

  // show modal and populate fields
  console.log("🔧 Edit game:", game);
  // TODO — build edit UI
}

function exportGameToPDF(gameId) {
  const game = window.GAME_LIST.find(g => g.id === gameId);
  if (!game) return;

  console.log("📄 Exporting to PDF:", game);
  // TODO — hook into your existing PDF system
}

// schedule-import.js

function parseAndImport(rawText, parserKey = "generic") {
  if (!rawText) {
    console.warn("parseAndImport called without rawText.");
    return [];
  }

  const lines = rawText
    .trim()
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const games = lines.map((line, i) => {
    const parts = line.split("\t");

    return {
      id: `auto-${i}`,
      parserKey,

      // structured fields (safe defaults)
      gameNumber: parts[0] || "",
      round: parts[1] || "",
      homeTeam: parts[2] || "",
      awayTeam: parts[3] || "",
      date: parts[4] || "",
      time: parts[5] || "",
      location: parts[6] || "",
      field: parts[7] || "",
      division: parts[8] || "",

      // always keep raw
      raw: line
    };
  });

  console.log(`📊 parseAndImport → ${games.length} games`);
  return games;
}

// expose globally for both apps
window.ScheduleImport = {
  parseAndImport
};

export function setupScheduleParser({ parseBtnId, rawInputId }) {
  const parseBtn = document.getElementById(parseBtnId);
  const rawEl = document.getElementById(rawInputId);

  if (!parseBtn || !rawEl) {
    console.warn("Parser setup failed: missing DOM elements.");
    return;
  }

  parseBtn.addEventListener("click", () => {
    const raw = rawEl.value?.trim() || "";
    if (!raw) {
      alert("Paste schedule text first.");
      return;
    }

    const parserKey = localStorage.getItem("selectedScheduleParserKey") || "generic";

	const { games, errors } = ScheduleParser.parse(
	  raw,
	  window.selectedParserKey || "generic"
	);

	if (errors?.length) console.warn("Parse errors:", errors);

	// You can optionally do auto-selection logic here if needed:
	window.GAME_LIST = games;

    if (!Array.isArray(games) || games.length === 0) {
      alert("No games parsed.");
      return;
    }

    window.GAME_LIST = games;

    // Update global UI
    renderCards?.();
    updateStatusLines?.();
    updateSelectedCountUI?.();

    // Update current schedule display if present
    const schedDisplay = document.getElementById("currentScheduleDisplay");
    if (schedDisplay) {
      schedDisplay.value = JSON.stringify(games, null, 2);
    }

    // Prompt for save name based on first line of raw
    const defaultName = raw.split(/\r?\n/)[0]?.trim() || `Schedule ${new Date().toLocaleDateString()}`;
	if (typeof showSaveScheduleModal === "function") {
	console.log("[Caller] showSaveScheduleModal about to be called");

		document.addEventListener("DOMContentLoaded", () => {
		showSaveScheduleModal(defaultName);
	});
}
  });
}
document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;
  if (!name) return alert("Select a saved schedule first.");

 const schedule = ScheduleStoreV2.getScheduleByName(name);
if (!schedule) return alert("Schedule not found.");

document.getElementById("rawInput").value = schedule.rawText;

// Normalize parsed games
const parsedGames = schedule.parsedGames || [];
const selectedParserKey = schedule.parserKey || "unknown";
const normalizedGames = parsedGames.map(g =>
  normalizeParsedGame(g, selectedParserKey)
);
window.GAME_LIST = normalizedGames;

  // Update display area
  document.getElementById("currentScheduleDisplay").value =
    JSON.stringify(window.GAME_LIST, null, 2);

  // Keep parser dropdown in sync
  if (schedule.parserKey) {
    localStorage.setItem("selectedScheduleParserKey", schedule.parserKey);
    document.getElementById("parserSelect").value = schedule.parserKey;
  }

  renderCards?.();
  updateStatusLines?.();
});

