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
window.TEMPLATE_LIST = [];
window.selectedTemplateIndex = 0;
window.ROSTER_LIST = [];

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

function enterEditMode(team, game) {
	const modal = document.getElementById("lineupEditModal");
	const body = document.getElementById("lineupEditModalBody");
	const saveBtn = document.getElementById("saveLineupEditBtn");
	const cancelBtn = document.getElementById("cancelLineupEditBtn");

	if (!modal || !body || !saveBtn || !cancelBtn) {
		console.warn("❌ Edit modal elements not found");
		return;
	}

	body.innerHTML = "";

	// helper to add editable rows
	const row = (label, id, value = "") => `
    <div class="edit-row">
      <label><strong>${label}</strong></label>
      <input id="${id}" class="macos-input" type="text" value="${value}">
    </div>
  `;

	/* =========================
	   TEAM FIELDS
	========================= */
	body.insertAdjacentHTML("beforeend", row("Team Name", "editTeamName", team.teamName));
	body.insertAdjacentHTML("beforeend", row("Coach", "editTeamCoach", team.teamCoach));
	body.insertAdjacentHTML("beforeend", row("Region", "editTeamRegion", team.teamRegion));
	body.insertAdjacentHTML("beforeend", row("Age / Div", "editTeamAgeDiv", team.teamAgeDiv));
	body.insertAdjacentHTML("beforeend", row("Team Colors", "editTeamColors", team.teamColors));

	/* =========================
	   GAME FIELDS (optional)
	========================= */
	if (game) {
		body.insertAdjacentHTML("beforeend", "<hr>");
		body.insertAdjacentHTML("beforeend", row("Date", "editGameDate", game.match_date));
		body.insertAdjacentHTML("beforeend", row("Time", "editGameTime", game.match_time));
		body.insertAdjacentHTML("beforeend", row("Location", "editGameLocation", game.location));
	}

	/* =========================
	   SHOW MODAL
	========================= */
	modal.classList.remove("hidden");
	modal.style.display = "flex";
	/* =========================
	   SAVE HANDLER
	========================= */
	saveBtn.onclick = () => {
		// update team
		team.teamName = document.getElementById("editTeamName")?.value.trim() || "";
		team.teamCoach = document.getElementById("editTeamCoach")?.value.trim() || "";
		team.teamRegion = document.getElementById("editTeamRegion")?.value.trim() || "";
		team.teamAgeDiv = document.getElementById("editTeamAgeDiv")?.value.trim() || "";
		team.teamColors = document.getElementById("editTeamColors")?.value.trim() || "";

		// update game if present
		if (game) {
			game.match_date = document.getElementById("editGameDate")?.value.trim() || "";
			game.match_time = document.getElementById("editGameTime")?.value.trim() || "";
			game.location = document.getElementById("editGameLocation")?.value.trim() || "";
		}

		// persist teams
		saveTeamsToStorage();

		modal.classList.add("hidden");

		// refresh UI
		renderCurrentTeamUI();
		renderPreviewCards();
	};

	/* =========================
	   CANCEL HANDLER
	========================= */
	cancelBtn.onclick = () => {
		modal.classList.add("hidden");
	};
}

window.enterEditMode = enterEditMode;



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

// ———————————————————————————
// Schedule Carousel State
// ———————————————————————————
function updateScheduleStatus() {
	const list = window.SCHEDULE_LIST || [];
	const idx = window.selectedScheduleIndex;
	const statusEl = document.getElementById("scheduleStatus");

	if (!list.length) {
		statusEl.textContent = "No schedules saved.";
		return;
	}

	if (idx === null || idx === undefined || !list[idx]) {
		statusEl.textContent = "No schedule selected.";
		return;
	}

	statusEl.textContent = `Selected ${idx + 1} of ${list.length}: "${list[idx].name}"`;
}
window.SCHEDULE_LIST = [];
window.selectedScheduleIndex = 0;

// Refresh the carousel HTML

function refreshScheduleCarousel() {
	const viewport = document.getElementById("scheduleCarouselViewport");
	if (!viewport) return;

	viewport.innerHTML = "";

	const list = window.SCHEDULE_LIST || [];

	if (!list.length) {
		document.getElementById("scheduleStatus").textContent = "No schedules saved.";
		return;
	}

	list.forEach((s, idx) => {
		const div = document.createElement("div");
		div.className = "carousel-item";
		div.textContent = s.name || `Schedule ${idx + 1}`;

		if (idx === window.selectedScheduleIndex) {
			div.classList.add("selected");
		}

		div.addEventListener("click", () => {
			window.selectedScheduleIndex = idx;

			const rawArea = document.getElementById("rawInput");
			if (rawArea) rawArea.value = s.rawText;

			refreshScheduleCarousel();
			updateScheduleStatus();
		});

		viewport.appendChild(div);
	});

	updateScheduleStatus(); // update text below carousel
}

// Load saved schedules from localStorage
function loadSavedSchedules() {
	const stored = JSON.parse(localStorage.getItem("savedSchedules") || "[]");
	window.SCHEDULE_LIST = Array.isArray(stored) ? stored : [];
	window.selectedScheduleIndex = 0;
	refreshScheduleCarousel();
}

loadSavedSchedules();

// Save the selected schedule into memory

 document.getElementById("saveScheduleBtnImport")?.addEventListener("click", () => {
  // logic for Save button from Import section
  const modal = document.getElementById("saveScheduleModal");
  document.getElementById("saveScheduleKeyInput").value = window.selectedParserKey || "";
  modal?.classList.remove("hidden");
});


// Delete the selected schedule

document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
	const list = window.SCHEDULE_LIST || [];
	const idx = window.selectedScheduleIndex;

	if (!list.length || idx == null || !list[idx]) {
		alert("No saved schedule selected to delete.");
		return;
	}

	if (!confirm(`Delete schedule "${list[idx].name}"?`)) return;

	list.splice(idx, 1);

	if (list.length === 0) {
		window.selectedScheduleIndex = null;
	} else {
		window.selectedScheduleIndex = Math.min(idx, list.length - 1);
	}

	localStorage.setItem("savedSchedules", JSON.stringify(list));
	window.SCHEDULE_LIST = list;

	refreshScheduleCarousel();
	updateScheduleStatus();

	// clear textarea
	const rawArea = document.getElementById("rawInput");
	if (rawArea) rawArea.value = "";
});

// Clear all saved schedules
document.getElementById("clearAllSchedulesBtn")?.addEventListener("click", () => {
	if (!confirm("Delete ALL saved schedules?")) return;
	localStorage.removeItem("savedSchedules");
	loadSavedSchedules();
});

// Carousel navigation
document.getElementById("schedulePrev")?.addEventListener("click", () => {
	if (!window.SCHEDULE_LIST.length) return;
	window.selectedScheduleIndex =
		(window.selectedScheduleIndex + window.SCHEDULE_LIST.length - 1) %
		window.SCHEDULE_LIST.length;
	refreshScheduleCarousel();
});
document.getElementById("scheduleNext")?.addEventListener("click", () => {
	if (!window.SCHEDULE_LIST.length) return;
	window.selectedScheduleIndex =
		(window.selectedScheduleIndex + 1) % window.SCHEDULE_LIST.length;
	refreshScheduleCarousel();
});

// Load saved schedules on startup
loadSavedSchedules();

/* ============================================================
   INIT UI
============================================================ */
window.initUI = function initUI() {
	console.log("🟢 initUI() starting…");
	window.initSharedScheduleUIv2?.();
	// Initialize collapsibles first (if needed)
	// initCollapsibles();

	// Load templates
	loadTemplates().then(() => {
		refreshTemplateCarousel();
	});

	// — TEAM SELECTOR INITIALIZATION — //

	// Load teams into the shared TeamStore
	window.TeamStore.loadTeamsFromStorage();

	// Populate the team selector dropdown
	if (window.initTeamDropdown) window.initTeamDropdown();

	let team = window.TeamStore.getCurrentTeam();
	if (team) {
		renderCurrentTeamUI();
	} else {
		const all = window.TeamStore.getAllTeams();
		if (all.length > 0) {
			window.TeamStore.selectTeamById(all[0].teamId);
			if (window.initTeamDropdown) window.initTeamDropdown();
			renderCurrentTeamUI();
			team = window.TeamStore.getCurrentTeam(); // update after selection
		}
	}

	// Update collapsed section status
	const status = document.getElementById("status-section-1-team");
	if (status) {
		if (team) {
			const label = team.teamName?.trim() || team.teamId?.trim() || "(unnamed team)";
			status.textContent =
				`${label} — Currently selected. Expand to change, view or edit teams.`;
		} else {
			status.textContent = "No team selected — create or load a team.";
		}
	}

	console.log("🧠 Loaded teams:", window.TeamStore.getAllTeams());

	// Team selector change handler
	document.getElementById("teamSelect")?.addEventListener("change", (e) => {
		const newId = e.target.value;
		if (newId) {
			window.TeamStore.selectTeamById(newId);
			renderCurrentTeamUI();
		}
	});

	// — SAVED SCHEDULES INITIALIZATION — //

	// Refresh dropdown from ScheduleStore
	window.refreshScheduleDropdown?.();

	// Load Schedule dropdown handlers
 	document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
		const sel = document.getElementById("scheduleSelect");
		const name = sel?.value;
		if (!name) return alert("Select a schedule first.");
		if (!confirm(`Delete schedule "${name}"?`)) return;

		ScheduleStoreV2.deleteScheduleByName(name);
		window.refreshScheduleDropdown?.();
	});

	document.getElementById("renameScheduleBtn")?.addEventListener("click", () => {
		const sel = document.getElementById("scheduleSelect");
		const oldName = sel?.value;
		if (!oldName) return alert("Select a schedule first.");

		const newName = prompt("Enter a new name:", oldName);
		if (!newName || newName.trim() === "" || newName === oldName) return;

		const schedule = ScheduleStoreV2.getScheduleByName(oldName);
		if (!schedule) return;

		ScheduleStoreV2.deleteScheduleByName(oldName);
		schedule.name = newName.trim();
		ScheduleStoreV2.addOrUpdateSchedule(schedule);

		window.refreshScheduleDropdown?.();
		document.getElementById("scheduleSelect").value = newName.trim();
	});

	// — SCHEDULE PARSE HANDLER (with ONE save prompt) — //
	document.getElementById("parseBtn")?.addEventListener("click", () => {
	  const rawInputEl = document.getElementById("rawInput");
	  const raw = rawInputEl?.value.trim() || "";

	  if (!raw) {
		alert("Paste schedule text first.");
		return;
	  }

		const { games, errors } = ScheduleParser.parse(
		  raw,
		  window.selectedParserKey || "generic"
		);
		const parsedGames = result.games || [];
		const selectedParserKey = window.selectedParserKey || "unknown";
		const normalizedGames = parsedGames.map(g =>
		  normalizeParsedGame(g, selectedParserKey)
		);
				if (errors?.length) console.warn("Parse errors:", errors);

				// You can optionally do auto-selection logic here if needed:
		window.GAME_LIST = normalizedGames;

	  if (!Array.isArray(games) || games.length === 0) {
		return;
	  }

	  renderPreviewCards();
	  updateStatusLines?.();

	  // ✅ Replace inline prompt with modal
	  const defaultName = raw.split(/\r?\n/)[0]?.trim() || `Schedule ${new Date().toLocaleDateString()}`;
	  window.showSaveScheduleModal(defaultName);

	  // ✅ Auto‑select first team if none selected
	  const currentTeam = window.TeamStore?.getCurrentTeam?.();
	  const allTeams = window.TeamStore?.getAllTeams?.() || [];
	  if (!currentTeam && allTeams.length > 0) {
		console.log("🟢 No team selected — auto‑selecting first team");
		window.TeamStore.selectTeamById(allTeams[0].teamId);
		renderCurrentTeamUI();
	  }
	});

	// after rendering team and parsing controls
	window.initSharedScheduleUI?.();
	// — CLEAR SCHEDULE textarea — //
	document.getElementById("clearScheduleBtn")?.addEventListener("click", () => {
		document.getElementById("rawInput").value = "";
		window.GAME_LIST = [];
		updateStatusLines?.();
		renderPreviewCards();
	});

	// — FILTER HANDLERS — //
	document.getElementById("applyFilterBtn")?.addEventListener("click", applyFilter);
	document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
		document.getElementById("filterInput").value = "";
		applyFilter();
	});

	// — PDF / GENERATOR HANDLER — //
	document.getElementById("generateBtn")?.addEventListener("click", generatePDFs);

	// — TEMPLATE CAROUSEL CONTROLS — //
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

	// — FINAL REFRESHES — //
	loadTemplates().then(refreshTemplateCarousel);
	refreshImportCarousel();

	window.addEventListener("scheduleImported", (ev) => {
		if (typeof renderPreviewCards === "function") renderPreviewCards();
		if (typeof updateStatusLines === "function") updateStatusLines();
	});
};

// ———————————————
// Schedule Carousel State
// ———————————————
window.SCHEDULE_LIST = [];
window.selectedScheduleIndex = 0;

// Refresh UI
// ─── LOAD SAVED SCHEDULES ───────────────────────────────────
const stored = JSON.parse(localStorage.getItem("savedSchedules") || "[]");
window.SCHEDULE_LIST = Array.isArray(stored) ? stored : [];
window.selectedScheduleIndex = window.SCHEDULE_LIST.length > 0 ? 0 : null;



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

// Carousel arrows
document.getElementById("schedulePrev")?.addEventListener("click", () => {
	if (!window.SCHEDULE_LIST.length) return;
	window.selectedScheduleIndex =
		(window.selectedScheduleIndex + window.SCHEDULE_LIST.length - 1) %
		window.SCHEDULE_LIST.length;
	refreshScheduleCarousel();
});

document.getElementById("scheduleNext")?.addEventListener("click", () => {
	if (!window.SCHEDULE_LIST.length) return;
	window.selectedScheduleIndex =
		(window.selectedScheduleIndex + 1) %
		window.SCHEDULE_LIST.length;
	refreshScheduleCarousel();
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
/**
 * Create a single PDF byte array for one lineup card
 * @param {Object} team
 * @param {Object|null} game
 */

// Expose globally so card PDF button can call it
