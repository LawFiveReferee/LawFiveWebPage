/**
 * Shared Schedule UI logic for both factories.
 * Exposes one entrypoint: initSharedScheduleUI()
 */

function initSharedScheduleUI() {
  // Populate saved schedule dropdown
  window.refreshScheduleDropdown?.();

  // Load schedule
  document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
    const sel = document.getElementById("scheduleSelect");
    const name = sel?.value;
    if (!name) return alert("Select a schedule first.");

    const schedule = ScheduleStoreV2.getScheduleByName(name);
    if (!schedule) return alert("Schedule not found.");

    document.getElementById("rawInput").value = schedule.rawText;

	if (schedule.parserKey && typeof selectParserByKey === "function") {
	  const ok = selectParserByKey(schedule.parserKey);
	  if (!ok) {
		console.warn(`Parser "${schedule.parserKey}" not found — keeping current.`);
	  }
	}

    window.GAME_LIST = schedule.parsedGames || [];

    renderPreviewCards?.();
    updateStatusLines?.();
    updateSelectedCountUI?.();

    document.getElementById("status-section-1") &&
      (document.getElementById("status-section-1").textContent =
        `Loaded schedule: ${name}`);
  });

  // Delete schedule
  document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
    const sel = document.getElementById("scheduleSelect");
    const name = sel?.value;
    if (!name) return alert("Select a schedule first.");
    if (!confirm(`Delete schedule "${name}"?`)) return;

    ScheduleStoreV2.deleteScheduleByName(name);
    window.refreshScheduleDropdown?.();
  });

  // Rename schedule
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
    sel.value = newName.trim();
  });
}

// Expose for factories
window.initSharedScheduleUI = initSharedScheduleUI;

function showSaveScheduleModal(defaultName = "") {
  const modal = document.getElementById("scheduleSaveModal");
  const nameInput = document.getElementById("scheduleNameInput");
  const errorEl = document.getElementById("scheduleSaveError");

  if (!modal || !nameInput) return;

  nameInput.value = defaultName;
  errorEl.classList.add("hidden");
  modal.classList.remove("hidden");
  nameInput.focus();

  document.getElementById("confirmSaveScheduleBtn")?.onclick = () => {
    const name = nameInput.value.trim();
    if (!name) {
      errorEl.textContent = "Name is required.";
      errorEl.classList.remove("hidden");
      return;
    }
    const raw = document.getElementById("rawInput")?.value.trim();
    if (!raw) {
      alert("Nothing to save.");
      modal.classList.add("hidden");
      return;
    }
    ScheduleStoreV2.addOrUpdateSchedule({
      name,
      rawText: raw,
      parserKey: window.selectedParserKey || ""
    });
    window.refreshScheduleDropdown?.();
    modal.classList.add("hidden");
  };

  document.getElementById("cancelSaveScheduleBtn")?.onclick = () => {
    modal.classList.add("hidden");
  };
}

/**
 * Show the Save Schedule modal.
 * @param {string} defaultName — Suggested name to prefill.
 */
function showSaveScheduleModal(defaultName = "") {
  const modal = document.getElementById("scheduleSaveModal");
  const nameInput = document.getElementById("scheduleNameInput");
  const errorEl = document.getElementById("scheduleSaveError");

  if (!modal || !nameInput || !errorEl) return;

  nameInput.value = defaultName;
  errorEl.classList.add("hidden");
  modal.classList.remove("hidden");
  nameInput.focus();

  // Confirm button click
  document.getElementById("confirmSaveScheduleBtn").onclick = () => {
    const name = nameInput.value.trim();
    if (!name) {
      errorEl.textContent = "Schedule name is required.";
      errorEl.classList.remove("hidden");
      return;
    }

    const raw = document.getElementById("rawInput")?.value.trim();
    if (!raw) {
      alert("Nothing to save — paste or select a schedule first.");
      modal.classList.add("hidden");
      return;
    }

    // Save the schedule
    ScheduleStoreV2.addOrUpdateSchedule({
      name,
      rawText: raw,
      parserKey: window.selectedParserKey || "",
      parsedGames: window.GAME_LIST || []
    });

    window.refreshScheduleDropdown?.();
    modal.classList.add("hidden");
  };

  // Cancel button
  document.getElementById("cancelSaveScheduleBtn").onclick = () => {
    modal.classList.add("hidden");
  };
}

window.showSaveScheduleModal = showSaveScheduleModal;

/**
 * Shows the Save Schedule modal and handles save logic.
 * @param {string} defaultName — Prefilled suggested name.
 */
function showSaveScheduleModal(defaultName = "") {
  const modal = document.getElementById("scheduleSaveModal");
  const nameInput = document.getElementById("scheduleNameInput");
  const errorEl = document.getElementById("scheduleSaveError");

  if (!modal || !nameInput || !errorEl) return;

  // Prefill and reset UI
  nameInput.value = defaultName;
  errorEl.classList.add("hidden");
  modal.classList.remove("hidden");
  nameInput.focus();

  // Confirm save handler
  document.getElementById("confirmSaveScheduleBtn").onclick = () => {
    const name = nameInput.value.trim();

    // Validation
    if (!name) {
      errorEl.textContent = "Schedule name is required.";
      errorEl.classList.remove("hidden");
      return;
    }

    const raw = document.getElementById("rawInput")?.value.trim();
    if (!raw) {
      alert("Nothing to save — paste or select a schedule first.");
      modal.classList.add("hidden");
      return;
    }

    // Check for duplicate names
    const existing = ScheduleStoreV2.getScheduleByName(name);
    if (existing) {
      if (!confirm(`A schedule named "${name}" already exists. Overwrite?`)) {
        return;
      }
    }

    // Save to ScheduleStore
    ScheduleStoreV2.addOrUpdateSchedule({
      name,
      rawText: raw,
      parserKey: window.selectedParserKey || "",
      parsedGames: window.GAME_LIST || []
    });

    // Update dropdown
    window.refreshScheduleDropdown?.();

    // Close modal
    modal.classList.add("hidden");
  };

  // Cancel button handler
  document.getElementById("cancelSaveScheduleBtn").onclick = () => {
    modal.classList.add("hidden");
  };
}

window.showSaveScheduleModal = showSaveScheduleModal;

// Save schedule button logic
document.getElementById("saveScheduleBtn")?.addEventListener("click", () => {
  // 1) Get schedule name from an input field or prompt
  const nameInput = document.getElementById("scheduleSaveName");
  let scheduleName = nameInput?.value?.trim();

  // If no name yet, prompt the user
  if (!scheduleName) {
    scheduleName = prompt("Enter a name for this schedule:");
    if (!scheduleName) {
      alert("Save canceled — name required.");
      return;
    }
  }

  // 2) Gather data to save
  const rawText = document.getElementById("rawInput")?.value || "";
  const parserKey = localStorage.getItem("selectedScheduleParserKey") || "";

  // If schedule has been saved before, include its id
  const existing = ScheduleStoreV2.getScheduleByName(scheduleName);
  const scheduleToSave = {
    id: existing?.id,               // preserve id if updating
    name: scheduleName,
    rawText,
    parserKey,
    parsedGames: Array.isArray(window.GAME_LIST)
      ? window.GAME_LIST
      : []
  };

  // 3) Save
  const saved = ScheduleStoreV2.saveSchedule(scheduleToSave);
  if (!saved) {
    alert("Error saving schedule.");
    return;
  }

  // 4) Refresh schedule list and show success
  refreshScheduleDropdown();

  // Put the name back into the input if present
  if (nameInput) nameInput.value = scheduleName;

  alert(`Schedule "${scheduleName}" saved successfully.`);
});
