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
  const team = getCurrentTeam();
  if (!team) return;

  _teams = _teams.filter(t => t.teamId !== team.teamId);
  saveTeamsToStorage();
  _currentTeamId = null;
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
  const lines = tsv.trim().split(/\r?\n/);
  const team = {};
  const roster = [];

  lines.forEach((line, i) => {
    const cells = line.split("\t").map(s => s.trim());
    if (i === 0) {
      // first row = team info
      [
        team.teamId,
        team.teamName,
        team.teamCoach,
        team.teamRegion,
        team.teamAsstCoach,
        team.teamNumber,
        team.teamAgeDiv,
        team.teamColors
      ] = cells;
    } else if (cells.length >= 2) {
      roster.push({ number: cells[0], name: cells[1] });
    }
  });

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
  if (!team) {
    clearTeamFields();
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

  renderRosterTable(team.roster || []);
}

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
  syncRosterFromUI();

  const team = {
    teamId: document.getElementById("teamId").value.trim(),
    teamNumber: document.getElementById("teamNumber").value.trim(),
    teamName: document.getElementById("teamName").value.trim(),
    teamCoach: document.getElementById("teamCoach").value.trim(),
    teamRegion: document.getElementById("teamRegion").value.trim(),
    teamAsstCoach: document.getElementById("teamAsstCoach").value.trim(),
    teamAgeDiv: document.getElementById("teamAgeDiv").value.trim(),
    teamColors: document.getElementById("teamColors").value.trim(),
    roster: window.ROSTER_LIST
  };

  if (!team.teamId) {
    alert("Team ID is required");
    return;
  }

  const existing = getTeamById(team.teamId);
  if (existing && existing !== getCurrentTeam()) {
    alert("Team ID must be unique");
    return;
  }

  addOrUpdateTeam(team);
  initTeamSelectorUI();
}

// ----------------------------------------
// IMPORT SHEET EVENT HOOKS
// ----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("openImportModalBtn")?.addEventListener("click", () => {
    document.getElementById("importModal").classList.remove("hidden");
    document.getElementById("tsvInput").value = "";
  });

  document.getElementById("closeImportModalBtn")?.addEventListener("click", () => {
    document.getElementById("importModal").classList.add("hidden");
  });

  document.getElementById("importTsvBtn")?.addEventListener("click", () => {
    const text = document.getElementById("tsvInput").value.trim();
    if (!text) {
      alert("Paste TSV to import");
      return;
    }
    const { team, roster } = parseTSV(text);
    if (!team.teamId) {
      alert("No valid team found in TSV");
      return;
    }
    document.getElementById("importModal").classList.add("hidden");

    window.ROSTER_LIST = roster;
    document.getElementById("teamId").value        = team.teamId || "";
    document.getElementById("teamNumber").value    = team.teamNumber || "";
    document.getElementById("teamName").value      = team.teamName || "";
    document.getElementById("teamCoach").value     = team.teamCoach || "";
    document.getElementById("teamRegion").value    = team.teamRegion || "";
    document.getElementById("teamAsstCoach").value = team.teamAsstCoach || "";
    document.getElementById("teamAgeDiv").value    = team.teamAgeDiv || "";
    document.getElementById("teamColors").value    = team.teamColors || "";

    renderRosterTable(roster);
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
