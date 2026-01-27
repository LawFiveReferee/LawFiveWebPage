/* ============================================================
   Game Card Factory — app.js (rebuilt, non-module, single source of truth)
   - No ES module imports
   - One initParsingControls()
   - Collapsibles always attach
   - Generic mapper keeps leading delimiters (no trim)
   - Generic mapper saved profiles supported
============================================================ */

console.log("App.js loaded");

/* ============================================================
   DOM helpers (safe even if dom-helpers.js also exists)
============================================================ */
function $(sel) {
	return document.querySelector(sel);
}

function $all(sel) {
	return Array.from(document.querySelectorAll(sel));
}

/* ============================================================
   GLOBAL-LIKE STATE (module-scoped, but exposed for debugging)
============================================================ */
let PARSER_LIST = [];
let selectedParserIndex = 0;
let selectedParserKey = null;

let games = [];
let TEMPLATE_LIST = [];
let selectedTemplateIndex = 0;

window.PARSER_LIST = PARSER_LIST;
window.selectedParserIndex = selectedParserIndex;
window.selectedParserKey = selectedParserKey;
window.games = games;
window.TEMPLATE_LIST = TEMPLATE_LIST;

/* ============================================================
   UTILITY: Unique ID for games
============================================================ */
const makeGameId = () => {
	if (window.crypto && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return "g-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
};
window.makeGameId = makeGameId;

/* ============================================================
   Shared Schedule Import and parsing
============================================================ */
const allParsers = ParserStore.loadAllParsers();
// Use `allParsers` to populate dropdowns, carousels, etc.

const { parseAndImport } = window.ScheduleImport || {};

document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const list = window.SCHEDULE_LIST || [];
  const idx = window.selectedScheduleIndex;
  if (!list.length || idx == null || !list[idx]) {
    alert("Select a schedule first.");
    return;
  }

  const sel = list[idx];
  const games = parseAndImport({
    rawText: sel.rawText,
    parserKey: sel.parserKey || "generic",
    save: false,
    name: sel.name,
    source: "saved"
  });

  window.GAME_LIST = games;

  // auto‑select a team if desired
  if (games.length > 0) {
    const firstGame = games[0];
    window.CURRENT_TEAM = firstGame.home?.teamId || firstGame.away?.teamId;
  }

  renderPreviewCards();
  updateStatusLines();
});
/* ============================================================
   UTILITY: Date / Time formatting
============================================================ */
function parseDateFlexible(raw) {
	if (!raw) return null;

	// MM/DD/YYYY
	let m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (m) return new Date(+m[3], +m[1] - 1, +m[2]);

	// YYYY-MM-DD
	m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
	if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

	return null;
}

function formatGameDate(raw) {
	if (!raw) return "";
	const d = parseDateFlexible(raw);
	if (!d || isNaN(d.getTime())) return raw;

	const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
	const months = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

	return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatGameTime(raw) {
	if (!raw) return "";
	const m = raw.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])/);
	if (!m) return raw;

	const hour = parseInt(m[1], 10);
	const mins = m[2];
	const ampm = m[3].toLowerCase();

	if (mins === "00" && hour !== 12) return `${hour} ${ampm}`;
	return `${hour}:${mins} ${ampm}`;
}

window.formatGameDate = formatGameDate;
window.formatGameTime = formatGameTime;

/* ============================================================
   Collapsibles (expand/collapse panels)
============================================================ */

function initCollapsibles() {
	const panels = Array.from(document.querySelectorAll(".collapsible-panel"));

	function initSection2FiltersOnce(panel) {
		if (!panel || panel.id !== "section-2") return;
		if (panel.dataset.filtersInitialized === "1") return;

		panel.dataset.filtersInitialized = "1";

		if (typeof window.initFilterControls === "function") {
			window.initFilterControls();
		} else {
			console.warn("initFilterControls() not found (filter-rules.js not loaded yet).");
		}
	}

	panels.forEach(panel => {
		const header = panel.querySelector(".collapsible-header");
		const icon = panel.querySelector(".collapsible-icon");
		if (!header) return;

		// Initial aria + icon state
		const initiallyOpen = panel.classList.contains("open");
		header.setAttribute("aria-expanded", initiallyOpen ? "true" : "false");
		if (icon) icon.textContent = initiallyOpen ? "−" : "+";

		// If Section 2 is already open on load, init immediately
		if (initiallyOpen) {
			initSection2FiltersOnce(panel);
		}

		header.addEventListener("click", (ev) => {
			ev.preventDefault();

			const isOpen = panel.classList.toggle("open");

			if (icon) icon.textContent = isOpen ? "−" : "+";
			header.setAttribute("aria-expanded", isOpen ? "true" : "false");

			// First open of Section 2 triggers filter UI creation
			if (isOpen) {
				initSection2FiltersOnce(panel);
			}
		});
	});
}

window.initCollapsibles = initCollapsibles;

/* ============================================================
   Generic Mapper Profiles (saved extractors)
============================================================ */
function loadSavedGenericMapperProfiles() {
	const raw = localStorage.getItem("genericMapperProfiles");
	return raw ? JSON.parse(raw) : []; // [{ key, name }]
}

function registerGenericMapperProfile(profileKey, profileName) {
	if (!profileKey) return;

	const parserKey = "generic-mapper:" + profileKey;
	const existing = PARSER_LIST.find(p => p.key === parserKey);

	if (!existing) {
		PARSER_LIST.push({
			key: parserKey,
			name: `User Defined Mapper (TSV/CSV): ${profileName}`,
			description: "User-saved column mapping profile.",
			parseFn: (raw) => window.parseGenericMapped(raw, profileKey),
			mappingProfileKey: profileKey
		});
	} else {
		existing.name = `User Defined Mapper (TSV/CSV): ${profileName}`;
		existing.description = "User-saved column mapping profile.";
		existing.parseFn = (raw) => window.parseGenericMapped(raw, profileKey);
		existing.mappingProfileKey = profileKey;
	}

	const idx = PARSER_LIST.findIndex(p => p.key === parserKey);
	if (idx >= 0) {
		selectedParserIndex = idx;
		selectedParserKey = PARSER_LIST[idx].key;
		refreshParserCarousel();
	}
}

window.registerGenericMapperProfile = registerGenericMapperProfile;

/* ============================================================
   Load parsers from JSON and bind to window functions
============================================================ */
async function loadParserList() {
	console.log("Loading parser-list.json…");

	try {
		const res = await fetch("js/parser-list.json", {
			cache: "no-store"
		});
		if (!res.ok) throw new Error("HTTP " + res.status);

		PARSER_LIST = await res.json();
		if (!Array.isArray(PARSER_LIST) || PARSER_LIST.length === 0) {
			PARSER_LIST = [];
			selectedParserIndex = 0;
			selectedParserKey = null;
			console.error("parser-list.json invalid or empty.");
			return;
		}

		// Attach parse functions
		PARSER_LIST.forEach(p => {
			const fnName = p.function;
			const fn = fnName ? window[fnName] : null;
			p.parseFn = (typeof fn === "function") ? fn : (() => []);
			if (typeof fn !== "function") {
				console.warn(`Parser function '${fnName}' not found on window.`);
			}
		});

		// Append saved Generic Mapper profiles
		const profiles = loadSavedGenericMapperProfiles();
		profiles.forEach(p => {
			PARSER_LIST.push({
				key: "generic-mapper:" + p.key,
				name: `User Defined Mapper (TSV/CSV): ${p.name}`,
				description: "User-saved column mapping profile.",
				parseFn: (raw) => window.parseGenericMapped(raw, p.key),
				mappingProfileKey: p.key
			});
		});

		// Restore previous selection
		const storedKey = localStorage.getItem("fastCardFactoryParserKey");
		if (storedKey) {
			const idx = PARSER_LIST.findIndex(p => p.key === storedKey);
			if (idx >= 0) {
				selectedParserIndex = idx;
				selectedParserKey = storedKey;
			} else {
				selectedParserIndex = 0;
				selectedParserKey = PARSER_LIST[0].key;
			}
		} else {
			selectedParserIndex = 0;
			selectedParserKey = PARSER_LIST[0].key;
		}

	} catch (err) {
		console.error("Failed to load parser-list.json:", err);
		PARSER_LIST = [];
		selectedParserIndex = 0;
		selectedParserKey = null;
	}

	window.PARSER_LIST = PARSER_LIST;
	window.selectedParserIndex = selectedParserIndex;
	window.selectedParserKey = selectedParserKey;
}

window.loadParserList = loadParserList;

/* ============================================================
   Parser Carousel
============================================================ */
function refreshParserCarousel() {
	const nameEl = document.getElementById("parserNameCarousel");
	const descEl = document.getElementById("parserDescription");
	const labelEl = document.getElementById("parserName");

	const editBtn = document.getElementById("editMappingBtn");
	const deleteBtn = document.getElementById("deleteMappingProfileBtn");

	if (!PARSER_LIST.length) {
		if (nameEl) nameEl.textContent = "(no parsers)";
		if (descEl) descEl.textContent = "";
		if (labelEl) labelEl.textContent = "(none)";

		if (editBtn) editBtn.classList.add("hidden");
		if (deleteBtn) deleteBtn.classList.add("hidden");
		return;
	}

	const p = PARSER_LIST[selectedParserIndex];

	if (nameEl) nameEl.textContent = p.name || "";
	if (descEl) descEl.textContent = p.description || "";
	if (labelEl) labelEl.textContent = p.name || "";

	// Persist selected extractor
	try {
		localStorage.setItem("fastCardFactoryParserKey", p.key);
	} catch (_) {}

	// --- Mapping buttons visibility ---
	const isGenericMapper =
		p.key === "generic-mapper" ||
		(typeof p.key === "string" && p.key.startsWith("generic-mapper:"));

	const isSavedMapper =
		(typeof p.key === "string" && p.key.startsWith("generic-mapper:"));

	// Edit Mapping shows for base mapper and saved mapper profiles
	if (editBtn) {
		if (isGenericMapper) editBtn.classList.remove("hidden");
		else editBtn.classList.add("hidden");
	}

	// Delete Mapper shows ONLY for saved mapper profiles (generic-mapper:...)
	if (deleteBtn) {
		if (isSavedMapper) deleteBtn.classList.remove("hidden");
		else deleteBtn.classList.add("hidden");
	}
}

window.refreshParserCarousel = refreshParserCarousel;

function initParserCarouselControls() {
	const prevBtn = $("#prevParser");
	const nextBtn = $("#nextParser");

	const editBtn = document.getElementById("editMappingBtn");
	const deleteBtn = document.getElementById("deleteMappingProfileBtn");

	if (!prevBtn || !nextBtn) return;

	function isGenericMapperParser(p) {
		return !!p && (
			p.key === "generic-mapper" ||
			(typeof p.key === "string" && p.key.startsWith("generic-mapper:"))
		);
	}

	function isCustomGenericProfile(p) {
		return !!p && (typeof p.key === "string" && p.key.startsWith("generic-mapper:"));
	}

	function getProfileKeyFromParser(p) {
		if (!p || typeof p.key !== "string") return null;
		if (!p.key.startsWith("generic-mapper:")) return null;
		return p.key.slice("generic-mapper:".length);
	}

	function loadGenericMapperProfiles() {
		try {
			const raw = localStorage.getItem("genericMapperProfiles");
			const arr = raw ? JSON.parse(raw) : [];
			return Array.isArray(arr) ? arr : [];
		} catch {
			return [];
		}
	}

	function saveGenericMapperProfiles(arr) {
		localStorage.setItem("genericMapperProfiles", JSON.stringify(Array.isArray(arr) ? arr : []));
	}

	function updateMappingButtons() {
		if (!PARSER_LIST.length) return;

		const p = PARSER_LIST[selectedParserIndex];

		// Edit Mapping: show for base generic mapper AND saved mapper profiles
		if (editBtn) {
			if (isGenericMapperParser(p)) editBtn.classList.remove("hidden");
			else editBtn.classList.add("hidden");
		}

		// Delete Mapper: show ONLY for saved mapper profiles (generic-mapper:xxxx)
		if (deleteBtn) {
			if (isCustomGenericProfile(p)) deleteBtn.classList.remove("hidden");
			else deleteBtn.classList.add("hidden");
		}
	}

	// Expose so other code (refreshParserCarousel) can force a UI refresh
	window.updateMappingButtons = updateMappingButtons;

	function selectIndex(newIndex) {
		if (!PARSER_LIST.length) return;

		selectedParserIndex = (newIndex + PARSER_LIST.length) % PARSER_LIST.length;
		selectedParserKey = PARSER_LIST[selectedParserIndex].key;
		// Update parser key on the raw input element
		const rawInputEl = document.getElementById("rawInput");
		if (rawInputEl && PARSER_LIST[selectedParserIndex]) {
		  rawInputEl.setAttribute(
			"data-parser-key",
			PARSER_LIST[selectedParserIndex].key
		  );
		}
		refreshParserCarousel(); // will call updateMappingButtons() too (see next patch)
		updateMappingButtons();
	}

	prevBtn.addEventListener("click", () => selectIndex(selectedParserIndex - 1));
	nextBtn.addEventListener("click", () => selectIndex(selectedParserIndex + 1));

	if (deleteBtn) {
		deleteBtn.addEventListener("click", () => {
			if (!PARSER_LIST.length) return;

			const p = PARSER_LIST[selectedParserIndex];
			if (!isCustomGenericProfile(p)) return;

			const profileKey = getProfileKeyFromParser(p);
			if (!profileKey) return;

			const profileName = (p.name || "").replace(/^User Defined Mapper \(TSV\/CSV\):\s*/i, "") || profileKey;

			const ok = confirm(`Delete saved mapper "${profileName}"?`);
			if (!ok) return;

			// Remove from localStorage
			const profiles = loadGenericMapperProfiles();
			const nextProfiles = profiles.filter(x => x && x.key !== profileKey);
			saveGenericMapperProfiles(nextProfiles);

			// Remove from in-memory list
			const removeKey = "generic-mapper:" + profileKey;
			const removedIndex = PARSER_LIST.findIndex(x => x.key === removeKey);
			if (removedIndex >= 0) PARSER_LIST.splice(removedIndex, 1);

			// Move selection safely
			if (!PARSER_LIST.length) {
				selectedParserIndex = 0;
				selectedParserKey = null;
			} else {
				selectedParserIndex = Math.min(selectedParserIndex, PARSER_LIST.length - 1);
				selectedParserKey = PARSER_LIST[selectedParserIndex].key;
			}

			refreshParserCarousel();
			updateMappingButtons();

			alert("Mapper deleted.");
		});
	}

	// Initial state
	updateMappingButtons();
}
window.initParserCarouselControls = initParserCarouselControls;

/* ============================================================
   Status Lines
============================================================ */
function updateStatusLines() {
	const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
	const total = games.length;
	const selected = games.filter(g => g.selected).length;

	const s1 = document.getElementById("status-section-1");
	const s2 = document.getElementById("status-section-2");
	const s4 = document.getElementById("status-section-4");
	updateSelectedCountUI();

	if (s1) {
		s1.textContent = total ?
			`Extracted ${total} game${total !== 1 ? "s" : ""}.` :
			"Paste schedule text and select an extractor.";
	}

	if (s2) {
		if (!total) {
			s2.textContent = "No games extracted.";
		} else if (selected === 0) {
			s2.textContent = `No games selected. (${total} extracted)`;
		} else {
			s2.textContent = `Selected ${selected} of ${total} extracted game${total !== 1 ? "s" : ""}.`;
		}
	}

	if (s4) {
		s4.textContent = total ?
			`Previewing ${selected} of ${total} game${total !== 1 ? "s" : ""}.` :
			"No games to preview.";
	}

	console.log("🔄 Status lines updated:", {
		total,
		selected
	});
}


window.updateStatusLines = updateStatusLines;

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

function updateSelectedCountUI() {
	const el = document.getElementById("selectedCount");
	if (!el) return;

	const list = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
	const selectedCount = list.filter(g => g.selected).length;

	el.textContent = String(selectedCount);
}

function deleteGameById(gameId) {
	const idx = games.findIndex(g => g.id === gameId);
	if (idx < 0) return;

	games.splice(idx, 1);
	renderCards()
	updateSelectedCountUI()
	updateStatusLines();
	updateSelectedCountUI();
	updateStatusLines();
}

function deleteSelectedGames() {
	const before = games.length;
	games = games.filter(g => !g.selected);
	window.games = games; // keep other modules in sync (filter-rules.js uses window.games)

	const removed = before - games.length;
	if (removed > 0) {
		renderCards()
		updateSelectedCountUI()
		updateStatusLines();
		updateSelectedCountUI();
		updateStatusLines();
	}
}
/* ============================================================
   Render Cards
============================================================ */
function renderCards() {
	const container = $("#cardsContainer");
	const list = window.GAME_LIST || [];
	if (!container) return;
	container.innerHTML = "";

	if (!games.length) {
		container.innerHTML = "<p>No games extracted yet.</p>";
		updateSelectedCountUI();
		updateStatusLines();
		return;
	}

	games.forEach(g => {
		const card = document.createElement("div");
		card.className = "game-card";
		card.dataset.id = g.id;

		const dateStr = formatGameDate(g.match_date);
		const timeStr = formatGameTime(g.match_time);

		const assignerText =
			g.assigner && typeof g.assigner === "object" ?
			[g.assigner.name, g.assigner.phone, g.assigner.email].filter(Boolean).join(" — ") :
			"";

		const payerText =
			g.payer && typeof g.payer === "object" ?
			[g.payer.name, g.payer.phone, g.payer.email].filter(Boolean).join(" — ") :
			"";

		card.innerHTML = `
      <div class="card-header-row">
        <input type="checkbox" class="select-box" ${g.selected ? "checked" : ""}>
        <h3>Game ${g.game_number || ""}</h3>
      </div>

      <div class="card-row"><label>Date:</label> ${dateStr}</div>
      <div class="card-row"><label>Time:</label> ${timeStr}</div>
      <div class="card-row"><label>Age/Div:</label> ${g.age_division || ""}</div>

      <div class="card-row"><label>Home:</label> ${g.home_team || ""}</div>
      <div class="card-row"><label>Home Colors:</label> ${g.home_colors || ""}</div>

      <div class="card-row"><label>Away:</label> ${g.away_team || ""}</div>
      <div class="card-row"><label>Away Colors:</label> ${g.away_colors || ""}</div>

      <div class="card-row"><label>Location:</label> ${g.location || ""}</div>
      <div class="card-row"><label>Field:</label> ${g.field || ""}</div>

      <div class="card-row"><label>Ref 1:</label> ${g.referee1 || ""}</div>
      <div class="card-row"><label>Ref 2:</label> ${g.referee2 || ""}</div>
      <div class="card-row"><label>Ref 3:</label> ${g.referee3 || ""}</div>

      <div class="card-row"><label>Assigner:</label> ${assignerText}</div>
      <div class="card-row"><label>Payer:</label> ${payerText}</div>

      <div class="card-row"><label>Notes:</label> ${g.notes || ""}</div>

     <div class="card-buttons">
	  <button class="secondary editBtn">Edit</button>
	  <button class="secondary singlePdfBtn">PDF</button>
	  <button class="secondary deleteGameBtn">Delete</button>
	</div>
    `;

		const checkbox = card.querySelector(".select-box");
		if (checkbox) {
			checkbox.addEventListener("change", e => {
				g.selected = e.target.checked;
				updateSelectedCountUI();
				updateStatusLines();
			});
		}

		const editBtn = card.querySelector(".editBtn");
		if (editBtn) editBtn.addEventListener("click", () => enterEditMode(g.id));

		const pdfBtn = card.querySelector(".singlePdfBtn");
		if (pdfBtn) pdfBtn.addEventListener("click", () => generateSinglePdfById(g.id));
		// ✅ DELETE BUTTON — MUST BE HERE
		const delBtn = card.querySelector(".deleteGameBtn");
		if (delBtn) {
			delBtn.addEventListener("click", () => {
				const ok = confirm(`Delete this game?`);
				if (!ok) return;
				deleteGameById(g.id);
			});
		}
		container.appendChild(card);
	});
	updateSelectedCountUI();

	updateStatusLines();
}

window.renderCards = renderCards;

/* ============================================================
   Edit Modal
============================================================ */
function editRow(label, id, val, type = "text") {
	return `
    <div class="edit-row">
      <label>${label}</label>
      <input id="${id}" class="macos-input" type="${type}" value="${val || ""}">
    </div>
  `;
}

function enterEditMode(id) {
	const g = games.find(x => x.id === id);
	if (!g) return;

	if (typeof g.assigner !== "object" || !g.assigner) g.assigner = {
		name: "",
		phone: "",
		email: ""
	};
	if (typeof g.payer !== "object" || !g.payer) g.payer = {
		name: "",
		phone: "",
		email: ""
	};

	const modal = $("#editModal");
	const body = $("#editModalBody");
	if (!modal || !body) return;

	body.innerHTML = `
    ${editRow("Game #",          "editGameNumber",  g.game_number)}
    ${editRow("Date",            "editDate",        g.match_date, "date")}
    ${editRow("Time",            "editTime",        g.match_time)}
    ${editRow("Age/Div",         "editAgeDiv",      g.age_division)}
    ${editRow("Home Team",       "editHome",        g.home_team)}
    ${editRow("Away Team",       "editAway",        g.away_team)}
    ${editRow("Location",        "editLocation",    g.location)}
    ${editRow("Field",           "editField",       g.field)}
    ${editRow("Home Colors",     "editHomeColors",  g.home_colors)}
    ${editRow("Away Colors",     "editAwayColors",  g.away_colors)}
    ${editRow("Ref 1",           "editRef1",        g.referee1)}
    ${editRow("Ref 2",           "editRef2",        g.referee2)}
    ${editRow("Ref 3",           "editRef3",        g.referee3)}

    ${editRow("Assigner Name",   "editAssignName",  g.assigner.name)}
    ${editRow("Assigner Phone",  "editAssignPhone", g.assigner.phone)}
    ${editRow("Assigner Email",  "editAssignEmail", g.assigner.email)}

    ${editRow("Payer Name",      "editPayerName",   g.payer.name)}
    ${editRow("Payer Phone",     "editPayerPhone",  g.payer.phone)}
    ${editRow("Payer Email",     "editPayerEmail",  g.payer.email)}

    <div class="edit-row">
      <label>Notes</label>
      <textarea id="editNotes" class="macos-input" rows="3">${g.notes || ""}</textarea>
    </div>
  `;

	modal.style.display = "flex";

	const saveBtn = $("#saveEditBtn");
	const cancelBtn = $("#cancelEditBtn");

	if (saveBtn) saveBtn.onclick = () => saveEditChanges(id);
	if (cancelBtn) cancelBtn.onclick = () => {
		modal.style.display = "none";
	};
}

function saveEditChanges(id) {
	const g = games.find(x => x.id === id);
	if (!g) return;

	if (typeof g.assigner !== "object" || !g.assigner) g.assigner = {
		name: "",
		phone: "",
		email: ""
	};
	if (typeof g.payer !== "object" || !g.payer) g.payer = {
		name: "",
		phone: "",
		email: ""
	};

	g.game_number = $("#editGameNumber")?.value?.trim() || "";
	g.match_date = $("#editDate")?.value?.trim() || "";
	g.match_time = $("#editTime")?.value?.trim() || "";
	g.age_division = $("#editAgeDiv")?.value?.trim() || "";
	g.home_team = $("#editHome")?.value?.trim() || "";
	g.away_team = $("#editAway")?.value?.trim() || "";
	g.location = $("#editLocation")?.value?.trim() || "";
	g.field = $("#editField")?.value?.trim() || "";
	g.home_colors = $("#editHomeColors")?.value?.trim() || "";
	g.away_colors = $("#editAwayColors")?.value?.trim() || "";
	g.referee1 = $("#editRef1")?.value?.trim() || "";
	g.referee2 = $("#editRef2")?.value?.trim() || "";
	g.referee3 = $("#editRef3")?.value?.trim() || "";

	g.assigner.name = $("#editAssignName")?.value?.trim() || "";
	g.assigner.phone = $("#editAssignPhone")?.value?.trim() || "";
	g.assigner.email = $("#editAssignEmail")?.value?.trim() || "";

	g.payer.name = $("#editPayerName")?.value?.trim() || "";
	g.payer.phone = $("#editPayerPhone")?.value?.trim() || "";
	g.payer.email = $("#editPayerEmail")?.value?.trim() || "";

	g.notes = $("#editNotes")?.value?.trim() || "";

	renderCards()
	updateSelectedCountUIupdateStatusLines()
		();
	updateSelectedCountUI();
	updateStatusLines();

	const modal = $("#editModal");
	if (modal) modal.style.display = "none";
}

window.enterEditMode = enterEditMode;
window.saveEditChanges = saveEditChanges;

/* ============================================================
   Parsing Controls (single, clean)
============================================================ */
function initParsingControls() {
	const parseBtn = $("#parseBtn");
	const clearBtn = $("#clearBtn");
	const rawEl = $("#rawInput");
	const statusEl = $("#parseStatus");

	if (!rawEl) return;

	document.getElementById("saveScheduleBtn")?.addEventListener("click", () => {
	  const rawInput = document.getElementById("rawInput")?.value?.trim();
	  if (!rawInput) return alert("Nothing to save — paste or select a schedule first.");
	  const name = prompt("Enter a name for this schedule:");
	  if (!name) return;
	  const parserKey = selectedParserKey || "generic";
	  const schedules = JSON.parse(localStorage.getItem("savedSchedules") || "[]");
	  schedules.push({ name, rawText: rawInput, parserKey });
	  localStorage.setItem("savedSchedules", JSON.stringify(schedules));
	  alert("Saved.");
	});
	/* ----------------------------
	   EDIT MAPPING BUTTON
	---------------------------- */
	const editMappingBtn = document.getElementById("editMappingBtn");
	if (editMappingBtn) {
		editMappingBtn.addEventListener("click", () => {
			const rawEl = document.getElementById("rawInput");
			if (!rawEl) return;

			// Preserve leading delimiters; only trim the end
			const raw = (rawEl.value || "").trimEnd();

			if (!raw) {
				alert("Paste schedule text first.");
				return;
			}

			const delimiter =
				raw.includes("\t") ? "\t" :
				raw.includes("|") ? "|" :
				",";

			// Preserve leading delimiter by not trimming the line itself
			const lines = raw.split(/\r?\n/).filter(l => (l || "").trim().length > 0);
			const headers = (lines[0] || "").split(delimiter).map(h => (h ?? "").trim());

			window.openGenericMappingUI(headers, "generic-default-profile", raw);
		});
	}
	/* ----------------------------
	   PARSE BUTTON
	---------------------------- */
if (parseBtn) {
 document.getElementById("parseBtn")?.addEventListener("click", () => {
	const rawInputEl = document.getElementById("rawInput");
	const raw = rawInputEl?.value.trim() || "";

	if (!raw) {
		alert("Paste schedule text first.");
		return;
	}

	const games = window.ScheduleStore.importSchedule({
		rawText: raw,
		source: "paste",
		autoSelect: true
	});

	if (!Array.isArray(games) || games.length === 0) {
		return;
	}

	// Update UI
	renderPreviewCards();
	updateStatusLines?.();

	// Prompt to save schedule
	if (Array.isArray(parsed) && parsed.length > 0) {
	  const defaultName = rawOriginal.split(/\r?\n/)[0]?.trim() || `Schedule ${new Date().toLocaleDateString()}`;
	  const name = prompt("Enter a name for this schedule:", defaultName);
	  if (name && name.trim()) {
		window.ScheduleStore.addOrUpdateSchedule({
		  name: name.trim(),
		  parserKey: selectedParserKey,
		  rawText: rawOriginal,
		  parsedGames: parsed
		});
		window.refreshScheduleDropdown?.();
		alert(`Schedule "${name.trim()}" saved.`);
	  }
	}
	// Auto‑select first team if none selected
	const currentTeam = window.TeamStore?.getCurrentTeam?.();
	const allTeams = window.TeamStore?.getAllTeams?.() || [];
	if (!currentTeam && allTeams.length > 0) {
		console.log("🟢 No team selected — auto‑selecting first team");
		window.TeamStore.selectTeamById(allTeams[0].teamId);
		renderCurrentTeamUI();
	}
});

// — Delete Saved Schedule —
// — Delete Saved Schedule —
document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;
  if (!name) {
    alert("Select a schedule first.");
    return;
  }
  if (!confirm(`Delete schedule "${name}"?`)) return;

  window.ScheduleStore.deleteScheduleByName(name);
  window.refreshScheduleDropdown?.();
});

// — Rename Schedule —
document.getElementById("renameScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const oldName = sel?.value;
  if (!oldName) {
    alert("Select a schedule first.");
    return;
  }

  const newName = prompt("Enter a new name:", oldName);
  if (!newName || newName.trim() === "" || newName === oldName) return;

  const schedule = window.ScheduleStore.getScheduleByName(oldName);
  if (!schedule) return;

  window.ScheduleStore.deleteScheduleByName(oldName);
  schedule.name = newName.trim();
  window.ScheduleStore.addOrUpdateSchedule(schedule);

  window.refreshScheduleDropdown?.();
  sel.value = newName.trim();
});

// — Schedule Parse —
document.getElementById("parseBtn")?.addEventListener("click", () => {
  const rawInputEl = document.getElementById("rawInput");
  const raw = rawInputEl?.value.trim() || "";

  if (!raw) {
    alert("Paste schedule text first.");
    return;
  }

  const games = window.ScheduleStore.importSchedule({
    rawText: raw,
    source: "paste",
    autoSelect: true
  });

  if (!Array.isArray(games) || games.length === 0) {
    alert("No games parsed.");
    return;
  }

  // ✅ Prompt user to save
  const defaultName = raw.split(/\r?\n/)[0]?.trim() || `Schedule ${new Date().toLocaleDateString()}`;
  const name = prompt("Enter a name for this schedule:", defaultName);

  if (name && name.trim()) {
    window.ScheduleStore.addOrUpdateSchedule({
      name: name.trim(),
      parserKey: window.selectedParserKey || "generic",
      rawText: raw,
      parsedGames: games
    });
    window.refreshScheduleDropdown?.();
    alert(`Schedule "${name.trim()}" saved.`);
  }

  renderCards();
  updateStatusLines();
  updateSelectedCountUI();
});


	/* ----------------------------
	   CLEAR BUTTON
	---------------------------- */
	if (clearBtn) {
		clearBtn.disabled = true;

		clearBtn.addEventListener("click", () => {
			if (!confirm("Clear ALL games?")) return;

			games.length = 0;
			rawEl.value = "";
			if (statusEl) statusEl.textContent = "";
			clearBtn.disabled = true;

			renderCards()
			updateStatusLines()
			updateSelectedCountUI();
			updateSelectedCountUI();
			updateStatusLines();
		});
	}
}
}
window.initParsingControls = initParsingControls;

/* ============================================================
   Template Carousel + PDF helpers (kept from your version)
============================================================ */
async function loadTemplates() {
	const status = $("#templateStatus");
	try {
		const resp = await fetch("templates.json", {
			cache: "no-store"
		});
		if (!resp.ok) throw new Error("HTTP " + resp.status);

		TEMPLATE_LIST = await resp.json();
		window.TEMPLATE_LIST = TEMPLATE_LIST;

		const storedId = localStorage.getItem("fastCardFactoryTemplateId");
		if (storedId) {
			const idx = TEMPLATE_LIST.findIndex(t => String(t.id) === String(storedId));
			if (idx >= 0) selectedTemplateIndex = idx;
		}

		if (status) status.textContent = `Loaded ${TEMPLATE_LIST.length} template(s).`;
	} catch (err) {
		console.error("Error loading templates.json:", err);
		TEMPLATE_LIST = [];
		window.TEMPLATE_LIST = TEMPLATE_LIST;
		if (status) status.textContent = "Error loading templates.";
	}
}

function refreshTemplateCarousel() {
	const status = $("#templateStatus");
	if (!TEMPLATE_LIST.length) {
		if (status) status.textContent = "No templates loaded yet.";
		return;
	}

	const tpl = TEMPLATE_LIST[selectedTemplateIndex];

	const img = $("#templateImage");
	const nameEl = $("#templateName");

	if (img) img.src = `./templates/${tpl.png}`;
	if (nameEl) nameEl.textContent = tpl.name || "";

	if (status) status.textContent = `Template ${selectedTemplateIndex + 1} of ${TEMPLATE_LIST.length}`;

	localStorage.setItem("fastCardFactoryTemplateId", tpl.id);
}

function initCarouselControls() {
	const prev = $("#prevTemplate");
	const next = $("#nextTemplate");

	if (prev) {
		prev.addEventListener("click", () => {
			if (!TEMPLATE_LIST.length) return;
			selectedTemplateIndex = (selectedTemplateIndex - 1 + TEMPLATE_LIST.length) % TEMPLATE_LIST.length;
			refreshTemplateCarousel();
		});
	}

	if (next) {
		next.addEventListener("click", () => {
			if (!TEMPLATE_LIST.length) return;
			selectedTemplateIndex = (selectedTemplateIndex + 1) % TEMPLATE_LIST.length;
			refreshTemplateCarousel();
		});
	}
}

/* ============================================================
   PDF generation (your existing functions rely on PDFLib, JSZip, saveAs)
   Kept function names you already call: generateSinglePdfById, generateCombinedPdf, generateIndividualPdfs
============================================================ */

function buildFieldValuesFromGame(g) {
	if (!g.assigner || typeof g.assigner !== "object") g.assigner = {
		name: "",
		phone: "",
		email: ""
	};
	if (!g.payer || typeof g.payer !== "object") g.payer = {
		name: "",
		phone: "",
		email: ""
	};

	const assignerText = [g.assigner.name, g.assigner.phone, g.assigner.email].filter(Boolean).join(" — ");
	const payerText = [g.payer.name, g.payer.phone, g.payer.email].filter(Boolean).join(" — ");

	let ref1 = g.referee1 || "";
	let ref2 = g.referee2 || "";
	let ref3 = g.referee3 || "";

	let lbl1 = "";
	let lbl2 = "";
	let lbl3 = "";

	if ((ref1 && ref2 && !ref3) || (g._arbiterTwoManCrew === true)) {
		lbl1 = "Sr. Referee";
		lbl2 = "";
		lbl3 = "Jr. Referee";
		ref3 = ref2;
		ref2 = "";
	} else if (ref1 && ref2 && ref3) {
		lbl1 = "Referee";
		lbl2 = "AR1";
		lbl3 = "AR2";
	} else if (ref1 && !ref2 && !ref3) {
		lbl1 = "Referee";
		lbl2 = "";
		lbl3 = "";
	} else {
		lbl1 = ref1 ? "Referee" : "";
		lbl2 = ref2 ? "AR1" : "";
		lbl3 = ref3 ? "AR2" : "";
	}

	return {
		GameNumber: g.game_number || "",
		GameDate: formatGameDate(g.match_date),
		GameTime: formatGameTime(g.match_time),
		GameLocationField: `${g.location || ""}${g.field ? " — " + g.field : ""}`,
		GameAgeDivision: g.age_division || "",

		HomeNameCoach: g.home_team || "",
		VisitorNameCoach: g.away_team || "",

		centerReferee: ref1,
		assistantReferee1: ref2,
		assistantReferee2: ref3,

		RefLabel1: lbl1,
		RefLabel2: lbl2,
		RefLabel3: lbl3,

		Assigner: assignerText,
		Payer: payerText,

		GameAdditionalInfo: g.notes || ""
	};
}

async function fillTemplatePdfForGame(templateBytes, tpl, g) {
	const srcDoc = await PDFLib.PDFDocument.load(templateBytes);
	const form = srcDoc.getForm();

	const fields = form.getFields();
	const fieldNames = fields.map(f => f.getName());

	fields.forEach(f => {
		try {
			f.setText("");
		} catch (e) {}
	});

	const vals = buildFieldValuesFromGame(g);
	for (const [k, v] of Object.entries(vals)) {
		if (fieldNames.includes(k)) {
			try {
				form.getTextField(k).setText(v || "");
			} catch (e) {}
		}
	}

	form.flatten();
	return await srcDoc.save();
}

async function generateSinglePdf(g) {
	if (!g) return;

	if (!TEMPLATE_LIST.length) {
		alert("No templates loaded.");
		return;
	}

	const tpl = TEMPLATE_LIST[selectedTemplateIndex];
	const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`).then(r => r.arrayBuffer());

	const finalBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
	saveAs(new Blob([finalBytes], {
		type: "application/pdf"
	}), `Game-${g.game_number || "Match"}.pdf`);
}

async function generateSinglePdfById(gameId) {
	const status = $("#generateStatus");
	if (status) status.textContent = "Generating single-game PDF…";

	try {
		const g = games.find(x => x.id === gameId);
		if (!g) {
			if (status) status.textContent = "Error: game not found.";
			return;
		}
		await generateSinglePdf(g);
		if (status) status.textContent = "Single-game PDF generated.";
	} catch (err) {
		console.error("Error generating single-game PDF:", err);
		if (status) status.textContent = "Error generating single-game PDF.";
	}
}

window.generateSinglePdfById = generateSinglePdfById;
/* ============================================================
   PDF Progress UI helpers
============================================================ */
function getPdfProgressEls() {
	return {
		wrap: document.getElementById("pdfProgressWrap"),
		spin: document.getElementById("pdfSpinner"),
		text: document.getElementById("pdfProgressText"),
		barW: document.getElementById("pdfProgressBarWrap"),
		fill: document.getElementById("pdfProgressFill"),
		count: document.getElementById("pdfProgressCount")
	};
}

function pdfProgressShow(total, message) {
	const els = getPdfProgressEls();
	if (!els.wrap) return;

	els.wrap.classList.remove("hidden");

	if (els.text) els.text.textContent = message || "Working…";

	// If > 10 items, show progress bar + count. Otherwise just spinner + text.
	const showBar = total > 10;

	if (els.barW) {
		if (showBar) els.barW.classList.remove("hidden");
		else els.barW.classList.add("hidden");
	}

	if (els.spin) {
		els.spin.classList.remove("hidden");
	}

	if (els.fill) els.fill.style.width = "0%";
	if (els.count) els.count.textContent = `0 / ${total}`;
}

function pdfProgressUpdate(done, total, message) {
	const els = getPdfProgressEls();
	if (!els.wrap) return;

	const safeTotal = Math.max(1, total);
	const pct = Math.max(0, Math.min(100, Math.round((done / safeTotal) * 100)));

	if (els.text && message) els.text.textContent = message;

	if (total > 10) {
		if (els.fill) els.fill.style.width = `${pct}%`;
		if (els.count) els.count.textContent = `${done} / ${total}`;
	} else {
		// For <= 10, keep it simple and show “Processing x of y”
		if (els.text) {
			els.text.textContent = message || `Processing ${done} of ${total}…`;
		}
	}
}

function pdfProgressHide() {
	const els = getPdfProgressEls();
	if (!els.wrap) return;

	els.wrap.classList.add("hidden");
}

function tickUI() {
	// let the browser paint (important for long loops)
	return new Promise(resolve => setTimeout(resolve, 0));
}

async function generateCombinedPdf() {
	const selected = games.filter(g => g.selected);
	if (!selected.length) {
		alert("No games selected.");
		return;
	}
	if (!TEMPLATE_LIST.length) {
		alert("No templates loaded.");
		return;
	}

	const status = $("#generateStatus");
	if (status) status.textContent = "Generating combined PDF…";

	pdfProgressShow(selected.length, "Preparing combined PDF…");
	await tickUI();

	try {
		const tpl = TEMPLATE_LIST[selectedTemplateIndex];

		const [templateBytes, backgroundBytes] = await Promise.all([
			fetch(`./templates/${tpl.pdf}?v=${Date.now()}`).then(r => r.arrayBuffer()),
			fetch("./templates/letter-background.pdf").then(r => r.arrayBuffer())
		]);

		const bgDoc = await PDFLib.PDFDocument.load(backgroundBytes);
		const outDoc = await PDFLib.PDFDocument.create();

		const embeddedCards = [];
		let done = 0;
		const total = selected.length;

		for (const g of selected) {
			const cardBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
			const cleaned = await PDFLib.PDFDocument.load(cardBytes);
			const [page] = await cleaned.copyPages(cleaned, [0]);
			const embedded = await outDoc.embedPage(page);
			embeddedCards.push(embedded);

			done += 1;
			pdfProgressUpdate(done, total, `Processing ${done} of ${total}…`);
			if (done % 2 === 0) await tickUI();
		}

		// hard-coded positions for two 6x4-ish cards on letter
		const TOP = {
			x: 72,
			y: 432
		};
		const BOTTOM = {
			x: 72,
			y: 72
		};

		for (let i = 0; i < embeddedCards.length; i += 2) {
			const [bgPage] = await outDoc.copyPages(bgDoc, [0]);
			const outPage = outDoc.addPage(bgPage);

			outPage.drawPage(embeddedCards[i], TOP);
			if (embeddedCards[i + 1]) {
				outPage.drawPage(embeddedCards[i + 1], BOTTOM);
			}

			if (i % 4 === 0) await tickUI();
		}

		const finalBytes = await outDoc.save();
		saveAs(new Blob([finalBytes], {
			type: "application/pdf"
		}), "MatchCards.pdf");

		if (status) status.textContent = `Combined PDF generated for ${selected.length} game(s).`;
	} catch (err) {
		console.error("Error generating combined PDF:", err);
		if (status) status.textContent = "Error generating combined PDF.";
		alert("Error generating combined PDF. Check console for details.");
	} finally {
		pdfProgressHide();
	}
}


window.generateCombinedPdf = generateCombinedPdf;

async function generateIndividualPdfs() {
	const selected = games.filter(g => g.selected);
	if (!selected.length) {
		alert("No games selected.");
		return;
	}
	if (!TEMPLATE_LIST.length) {
		alert("No templates loaded.");
		return;
	}

	const status = $("#generateStatus");
	if (status) status.textContent = "Generating individual PDFs…";

	pdfProgressShow(selected.length, "Preparing PDFs…");
	await tickUI();

	try {
		const tpl = TEMPLATE_LIST[selectedTemplateIndex];
		const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`)
			.then(r => r.arrayBuffer());

		// Single PDF path (still show spinner briefly)
		if (selected.length === 1) {
			const g = selected[0];
			pdfProgressUpdate(1, 1, "Generating PDF…");
			await tickUI();

			const finalBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
			saveAs(new Blob([finalBytes], {
				type: "application/pdf"
			}), `Game-${g.game_number || "Match"}.pdf`);

			if (status) status.textContent = "Single PDF generated.";
			return;
		}

		const zip = new JSZip();

		let done = 0;
		const total = selected.length;

		for (const g of selected) {
			const finalBytes = await fillTemplatePdfForGame(templateBytes, tpl, g);
			const filename = `Game-${g.game_number || "Match"}.pdf`;
			zip.file(filename, finalBytes);

			done += 1;
			pdfProgressUpdate(done, total, `Processing ${done} of ${total}…`);

			// Yield periodically so the UI can paint
			if (done % 2 === 0) await tickUI();
		}

		pdfProgressUpdate(total, total, "Packaging ZIP…");
		await tickUI();

		const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
		const zipBlob = await zip.generateAsync({
			type: "blob"
		});
		saveAs(zipBlob, `MatchCards-${stamp}.zip`);

		if (status) status.textContent = `Generated ${selected.length} PDFs (zipped).`;
	} catch (err) {
		console.error("Error generating individual PDFs:", err);
		if (status) status.textContent = "Error generating individual PDFs.";
		alert("Error generating individual PDFs. Check console for details.");
	} finally {
		pdfProgressHide();
	}
}

window.generateIndividualPdfs = generateIndividualPdfs;

function initPdfButtons() {
	const combinedBtn = $("#generateCombinedBtn");
	const indivBtn = $("#generateIndividualBtn");

	if (combinedBtn) {
		combinedBtn.addEventListener("click", () => {
			generateCombinedPdf().catch(err => {
				console.error(err);
				const s = $("#generateStatus");
				if (s) s.textContent = "Error generating combined PDF.";
			});
		});
	}

	if (indivBtn) {
		indivBtn.addEventListener("click", () => {
			generateIndividualPdfs().catch(err => {
				console.error(err);
				const s = $("#generateStatus");
				if (s) s.textContent = "Error generating individual PDFs.";
			});
		});
	}
}

window.initPdfButtons = initPdfButtons;

/* ============================================================
   Callback used by mapping-ui.js after mapping is applied
============================================================ */
window.onParsedGames = function onParsedGames(parsedGames) {
	console.log(`✅ Parsed ${parsedGames.length} games from mapping`);

	// Save to window
	window.GAME_LIST = Array.isArray(parsedGames) ? parsedGames : [];

	// Render downstream UI
	updateStatusLines();
	renderCards()
	updateSelectedCountUI()
	updateStatusLines(); // Optional: refresh game list table
	renderGamePreview(); // Rebuild preview panel

	// Log a warning if no games are valid
	if (parsedGames.length === 0) {
		alert("Your mapping was applied, but none of the rows contained valid data (Home + Away teams).");
	}
};

/* ============================================================
   DOMContentLoaded — initialize in correct order
============================================================ */
/* ============================================================
   BOOT — called by module-loader.js after DOM ready
============================================================ */
async function bootGameCardFactory() {
	try {
		await loadParserList();

		initCollapsibles();

		initParserCarouselControls();
		refreshParserCarousel();

		initParsingControls();

		await loadTemplates();
		initCarouselControls();
		refreshTemplateCarousel();

		initPdfButtons();

		if (typeof window.initFilterControls === "function") {
			window.initFilterControls();
		}

		if (typeof window.initBulkEditControls === "function") {
			window.initBulkEditControls();
		}
		updateSelectedCountUI();

		updateStatusLines();
	} catch (err) {
		console.error("Boot failed:", err);
	}
}
window.bootGameCardFactory = bootGameCardFactory;
// ————————————————
// MAPPING PANEL BUTTON SETUP
// ————————————————

document.addEventListener("DOMContentLoaded", () => {
	// Populate saved schedule dropdown
	window.refreshScheduleDropdown?.();
	const btn = document.getElementById("openMappingPanelBtn");
	// — Load Saved Schedule —
document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;
  if (!name) return alert("Select a saved schedule first.");

  const schedule = window.ScheduleStore.getScheduleByName(name);
  if (!schedule) return alert("Schedule not found.");

  // Put raw text into textarea
  document.getElementById("rawInput").value = schedule.rawText;

  // Try to restore parser UI (if you choose)
  if (schedule.parserKey && typeof selectParserByKey === "function") {
    selectParserByKey(schedule.parserKey);
  }

  // Apply parsed games
  window.GAME_LIST = schedule.parsedGames || [];

  // Update UI
  renderPreviewCards?.();
  document.getElementById("status-section-1").textContent =
    `Loaded schedule: ${name}`;
});

// — Delete Saved Schedule —
document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;
  if (!name) return alert("Select a schedule first.");
  if (!confirm(`Delete schedule "${name}"?`)) return;

  window.ScheduleStore.deleteScheduleByName(name);
  window.refreshScheduleDropdown?.();
});


// ----------------------------
// FILTER LOGIC (OUTSIDE DOM READY)
// ----------------------------
function applyFilter() {
  const keyword =
    document.getElementById("filterInput")?.value?.toLowerCase() || "";

  if (!Array.isArray(window.GAME_LIST)) return;

  window.GAME_LIST.forEach(game => {
    const match =
      game.home_team?.toLowerCase().includes(keyword) ||
      game.away_team?.toLowerCase().includes(keyword) ||
      game.age_division?.toLowerCase().includes(keyword) ||
      game.location?.toLowerCase().includes(keyword);

    game.selected = match;
  });

  updateGameCountUI();
  renderCards();
  renderGamePreview();
  updateStatusLines();
  updateSelectedCountUI();
}
