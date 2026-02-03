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
   GLOBAL STATE
   (expose only what actually matters for shared modules)
============================================================ */
// Parser key for schedule import / parsing
// Unified current game list for views & bulk edit UI
// Parser key for schedule import / parsing
window.selectedParserIndex = 0;
window.selectedParserKey = null;

// Unified current game list for views & bulk edit UI
window.GAME_LIST = [];

// Templates (if used elsewhere)
window.selectedTemplateIndex = 0;
window.TEMPLATE_LIST = [];



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

function registerGenericMapperProfile(profileKey, profileName) {
	if (!profileKey) return;

const sel = document.getElementById("parserSelect");
const parserKey = sel?.value || "generic";
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

/**
 * Parse schedule text using selected parser,
 * populate global GAME_LIST, update UI and fill JSON textarea.
 */
import { handleParseSchedule } from "../../shared/utils.js";
document.getElementById("parseScheduleBtn")?.addEventListener("click", () => {
  handleParseSchedule({
    onAfterParse: () => {
      renderCards();
      updateStatusLines?.();
      updateSelectedCountUI?.();
    }
  });
});

/* ============================================================
   Parser Carousel
============================================================ */


function refreshParserCarousel() {
  const list = window.ParserStore?.getParserList?.() || [];

  const nameEl = document.getElementById("parserName");
  const descEl = document.getElementById("parserDescription");

  if (!list.length) {
    if (nameEl) nameEl.textContent = "(No parsers available)";
    if (descEl) descEl.textContent = "";
    selectedParserIndex = 0;
    selectedParserKey = null;
    return;
  }

  // Clamp index safely
  if (
    typeof selectedParserIndex !== "number" ||
    selectedParserIndex < 0 ||
    selectedParserIndex >= list.length
  ) {
    selectedParserIndex = 0;
  }

  const parser = list[selectedParserIndex];
  if (!parser) return;

  selectedParserKey = parser.key;

  // Update visible UI
  if (nameEl) {
    nameEl.textContent = parser.name || parser.key || "(Unnamed parser)";
  }

  if (descEl) {
    descEl.textContent = parser.description || "";
  }

  // Attach parser key to raw input for import logic
  const rawInputEl = document.getElementById("rawInput");
  if (rawInputEl && parser.key) {
    rawInputEl.setAttribute("data-parser-key", parser.key);
  }

  // Update mapping / delete buttons if present
  if (typeof window.updateMappingButtons === "function") {
    window.updateMappingButtons();
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
		const list = window.ParserStore?.getParserList?.() || [];
		if (!list.length) return;

		const parser = list[selectedParserIndex];
		if (!parser) return;

		// You can add UI updates here if needed (e.g., enabling/disabling buttons)
	}
	window.updateMappingButtons = updateMappingButtons;

	function selectIndex(newIndex) {
		const parserList = window.ParserStore?.getParserList?.() || [];
		if (!parserList.length) return;

		selectedParserIndex = (newIndex + parserList.length) % parserList.length;
		selectedParserKey = parserList[selectedParserIndex].key;

		const rawInputEl = document.getElementById("rawInput");
		if (rawInputEl && parserList[selectedParserIndex]) {
			rawInputEl.setAttribute("data-parser-key", parserList[selectedParserIndex].key);
		}

		refreshParserCarousel?.();
		updateMappingButtons?.();
	}

	prevBtn.addEventListener("click", () => selectIndex(selectedParserIndex - 1));
	nextBtn.addEventListener("click", () => selectIndex(selectedParserIndex + 1));

	if (deleteBtn) {
		deleteBtn.addEventListener("click", () => {
			const parserList = window.ParserStore?.getParserList?.() || [];
			if (!parserList.length) return;

			const p = parserList[selectedParserIndex];
			if (!isCustomGenericProfile(p)) return;

			const profileKey = getProfileKeyFromParser(p);
			if (!profileKey) return;

			const profileName = (p.name || "").replace(/^User Defined Mapper \(TSV\/CSV\):\s*/i, "") || profileKey;
			const ok = confirm(`Delete saved mapper "${profileName}"?`);
			if (!ok) return;

			const profiles = loadGenericMapperProfiles();
			const nextProfiles = profiles.filter(x => x && x.key !== profileKey);
			saveGenericMapperProfiles(nextProfiles);

			// Remove from in-memory list
			window.ParserStore?.removeParserByKey?.("generic-mapper:" + profileKey);

			// Update selection
			const updatedList = window.ParserStore?.getParserList?.() || [];
			if (!updatedList.length) {
				selectedParserIndex = 0;
				selectedParserKey = null;
			} else {
				selectedParserIndex = Math.min(selectedParserIndex, updatedList.length - 1);
				selectedParserKey = updatedList[selectedParserIndex].key;
			}

			refreshParserCarousel?.();
			updateMappingButtons?.();

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
	window.GAME_LIST = window.GAME_LIST || [];
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
  const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
  const container = document.getElementById("cardsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!games.length) {
    container.innerHTML = "<p>No games to display.</p>";
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

      <hr>
      <strong>League & Competition</strong>
      ${renderField("League", g.league)}
      ${renderField("Competition", g.competition)}

      <hr>
      <strong>Match Info</strong>
      ${renderField("Date", g.match_date, true)}
      ${renderField("Time", g.match_time, true)}
      ${renderField("Age / Division", g.age_division)}
      ${renderField("Location", g.location)}
      ${renderField("Field", g.field)}

      <hr>
      <strong>Teams</strong>
      ${renderField("Home Team", g.home_team)}
      ${renderField("Away Team", g.away_team)}
      ${renderField("Home Colors", g.home_colors)}
      ${renderField("Away Colors", g.away_colors)}
      ${renderField("Home Coach", g.home_coach?.name)}
      ${renderField("Away Coach", g.away_coach?.name)}

      <hr>
      <strong>Referee Crew</strong>
      ${renderRefereeBlock(g.referees)}

      <hr>
      <strong>Officials</strong>
      ${renderField("Assigner", g.assigner?.name)}
      ${renderField("Assigner Email", g.assigner?.email)}
      ${renderField("Assigner Phone", g.assigner?.phone)}
      ${renderField("Payer", g.payer?.name)}
      ${renderField("Payer Email", g.payer?.email)}
      ${renderField("Payer Phone", g.payer?.phone)}

      ${g.notes?.trim() ? `
        <hr>
        <strong>Notes</strong>
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
window.renderCards = renderCards;

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

function enterEditMode(id) {
  console.log("[enterEditMode] Called with:", id);

  const g = window.GAME_LIST?.find(x => x.id === id);
  if (!g) {
    console.warn("[enterEditMode] No game found for ID:", id);
    return;
  }
  console.log("[enterEditMode] Found game object:", g);

  g.assigner ??= { name: "", phone: "", email: "" };
  g.payer ??= { name: "", phone: "", email: "" };
  g.referees ??= [];

  const modal = document.getElementById("editModal");
  const body = document.getElementById("editModalBody");

  if (!modal) {
    console.error("[enterEditMode] Modal not found");
    return;
  }
  if (!body) {
    console.error("[enterEditMode] Modal body not found");
    return;
  }

	const refereeInputs = g.referees.map((ref, i) => `
	  ${editRow(`${ref.role || `Referee ${i + 1}`} — Name`, `editRef${i}_name`, ref.name)}
	  ${editRow(`${ref.role || `Referee ${i + 1}`} — Email`, `editRef${i}_email`, ref.email, "email")}
	  ${editRow(`${ref.role || `Referee ${i + 1}`} — Phone`, `editRef${i}_phone`, ref.phone, "tel")}
	`).join("");
  console.log("[enterEditMode] Setting modal innerHTML...");

  body.innerHTML = `
    ${editGroup("League & Competition", `
      ${editRow("League", "editLeague", g.league ?? "")}
      ${editRow("Competition", "editCompetition", g.competition ?? "")}
    `, "group-competition")}

    ${editGroup("Match Info", `
		${editRow("Game ID", "editGameId", g.id, "text", true, true)}
		${editRow("Game #", "editGameNumber", g.game_number)}
		${editRow("Date", "editDate", g.match_date, "date", false, true)}
		${editRow("Time", "editTime", g.match_time, "time", false, true)}
		${editRow("Age / Division", "editAgeDiv", g.age_division)}
		${editRow("Location", "editLocation", g.location)}
		${editRow("Field", "editField", g.field)}
		`, "group-match")}

	${editGroup("Teams", `
	  ${editRow("Home Team", "editHome", g.home_team)}
	  ${editRow("Home Coach", "editHomeCoach", g.home_coach?.name)}
	  ${editRow("Home Coach Email", "editHomeCoachEmail", g.home_coach?.email, "email")}
	  ${editRow("Home Coach Phone", "editHomeCoachPhone", g.home_coach?.phone, "tel")}
	  ${editRow("Home Asst. Coach", "editHomeAsstCoach", g.home_asst_coach?.name)}
	  ${editRow("Home Asst. Coach Email", "editHomeAsstCoachEmail", g.home_asst_coach?.email, "email")}
	  ${editRow("Home Asst. Coach Phone", "editHomeAsstCoachPhone", g.home_asst_coach?.phone, "tel")}

	  ${editRow("Away Team", "editAway", g.away_team)}
	  ${editRow("Away Coach", "editAwayCoach", g.away_coach?.name)}
	  ${editRow("Away Coach Email", "editAwayCoachEmail", g.away_coach?.email, "email")}
	  ${editRow("Away Coach Phone", "editAwayCoachPhone", g.away_coach?.phone, "tel")}
	  ${editRow("Away Asst. Coach", "editAwayAsstCoach", g.away_asst_coach?.name)}
	  ${editRow("Away Asst. Coach Email", "editAwayAsstCoachEmail", g.away_asst_coach?.email, "email")}
	  ${editRow("Away Asst. Coach Phone", "editAwayAsstCoachPhone", g.away_asst_coach?.phone, "tel")}

	  ${editRow("Home Colors", "editHomeColors", g.home_colors)}
	  ${editRow("Away Colors", "editAwayColors", g.away_colors)}
	`, "group-teams")}

    ${editGroup("Referee Crew", refereeInputs, "group-crew")}

    ${editGroup("Officials", `
      ${editRow("Assigner Name", "editAssignName", g.assigner.name ?? "")}
      ${editRow("Assigner Phone", "editAssignPhone", g.assigner.phone ?? "")}
      ${editRow("Assigner Email", "editAssignEmail", g.assigner.email ?? "")}
      ${editRow("Payer Name", "editPayerName", g.payer.name ?? "")}
      ${editRow("Payer Phone", "editPayerPhone", g.payer.phone ?? "")}
      ${editRow("Payer Email", "editPayerEmail", g.payer.email ?? "")}
    `, "group-officials")}

    ${editGroup("Notes", `
      ${editTextArea("Notes", "editNotes", g.notes ?? "")}
    `, "group-notes")}
  `;

  console.log("[enterEditMode] Showing modal");
	modal.classList.remove("hidden");
	modal.style.display = "flex"; // 👈 force visible

  const saveBtn = document.getElementById("saveEditBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");

if (saveBtn) {
  saveBtn.onclick = () => {
    saveEditChanges(id);
    modal.classList.add("hidden");
    modal.style.display = "none";
  };
}

if (cancelBtn) {
  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
    modal.style.display = "none";
  };
}
}

function saveEditChanges(id) {
  const g = window.GAME_LIST?.find(x => x.id === id);
  if (!g) return;

  g.assigner ??= { name: "", phone: "", email: "" };
  g.payer ??= { name: "", phone: "", email: "" };

  g.game_number = $("#editGameNumber")?.value?.trim() || "";
  g.match_date = $("#editDate")?.value?.trim() || "";
  g.match_time = $("#editTime")?.value?.trim() || "";
  g.age_division = $("#editAgeDiv")?.value?.trim() || "";
	g.location = $("#editLocation")?.value?.trim() || "";
	g.field = $("#editField")?.value?.trim() || "";
	g.home_team = $("#editHome")?.value?.trim() || "";
  g.away_team = $("#editAway")?.value?.trim() || "";
  g.home_colors = $("#editHomeColors")?.value?.trim() || "";
  g.away_colors = $("#editAwayColors")?.value?.trim() || "";

	g.home_coach = {
	  name: $("#editHomeCoach")?.value?.trim() || "",
	  email: $("#editHomeCoachEmail")?.value?.trim() || "",
	  phone: $("#editHomeCoachPhone")?.value?.trim() || ""
	};

	g.away_coach = {
	  name: $("#editAwayCoach")?.value?.trim() || "",
	  email: $("#editAwayCoachEmail")?.value?.trim() || "",
	  phone: $("#editAwayCoachPhone")?.value?.trim() || ""
	};
	g.home_asst_coach = {
  name: $("#editHomeAsstCoach")?.value?.trim() || "",
  email: $("#editHomeAsstCoachEmail")?.value?.trim() || "",
  phone: $("#editHomeAsstCoachPhone")?.value?.trim() || ""
};

g.away_asst_coach = {
  name: $("#editAwayAsstCoach")?.value?.trim() || "",
  email: $("#editAwayAsstCoachEmail")?.value?.trim() || "",
  phone: $("#editAwayAsstCoachPhone")?.value?.trim() || ""
};
  g.assigner.name = $("#editAssignName")?.value?.trim() || "";
  g.assigner.phone = $("#editAssignPhone")?.value?.trim() || "";
  g.assigner.email = $("#editAssignEmail")?.value?.trim() || "";

  g.payer.name = $("#editPayerName")?.value?.trim() || "";
  g.payer.phone = $("#editPayerPhone")?.value?.trim() || "";
  g.payer.email = $("#editPayerEmail")?.value?.trim() || "";

  g.league = $("#editLeague")?.value?.trim() || "";
  g.competition = $("#editCompetition")?.value?.trim() || "";

  g.notes = $("#editNotes")?.value?.trim() || "";

  // Update referees (by index)
  g.referees = g.referees.map((ref, i) => ({
    ...ref,
    name: $(`#editRef${i}_name`)?.value?.trim() || "",
    email: $(`#editRef${i}_email`)?.value?.trim() || "",
    phone: $(`#editRef${i}_phone`)?.value?.trim() || ""
  }));

  renderCards();
  updateSelectedCountUI?.();
  updateStatusLines?.();

  hideModal("editModal");
}

window.enterEditMode = enterEditMode;
window.saveEditChanges = saveEditChanges;

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
   BOOT — called by module-loader.js after DOM ready
============================================================ */
async function bootGameCardFactory() {
  try {
    // Parser dropdown
    if (typeof populateParserSelect === "function") {
      populateParserSelect();
    }

    // Collapsibles + parser carousel
    initCollapsibles();
    initParserCarouselControls();
    refreshParserCarousel();

    // Templates
    await loadTemplates();
    initCarouselControls();
    refreshTemplateCarousel();

    // PDFs
    initPdfButtons();

    // Filters & bulk edit
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
  // —————————————————————————
// Schedule Save Modal Logic
// —————————————————————————
const saveModal = document.getElementById("saveScheduleModal");
const cancelSaveBtn = document.getElementById("saveScheduleCancelBtn");


cancelSaveBtn?.addEventListener("click", () => {
  saveModal?.classList.add("hidden");
});
}

window.bootGameCardFactory = bootGameCardFactory;

/* ============================================================
   DOMContentLoaded — initialize after DOM ready
============================================================ */

 /* ============================================================
   DOM READY — SINGLE ENTRY POINT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 DOM ready — booting Game Card Factory");

  // Main boot
  if (typeof bootGameCardFactory === "function") {
    bootGameCardFactory();
  }

  // Shared schedule UI
  if (typeof window.initSharedScheduleUIv2 === "function") {
    window.initSharedScheduleUIv2();
  }

  // Collapsibles
  if (typeof initCollapsibles === "function") {
    initCollapsibles();
  }

  // Buttons
  const parseBtn = document.getElementById("parseScheduleBtn");
  const applyFilterBtn = document.getElementById("applyFilterBtn");
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  const mapBtn = document.getElementById("openMappingPanelBtn");

  if (parseBtn && typeof handleParseSchedule === "function") {
    parseBtn.addEventListener("click", handleParseSchedule);
  }


  if (applyFilterBtn && typeof applyFilter === "function") {
    applyFilterBtn.addEventListener("click", applyFilter);
  }

  if (clearFilterBtn && typeof applyFilter === "function") {
    clearFilterBtn.addEventListener("click", () => {
      const filterInput = document.getElementById("filterInput");
      if (filterInput) filterInput.value = "";
      applyFilter();
    });
  }

  if (mapBtn) {
    mapBtn.addEventListener("click", () => {
      const raw = document.getElementById("rawInput")?.value?.trim();
      if (!raw) {
        alert("Paste schedule text first.");
        return;
      }

      const delimiter = raw.includes("\t") ? "\t" : raw.includes("|") ? "|" : ",";
      const headers = raw.split(/\r?\n/)[0].split(delimiter).map(h => h.trim());

      if (typeof window.openGenericMappingUI === "function") {
        window.openGenericMappingUI(headers, "user-mapper", raw);
      } else {
        alert("Mapping UI not available.");
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const parseBtn = document.getElementById("parseScheduleBtn");
  if (parseBtn) {
    parseBtn.addEventListener("click", handleParseSchedule);
  }
});

// ============================================================
// Schedule Saving Section
// ============================================================

import { saveScheduleToStorage } from "../../shared/utils.js";

// Show save modal
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
    alert("⚠️ Enter a schedule name.");
    return;
  }

  if (!Array.isArray(gameList) || gameList.length === 0) {
    alert("⚠️ No games to save — extract a schedule first.");
    return;
  }

  saveScheduleToStorage(key, gameList);
  modal.classList.add("hidden");
});
