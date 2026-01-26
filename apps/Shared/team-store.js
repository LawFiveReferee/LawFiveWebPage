// ----------------------------------------
// TEAM STORE (persistent via localStorage)
// ----------------------------------------

const TEAM_STORAGE_KEY = "lineupCardFactoryTeams";
const LAST_TEAM_KEY = "lastSelectedTeamId";

let _teams = [];
let _currentTeamId = null;
window.ROSTER_LIST = [];

// ----------------------------------------
// STORAGE
// ----------------------------------------

function loadTeamsFromStorage() {
  try {
    _teams = JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY)) || [];
  } catch {
    _teams = [];
  }

  const last = localStorage.getItem(LAST_TEAM_KEY);
  if (last && _teams.find(t => t.teamId === last)) {
    _currentTeamId = last;
  }
}

function saveTeamsToStorage() {
  localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(_teams));
}

// ----------------------------------------
// ACCESSORS
// ----------------------------------------

function getAllTeams() {
  return _teams;
}

function getTeamById(id) {
  return _teams.find(t => t.teamId === id) || null;
}

function getCurrentTeam() {
  return _currentTeamId ? getTeamById(_currentTeamId) : null;
}

function selectTeamById(id) {
  _currentTeamId = id;
  localStorage.setItem(LAST_TEAM_KEY, id);
}

// ----------------------------------------
// MUTATORS
// ----------------------------------------

function addOrUpdateTeam(team) {
  const idx = _teams.findIndex(t => t.teamId === team.teamId);
  if (idx >= 0) _teams[idx] = team;
  else _teams.push(team);

  _currentTeamId = team.teamId;
  saveTeamsToStorage();
}

function deleteCurrentTeam() {
  if (!Number.isInteger(window.CURRENT_TEAM)) return;
  if (!confirm("Delete this team?")) return;

  const idx = window.CURRENT_TEAM;

  window.TEAM_LIST.splice(idx, 1);

  // choose new index
  if (window.TEAM_LIST.length > 0) {
    const newIndex = idx > 0 ? idx - 1 : 0;
    window.CURRENT_TEAM = newIndex;
  } else {
    window.CURRENT_TEAM = null;
  }

  saveTeamsToStorage();
  populateTeamSelect();
  renderCurrentTeamUI();
}

// create a unique clone ID
function generateCloneId(baseId) {
  let i = 1;
  let candidate = `${baseId}-clone`;
  while (getTeamById(candidate)) candidate = `${baseId}-clone-${i++}`;
  return candidate;
}

function cloneCurrentTeam() {
  const team = getCurrentTeam();
  if (!team) return;
  const clone = JSON.parse(JSON.stringify(team));
  clone.teamId = generateCloneId(team.teamId);
  addOrUpdateTeam(clone);
}

// ----------------------------------------
// TSV IMPORT
// ----------------------------------------

function parseTSV(tsv) {
  const lines = tsv.trim().split(/\r?\n/).filter(l => l.trim() !== "");
  const roster = [];
  const team = {};

  if (lines.length === 0) {
    return { team: {}, roster: [] };
  }

  // Look at first line to see if it contains headers
  const firstCells = lines[0].split("\t").map(c => c.trim().toLowerCase());

  const teamHeaders = [
    "team id", "age / division", "age/division", "age div",
    "team region", "region", "team number", "team #",
    "team name", "coach", "team coach",
    "assistant coach", "asst coach", "colors", "team colors"
  ];

  const isHeader = firstCells.every(cell =>
    teamHeaders.includes(cell)
  );

  let dataStartIndex = 0;
  let headerMap = null;

  if (isHeader) {
    // Map column name → index
    headerMap = {};
    firstCells.forEach((label, idx) => {
      headerMap[label] = idx;
    });
    dataStartIndex = 1;
  }

  // If header row exists, parse team fields from it; else parse from first data row
  function getField(cells, fieldNames) {
    if (!headerMap) return null;
    for (const name of fieldNames) {
      const key = Object.keys(headerMap).find(h => h === name.toLowerCase());
      if (key !== undefined) {
        return cells[headerMap[key]] || "";
      }
    }
    return null;
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const cells = lines[i].split("\t").map(c => c.trim());

    // First data row → team fields if we haven’t set them yet
    if (i === dataStartIndex) {
      if (headerMap) {
        // Header‑based extraction
        team.teamId        = getField(cells, ["Team ID"]) || "";
        team.teamAgeDiv    = getField(cells, ["Age / Division","AgeDiv"]) || "";
        team.teamRegion    = getField(cells, ["Team Region","Region"]) || "";
        team.teamNumber    = getField(cells, ["Team Number","Team #"]) || "";
        team.teamName      = getField(cells, ["Team Name"]) || "";
        team.teamCoach     = getField(cells, ["Team Coach","Coach"]) || "";
        team.teamAsstCoach = getField(cells, ["Assistant Coach","Asst Coach"]) || "";
        team.teamColors    = getField(cells, ["Team Colors","Colors"]) || "";
      } else if (cells.length >= 8) {
        // No header — assume the standard ordered line
        team.teamId        = cells[0] || "";
        team.teamAgeDiv    = cells[1] || "";
        team.teamRegion    = cells[2] || "";
        team.teamNumber    = cells[3] || "";
        team.teamName      = cells[4] || "";
        team.teamCoach     = cells[5] || "";
        team.teamAsstCoach = cells[6] || "";
        team.teamColors    = cells[7] || "";
      }
      // After extracting team fields, continue to next line
      continue;
    }

    // Roster lines — need at least two fields (number + name)
    if (cells.length >= 2) {
      roster.push({
        number: cells[0] || "",
        name:   cells[1] || ""
      });
    }
  }

  return { team, roster };
}

// ----------------------------------------
// ROSTER RENDERING
// ----------------------------------------

window.renderRosterTable = function (roster = [], container) {
  container = container || document.getElementById("rosterTableContainer");
  if (!container) return;
  container.innerHTML = "";
  window.ROSTER_LIST = roster;

  roster.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "roster-row";
    row.dataset.index = index;
    row.draggable = true;

    row.innerHTML = `
      <span class="drag-handle">☰</span>
      <button type="button" class="remove-player-btn" data-index="${index}">−</button>
      <input class="roster-number-input" placeholder="#" value="${p.number || ""}">
      <input class="roster-name-input" placeholder="Player Name" value="${p.name || ""}">
    `;

    container.appendChild(row);
  });

  attachRosterHandlers(container);
};

function syncRosterFromUI() {
  window.ROSTER_LIST = Array.from(document.querySelectorAll(".roster-row"))
    .map(r => ({
      number: r.querySelector(".roster-number-input")?.value.trim() || "",
      name:   r.querySelector(".roster-name-input")?.value.trim() || ""
    }))
    .filter(p => p.number || p.name);
}

function attachRosterHandlers(container) {
  let dragSrcIndex = null;

  container.querySelectorAll(".roster-row").forEach(row => {

    row.addEventListener("dragstart", e => {
      dragSrcIndex = Number(row.dataset.index);
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
    });

    row.addEventListener("dragover", e => {
      e.preventDefault();
    });

    row.addEventListener("drop", e => {
      e.preventDefault();
      const targetIndex = Number(row.dataset.index);
      if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

      syncRosterFromUI();

      const moved = window.ROSTER_LIST.splice(dragSrcIndex, 1)[0];
      window.ROSTER_LIST.splice(targetIndex, 0, moved);

      renderRosterTable(window.ROSTER_LIST);
    });
  });

  container.querySelectorAll(".remove-player-btn").forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.index);
      syncRosterFromUI();
      window.ROSTER_LIST.splice(idx, 1);
      renderRosterTable(window.ROSTER_LIST);
    };
  });
}

// ----------------------------------------
// UI
// ----------------------------------------

function clearTeamFields() {
  ["teamId","teamNumber","teamName","teamCoach",
   "teamRegion","teamAsstCoach","teamAgeDiv","teamColors"]
    .forEach(id => document.getElementById(id).value = "");
  renderRosterTable([]);
}

function renderCurrentTeamUI() {
  const team = getCurrentTeam();
  const status = document.getElementById("status-section‑1‑team");

  if (!team) {
    if (status) status.textContent = "No team selected — create or load a team.";
    clearTeamFields();
    renderRosterTable([]);
    return;
  }

  document.getElementById("teamId").value        = team.teamId || "";
  document.getElementById("teamNumber").value    = team.teamNumber || "";
  document.getElementById("teamName").value      = team.teamName || "";
  document.getElementById("teamCoach").value     = team.teamCoach || "";
  document.getElementById("teamRegion").value    = team.teamRegion || "";
  document.getElementById("teamAsstCoach").value = team.teamAsstCoach || "";
  document.getElementById("teamAgeDiv").value    = team.teamAgeDiv || "";
  document.getElementById("teamColors").value    = team.teamColors || "";

  window.ROSTER_LIST = team.roster || [];
  renderRosterTable(window.ROSTER_LIST);

	 if (status) {
	  const label =
		team.teamName?.trim() ||
		team.teamId?.trim() ||
		"(unnamed team)";

	  status.textContent =
		`${label} — Currently selected. Expand to change, view or edit teams.`;
	}
}
window.renderCurrentTeamUI = renderCurrentTeamUI;

function initTeamSelectorUI() {
  const sel = document.getElementById("teamSelect");
  if (!sel) return;

  sel.innerHTML = "";
  getAllTeams().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.teamId;
    opt.textContent = t.teamId;
    sel.appendChild(opt);
  });

  if (_currentTeamId && sel.querySelector(`option[value="${_currentTeamId}"]`)) {
    sel.value = _currentTeamId;
  }

  sel.onchange = () => {
    selectTeamById(sel.value);
    renderCurrentTeamUI();
  };

  renderCurrentTeamUI();
}
function initTeamDropdown() {
  const sel = document.getElementById("teamSelect");
  if (!sel) return;

  const teams = window.TeamStore.getAllTeams();
  sel.innerHTML = "";

  teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.teamId;
    opt.textContent = t.teamId;
    sel.appendChild(opt);
  });

  const current = window.TeamStore.getCurrentTeam();
  if (current) {
    sel.value = current.teamId;
  }

  sel.onchange = () => {
    window.TeamStore.selectTeamById(sel.value);
    renderCurrentTeamUI();
  };
}

// 🔁 Expose globally so lineup-card-factory.js can call it
window.initTeamDropdown = initTeamDropdown;


// ----------------------------------------
// SAVE
// ----------------------------------------

function saveCurrentTeam() {
  // Pull values from UI into ROSTER_LIST
  syncRosterFromUI();

  const team = {
    teamId: document.getElementById("teamId")?.value.trim(),
    teamNumber: document.getElementById("teamNumber")?.value.trim(),
    teamName: document.getElementById("teamName")?.value.trim(),
    teamCoach: document.getElementById("teamCoach")?.value.trim(),
    teamRegion: document.getElementById("teamRegion")?.value.trim(),
    teamAsstCoach: document.getElementById("teamAsstCoach")?.value.trim(),
    teamAgeDiv: document.getElementById("teamAgeDiv")?.value.trim(),
    teamColors: document.getElementById("teamColors")?.value.trim(),
    roster: window.ROSTER_LIST
  };

  if (!team.teamId) {
    alert("Team ID is required");
    return;
  }

  // Save via TeamStore
  window.TeamStore.addOrUpdateTeam(team);

  alert(`Team "${team.teamName || team.teamId}" saved.`);
}

// ----------------------------------------
// IMPORT SHEET EVENT HOOKS
// ----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  window.TeamStore.loadTeamsFromStorage();
  window.initTeamDropdown && window.initTeamDropdown();

document.getElementById("parseRosterBtn")?.addEventListener("click", () => {
  // Sync what’s in the roster input area into the UI roster list
  const textarea = document.getElementById("rosterInput");
  if (!textarea) return;
  const lines = textarea.value
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const parsed = lines.map(line => {
    const parts = line.split(/\t| {2,}/);
    return { number: parts[0] || "", name: parts.slice(1).join(" ").trim() };
  });
  window.ROSTER_LIST = parsed;
  renderRosterTable(parsed);
});

  // --- SAVE TEAM ---
  document.getElementById("saveTeamBtn")?.addEventListener("click", () => {
    saveCurrentTeam();
    initTeamSelectorUI(); // refresh dropdown
  });

  // --- DELETE TEAM ---
document.getElementById("deleteTeamBtn")?.addEventListener("click", () => {

  const currentTeam = window.TeamStore.getCurrentTeam();
  if (!currentTeam) {
    alert("No team selected to delete.");
    return;
  }

  if (!confirm(`Delete team "${currentTeam.teamName || currentTeam.teamId}"?`)) {
    return;
  }

  // Remove the current team
  window.TeamStore.deleteCurrentTeam();

  // Get remaining teams
  const remaining = window.TeamStore.getAllTeams();

  // Decide what should be selected next
  let nextTeam = null;
  if (remaining.length > 0) {
    // Try to find the index of the deleted team in the old list
    // (TeamStore doesn’t track indexes, so just pick first)
    nextTeam = remaining[0];
    window.TeamStore.selectTeamById(nextTeam.teamId);
  } else {
    // No teams left
    window.TeamStore.selectTeamById(null);
  }

  // Update dropdown UI
  if (window.initTeamDropdown) window.initTeamDropdown();

  // Update form
  if (nextTeam) {
    window.renderCurrentTeamUI();
  } else {
    // Clear the form if nothing left
    clearTeamFields();
  }
});

  // --- CLONE TEAM ---
  document.getElementById("cloneTeamBtn")?.addEventListener("click", () => {
    window.TeamStore.cloneCurrentTeam();
    initTeamSelectorUI();
  });

  // --- NEW TEAM ---
  document.getElementById("newTeamBtn")?.addEventListener("click", () => {
    // clear internal current team so save creates a new one
    window.TeamStore.selectTeamById(null);

    // clear UI
    clearTeamFields();

    // add a "New Team" placeholder option if it isn't there
    const sel = document.getElementById("teamSelect");
    if (sel) {
      let placeholder = sel.querySelector('option[value="new"]');
      if (!placeholder) {
        placeholder = document.createElement("option");
        placeholder.value = "new";
        placeholder.textContent = "🔹 New Team";
        sel.insertBefore(placeholder, sel.firstChild);
      }
      sel.value = "new";
    }
  });
	  // 🔘 Open Import Modal
	document.getElementById("openImportModalBtn")?.addEventListener("click", () => {
	  document.getElementById("importModal").classList.remove("hidden");
	  document.getElementById("tsvInput").value = "";
	});

	// ❌ Close Modal
	document.getElementById("closeImportModalBtn")?.addEventListener("click", () => {
	  document.getElementById("importModal").classList.add("hidden");
	});

	// ✅ Import TSV
document.getElementById("importTsvBtn")?.addEventListener("click", () => {
  const text = document.getElementById("tsvInput").value.trim();
  if (!text) {
    alert("Paste TSV to import");
    return;
  }

  const { team, roster } = parseTSV(text);
  if (!team.teamId) {
    alert("No valid team in TSV");
    return;
  }

  // Set as new/ imported team
  _currentTeamId = null;
  window.ROSTER_LIST = roster;

  // Populate fields
  document.getElementById("teamId").value        = team.teamId || "";
  document.getElementById("teamNumber").value    = team.teamNumber || "";
  document.getElementById("teamName").value      = team.teamName || "";
  document.getElementById("teamCoach").value     = team.teamCoach || "";
  document.getElementById("teamRegion").value    = team.teamRegion || "";
  document.getElementById("teamAsstCoach").value = team.teamAsstCoach || "";
  document.getElementById("teamAgeDiv").value    = team.teamAgeDiv || "";
  document.getElementById("teamColors").value    = team.teamColors || "";

  renderRosterTable(roster);

  // === Update the dropdown to show "Imported Team" ===
  const sel = document.getElementById("teamSelect");
  if (sel) {
    // Remove existing "imported" or "new" placeholder if present
    const oldPlaceholder = sel.querySelector('option[value="new"]');
    if (oldPlaceholder) oldPlaceholder.remove();

    // Add a fresh placeholder at the top
    const placeholder = document.createElement("option");
    placeholder.value = "new";
    placeholder.textContent = `🔹 Imported Team`;
    sel.insertBefore(placeholder, sel.firstChild);

    sel.value = "new";
  }

  document.getElementById("importModal").classList.add("hidden");
  document.getElementById("status-section-1-team").textContent =
    `Imported team "${team.teamName || team.teamId}" — ready to save`;
});
});


// ----------------------------------------
// EXPOSE
// ----------------------------------------

window.TeamStore = {
  loadTeamsFromStorage,
  getAllTeams,
  getTeamById,
  getCurrentTeam,
  selectTeamById,
  addOrUpdateTeam,
  deleteCurrentTeam,
  cloneCurrentTeam
};

console.log("✅ TeamStore initialized");
