function initTeamSelectorUI() {
  const teamSelect = document.getElementById("teamSelect");
  const rosterTable = document.getElementById("rosterTableContainer");

  // if either element does not exist, do nothing
  if (!teamSelect) return;

  // fill dropdown
  function refreshTeamSelect() {
    const teams = window.TeamStore.getAllTeams();
    teamSelect.innerHTML = "";

    teams.forEach(team => {
      const opt = document.createElement("option");
      opt.value = team.teamId;
      opt.textContent = team.teamName || team.teamNumber || team.teamId;
      teamSelect.appendChild(opt);
    });

    // auto-load first team
    if (teamSelect.options.length > 0) {
      teamSelect.selectedIndex = 0;
      loadSelectedTeam();
    }
  }

  // load selected team into form
  function loadSelectedTeam() {
    const id = teamSelect.value;
    const team = window.TeamStore.getTeamById(id);
    if (!team) return;

    document.getElementById("teamId").value = team.teamId || "";
    document.getElementById("teamNumber").value = team.teamNumber || "";
    document.getElementById("teamName").value = team.teamName || "";
    document.getElementById("teamCoach").value = team.coachName || "";
    document.getElementById("teamRegion").value = team.region || "";
    document.getElementById("teamAsstCoach").value = team.asstCoach || "";
    document.getElementById("teamAgeDiv").value = team.ageDiv || "";
    document.getElementById("teamColors").value = team.colors || "";

    renderRosterTable(team.roster || []);
  }

  // show roster in table
  function renderRosterTable(roster) {
    if (!rosterTable) return;

    rosterTable.innerHTML = "";
    const table = document.createElement("table");
    table.className = "roster-table";

    roster.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${p.playerNumber}</td><td>${p.playerName}</td>`;
      table.appendChild(row);
    });

    rosterTable.appendChild(table);
  }

  // wire change listener
  teamSelect.addEventListener("change", loadSelectedTeam);

  // run it once
  refreshTeamSelect();
}

document.addEventListener("DOMContentLoaded", initTeamSelectorUI);
