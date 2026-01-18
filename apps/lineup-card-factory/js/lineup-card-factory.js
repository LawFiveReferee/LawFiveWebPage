/* ============================================================
   Lineup Card Factory — lineup-card-factory.js
============================================================ */

console.log("Lineup Card Factory loaded…");

/* ============================================================
   GLOBAL STATE
============================================================ */

window.TEAM_LIST = [];
window.CURRENT_TEAM = null;
window.GAME_LIST = [];
window.TEMPLATE_LIST = [];
window.selectedTemplateIndex = 0;
window.ROSTER_LIST = [];

/* ============================================================
   STORAGE HELPERS
============================================================ */

function saveTeamsToStorage() {
  try {
    localStorage.setItem(
      "lineupCardFactoryTeams",
      JSON.stringify(window.TEAM_LIST)
    );
  } catch (e) {
    console.error("Failed saving teams:", e);
  }
}

function loadTeamsFromStorage() {
  try {
    const raw = localStorage.getItem("lineupCardFactoryTeams");
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      window.TEAM_LIST = [];
      return;
    }

    window.TEAM_LIST = parsed.map(t => ({
      teamId:        t.teamId        || "",
      teamNumber:    t.teamNumber    || "",
      teamName:      t.teamName      || "",
      teamCoach:     t.teamCoach     || "",
      teamRegion:    t.teamRegion    || "",
      teamAsstCoach: t.teamAsstCoach || "",
      teamAgeDiv:    t.teamAgeDiv    || "",
      teamColors:    t.teamColors    || "",
      roster:        Array.isArray(t.roster) ? t.roster : []
    }));

  } catch (err) {
    console.error("Error loading saved teams:", err);
    window.TEAM_LIST = [];
  }
}


/* ============================================================
   SCHEDULE PARSING
============================================================ */

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
   COLLAPSIBLE PANELS
============================================================ */

function initCollapsibles() {
  const panels = document.querySelectorAll(".collapsible-panel");

  panels.forEach(panel => {
    const header = panel.querySelector(".collapsible-header");
    const icon = panel.querySelector(".collapsible-icon");
    if (!header) return;

    const open = panel.classList.contains("open");
    header.setAttribute("aria-expanded", open ? "true" : "false");
    if (icon) icon.textContent = open ? "−" : "+";

    header.addEventListener("click", e => {
      e.preventDefault();
      const isOpen = panel.classList.toggle("open");
      header.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (icon) icon.textContent = isOpen ? "−" : "+";
    });
  });

  console.log("✅ Collapsibles initialized:", panels.length);
}

window.initCollapsibles = initCollapsibles;

/* ============================================================
   TEAM FUNCTIONS
============================================================ */

function populateTeamSelect() {
  const sel = document.getElementById("teamSelect");
  if (!sel) return;

  sel.innerHTML = "";

  window.TEAM_LIST.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = t.teamName || `Team ${i + 1}`;
    sel.appendChild(opt);
  });

  if (
    Number.isInteger(window.CURRENT_TEAM) &&
    window.CURRENT_TEAM >= 0 &&
    window.CURRENT_TEAM < window.TEAM_LIST.length
  ) {
    sel.value = String(window.CURRENT_TEAM);
  }
}

function selectTeam(index) {
  index = Number(index);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= window.TEAM_LIST.length
  ) {
    console.warn("Invalid team index:", index);
    return;
  }

  window.CURRENT_TEAM = index;
  localStorage.setItem(
    "lineupCardFactoryCurrentTeam",
    String(index)
  );

  renderCurrentTeamUI();
  updateStatusLines();
}

window.selectTeam = selectTeam;

function getCurrentTeam() {
  const idx = window.CURRENT_TEAM;
  if (
    !Number.isInteger(idx) ||
    idx < 0 ||
    idx >= window.TEAM_LIST.length
  ) {
    return null;
  }
  return window.TEAM_LIST[idx];
}

function renderCurrentTeamUI() {
  const team = getCurrentTeam();
  const status = document.getElementById("status-section-1-team");

  if (!team) {
    if (status) status.textContent = "No team selected.";
    clearTeamFields();
    window.ROSTER_LIST = [];
    renderRosterTable();
    return;
  }

  document.getElementById("teamId").value        = team.teamId;
  document.getElementById("teamNumber").value    = team.teamNumber;
  document.getElementById("teamName").value      = team.teamName;
  document.getElementById("teamCoach").value     = team.teamCoach;
  document.getElementById("teamRegion").value    = team.teamRegion;
  document.getElementById("teamAsstCoach").value = team.teamAsstCoach;
  document.getElementById("teamAgeDiv").value    = team.teamAgeDiv;
  document.getElementById("teamColors").value    = team.teamColors;

  window.ROSTER_LIST = Array.isArray(team.roster)
    ? team.roster
    : [];

  if (status) {
    status.textContent =
      `Editing team: ${team.teamName || "(unnamed)"}`;
  }

  renderRosterTable();
}

function clearTeamFields() {
  [
    "teamId",
    "teamNumber",
    "teamName",
    "teamCoach",
    "teamRegion",
    "teamAsstCoach",
    "teamAgeDiv",
    "teamColors"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  window.ROSTER_LIST = [];
}

function saveCurrentTeam() {
  const team = {
    teamId:        document.getElementById("teamId")?.value.trim() || "",
    teamNumber:    document.getElementById("teamNumber")?.value.trim() || "",
    teamName:      document.getElementById("teamName")?.value.trim() || "",
    teamCoach:     document.getElementById("teamCoach")?.value.trim() || "",
    teamRegion:    document.getElementById("teamRegion")?.value.trim() || "",
    teamAsstCoach: document.getElementById("teamAsstCoach")?.value.trim() || "",
    teamAgeDiv:    document.getElementById("teamAgeDiv")?.value.trim() || "",
    teamColors:    document.getElementById("teamColors")?.value.trim() || "",
    roster:        Array.isArray(window.ROSTER_LIST)
                    ? window.ROSTER_LIST
                    : []
  };

  if (!Number.isInteger(window.CURRENT_TEAM)) {
    window.TEAM_LIST.push(team);
    window.CURRENT_TEAM = window.TEAM_LIST.length - 1;
  } else {
    window.TEAM_LIST[window.CURRENT_TEAM] = team;
  }

  saveTeamsToStorage();
  populateTeamSelect();
  renderCurrentTeamUI();
}

window.saveCurrentTeam = saveCurrentTeam;

function deleteCurrentTeam() {
  if (!Number.isInteger(window.CURRENT_TEAM)) return;
  if (!confirm("Delete this team?")) return;

  window.TEAM_LIST.splice(window.CURRENT_TEAM, 1);
  window.CURRENT_TEAM = null;

  saveTeamsToStorage();
  populateTeamSelect();
  renderCurrentTeamUI();
}

function cloneCurrentTeam() {
  const team = getCurrentTeam();
  if (!team) return;

  const clone = JSON.parse(JSON.stringify(team));
  clone.teamName += " (clone)";

  window.TEAM_LIST.push(clone);
  window.CURRENT_TEAM = window.TEAM_LIST.length - 1;

  saveTeamsToStorage();
  populateTeamSelect();
  renderCurrentTeamUI();
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
    return { number: parts[0] || "", name: parts[1] || "" };
  });

  renderRosterTable();
}

function renderRosterTable() {
  const container = document.getElementById("rosterTableContainer");
  if (!container) return;

  if (!window.ROSTER_LIST.length) {
    container.innerHTML = "<p>No roster data.</p>";
    return;
  }

  let html = `
    <table class="roster-table">
      <thead><tr><th>#</th><th>Player Name</th></tr></thead>
      <tbody>
  `;

  window.ROSTER_LIST.forEach((p, i) => {
    html += `
      <tr>
        <td><input data-i="${i}" class="roster-num" value="${p.number}"></td>
        <td><input data-i="${i}" class="roster-name" value="${p.name}"></td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;

  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", e => {
      const i = Number(e.target.dataset.i);
      if (e.target.classList.contains("roster-num")) {
        window.ROSTER_LIST[i].number = e.target.value;
      } else {
        window.ROSTER_LIST[i].name = e.target.value;
      }
    });
  });
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
    s3.textContent = total
      ? `Extracted ${total} games.`
      : "No games extracted.";
  }

  const s5 = document.getElementById("status-section-5");
  if (s5) {
    // +1 for roster card
    const rosterSelected = 1;
    const totalSelected = rosterSelected + selectedGames;
    s5.textContent = total
      ? `Previewing ${totalSelected} of ${total + 1} cards.`
      : "No lineup cards to preview.";
  }
}

/* ============================================================
   PREVIEW CARDS
============================================================ */



function createCardElement(team, game) {
  const isTeamCard = !game;

  const card = document.createElement("div");
  card.className = "lineup-card";
  card.innerHTML = `
    <h3>${isTeamCard ? "Roster Only" : `${game.match_date} – ${game.match_time}`}</h3>
    <p><strong>Team:</strong> ${team.teamName}</p>
    ${!isTeamCard ? `
      <p><strong>Opponent:</strong> ${game.home_team === team.teamId ? game.away_team : game.home_team}</p>
      <p><strong>Location:</strong> ${game.location}</p>
    ` : ""}
    <div class="roster-list">
      ${team.roster.map(p => `<div>${p.number} – ${p.name}</div>`).join("")}
    </div>
    <div class="card-buttons">
      <button class="btn edit-card-btn">✏️ Edit</button>
      <button class="btn pdf-card-btn">📄 PDF</button>
    </div>
  `;

  // PDF button
  card.querySelector(".pdf-card-btn")?.addEventListener("click", async () => {
    if (!window.TEMPLATE_LIST.length) {
      alert("No template selected.");
      return;
    }

    try {
      const bytes = await createPdfForLineup(team, game);
      const filename = game
        ? `${team.teamName}-vs-${game.home_team === team.teamId ? game.away_team : game.home_team}.pdf`
        : `${team.teamName}-Roster.pdf`;

      saveAs(new Blob([bytes], { type: "application/pdf" }), filename);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  });

  // Edit button
  card.querySelector(".edit-card-btn")?.addEventListener("click", () => {
    enterEditModeInline(card, team, game);
  });

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
      saveAs(new Blob([bytes], { type: "application/pdf" }), filename);
    });
  });
}





function renderPreviewCards() {
  console.log("🔄 renderPreviewCards() called…");

  const container = document.getElementById("previewContainer");
  if (!container) {
    console.warn("⚠️ previewContainer not found");
    return;
  }

  container.innerHTML = "";

  const team = getCurrentTeam();
  if (!team) {
    console.log("❗ No team selected yet");
    container.innerHTML = "<p>Select a team to preview cards.</p>";
    return;
  }

  if (!Array.isArray(window.GAME_LIST) || window.GAME_LIST.length === 0) {
    console.log("❗ No games parsed yet");
    container.innerHTML = "<p>No schedule extracted yet.</p>";
    return;
  }

  console.log("✅ Selected team:", team.teamName, "| teamId:", team.teamId);

  const grid = document.createElement("div");
  grid.className = "lineup-card-grid";
  container.appendChild(grid);

  // 🧾 Roster-only card
  const teamCard = createCardElement(team, null);
  grid.appendChild(teamCard);

  // 🔍 Fuzzy match against home/away team IDs or names
  const tid = String(team.teamId || "").toLowerCase();
  const tnum = String(team.teamNumber || "").toLowerCase();
  const tname = String(team.teamName || "").toLowerCase();

  let matchCount = 0;

  const matchingGames = window.GAME_LIST.filter(g => {
    const home = String(g.home_team || "").toLowerCase();
    const away = String(g.away_team || "").toLowerCase();

    return (
      home.includes(tid) || away.includes(tid) ||
      home.includes(tnum) || away.includes(tnum) ||
      home.includes(tname) || away.includes(tname)
    );
  });

  console.log(`🎯 Found ${matchingGames.length} matching games`);

  matchingGames.forEach(game => {
    const card = createCardElement(team, game);
    grid.appendChild(card);
    matchCount++;
  });

  // 💬 Update preview status line
  const status = document.getElementById("previewStatusLine");
  if (status) {
    status.textContent = `Previewing ${matchCount + 1} of ${window.GAME_LIST.length} cards.`;
  }

  if (matchCount === 0) {
    grid.insertAdjacentHTML("beforeend", "<p>No matching games found for this team.</p>");
  }
}


function enterEditMode(team, game) {
  const modal = document.getElementById("lineupEditModal");
  const body  = document.getElementById("lineupEditModalBody");
  const saveBtn   = document.getElementById("saveLineupEditBtn");
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
  body.insertAdjacentHTML("beforeend", row("Team Name",   "editTeamName",   team.teamName));
  body.insertAdjacentHTML("beforeend", row("Coach",       "editTeamCoach",  team.teamCoach));
  body.insertAdjacentHTML("beforeend", row("Region",      "editTeamRegion", team.teamRegion));
  body.insertAdjacentHTML("beforeend", row("Age / Div",   "editTeamAgeDiv", team.teamAgeDiv));
  body.insertAdjacentHTML("beforeend", row("Team Colors", "editTeamColors", team.teamColors));

  /* =========================
     GAME FIELDS (optional)
  ========================= */
  if (game) {
    body.insertAdjacentHTML("beforeend", "<hr>");
    body.insertAdjacentHTML("beforeend", row("Date",     "editGameDate",     game.match_date));
    body.insertAdjacentHTML("beforeend", row("Time",     "editGameTime",     game.match_time));
    body.insertAdjacentHTML("beforeend", row("Location", "editGameLocation", game.location));
  }

  /* =========================
     SHOW MODAL
  ========================= */
  modal.classList.remove("hidden");

  /* =========================
     SAVE HANDLER
  ========================= */
  saveBtn.onclick = () => {
    // update team
    team.teamName   = document.getElementById("editTeamName")?.value.trim()   || "";
    team.teamCoach  = document.getElementById("editTeamCoach")?.value.trim()  || "";
    team.teamRegion = document.getElementById("editTeamRegion")?.value.trim() || "";
    team.teamAgeDiv = document.getElementById("editTeamAgeDiv")?.value.trim() || "";
    team.teamColors = document.getElementById("editTeamColors")?.value.trim() || "";

    // update game if present
    if (game) {
      game.match_date = document.getElementById("editGameDate")?.value.trim() || "";
      game.match_time = document.getElementById("editGameTime")?.value.trim() || "";
      game.location   = document.getElementById("editGameLocation")?.value.trim() || "";
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


/**
 * Create a single PDF byte array for one lineup card
 * @param {Object} team
 * @param {Object|null} game
 */
window.createPdfForLineup = async function createPdfForLineup(team, game) {
  // Get selected template
  const tpl = window.TEMPLATE_LIST?.[window.selectedTemplateIndex];
  if (!tpl) {
    throw new Error("No template loaded");
  }

  // Load the PDF template bytes
  const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`)
    .then(r => r.arrayBuffer());

  const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Team fields
  form.getTextField("TeamName").setText(team.teamName || "");
  form.getTextField("Coach").setText(team.teamCoach || "");
  form.getTextField("Region").setText(team.teamRegion || "");
  form.getTextField("AgeDiv").setText(team.teamAgeDiv || "");
  form.getTextField("Colors").setText(team.teamColors || "");

  // Game fields (if any)
  if (game) {
    const opp = game.home_team === team.teamId ? game.away_team : game.home_team;
    form.getTextField("Opponent").setText(opp || "");
    form.getTextField("Date").setText(game.match_date || "");
    form.getTextField("Time").setText(game.match_time || "");
    form.getTextField("Location").setText(game.location || "");
  }

  // Roster fields — up to the number your template supports
  const roster = game?.customRoster || team.roster || [];
  roster.forEach((p, i) => {
    const numField = `Player${i + 1}_Number`;
    const nameField = `Player${i + 1}_Name`;

    try {
      form.getTextField(numField).setText(p.number || "");
      form.getTextField(nameField).setText(p.name || "");
    } catch (err) {
      // Some templates may not have all fields; ignore missing
    }
  });

  form.flatten();
  return await pdfDoc.save();
}

// Expose globally so card PDF button can call it
window.createPdfForLineup = createPdfForLineup;
async function generatePDFs() {
  const team = getCurrentTeam();
  if (!team) {
    alert("Select a team first.");
    return;
  }

  const selectedGames = window.GAME_LIST.filter(g => g.selected);
  const outputList = [];

  // Always include roster-only card
  outputList.push({ team, game: null });

  // Add selected game cards
  selectedGames.forEach(game => {
    const match = [game.home_team, game.away_team]
      .some(t => t?.toLowerCase().includes(team.teamId?.toLowerCase()));
    if (match) {
      outputList.push({ team, game });
    }
  });

  const zip = new JSZip();

  for (const { team, game } of outputList) {
    const bytes = await createPdfForLineup(team, game);
    const opp = game?.home_team === team.teamId ? game.away_team : game?.home_team;
    const filename = game
      ? `${team.teamName}-vs-${opp || "Opponent"}.pdf`
      : `${team.teamName}-Roster.pdf`;
    zip.file(filename, bytes);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${team.teamName}-LineupCards.zip`);
}
window.generatePDFs = generatePDFs;

window.createPdfForLineup = async function (team, game) {
  const tpl = window.TEMPLATE_LIST?.[window.selectedTemplateIndex];
  if (!tpl) {
    throw new Error("No template selected.");
  }

  const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`)
    .then((r) => r.arrayBuffer());

  const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Helper to set field only if it exists
  function setField(name, value) {
    try {
      const field = form.getTextField(name);
      if (field) {
        field.setText(value ?? "");
        console.log(`✅ Set field "${name}" =`, value);
      }
    } catch (err) {
      console.warn(`⚠️ Field "${name}" not found or not writable`);
    }
  }

  // --- Game fields (if present) ---
  if (game) {
    setField("GameDate", game.match_date || "");
    setField("GameTime", game.match_time || "");

    const combinedDateTime = `${game.match_date || ""} ${game.match_time || ""}`.trim();
	setField("DateTime", combinedDateTime);
	// fallback if some templates use this name
	setField("GameDateTime", combinedDateTime);

    setField("GameLocation", game.location || "");
    setField("GameLengthOfHalf", game.lengthOfHalf || "");

    const isHome = game.home_team === team.teamId;
    if (isHome) {
      setField("HomeX", "X");
      setField("VisitorX", "");
      setField("HomeID", team.teamId || "");
      setField("VisitorID", game.away_team || "");
    } else {
      setField("HomeX", "");
      setField("VisitorX", "X");
      setField("HomeID", game.home_team || "");
      setField("VisitorID", team.teamId || "");
    }
  }

  // --- Team fields ---
  setField("TeamName", team.teamName || "");
  setField("TeamColors", team.teamColors || "");
  setField("TeamCoach", team.teamCoach || "");
  setField("TeamRegion", team.teamRegion || "");
  setField("TeamID", team.teamId || "");
  setField("TeamAsstCoach", team.teamAsstCoach || "");

  // ✅ NEW: Set AgeDiv (Age/Division)
  setField("AgeDiv", team.teamAgeDiv || "");

  // --- Opponent fields (if game) ---
  if (game) {
    const isHome = (game.home_team === team.teamId);
    const opponentId = isHome ? game.away_team : game.home_team;
    const opponentName = isHome ? game.away_team : game.home_team;

    setField("OpponentID", opponentId || "");
    setField("OpponentName", opponentName || "");
    setField("OpponentRegion", game.opponentRegion || "");
    setField("OpponentCoach", game.opponentCoach || "");
    setField("OpponentAsstCoach", game.opponentAsstCoach || "");
    setField("OpponentColors", game.opponentColors || "");
  }

  // --- Roster (up to 18) ---
  const roster = game?.customRoster || team.roster || [];
  for (let i = 0; i < 18; i++) {
    const p = roster[i] || { number: "", name: "" };
    setField(`Player${i + 1}_Name`,   p.name   || "");
    setField(`Player${i + 1}_Number`, p.number || "");
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
  const selectedGames = Array.isArray(window.GAME_LIST)
    ? window.GAME_LIST.filter(g => g.selected &&
        (String(g.home_team || "").toLowerCase().includes(teamIdLower) ||
         String(g.away_team || "").toLowerCase().includes(teamIdLower)))
    : [];

  // Always include roster‑only card
  const items = [{ team, game: null }];

  // Add games
  selectedGames.forEach(game => {
    items.push({ team, game });
  });

  if (!items.length) {
    alert("No games selected to generate.");
    return;
  }

  // Use JSZip to make a zip with all PDFs
  const zip = new JSZip();

  for (const item of items) {
    const { team, game } = item;

    try {
      const pdfBytes = await window.createPdfForLineup(team, game);

      // Determine filename
      const filename = game
        ? `${team.teamName}-vs-${(game.home_team === team.teamId
            ? game.away_team
            : game.home_team)
          }.pdf`
        : `${team.teamName}-Roster.pdf`;

      zip.file(filename, pdfBytes);
    } catch (err) {
      console.error("Error generating PDF for", game, err);
      alert(`Error generating PDF for ${game?.match_date} ${game?.match_time}`);
      return;
    }
  }

  // Generate and download zip
  try {
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${team.teamName}-LineupCards.zip`);
  } catch (err) {
    console.error("Error generating ZIP", err);
    alert("Failed to generate ZIP.");
  }
}

window.generateAllLineupPDFs = generateAllLineupPDFs;

async function loadTemplates() {
  try {
    const resp = await fetch("templates.json", { cache: "no-store" });
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
  const nameEl   = document.getElementById("templateName");
  const img      = document.getElementById("templateImage");

  if (!Array.isArray(window.TEMPLATE_LIST) || !window.TEMPLATE_LIST.length) {
    statusEl.textContent = "No templates loaded.";
    nameEl.textContent   = "";
    img.src              = "";
    return;
  }

  const tpl = window.TEMPLATE_LIST[window.selectedTemplateIndex];
  nameEl.textContent = tpl.name || "";
  statusEl.textContent = `Template ${window.selectedTemplateIndex + 1} of ${window.TEMPLATE_LIST.length}`;

  img.src = `templates/${tpl.png}`;
}

	document.getElementById("inspectTemplateBtn")?.addEventListener("click", async () => {
	  const tpl = window.TEMPLATE_LIST[window.selectedTemplateIndex];
	  const resultEl = document.getElementById("templateFieldList");

	  if (!tpl) {
		resultEl.textContent = "⚠️ No template selected.";
		return;
	  }

	  const url = `./templates/${tpl.pdf}?v=${Date.now()}`;

	  try {
		const bytes = await fetch(url).then(r => r.arrayBuffer());
		const pdfDoc = await PDFLib.PDFDocument.load(bytes);
		const form = pdfDoc.getForm();
		const fieldNames = form.getFields().map(f => f.getName());

		if (!fieldNames.length) {
		  resultEl.textContent = "⚠️ No form fields found in this template.";
		  return;
		}

		// Build list HTML
		resultEl.innerHTML =
		  `<p>Fields in "${tpl.name}" (${tpl.pdf}):</p>` +
		  `<ul>` +
		  fieldNames.map(name => `<li>${name}</li>`).join("") +
		  `</ul>`;
	  } catch (err) {
		console.error("Inspect Template Fields error:", err);
		resultEl.textContent = `❌ Error reading PDF template: ${err.message}`;
	  }

	  // Show panel
	  document.getElementById("templateFieldInspector")?.classList.remove("hidden");
	});



document.getElementById("closeFieldInspectorBtn")?.addEventListener("click", () => {
  document.getElementById("templateFieldInspector").classList.add("hidden");
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

document.getElementById("saveScheduleBtn")?.addEventListener("click", () => {
  const rawInputEl = document.getElementById("rawInput");
  const raw = rawInputEl?.value.trim() || "";

  if (!raw) {
    alert("Please paste schedule text before saving.");
    return;
  }

  const nameInput = prompt("Name this schedule:", "");
  const name = nameInput?.trim();
  if (!name) return;

  const list = window.SCHEDULE_LIST || [];
  const existingIndex = list.findIndex(s => s.name === name);

  if (existingIndex >= 0) {
    if (!confirm(`A schedule named "${name}" already exists. Replace it?`)) {
      return;
    }

    // Replace
    list[existingIndex].rawText = raw;
    window.selectedScheduleIndex = existingIndex;

  } else {
    list.push({ name, rawText: raw });
    window.selectedScheduleIndex = list.length - 1;
  }

  localStorage.setItem("savedSchedules", JSON.stringify(list));
  refreshScheduleCarousel();
  updateScheduleStatus();
});


  // Load existing saved schedules

// Use the selected schedule

document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const list = window.SCHEDULE_LIST || [];
  const idx = window.selectedScheduleIndex;

  if (list.length === 0 || idx == null || !list[idx]) {
    alert("Select a schedule first.");
    return;
  }

  const raw = list[idx].rawText;
  if (!raw) {
    alert("Selected schedule is empty.");
    return;
  }

  const rawArea = document.getElementById("rawInput");
  rawArea.value = raw;

  const parsed = window.ScheduleStore.importSchedule({
  rawText: raw,
  source: "paste",          // or "saved", "single-game", etc
  autoSelect: true          // optional, selects games by default
});
  const statusEl = document.getElementById("scheduleStatus");

  if (parsed && parsed.length) {
    statusEl.textContent = `🔍 Extracted ${parsed.length} games`;
  } else {
    statusEl.textContent = `⚠️ No games extracted from schedule.`;
  }
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

  // Initialize collapsibles first
 // initCollapsibles();

 // Load templates
	loadTemplates().then(() => {
	  refreshTemplateCarousel();
	});

  // Load teams from storage
  loadTeamsFromStorage();
  console.log("🧠 Loaded teams:", window.TEAM_LIST);

  // Populate the dropdown
  populateTeamSelect();

  // Try to restore previous selection
  const storedIdxRaw = localStorage.getItem("lineupCardFactoryCurrentTeam");
  let restoredIndex = null;

  if (storedIdxRaw !== null) {
    const idx = Number(storedIdxRaw);
    if (Number.isInteger(idx) && idx >= 0 && idx < window.TEAM_LIST.length) {
      restoredIndex = idx;
    }
  }

  // If not restored, and teams exist, pick the first
  if (restoredIndex === null && window.TEAM_LIST.length > 0) {
    restoredIndex = 0;
  }

  // If we have a team index, *select* it via selectTeam()
  if (restoredIndex !== null) {
    console.log("🧠 initUI -> selecting team index:", restoredIndex);
    selectTeam(restoredIndex);
  }

  // Log final state
  console.log("🧠 After initUI, CURRENT_TEAM =", window.CURRENT_TEAM);

  // Team selector change handler
  document.getElementById("teamSelect")?.addEventListener("change", (e) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx)) {
      selectTeam(idx);
    }
  });

  // Team form buttons
  document.getElementById("newTeamBtn")?.addEventListener("click", () => {
    window.CURRENT_TEAM = null;
    clearTeamFields();
    populateTeamSelect();
  });
  document.getElementById("cloneTeamBtn")?.addEventListener("click", cloneCurrentTeam);
  document.getElementById("deleteTeamBtn")?.addEventListener("click", deleteCurrentTeam);
  document.getElementById("saveTeamBtn")?.addEventListener("click", saveCurrentTeam);

  // Roster buttons
  document.getElementById("parseRosterBtn")?.addEventListener("click", () => {
    parseRoster(document.getElementById("rosterInput")?.value || "");
  });
  document.getElementById("clearRosterBtn")?.addEventListener("click", () => {
    window.ROSTER_LIST = [];
    renderRosterTable();
  });
// Load saved schedules
const savedSchedules =
  JSON.parse(localStorage.getItem("savedSchedules") || "[]") || [];

savedSchedules.forEach(s => addSchedule(s.name, s.rawText));

// Optional: add sample schedules
addSchedule(
  "Sample AYSO",
  `Home\tAway\tDate\tTime\tLocation\nTeam1\tTeam2\tSat, Jan 10, 2026\t10:00 AM\tField1`
);
  // Schedule parse
document.getElementById("parseBtn")?.addEventListener("click", () => {
  const raw = document.getElementById("rawInput")?.value || "";
  const parsed = window.ScheduleStore.importSchedule({
  rawText: raw,
  source: "paste",          // or "saved", "single-game", etc
  autoSelect: true          // optional, selects games by default
});

  if (parsed && parsed.length) {

    // ✅ If no team is currently selected, pick the first
    if (window.CURRENT_TEAM === null && window.TEAM_LIST.length > 0) {
      console.log("🟢 No team selected — auto‑selecting first team");
      selectTeam(0);   // sets CURRENT_TEAM and updates UI state
    }

    renderPreviewCards();
  }
});

  document.getElementById("clearScheduleBtn")?.addEventListener("click", () => {
    document.getElementById("rawInput").value = "";
    window.GAME_LIST = [];
    updateStatusLines();
    renderPreviewCards();
  });

  // Filter
  document.getElementById("applyFilterBtn")?.addEventListener("click", applyFilter);
  document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
    document.getElementById("filterInput").value = "";
    applyFilter();
  });
  document.getElementById("generateBtn")?.addEventListener("click", generatePDFs);

// 🔽 Add these below existing event listeners
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

// Template loading
loadTemplates().then(refreshTemplateCarousel);
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


// Add a schedule to the list
function addSchedule(name, rawText) {
  window.SCHEDULE_LIST.push({ name, rawText });
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

// Load the selected schedule
document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const sel = window.SCHEDULE_LIST[window.selectedScheduleIndex];
  if (!sel) {
    alert("Select a schedule first.");
    return;
  }

  // Populate your existing raw input (if you have one) just in case
  const rawInput = document.getElementById("rawInput");
  if (rawInput) rawInput.value = sel.rawText;

  const parsed = parseScheduleText(sel.rawText);

  const statusEl = document.getElementById("scheduleStatus");
  if (parsed && parsed.length) {
    statusEl.textContent = `🔍 Extracted ${parsed.length} games from "${sel.name}"`;
  } else {
    statusEl.textContent = `⚠️ No games extracted from "${sel.name}"`;
  }
});

// Save the currently selected schedule
document.getElementById("saveScheduleBtn")?.addEventListener("click", () => {
  const sel = window.SCHEDULE_LIST[window.selectedScheduleIndex];
  if (!sel) return;

  const stored = JSON.parse(localStorage.getItem("savedSchedules") || "[]");
  const exists = stored.find(s => s.rawText === sel.rawText);

  if (exists) {
    alert("This schedule is already saved.");
    return;
  }

  stored.push(sel);
  localStorage.setItem("savedSchedules", JSON.stringify(stored));
  alert(`Schedule "${sel.name}" saved.`);
});
