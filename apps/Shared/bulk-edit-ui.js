
// ——————————————————————
// Bulk Game Settings UI Logic
// ——————————————————————

const bulkPanel = document.getElementById("bulkGameSettingsPanel");
const teamSizeSelect = document.getElementById("teamSizeSelect");
const halfLengthSelect = document.getElementById("halfLengthSelect");
const tieTypeSelect = document.getElementById("tieTypeSelect");
const etMinutesGroup = document.getElementById("etMinutesGroup");
const etMinutesInput = document.getElementById("etMinutesInput");
const applyBulkBtn = document.getElementById("applyBulkSettingsBtn");

// Show/hide ET minutes when tie type is ET+PK
tieTypeSelect.addEventListener("change", () => {
  if (tieTypeSelect.value === "ET+PK") {
    etMinutesGroup.classList.remove("hidden");
  } else {
    etMinutesGroup.classList.add("hidden");
    etMinutesInput.value = "";
  }
});

// Apply to all selected games
applyBulkBtn.addEventListener("click", () => {
  const selectedGames = window.GAME_LIST.filter(g => g.selected);

  if (!selectedGames.length) {
    alert("No games selected for bulk update.");
    return;
  }

  selectedGames.forEach(game => {
    // Team size
    if (teamSizeSelect.value) {
      game.team_size = teamSizeSelect.value;
    }

    // Half length
    if (halfLengthSelect.value) {
      game.half_length = Number(halfLengthSelect.value);
    }

    // Tie breaking
    if (tieTypeSelect.value) {
      game.tie_breaking = { type: tieTypeSelect.value };
      if (tieTypeSelect.value === "ET+PK" && etMinutesInput.value) {
        game.tie_breaking.et_minutes = Number(etMinutesInput.value);
      }
    }
  });

  // Refresh UI then save if applicable
	onSelectionChanged();


  alert("Bulk settings applied.");
});
function updateBulkPanelVisibility() {
  const anySelected = window.GAME_LIST.some(g => g.selected);
  if (anySelected) bulkPanel.classList.remove("hidden");
  else bulkPanel.classList.add("hidden");
}

// Call after selection changes
function onSelectionChanged() {
  	updateSelectedCountUI();
  	renderGameCards();
    renderLineupCards();
	updateBulkPanelVisibility();
}

// Make sure your selection logic calls onSelectionChanged()
