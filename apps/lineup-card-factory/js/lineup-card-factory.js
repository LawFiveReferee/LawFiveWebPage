/* ============================================================
   Lineup Card Factory — lineup-card-factory.js
============================================================ */
import("../../shared/pdf-utils.js").then(module => {
	window.validatePdfTemplate = module.validatePdfTemplate;
});

console.log("Lineup Card Factory loaded…");


/* ============================================================
   GLOBAL STATE
============================================================ */
window.GAME_LIST = [];
const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
window.games = games;


window.TEMPLATE_LIST = [];
window.selectedTemplateIndex = 0;
window.ROSTER_LIST = [];

import {
  generalFields,
  teamFields,
  refereeFields,
  officialFields,
  selectedTeamFields,
  matchResultFields
} from "../../shared/field-groups.js";

import {
  getSavedScheduleKeys,
  loadScheduleFromStorage,
  deleteScheduleFromStorage,
  refreshScheduleDropdown
} from "../../shared/utils.js";
/* ============================================================
   Shared schedule import and parsing
============================================================ */
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

const {
	parseAndImport
} = window.ScheduleImport || {};

import { enterEditMode } from "../../shared/ui-helpers.js";
 // Ensure it’s globally accessible
window.enterEditMode = enterEditMode;

// 🧹 Clear existing listeners so we donʼt double‑add
const oldBtn = document.getElementById("addPlayerBtn");
if (oldBtn) {
	const newBtn = oldBtn.cloneNode(true);
	oldBtn.parentNode.replaceChild(newBtn, oldBtn);
}

// ➕ Add player button

document.getElementById("addPlayerBtn")?.addEventListener("click", () => {
	console.log("➕ Add Player clicked");

	// First sync current UI roster so we donʼt lose edits
	const currentRoster = Array.from(document.querySelectorAll(".roster-row")).map(row => ({
		number: row.querySelector(".roster-number-input")?.value.trim() || "",
		name: row.querySelector(".roster-name-input")?.value.trim() || ""
	}));
	window.ROSTER_LIST = currentRoster;

	// Now add exactly ONE new player
	window.ROSTER_LIST.push({
		number: "",
		name: ""
	});

	// Render
	window.renderRosterTable(window.ROSTER_LIST);

	// Focus the new rowʼs number field
	const lastIndex = window.ROSTER_LIST.length - 1;
	const input = document.querySelector(`.roster-number-input[data-index="${lastIndex}"]`);
	if (input) input.focus();
});

/* ============================================================
   Render Cards
============================================================ */
function renderCards() {
  const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
  const container = document.getElementById("previewCardContainer");
  if (!container) return;

  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "1rem";

  const selectedTeam = window.TeamStore.getCurrentTeam();
  if (!selectedTeam) {
    container.innerHTML = "<p>No team selected. Please select a team to view lineup cards.</p>";
    return;
  }

  const selectedTeamId = selectedTeam.teamId?.trim();
  const selectedTeamName = selectedTeam.teamName?.trim().toLowerCase();

  const getTeamInfoByIdOrName = (id, name) => {
    const teams = window.TeamStore.getAllTeams();
    return (
      teams.find(t => t.teamId === id) ||
      teams.find(t => t.teamName?.trim().toLowerCase() === name?.trim().toLowerCase()) ||
      {}
    );
  };

  let renderedCount = 0;

  games.forEach((g, i) => {
    const homeName = g.home_team?.trim().toLowerCase();
    const awayName = g.away_team?.trim().toLowerCase();

    const isHome =
      (selectedTeamId && g.home_team_id === selectedTeamId) ||
      (selectedTeamName && homeName === selectedTeamName);

    const isAway =
      (selectedTeamId && g.away_team_id === selectedTeamId) ||
      (selectedTeamName && awayName === selectedTeamName);

    if (!isHome && !isAway) return;

    const currentTeamName = isHome ? g.home_team : g.away_team;
    const opponentTeamName = isHome ? g.away_team : g.home_team;

    const currentTeamInfo = getTeamInfoByIdOrName(
      isHome ? g.home_team_id : g.away_team_id,
      currentTeamName
    );

    const opponentTeamInfo = getTeamInfoByIdOrName(
      isHome ? g.away_team_id : g.home_team_id,
      opponentTeamName
    );

    const renderContact = (label, team = {}) => {
      const parts = [
        team[label.toLowerCase().includes("coach") ? "teamCoach" : "teamAsstCoach"],
        team.email ? `📧 ${team.email}` : "",
        team.phone ? `📞 ${team.phone}` : ""
      ].filter(Boolean);
      return parts.length ? `<p><strong>${label}:</strong> ${parts.join(" — ")}</p>` : "";
    };

    const renderPlayerTable = () => {
	const players = g.lineupOverrides?.[selectedTeamId] || currentTeamInfo.roster || [];
      if (!players.length) return "";
      const rows = players.slice(0, 20).map(p => `
        <tr><td><strong>${p.number || ""}</strong></td><td>${p.name || ""}</td></tr>
      `).join("");
      return `
        <hr><strong>Player Lineup</strong>
        <table class="simple-table">${rows}</table>
      `;
    };

    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <h3>Game ${i + 1} — ${g.match_date || "??"} @ ${g.match_time || "??"}</h3>
      <p><strong>Game ID:</strong> ${g.id || ""}</p>
      <p><strong>Game #:</strong> ${g.game_number || ""}</p>

      <hr><strong>League & Competition</strong>
      ${g.league ? `<p><strong>League:</strong> ${g.league}</p>` : ""}
      ${g.competition ? `<p><strong>Competition:</strong> ${g.competition}</p>` : ""}

      <hr><strong>Match Info</strong>
      <p><strong>Age / Division:</strong> ${g.age_division || ""}</p>
      <p><strong>Date:</strong> ${g.match_date || ""}</p>
      <p><strong>Time:</strong> ${g.match_time || ""}</p>
      <p><strong>Location:</strong> ${g.location || ""}${g.field ? ", " + g.field : ""}</p>

      <hr><strong>Opponent: ${opponentTeamInfo.teamName || opponentTeamName || "—"}</strong>
      ${renderContact("Coach", opponentTeamInfo)}
      ${renderContact("Asst. Coach", opponentTeamInfo)}
      ${opponentTeamInfo.teamColors ? `<p><strong>Colors:</strong> ${opponentTeamInfo.teamColors}</p>` : ""}
      <p><strong>Side:</strong> ${isHome ? "Away" : "Home"}</p>

      <hr><strong>Your Team: ${currentTeamInfo.teamName || currentTeamName || "—"}</strong>
      ${renderContact("Coach", currentTeamInfo)}
      ${renderContact("Asst. Coach", currentTeamInfo)}
      ${currentTeamInfo.teamColors ? `<p><strong>Colors:</strong> ${currentTeamInfo.teamColors}</p>` : ""}
      <p><strong>Side:</strong> ${isHome ? "Home" : "Away"}</p>

      ${renderPlayerTable()}

      <div class="card-actions">
        <button class="btn edit-btn" data-gameid="${g.id}">Edit</button>
        <button class="btn pdf-btn" data-gameid="${g.id}">PDF</button>
      </div>
    `;

    container.appendChild(card);
    renderedCount++;
  });

  if (!renderedCount) {
    container.innerHTML = "<p>No games found for the selected team.</p>";
  }
}
window.renderCards = renderCards;
/* ============================================================
  sorting roster
============================================================ */


document.getElementById("sortRosterBtn")?.addEventListener("click", () => {
	// First read current UI values so edits aren’t lost
	const currentRoster = Array.from(document.querySelectorAll(".roster-row")).map(r => ({
		number: r.querySelector(".roster-number-input")?.value.trim() || "",
		name: r.querySelector(".roster-name-input")?.value.trim() || ""
	}));

	// Sort roster
	currentRoster.sort((a, b) => {
		const na = parseInt(a.number, 10);
		const nb = parseInt(b.number, 10);

		if (!isNaN(na) && !isNaN(nb)) return na - nb;
		if (!isNaN(na)) return -1;
		if (!isNaN(nb)) return 1;
		return 0;
	});

	// Update global and rerender
	window.ROSTER_LIST = currentRoster;
	window.renderRosterTable(currentRoster);

	// Focus still optional
	const lastInput = document.querySelector(`.roster-number-input[data-index="${currentRoster.length - 1}"]`);
	if (lastInput) lastInput.focus();
});


/* ============================================================
   STORAGE HELPERS
============================================================ */




/* ============================================================
   SCHEDULE PARSING
============================================================ */
// Use `allParsers` to populate dropdowns, carousels, etc.

export function parseScheduleText(raw) {
	return parseGenericSchedule(raw);
}

/* ============================================================
   text utilities
============================================================ */
function cleanGameField(value) {
	return pdfSafeText(value); // same logic, lighter name
}

function pdfSafeText(value) {
	if (value == null) return "";

	return String(value)
		// Replace narrow no‑break space & no‑break space
		.replace(/\u202F/g, " ")
		.replace(/\u00A0/g, " ")

		// Replace smart quotes
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")

		// Replace unsupported symbols
		.replace(/√/g, "X")

		// Collapse whitespace
		.replace(/\s+/g, " ")
		.trim();
}



/* ============================================================
   ROSTER
============================================================ */

function parseRoster(raw) {
	const lines = (raw || "")
		.split(/\r?\n/)
		.filter(l => l.trim());

	window.ROSTER_LIST = lines.map(l => {
		const parts = l.split(/\t|,/).map(x => x.trim());
		return {
			number: parts[0] || "",
			name: parts[1] || ""
		};
	});

	renderRosterTable();
}

document.getElementById("toggleHiddenFieldsBtn")?.addEventListener("click", () => {
  const hiddenSection = document.querySelector(".hidden-fields");
  if (hiddenSection) {
    hiddenSection.classList.toggle("visible");
    const btn = document.getElementById("toggleHiddenFieldsBtn");
    btn.textContent = hiddenSection.classList.contains("visible")
      ? "Hide hidden fields"
      : "Show hidden fields";
  }
});
/* ============================================================
   FILTERING
============================================================ */

function applyFilter() {
	const kw = document.getElementById("filterInput")?.value.toLowerCase() || "";

	window.GAME_LIST.forEach(g => {
		g.selected =
			g.home_team.toLowerCase().includes(kw) ||
			g.away_team.toLowerCase().includes(kw) ||
			g.match_date.toLowerCase().includes(kw);
	});

	updateStatusLines();
}

/* ============================================================
   STATUS
============================================================ */

function updateStatusLines() {
	const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
	window.games = games; // ✅ expose globally
	const total = games.length;
	const selectedGames = games.filter(g => g.selectedInPreview).length;

	const s3 = document.getElementById("status-section-3");
	if (s3) {
		s3.textContent = total ?
			`Extracted ${total} games.` :
			"No games extracted.";
	}

	const s5 = document.getElementById("status-section-5");
	if (s5) {
		// +1 for roster card
		const rosterSelected = 1;
		const totalSelected = rosterSelected + selectedGames;
		s5.textContent = total ?
			`Previewing ${totalSelected} of ${total + 1} cards.` :
			"No lineup cards to preview.";
	}
}
window.updateStatusLines = updateStatusLines;

/* ============================================================
   PREVIEW CARDS
============================================================ */



function createCardElement(team, game) {
	const card = document.createElement("div");
	card.className = "lineup-card";

	// — TITLE —
	const title = document.createElement("h3");
	title.textContent = game ?
		`${team.teamName}` :
		`${team.teamName} — Roster`;
	card.appendChild(title);

	// — GAME INFO (if game provided) —
	if (game) {
		const homeId = game.home_team || game.homeTeamRaw || "";
		const awayId = game.away_team || game.awayTeamRaw || "";

		const matchup = document.createElement("p");
		matchup.innerHTML = `<strong>Matchup:</strong> ${homeId} – ${awayId}`;
		card.appendChild(matchup);

		const isHome = String(homeId || "").toLowerCase() === String(team.teamId || "").toLowerCase();
		const opponentVal = isHome ? awayId : homeId;

		const opponentLine = document.createElement("p");
		opponentLine.innerHTML = `<strong>Opponent:</strong> ${opponentVal}`;
		card.appendChild(opponentLine);

		// Age/Division
		const ageDivVal = game.ageDiv || game.age_division || "";
		if (ageDivVal) {
			const ageEl = document.createElement("p");
			ageEl.innerHTML = `<strong>Age/Div:</strong> ${ageDivVal}`;
			card.appendChild(ageEl);
		}

		// Date
		const dateVal = game.gameDate || "";
		if (dateVal) {
			const dateEl = document.createElement("p");
			dateEl.innerHTML = `<strong>Date:</strong> ${dateVal}`;
			card.appendChild(dateEl);
		}

		// Time
		const timeVal = game.gameTime || "";
		if (timeVal) {
			const timeEl = document.createElement("p");
			timeEl.innerHTML = `<strong>Time:</strong> ${timeVal}`;
			card.appendChild(timeEl);
		}

		// Location
		const locationVal = game.gameLocation || "";
		if (locationVal) {
			const locEl = document.createElement("p");
			locEl.innerHTML = `<strong>Location:</strong> ${locationVal}`;
			card.appendChild(locEl);
		}
	}

	// — TEAM INFO —
	if (team.teamCoach) {
		const coachEl = document.createElement("p");
		coachEl.innerHTML = `<strong>Coach:</strong> ${team.teamCoach}`;
		card.appendChild(coachEl);
	}

	if (team.teamAsstCoach) {
		const asstEl = document.createElement("p");
		asstEl.innerHTML = `<strong>Asst. Coach:</strong> ${team.teamAsstCoach}`;
		card.appendChild(asstEl);
	}

	if (team.teamColors) {
		const colorEl = document.createElement("p");
		colorEl.innerHTML = `<strong>Colors:</strong> ${team.teamColors}`;
		card.appendChild(colorEl);
	}

	// — BUTTON ROW (Edit + PDF) —
	const btnRow = document.createElement("div");
	btnRow.className = "card-button-row";

	const editBtn = document.createElement("button");
	editBtn.textContent = "Edit";
	editBtn.className = "btn";
	editBtn.addEventListener("click", () => enterInlineEditMode(card, team, game));
	btnRow.appendChild(editBtn);



	const pdfBtn = document.createElement("button");
	pdfBtn.textContent = "PDF";
	pdfBtn.className = "btn secondary";
	pdfBtn.addEventListener("click", async () => {
		try {
			// Compute opponent for filename
			const homeId = game?.home_team || game?.homeTeamRaw || "";
			const awayId = game?.away_team || game?.awayTeamRaw || "";
			const isHomeTeam = game && String(homeId).toLowerCase() === String(team.teamId).toLowerCase();
			const opponentName = isHomeTeam ? awayId : homeId || "Opponent";

			const bytes = await window.createPdfForLineup(team, game);
			const filename = game ?
				`${team.teamName}-vs-${opponentName}.pdf` :
				`${team.teamName}-Roster.pdf`;

			saveAs(new Blob([bytes], {
				type: "application/pdf"
			}), filename);
		} catch (err) {
			console.error("PDF generation error:", err);
			alert("Error generating PDF — see console.");
		}
	});
	btnRow.appendChild(pdfBtn);



	card.appendChild(btnRow);

	// — ROSTER LIST —
	const rosterHeader = document.createElement("h4");
	rosterHeader.textContent = "Roster";
	card.appendChild(rosterHeader);

	const rosterList = document.createElement("ul");
	rosterList.className = "roster-list";
	const roster = game?.customRoster || team.roster || [];

	roster.forEach(player => {
		const item = document.createElement("li");
		item.textContent = `${player.number || ""} ${player.name || ""}`.trim();
		rosterList.appendChild(item);
	});

	card.appendChild(rosterList);

	return card;
}


/*============================================================ */
/*Lineup card factory edit details*/
/*============================================================ */

import {
  GAME_CORE_FIELDS,
  COMPETITION_FIELDS,
  MATCH_CONTEXT_FIELDS,
  LINEUP_SPECIFIC_FIELDS,
  MATCH_STATUS_FIELDS
} from "../../shared/field-groups.js";

import { buildFieldEditor } from "../../shared/ui-helpers.js";

function buildEditModalContent(game) {
  const selectedTeam = window.TeamStore?.getCurrentTeam?.();
  if (!selectedTeam) {
    return `<p>No team selected.</p>`;
  }

  const selectedTeamId = selectedTeam.teamId?.trim();
  const selectedTeamName = selectedTeam.teamName?.trim().toLowerCase();

  const isHome =
    (selectedTeamId && game.home_team_id === selectedTeamId) ||
    (selectedTeamName &&
      game.home_team?.trim().toLowerCase() === selectedTeamName);

  const opponentPrefix = isHome ? "away" : "home";
  const selectedPrefix = isHome ? "home" : "away";

  return `
    <h3>Edit Lineup Card</h3>

    <!-- Competition / Context -->
    <div class="group-label">Competition</div>
    ${buildFieldEditor(game, COMPETITION_FIELDS)}
    ${buildFieldEditor(game, MATCH_CONTEXT_FIELDS)}

    <!-- Game Info -->
    <div class="group-label">Game Info</div>
    ${buildFieldEditor(game, GAME_CORE_FIELDS)}

    <!-- Opponent Team -->
    <div class="group-label">Opponent Team</div>
    ${buildFieldEditor(game, [
      `${opponentPrefix}_team`,
      `${opponentPrefix}_coach.name`,
      `${opponentPrefix}_coach.email`,
      `${opponentPrefix}_coach.phone`,
      `${opponentPrefix}_asst_coach`,
      `${opponentPrefix}_colors`
    ])}

    <!-- Selected Team -->
    <div class="group-label">Your Team</div>
    ${buildFieldEditor(game, [
      `${selectedPrefix}_team`,
      `${selectedPrefix}_coach.name`,
      `${selectedPrefix}_coach.email`,
      `${selectedPrefix}_coach.phone`,
      `${selectedPrefix}_asst_coach`,
      `${selectedPrefix}_colors`
    ])}

    <!-- Player Lineup -->
    <div class="group-label">Player Lineup</div>
    ${buildLineupEditor(game, selectedTeamId)}

    <!-- Match Notes / Status -->
    <div class="group-label">Match Notes</div>
    ${buildFieldEditor(game, LINEUP_SPECIFIC_FIELDS)}
    ${buildFieldEditor(game, MATCH_STATUS_FIELDS)}
  `;
}

window.buildEditModalContent = buildEditModalContent;

 function buildLineupEditor(game, teamId) {
  const roster =
    game.lineupOverrides?.[teamId] ||
    window.TeamStore
      ?.getAllTeams?.()
      ?.find(t => t.teamId === teamId)
      ?.roster ||
    [];

  return roster
    .slice(0, 20)
    .map((player, i) => {
      const isEmpty =
        !player?.number?.toString().trim() && !player?.name?.toString().trim();

      return `
        <div class="field-wrapper ${isEmpty ? "empty-field" : ""}">
          <label>Player ${i + 1}</label>
          <input
            type="text"
            value="${player.number || ""}"
            placeholder="#"
            style="width:60px"
            data-roster-index="${i}"
            data-roster-field="number"
          />
          <input
            type="text"
            value="${player.name || ""}"
            placeholder="Name"
            style="flex:1"
            data-roster-index="${i}"
            data-roster-field="name"
          />
        </div>
      `;
    })
    .join("");
}




function renderInputField(label, id, value = "") {
  const isEmpty = !value.trim();
  return `
    <div class="field-wrapper ${isEmpty ? "empty-field" : ""}">
      <label for="${id}">${label}</label>
      <input type="text" id="${id}" value="${value}">
    </div>
  `;
  // After updating the game object...
renderCards();
updateStatusLines?.();
updateSelectedCountUI?.();
}

function enterEditModeInline(card, team, game) {
	if (!game) {
		alert("Editing full team data not supported inline.");
		return;
	}

	const editHTML = `
    <div class="inline-edit">
      <label>Date: <input class="inline-date" value="${game.match_date}"></label>
      <label>Time: <input class="inline-time" value="${game.match_time}"></label>
      <label>Location: <input class="inline-location" value="${game.location}"></label>
      <div class="edit-buttons">
        <button class="btn save-edit-btn">💾 Save</button>
        <button class="btn cancel-edit-btn">❌ Cancel</button>
      </div>
    </div>
  `;

	const temp = document.createElement("div");
	temp.innerHTML = editHTML;
	const editPanel = temp.firstElementChild;

	const originalHTML = card.innerHTML;
	card.innerHTML = "";
	card.appendChild(editPanel);

	editPanel.querySelector(".save-edit-btn")?.addEventListener("click", () => {
		game.match_date = editPanel.querySelector(".inline-date").value.trim();
		game.match_time = editPanel.querySelector(".inline-time").value.trim();
		game.location = editPanel.querySelector(".inline-location").value.trim();
		renderPreviewCards();
	});

	editPanel.querySelector(".cancel-edit-btn")?.addEventListener("click", () => {
		card.innerHTML = originalHTML;
		// Re-bind buttons
		card.querySelector(".edit-card-btn")?.addEventListener("click", () => enterEditModeInline(card, team, game));
		card.querySelector(".pdf-card-btn")?.addEventListener("click", async () => {
			const bytes = await createPdfForLineup(team, game);
			const filename = `${team.teamName}-Game-${game.match_date}.pdf`;
			saveAs(new Blob([bytes], {
				type: "application/pdf"
			}), filename);
		});
	});
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
window.renderPreviewCards = renderPreviewCards;

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

function toggleEmptyFields() {
  const body = document.getElementById("lineupEditModalBody");
  if (!body) return;
  body.classList.toggle("show-all-fields");
}

window.toggleEmptyFields = toggleEmptyFields;

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



async function generatePDFs() {
	const team = window.TeamStore.getCurrentTeam();
	if (!team) {
		alert("Select a team first.");
		return;
	}

	const selectedGames = window.GAME_LIST.filter(g => g.selected);
	const outputList = [];

	// Always include roster-only card
	outputList.push({
		team,
		game: null
	});

	// Add selected game cards
	selectedGames.forEach(game => {
		const match = [game.home_team, game.away_team]
			.some(t => t?.toLowerCase().includes(team.teamId?.toLowerCase()));
		if (match) {
			outputList.push({
				team,
				game
			});
		}
	});

	const zip = new JSZip();

	for (const {
			team,
			game
		}
		of outputList) {
		const bytes = await createPdfForLineup(team, game);
		const opp = game?.home_team === team.teamId ? game.away_team : game?.home_team;
		const filename = game ?
			`${team.teamName}-vs-${opp || "Opponent"}.pdf` :
			`${team.teamName}-Roster.pdf`;
		zip.file(filename, bytes);
	}

	const blob = await zip.generateAsync({
		type: "blob"
	});
	saveAs(blob, `${team.teamName}-LineupCards.zip`);
}
window.generatePDFs = generatePDFs;

window.createPdfForLineup = async function(team, game) {
	const tpl = window.TEMPLATE_LIST?.[window.selectedTemplateIndex];
	if (!tpl) throw new Error("No template selected.");

	const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`)
		.then((r) => r.arrayBuffer());

	const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
	const form = pdfDoc.getForm();

	function setField(name, value) {
		try {
			const field = form.getTextField(name);
			if (field) {
				field.setText(value || "");
				console.log(`✅ Set field "${name}" =`, `"${value}"`);
			} else {
				console.warn(`⚠️ Field "${name}" not found`);
			}
		} catch (err) {
			console.warn(`⚠️ Field "${name}" not found or not writable`);
		}
	}

	// --- Game Info ---
	if (game) {
		setField("GameDate", game.gameDate);
		setField("GameTime", game.gameTime);
		setField("GameLocation", game.gameLocation);
		setField("AgeDiv", game.ageDiv);

		// Determine if team is home or away
		const isHome = team.teamId === game.homeTeamRaw;
		const opponentId = isHome ? game.awayTeamRaw : game.homeTeamRaw;

		setField("HomeX", isHome ? "X" : "");
		setField("VisitorX", isHome ? "" : "X");

		setField("HomeID", isHome ? team.teamId : opponentId);
		setField("VisitorID", isHome ? opponentId : team.teamId);
	}

	// --- Team Info ---
	setField("TeamName", team.teamName);
	setField("TeamColors", team.teamColors);
	setField("TeamCoach", team.teamCoach);
	setField("TeamAsstCoach", team.teamAsstCoach);
	setField("TeamID", team.teamId);
	setField("AgeDiv", team.ageDiv); // backup in case it's not in game

	// --- Roster (up to 15) ---
	const roster = game?.customRoster || team.roster || [];
	for (let i = 0; i < 15; i++) {
		const p = roster[i] || {
			number: "",
			name: ""
		};
		setField(`Player${i + 1}_Name`, p.name);
		setField(`Player${i + 1}_Number`, p.number);
	}

	form.flatten();
	return await pdfDoc.save();
};
async function generateAllLineupPDFs() {
	const team = getCurrentTeam();
	if (!team) {
		alert("Please select a team first.");
		return;
	}

	// Filter only games that match this team
	const teamIdLower = String(team.teamId || "").toLowerCase();
	const selectedGames = Array.isArray(window.GAME_LIST) ?
		window.GAME_LIST.filter(g => g.selected &&
			(String(g.home_team || "").toLowerCase().includes(teamIdLower) ||
				String(g.away_team || "").toLowerCase().includes(teamIdLower))) : [];

	// Always include roster‑only card
	const items = [{
		team,
		game: null
	}];

	// Add games
	selectedGames.forEach(game => {
		items.push({
			team,
			game
		});
	});

	if (!items.length) {
		alert("No games selected to generate.");
		return;
	}

	// Use JSZip to make a zip with all PDFs
	const zip = new JSZip();

	for (const item of items) {
		const {
			team,
			game
		} = item;

		try {
			const pdfBytes = await window.createPdfForLineup(team, game);

			// Determine filename
			const filename = game ?
				`${team.teamName}-vs-${(game.home_team === team.teamId
            ? game.away_team
            : game.home_team)
          }.pdf` :
				`${team.teamName}-Roster.pdf`;

			zip.file(filename, pdfBytes);
		} catch (err) {
			console.error("Error generating PDF for", game, err);
			alert(`Error generating PDF for ${game?.match_date} ${game?.match_time}`);
			return;
		}
	}

	// Generate and download zip
	try {
		const blob = await zip.generateAsync({
			type: "blob"
		});
		saveAs(blob, `${team.teamName}-LineupCards.zip`);
	} catch (err) {
		console.error("Error generating ZIP", err);
		alert("Failed to generate ZIP.");
	}
}

window.generateAllLineupPDFs = generateAllLineupPDFs;

async function loadTemplates() {
	try {
		const resp = await fetch("templates.json", {
			cache: "no-store"
		});
		const list = await resp.json();
		window.TEMPLATE_LIST = Array.isArray(list) ? list : [];
		refreshTemplateCarousel();
	} catch (err) {
		console.error("Error loading templates:", err);
		window.TEMPLATE_LIST = [];
	}
}

function refreshTemplateCarousel() {
	const statusEl = document.getElementById("templateStatus");
	const nameEl = document.getElementById("templateName");
	const img = document.getElementById("templateImage");

	if (!Array.isArray(window.TEMPLATE_LIST) || !window.TEMPLATE_LIST.length) {
		statusEl.textContent = "No templates loaded.";
		nameEl.textContent = "";
		img.src = "";
		return;
	}

	const tpl = window.TEMPLATE_LIST[window.selectedTemplateIndex];
	nameEl.textContent = tpl.name || "";
	statusEl.textContent = `Template ${window.selectedTemplateIndex + 1} of ${window.TEMPLATE_LIST.length}`;

	img.src = `templates/${tpl.png}`;
}


document.getElementById("inspectTemplateBtn")?.addEventListener("click", async () => {
	console.log("🔍 Inspect Template Fields clicked");

	const tpl = window.TEMPLATE_LIST?.[window.selectedTemplateIndex];
	const outputEl = document.getElementById("templateValidationOutput");

	if (!tpl) {
		outputEl.innerHTML = "<p style='color:red;'>No template selected.</p>";
		return;
	}

	const url = `./templates/${tpl.pdf}?v=${Date.now()}`;

	const report = await window.validatePdfTemplate(url);

	console.log("📄 Validation report:", report);

	// Build a summary at the top
	let summaryHtml = `<p><strong>Template:</strong> ${tpl.name}</p>`;

	if (report.pageSize) {
		const {
			width,
			height
		} = report.pageSize;
		summaryHtml += `<p><strong>Size (pts):</strong> ${width} × ${height}</p>`;
	}

	if (report.hasIllegalNames || report.hasIllegalValues) {
		summaryHtml += `
      <p style="font-weight:bold; color:#c00;">
        ⚠️ Template has fields with invalid characters. See list below.
      </p>
    `;
	} else {
		summaryHtml += `
      <p style="font-weight:bold; color:#080;">
        ✅ Template passed validation. All fields safe.
      </p>
    `;
	}

	if (!report.fields.length) {
		outputEl.innerHTML = summaryHtml + "<p>No form fields found in this template.</p>";
		return;
	}

	const listHtml = `
    <ul>
      ${report.fields.map(f => {
        const nameSafe = f.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const nameIssues = f.illegalInName.length
          ? ` — Illegal in name: ${f.illegalInName.map(i => i.char).join(", ")}`
          : "";
        const valIssues = f.illegalInValue.length
          ? ` — Illegal in default text: ${f.illegalInValue.map(i => i.char).join(", ")}`
          : "";
        return `<li><strong>${nameSafe}</strong>${nameIssues}${valIssues}</li>`;
      }).join("")}
    </ul>
  `;

	outputEl.innerHTML = summaryHtml + listHtml;
});


// 🧽 Optional: Reset modal fields, clear textarea, etc.

/* ============================================================
   INIT UI
============================================================ */
window.initUI = function initUI() {
	console.log("🟢 initUI() starting…");

	// 1. Initialize shared schedule UI (v2)
	window.initSharedScheduleUIv2?.();

	// 2. Load and initialize team data
	window.TeamStore.loadTeamsFromStorage();
	window.initTeamDropdown?.();

	let team = window.TeamStore.getCurrentTeam();
	if (!team) {
		const all = window.TeamStore.getAllTeams();
		if (all.length > 0) {
			window.TeamStore.selectTeamById(all[0].teamId);
			window.initTeamDropdown?.();
			team = window.TeamStore.getCurrentTeam();
		}
	}
	renderCurrentTeamUI();

	// 3. Update section status
	const status = document.getElementById("status-section-1-team");
	if (status) {
		status.textContent = team
			? `${team.teamName?.trim() || team.teamId?.trim() || "(unnamed team)"} — Currently selected. Expand to change, view or edit teams.`
			: "No team selected — create or load a team.";
	}

	console.log("🧠 Loaded teams:", window.TeamStore.getAllTeams());

	// 4. Team selector dropdown
	document.getElementById("teamSelect")?.addEventListener("change", (e) => {
		const newId = e.target.value;
		if (newId) {
			window.TeamStore.selectTeamById(newId);
			renderCurrentTeamUI();
		}
	});


	// 6. Parse schedule input and prompt to save
	document.getElementById("parseBtn")?.addEventListener("click", () => {
		const raw = document.getElementById("rawInput")?.value.trim() || "";
		if (!raw) return alert("Paste schedule text first.");

		const selectedParserKey = window.selectedParserKey || "generic";
		const result = ScheduleParser.parse(raw, selectedParserKey);
		const parsedGames = result.games || [];
		const errors = result.errors || [];

		if (errors.length) console.warn("Parse errors:", errors);
		if (!parsedGames.length) return;

		window.GAME_LIST = parsedGames.map(g => normalizeParsedGame(g, selectedParserKey));
		renderPreviewCards();
		updateStatusLines?.();

		const defaultName = raw.split(/\r?\n/)[0]?.trim() || `Schedule ${new Date().toLocaleDateString()}`;
		window.showSaveScheduleModal(defaultName);

		// Auto-select a team if none selected
		const currentTeam = window.TeamStore?.getCurrentTeam?.();
		const allTeams = window.TeamStore?.getAllTeams?.() || [];
		if (!currentTeam && allTeams.length > 0) {
			console.log("🟢 No team selected — auto‑selecting first team");
			window.TeamStore.selectTeamById(allTeams[0].teamId);
			renderCurrentTeamUI();
		}
	});

	// 7. Clear schedule textarea
	document.getElementById("clearScheduleBtn")?.addEventListener("click", () => {
		document.getElementById("rawInput").value = "";
		window.GAME_LIST = [];
		updateStatusLines?.();
		renderPreviewCards();
	});

	// 8. Filter controls
	document.getElementById("applyFilterBtn")?.addEventListener("click", applyFilter);
	document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
		document.getElementById("filterInput").value = "";
		applyFilter();
	});

	// 9. Generate PDFs
	document.getElementById("generateBtn")?.addEventListener("click", generatePDFs);

	// 10. Template navigation
	document.getElementById("prevTemplate")?.addEventListener("click", () => {
		if (!window.TEMPLATE_LIST.length) return;
		window.selectedTemplateIndex = (window.selectedTemplateIndex + window.TEMPLATE_LIST.length - 1) % window.TEMPLATE_LIST.length;
		refreshTemplateCarousel();
	});
	document.getElementById("nextTemplate")?.addEventListener("click", () => {
		if (!window.TEMPLATE_LIST.length) return;
		window.selectedTemplateIndex = (window.selectedTemplateIndex + 1) % window.TEMPLATE_LIST.length;
		refreshTemplateCarousel();
	});

	// 11. Final refresh
	loadTemplates().then(refreshTemplateCarousel);
	refreshImportCarousel();

	window.addEventListener("scheduleImported", () => {
		renderPreviewCards?.();
		updateStatusLines?.();
	});
};

// Refresh UI
// ─── LOAD SAVED SCHEDULES ───────────────────────────────────



window.enterInlineEditMode = function(cardElement, team, game) {
	const modal = document.getElementById("lineupEditModal");
	const body = document.getElementById("lineupEditModalBody");
	if (!modal || !body) return;

	// Clear previous
	body.innerHTML = "";

	// Team fields (only if game is null — otherwise show game fields too)
	if (!game) {
		body.innerHTML += `
      <div class="edit-row"><label>Team Name</label><input id="editTeamName" type="text" value="${team.teamName || ''}"></div>
      <div class="edit-row"><label>Coach</label><input id="editTeamCoach" type="text" value="${team.teamCoach || ''}"></div>
      <div class="edit-row"><label>Asst Coach</label><input id="editTeamAsst" type="text" value="${team.teamAsstCoach || ''}"></div>
      <div class="edit-row"><label>Colors</label><input id="editTeamColors" type="text" value="${team.teamColors || ''}"></div>
    `;
	}

	// Game fields
	if (game) {
		body.innerHTML += `
      <div class="edit-row"><label>Date</label><input id="editGameDate" type="text" value="${game.gameDate || ''}"></div>
      <div class="edit-row"><label>Time</label><input id="editGameTime" type="text" value="${game.gameTime || ''}"></div>
      <div class="edit-row"><label>Location</label><input id="editGameLocation" type="text" value="${game.gameLocation || ''}"></div>
    `;
	}

	modal.classList.remove("hidden");

	document.getElementById("saveLineupEditBtn").onclick = () => {
		if (!game) {
			team.teamName = document.getElementById("editTeamName")?.value.trim();
			team.teamCoach = document.getElementById("editTeamCoach")?.value.trim();
			team.teamAsstCoach = document.getElementById("editTeamAsst")?.value.trim();
			team.teamColors = document.getElementById("editTeamColors")?.value.trim();
		} else {
			game.gameDate = document.getElementById("editGameDate")?.value.trim();
			game.gameTime = document.getElementById("editGameTime")?.value.trim();
			game.gameLocation = document.getElementById("editGameLocation")?.value.trim();
		}
		modal.classList.add("hidden");

		// Refresh preview
		if (typeof renderPreviewCards === "function") renderPreviewCards();
	};

	document.getElementById("cancelLineupEditBtn").onclick = () => {
		modal.classList.add("hidden");
	};
};


// Add a schedule to the list
function addSchedule(name, rawText) {
	window.SCHEDULE_LIST.push({
		name,
		rawText
	});
	refreshScheduleCarousel();
}



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
/**
 * Create a single PDF byte array for one lineup card
 * @param {Object} team
 * @param {Object|null} game
 */

// Expose globally so card PDF button can call it
