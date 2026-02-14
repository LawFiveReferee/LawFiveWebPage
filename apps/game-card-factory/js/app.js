/* ============================================================
   Game Card Factory — app.js (rebuilt, non-module, single source of truth)
   - No ES module imports
   - One initParsingControls()
   - Collapsibles always attach
   - Generic mapper keeps leading delimiters (no trim)
   - Generic mapper saved profiles supported
============================================================ */

console.log("App.js loaded");

	import { loadTemplates,
		initCarouselControls,
		refreshTemplateCarousel,
		initPdfButtons } from "../../shared/pdf-utils.js";
	import { initFilterEngine } from "../../shared/filter-engine.js";

/* ============================================================
   GLOBAL STATE
   (expose only what actually matters for shared modules)
============================================================ */
// Parser key for schedule import / parsing
// Unified current game list for views & bulk edit UI
// Parser key for schedule import / parsing
/* ============================================================
   GLOBAL STATE (single source of truth)
============================================================ */

// Current schedule parser selection
window.selectedParserIndex = 0;

// Unified game list used by rendering, filtering, bulk edit
window.GAME_LIST = [];

// Template state
window.selectedTemplateIndex = 0;
window.TEMPLATE_LIST = [];

import {
  generalFields,
  teamFields,
  refereeFields,
  officialFields,
  selectedTeamFields,
  matchResultFields
} from "../../shared/field-groups.js";

/* ============================================================
   Collapsibles (expand/collapse panels)
============================================================ */


/* ============================================================
   Generic Mapper Profiles (saved extractors)
============================================================ */
function loadSavedGenericMapperProfiles() {
	const raw = localStorage.getItem("genericMapperProfiles");
	return raw ? JSON.parse(raw) : []; // [{ key, name }]
}


/* ============================================================
   Load parsers from JSON and bind to window functions
============================================================ */

/**
 * Parse schedule text using selected parser,
 * populate global GAME_LIST, update UI and fill JSON textarea.
 */
import { handleParseSchedule } from "../../shared/utils.js";

document
  .getElementById("parseScheduleBtn")
  ?.addEventListener("click", onParseScheduleClicked);

async function onParseScheduleClicked() {
  // --- STATUS: parsing started
  updateStatusLines(
    "scheduleParseStatus",
    "Parsing schedule…",
    "info"
  );

  try {
    const games = await handleParseSchedule({
      onAfterParse: null // we handle UI updates here
    });

    if (!games || games.length === 0) {
      updateStatusLines(
        "scheduleParseStatus",
        "❌ No games found",
        "error"
      );
      return;
    }

    // --- STATUS: parsing complete
    updateStatusLines(
      "scheduleParseStatus",
      `✔ ${games.length} games extracted`,
      "success"
    );

    // --- Render + downstream UI
 	window.onSelectionChanged?.();
     updateSelectedCountUI?.();

  } catch (err) {
    console.error(err);
    updateStatusLines(
      "scheduleParseStatus",
      `❌ Parse failed: ${err.message}`,
      "error"
    );
  }
}


/* ============================================================
   Status Lines
============================================================ */


function updateGameCountUI() {
	const total = window.GAME_LIST?.length || 0;
	const selected = window.GAME_LIST?.filter(g => g.selected).length || 0;

	document.querySelectorAll(".total-game-count").forEach(el =>
		el.textContent = total
	);
	document.querySelectorAll(".selected-game-count").forEach(el =>
		el.textContent = selected
	);
}


function deleteGameById(gameId) {
	const idx = games.findIndex(g => g.id === gameId);
	if (idx < 0) return;

	games.splice(idx, 1);

	onSelectionChanged();
}

function deleteSelectedGames() {
	const list = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];

	const before = list.length;

	window.GAME_LIST = list.filter(g => !g.selected);

	const removed = before - window.GAME_LIST.length;

	if (removed > 0 && typeof window.onSelectionChanged === "function") {
		window.onSelectionChanged();
	}
}
/* ============================================================
   Render Cards
============================================================ */

export function renderGameCards() {
  const container = document.getElementById("cardsContainer");
  if (!container) return;

  const games = Array.isArray(window.GAME_LIST)
    ? window.GAME_LIST.filter(g => g.selected)
    : [];

  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "1rem";

  if (!games.length) {
    container.innerHTML = "<p>No selected games to preview.</p>";
    return;
  }

  const renderField = (label, value, alwaysShow = false) => {
    if (!value?.toString().trim() && !alwaysShow) return "";
    return `<p><strong>${label}:</strong> ${value || ""}</p>`;
  };

  const renderRefereeBlock = (referees = []) => {
    if (!Array.isArray(referees) || referees.length === 0) return "";
    return referees.map((ref, i) => {
      const parts = [
        ref.name || "(No name)",
        ref.email ? `📧 ${ref.email}` : "",
        ref.phone ? `📞 ${ref.phone}` : ""
      ].filter(Boolean).join(" &nbsp;•&nbsp; ");
      return `<p><strong>${ref.role || `Referee ${i + 1}`}:</strong> ${parts}</p>`;
    }).join("");
  };

  games.forEach((g, i) => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <h3>Game ${i + 1} — ${g.match_date || "??"} @ ${g.match_time || "??"}</h3>

      ${renderField("Game ID", g.id)}
      ${renderField("Game #", g.game_number)}

      <hr><strong>League & Competition</strong>
      ${renderField("League", g.league)}
      ${renderField("Competition", g.competition)}

      <hr><strong>Match Info</strong>
      ${renderField("Date", g.match_date, true)}
      ${renderField("Time", g.match_time, true)}
      ${renderField("Age / Division", g.age_division)}
      ${renderField("Location", g.location)}
      ${renderField("Field", g.field)}

      <hr><strong>Teams</strong>
      ${renderField("Home Team", g.home_team)}
      ${renderField("Away Team", g.away_team)}
      ${renderField("Home Colors", g.home_colors)}
      ${renderField("Away Colors", g.away_colors)}
      ${renderField("Home Coach", g.home_coach?.name)}
      ${renderField("Away Coach", g.away_coach?.name)}

      <hr><strong>Referee Crew</strong>
      ${renderRefereeBlock(g.referees)}

      <hr><strong>Officials</strong>
      ${renderField("Assigner", g.assigner?.name)}
      ${renderField("Payer", g.payer?.name)}

      ${g.notes?.trim() ? `
        <hr><strong>Notes</strong>
        <p>${g.notes}</p>
      ` : ""}

      <div class="card-actions">
        <button class="btn edit-btn" data-gameid="${g.id}">Edit</button>
        <button class="btn pdf-btn" data-gameid="${g.id}">PDF</button>
      </div>
    `;

    container.appendChild(card);
  });
}
console.log("🔥 renderGameCards running", window.GAME_LIST.length);
window.renderGameCards = renderGameCards;

import { enterEditMode } from "../../shared/ui-helpers.js";

/* ============================================================
   Edit Modal
============================================================ */
function toggleEmptyFields(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;

  const rows = [...group.querySelectorAll(".edit-row[data-edit-row]")];
  const toggleLink = group.querySelector(".edit-group-toggle");
  if (!toggleLink) return;

  // Determine mode: show all, or hide empties
  const anyHidden = rows.some(row =>
    !row.dataset.alwaysShow && row.classList.contains("hidden")
  );

  rows.forEach(row => {
    const input = row.querySelector("input, textarea");

    // Always show rows marked as always-show
    if (row.dataset.alwaysShow !== undefined || input?.readOnly) {
      row.classList.remove("hidden");
      return;
    }

    const val = input?.value?.trim();
    const isEmpty = !val;

    if (anyHidden) {
      // Reveal everything
      row.classList.remove("hidden");
    } else {
      // Hide only truly empty fields
      row.classList.toggle("hidden", isEmpty);
    }
  });

  // Update button text
  toggleLink.textContent = anyHidden
    ? "Hide empty fields"
    : "Show hidden fields";
}
window.toggleEmptyFields = toggleEmptyFields;

function safeVal(val) {
  return (val ?? "").toString();
}

function editRow(label, id, val, type = "text", readOnly = false, alwaysShow = false) {
  const safeValue =
    val === null || val === undefined ? "" : String(val);

  const input = `
    <input
      id="${id}"
      class="macos-input"
      type="${type}"
      value="${safeValue}"
      ${readOnly ? "readonly" : ""}
    >
  `;

  const shouldHide = !alwaysShow && safeValue.trim() === "";

  return `
    <div
      class="edit-row horizontal ${shouldHide ? "hidden" : ""}"
      data-edit-row
      ${alwaysShow ? "data-always-show" : ""}
    >
      <label for="${id}">${label}</label>
      ${input}
    </div>
  `;
}

function editTextArea(label, id, val) {
  const hiddenClass = (!val || val === "") ? "hidden" : "";
  return `
    <div class="edit-row horizontal ${hiddenClass}" data-edit-row>
      <label for="${id}">${label}</label>
      <textarea id="${id}" class="macos-input">${val}</textarea>
    </div>
  `;
}

//Helper to build a toggleable group
function editGroup(title, rowsHtml, groupId) {
  return `
    <div class="edit-group" id="${groupId}">
      <h3>${title}</h3>
      <span class="edit-group-toggle" onclick="toggleEmptyFields('${groupId}')">
        Show hidden fields
      </span>
      ${rowsHtml}
    </div>
  `;
}
 	function tickUI() {
		// let the browser paint (important for long loops)
		return new Promise(resolve => setTimeout(resolve, 0));
	}





	/* ============================================================
	   Callback used by mapping-ui.js after mapping is applied
	============================================================ */
	window.onParsedGames = function onParsedGames(parsedGames) {
		console.log(`✅ Parsed ${parsedGames.length} games from mapping`);

		// Save to window
		window.GAME_LIST = Array.isArray(parsedGames) ? parsedGames : [];

		// Render downstream UI
		onSelectionChanged();

		// Log a warning if no games are valid
		if (parsedGames.length === 0) {
			alert("Your mapping was applied, but none of the rows contained valid data (Home + Away teams).");
		}
	};

/*============================================================ */
/*Game card factory edit details*/
/*============================================================ */
import {
  buildFieldEditor,
  getValue,
  prettifyFieldLabel
} from "../../shared/ui-helpers.js";

//import { generalFields, teamFields, refereeFields, officialFields } from "../../shared/field-groups.js";
// Get value safely from nested object using dot path (e.g. "home_coach.name")


 function buildRefereeEditor(game) {
  const crew = game.referees ?? [];
  return crew.map((ref, i) => {
    const name = ref.name || "";
    const email = ref.email || "";
    const phone = ref.phone || "";

    const nameEmpty = name.trim() === "";
    const emailEmpty = email.trim() === "";
    const phoneEmpty = phone.trim() === "";

    return `
      <div class="field-wrapper ${nameEmpty ? "empty-field" : ""}" data-ref-index="${i}" data-ref-field="name">
        <label>Referee ${i + 1} (${ref.role || "Unknown"})</label>
        <input type="text" value="${name}" data-ref-index="${i}" data-ref-field="name" />
      </div>
      <div class="field-wrapper nested ${emailEmpty ? "empty-field" : ""}">
        <label>Email</label>
        <input type="email" value="${email}" data-ref-index="${i}" data-ref-field="email" />
      </div>
      <div class="field-wrapper nested ${phoneEmpty ? "empty-field" : ""}">
        <label>Phone</label>
        <input type="text" value="${phone}" data-ref-index="${i}" data-ref-field="phone" />
      </div>
    `;
  }).join("");
}
function buildMatchOfficialsEditor(game) {
  const roles = [
    { key: "assigner", label: "Assigner" },
    { key: "payer", label: "Payer" }
  ];

  return roles.map(({ key, label }) => {
    const obj = game[key] || {};
    const name = obj.name || "";
    const email = obj.email || "";
    const phone = obj.phone || "";

    const nameEmpty = name.trim() === "";
    const emailEmpty = email.trim() === "";
    const phoneEmpty = phone.trim() === "";

    return `
      <div class="field-wrapper ${nameEmpty ? "empty-field" : ""}">
        <label>${label} Name</label>
        <input type="text" value="${name}" data-field="${key}.name" />
      </div>
      <div class="field-wrapper nested ${emailEmpty ? "empty-field" : ""}">
        <label>Email</label>
        <input type="email" value="${email}" data-field="${key}.email" />
      </div>
      <div class="field-wrapper nested ${phoneEmpty ? "empty-field" : ""}">
        <label>Phone</label>
        <input type="text" value="${phone}" data-field="${key}.phone" />
      </div>
    `;
  }).join("");
}

// Generate a single editable field row

function buildEditModalContent(game) {
  return `
    <h3>Edit Game</h3>

    ${buildFieldEditor(game, generalFields)}

    <div class="group-label">Home Team</div>
    ${buildFieldEditor(game, teamFields.home)}

    <div class="group-label">Away Team</div>
    ${buildFieldEditor(game, teamFields.away)}

 //  <div class="group-label">Referees</div>
 //   ${buildFieldEditor(game, refereeFields)}

	<div class="group-label">Referee Crew</div>
	${buildRefereeEditor(game)}

	<div class="group-label">Match Officials</div>
	${buildMatchOfficialsEditor(game)}
  `;
}
window.buildEditModalContent = buildEditModalContent;

/* ============================================================
   BOOT — called by module-loader.js after DOM ready
============================================================ */
/* ============================================================
   BOOT — Game Card Factory
============================================================ */

/* ============================================================
   BOOT — Game Card Factory
============================================================ */

async function bootGameCardFactory() {
  console.log("📦 Booting Game Card Factory…");

  try {

    // Collapsibles
	if (typeof initCollapsibles === "function") {
		initCollapsibles()
		console.log("📦 initCollapsibles from boot…")
	} else {
		console.warn("initCollapsibles not found");
	}

    // Parser carousel
    if (typeof initParserCarouselControls === "function") {
      initParserCarouselControls();
    }
    window.updateMappingButtons?.();
    window.refreshParserCarousel?.();
    window.updateParserSample?.();

    // Templates
    if (typeof loadTemplates === "function") {
      await loadTemplates();
    }
    if (typeof initCarouselControls === "function") {
      initCarouselControls();
    }
    if (typeof refreshTemplateCarousel === "function") {
      refreshTemplateCarousel();
    }

    // PDFs
    if (typeof initPdfButtons === "function") {
      initPdfButtons();
    }

    // Shared filter engine
    if (typeof initFilterEngine === "function") {
      initFilterEngine();
    }

    // Bulk edit
    if (typeof window.initBulkEditControls === "function") {
      window.initBulkEditControls();
    }

    // Initial render
    window.onSelectionChanged?.();

  } catch (err) {
    console.error("Boot failed:", err);
  }

  // Schedule Save Modal
  const saveModal = document.getElementById("saveScheduleModal");
  const cancelSaveBtn = document.getElementById("saveScheduleCancelBtn");

  cancelSaveBtn?.addEventListener("click", () => {
    saveModal?.classList.add("hidden");
  });
}

window.bootGameCardFactory = bootGameCardFactory;
/* ============================================================
   DOM READY — SINGLE ENTRY POINT
============================================================ */

import { saveScheduleToStorage } from "../../shared/utils.js";

function onDomReady() {
  console.log("📦 DOM ready — Game Card Factory");

  // Boot factory
  if (typeof bootGameCardFactory === "function") {
    bootGameCardFactory();
  }

  // Shared schedule UI
  if (typeof window.initSharedScheduleUIv2 === "function") {
    window.initSharedScheduleUIv2();
  }

  // 🔥 Wire Extract button (module-safe)
  const parseBtn = document.getElementById("parseBtn");
  if (parseBtn) {
    parseBtn.addEventListener("click", handleParseSchedule);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDomReady, { once: true });
} else {
  onDomReady();
}

/* ============================================================
   Schedule Saving Section
============================================================ */

const modal = document.getElementById("saveScheduleModal");
const input = document.getElementById("saveScheduleKeyInput");
const cancelBtn = document.getElementById("saveScheduleCancelBtn");
const confirmBtn = document.getElementById("saveScheduleConfirmBtn");

cancelBtn?.addEventListener("click", () => {
  modal?.classList.add("hidden");
});

confirmBtn?.addEventListener("click", () => {
  const key = input?.value?.trim();
  const gameList = window.GAME_LIST;

  if (!key) {
    alert("Enter a schedule name.");
    return;
  }

  if (!Array.isArray(gameList) || !gameList.length) {
    alert("No games to save.");
    return;
  }

  const existing = localStorage.getItem(`schedule:${key}`);

  if (existing) {
    const choice = confirm(
      `"${key}" already exists.\n\nOK = Overwrite\nCancel = Rename`
    );

    if (!choice) {
      input.focus();
      return;
    }
  }

  localStorage.setItem(`schedule:${key}`, JSON.stringify(gameList));

  modal.classList.add("hidden");

  const loadStatus = document.getElementById("scheduleLoadStatus");
  if (loadStatus) {
    loadStatus.textContent =
      `Saved schedule "${key}" (${gameList.length} games).`;
  }
});
