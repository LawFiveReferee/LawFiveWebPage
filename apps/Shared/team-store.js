// team-store.js
// ----------------------------------------
// TEAM STORE (persistent via localStorage)
// ----------------------------------------

const TEAM_STORAGE_KEY = "lineupCardFactoryTeams";
const LAST_TEAM_KEY = "lastSelectedTeamId";

let _teams = [];
let _currentTeamId = null;

// ----------------------------------------
// ROSTER RENDERING
// ----------------------------------------

window.renderRosterTable = function (roster = [], container) {
  container = container || document.getElementById("rosterTableContainer");
  if (!container) return;

  container.innerHTML = "";

  roster.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "roster-row";

    row.innerHTML = `
      <input class="roster-number-input"
             data-index="${index}"
             placeholder="#"
             value="${p.number || ""}">
      <input class="roster-name-input"
             data-index="${index}"
             placeholder="Player name"
             value="${p.name || ""}">
    `;

    container.appendChild(row);
  });
};

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

function deleteTeamById(id) {
  _teams = _teams.filter(t => t.teamId !== id);
  if (_currentTeamId === id) _currentTeamId = null;
  saveTeamsToStorage();
}

function generateCloneId(baseId) {
  let i = 1;
  let candidate = `${baseId}-clone`;
  while (getTeamById(candidate)) {
    candidate = `${baseId}-clone-${i++}`;
  }
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
// UI
// ----------------------------------------

function clearTeamFields() {
  [
    "teamId","teamNumber","teamName","teamCoach",
    "teamRegion","teamAsstCoach","teamAgeDiv","teamColors"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  renderRosterTable([]);
}

function renderCurrentTeamUI() {
  const team = getCurrentTeam();
  const status = document.getElementById("status-section-1-team");

  if (!team) {
    clearTeamFields();
    if (status) status.textContent = "No team selected.";
    return;
  }

  document.getElementById("teamId").value = team.teamId || "";
  document.getElementById("teamNumber").value = team.teamNumber || "";
  document.getElementById("teamName").value = team.teamName || "";
  document.getElementById("teamCoach").value = team.teamCoach || "";
  document.getElementById("teamRegion").value = team.teamRegion || "";
  document.getElementById("teamAsstCoach").value = team.teamAsstCoach || "";
  document.getElementById("teamAgeDiv").value = team.teamAgeDiv || "";
  document.getElementById("teamColors").value = team.teamColors || "";

  renderRosterTable(team.roster || []);
  if (status) status.textContent = `Editing team: ${team.teamId}`;
}

function initTeamSelectorUI() {
  const sel = document.getElementById("teamSelect");
  if (!sel) return;

  sel.innerHTML = "";
  _teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.teamId;
    opt.textContent = t.teamId;
    sel.appendChild(opt);
  });

  if (_currentTeamId) sel.value = _currentTeamId;
  renderCurrentTeamUI();

  sel.onchange = () => {
    selectTeamById(sel.value);
    renderCurrentTeamUI();
  };
}

// ----------------------------------------
// ROSTER PARSING
// ----------------------------------------

function parseRosterInput() {
  const textarea = document.getElementById("rosterInput");
  if (!textarea) return;

  const roster = textarea.value
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/\t| {2,}/);
      return {
        number: parts[0] || "",
        name: parts.slice(1).join(" ")
      };
    });

  renderRosterTable(roster);
}

// ----------------------------------------
// SAVE
// ----------------------------------------

function saveCurrentTeam() {
  const roster = Array.from(document.querySelectorAll(".roster-row")).map(r => ({
    number: r.querySelector(".roster-number-input")?.value || "",
    name: r.querySelector(".roster-name-input")?.value || ""
  }));

  const team = {
    teamId: document.getElementById("teamId").value.trim(),
    teamNumber: document.getElementById("teamNumber").value.trim(),
    teamName: document.getElementById("teamName").value.trim(),
    teamCoach: document.getElementById("teamCoach").value.trim(),
    teamRegion: document.getElementById("teamRegion").value.trim(),
    teamAsstCoach: document.getElementById("teamAsstCoach").value.trim(),
    teamAgeDiv: document.getElementById("teamAgeDiv").value.trim(),
    teamColors: document.getElementById("teamColors").value.trim(),
    roster
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
// EXPORT + INIT
// ----------------------------------------

window.TeamStore = {
  getAllTeams,
  getTeamById,
  getCurrentTeam,
  selectTeamById,
  addOrUpdateTeam,
  deleteTeamById,
  cloneCurrentTeam
};

document.addEventListener("DOMContentLoaded", () => {
  loadTeamsFromStorage();
  initTeamSelectorUI();

  document.getElementById("parseRosterBtn")?.addEventListener("click", parseRosterInput);
  document.getElementById("saveTeamBtn")?.addEventListener("click", saveCurrentTeam);
  document.getElementById("deleteTeamBtn")?.addEventListener("click", () => {
    deleteTeamById(getCurrentTeam()?.teamId);
    initTeamSelectorUI();
  });
  document.getElementById("cloneTeamBtn")?.addEventListener("click", () => {
    cloneCurrentTeam();
    initTeamSelectorUI();
  });
  document.getElementById("newTeamBtn")?.addEventListener("click", () => {
    _currentTeamId = null;
    clearTeamFields();
    document.getElementById("status-section-1-team").textContent = "New team in progress…";
  });
});

console.log("✅ TeamStore initialized");
