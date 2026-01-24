// team-store.js
// ----------------------------------------
// TEAM STORE (persistent via localStorage)
// ----------------------------------------

const TEAM_STORAGE_KEY = "savedTeams";

/**
 * Load all teams from localStorage
 */
function loadAllTeams() {
  try {
    const json = localStorage.getItem(TEAM_STORAGE_KEY) || "[]";
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("❌ team-store loadAllTeams() failed:", err);
    return [];
  }
}

/**
 * Save all teams to localStorage
 */
function saveAllTeams(teams) {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams));
  } catch (err) {
    console.error("❌ team-store saveAllTeams() failed:", err);
  }
}

/**
 * Get all teams
 */
function getAllTeams() {
  return loadAllTeams();
}

/**
 * Find a team by teamId
 */
function getTeamById(id) {
  if (!id) return null;
  return loadAllTeams().find(t => t.teamId === id) || null;
}

/**
 * Add or update a team
 */
function addOrUpdateTeam(team) {
  if (!team || !team.teamId) {
    console.warn("⚠️ addOrUpdateTeam called without valid teamId");
    return;
  }

  const teams = loadAllTeams();
  const idx = teams.findIndex(t => t.teamId === team.teamId);

  if (idx >= 0) {
    teams[idx] = team;
  } else {
    teams.push(team);
  }

  saveAllTeams(teams);
  console.log("💾 Team saved:", team.teamId);
}

/**
 * Remove a team
 */
function deleteTeamById(teamId) {
  if (!teamId) return;
  const teams = loadAllTeams().filter(t => t.teamId !== teamId);
  saveAllTeams(teams);
  console.log("🗑 Team deleted:", teamId);
}

// Expose globally
window.TeamStore = {
  getAllTeams,
  getTeamById,
  addOrUpdateTeam,
  deleteTeamById
};

console.log("✅ TeamStore initialized");

function loadTeamsFromStorage() {
  const raw = localStorage.getItem("lineupCardFactoryTeams");
  try {
    window.TEAM_LIST = JSON.parse(raw) || [];
  } catch {
    window.TEAM_LIST = [];
  }
}

function saveTeamsToStorage() {
  localStorage.setItem("lineupCardFactoryTeams", JSON.stringify(window.TEAM_LIST));
}

// 🔻 Add this at the very end of team-store.js:
document.addEventListener("DOMContentLoaded", () => {
  loadTeamsFromStorage();
  initTeamSelectorUI();

  const teamSelect = document.getElementById("teamSelect");
  if (teamSelect) {
    teamSelect.addEventListener("change", (e) => {
      selectTeam(e.target.value);
    });
  }

  document.getElementById("saveTeamBtn")?.addEventListener("click", saveCurrentTeam);
  document.getElementById("deleteTeamBtn")?.addEventListener("click", deleteCurrentTeam);
  document.getElementById("cloneTeamBtn")?.addEventListener("click", cloneCurrentTeam);

  document.getElementById("newTeamBtn")?.addEventListener("click", () => {
    window.CURRENT_TEAM = null;
    clearTeamFields();
    renderRosterTable([], document.getElementById("rosterTableContainer"));

    const teamSelect = document.getElementById("teamSelect");
    if (teamSelect) {
      // Insert 'New Team' option at the top if not present
      let newOpt = teamSelect.querySelector('option[value="new"]');
      if (!newOpt) {
        newOpt = document.createElement("option");
        newOpt.value = "new";
        newOpt.textContent = "New Team";
        teamSelect.insertBefore(newOpt, teamSelect.firstChild);
      }
      teamSelect.value = "new";
    }

    renderCurrentTeamUI();
    document.getElementById("status-section-1-team").textContent = "New team in progress...";
  });
});
function loadTeamsFromStorage() {
  const raw = localStorage.getItem("lineupCardFactoryTeams");
  try {
    window.TEAM_LIST = JSON.parse(raw) || [];
  } catch (err) {
    console.error("❌ Failed to parse saved teams:", err);
    window.TEAM_LIST = [];
  }
}

window.loadTeamsFromStorage = loadTeamsFromStorage;
