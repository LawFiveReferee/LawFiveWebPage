// ==============================
// Shared Schedule UI (Option A)
// ==============================

(function () {
  const dropdownId = "scheduleSelect";
  const loadBtnId = "loadScheduleBtn";
  const deleteBtnId = "deleteScheduleBtn";
  const renameBtnId = "renameScheduleBtn";
  const saveModalId = "scheduleSaveModal";
  const saveConfirmBtnId = "saveScheduleConfirmBtn";
  const saveCancelBtnId = "saveScheduleCancelBtn";
  const scheduleNameInputId = "scheduleNameInput";

  function refreshScheduleDropdown() {
    const sel = document.getElementById(dropdownId);
    if (!sel || !window.ScheduleStoreV2) return;

    sel.innerHTML = `<option value="">— Select Schedule —</option>`;
    const schedules = ScheduleStoreV2.getAllSchedules();

    schedules.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });

    // Try to restore last selected
    const lastSelected = localStorage.getItem("lastSelectedSchedule");
    if (lastSelected) {
      sel.value = lastSelected;
    }
  }
function loadScheduleByName(name) {
  if (!name) {
    alert("Select a schedule first.");
    return;
  }

  const sched = ScheduleStoreV2.getScheduleByName(name);
  if (!sched) {
    alert("Schedule not found.");
    return;
  }

  // 1. Load games (single source of truth)
  window.GAME_LIST = Array.isArray(sched.parsedGames)
    ? sched.parsedGames
    : [];

  // 2. Initialize selection (sets g.selected = true)
  initializeGameSelection(window.GAME_LIST);

  // 3. Optional UI sync
  const rawInput = document.getElementById("rawInput");
  if (rawInput) {
    rawInput.value = sched.rawText || "";
  }

  const display = document.getElementById("currentScheduleDisplay");
  if (display) {
    display.value = JSON.stringify(window.GAME_LIST, null, 2);
  }

  // 4. Persist last selection
  localStorage.setItem("lastSelectedSchedule", name);

  // 5. Render + status (single unified hook)
  onSelectionChanged();
}
  function attachLoadListener() {
    const btn = document.getElementById(loadBtnId);
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", () => {
      const sel = document.getElementById(dropdownId);
      const name = sel?.value;
      loadScheduleByName(name);
    });
  }

  function attachDeleteListener() {
    const btn = document.getElementById(deleteBtnId);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const sel = document.getElementById(dropdownId);
      const name = sel?.value;
      if (!name) return alert("Select a schedule to delete.");
      if (!confirm(`Delete schedule "${name}"?`)) return;

      ScheduleStoreV2.deleteScheduleByName(name);
      refreshScheduleDropdown();

      window.GAME_LIST = loadedGames;
		initializeGameSelection(window.GAME_LIST);
		onSelectionChanged();

    });
  }

  function attachRenameListener() {
    const btn = document.getElementById(renameBtnId);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const sel = document.getElementById(dropdownId);
      const oldName = sel?.value;
      if (!oldName) return alert("Select a schedule first.");

      const newName = prompt("Enter a new name:", oldName);
      if (!newName || newName.trim() === "" || newName === oldName) return;

      const schedule = ScheduleStoreV2.getScheduleByName(oldName);
      if (!schedule) return alert("Schedule not found.");

      ScheduleStoreV2.deleteScheduleByName(oldName);
      schedule.name = newName.trim();
      ScheduleStoreV2.saveSchedule(schedule);

      refreshScheduleDropdown();
		window.GAME_LIST = loadedGames;
		initializeGameSelection(window.GAME_LIST);
		onSelectionChanged();

      sel.value = newName.trim();
    });
  }

  function attachSaveModalLogic() {
    const confirmBtn = document.getElementById(saveConfirmBtnId);
    const cancelBtn = document.getElementById(saveCancelBtnId);
    const input = document.getElementById(scheduleNameInputId);
    const modal = document.getElementById(saveModalId);

    if (!modal || !input || !confirmBtn || !cancelBtn) {
      console.warn("⚠️ Save schedule modal elements missing.");
      return;
    }

    confirmBtn.addEventListener("click", () => {
      const name = input.value.trim();
      if (!name) {
        alert("Schedule name required.");
        return;
      }

      const rawText = document.getElementById("rawInput")?.value || "";

      ScheduleStoreV2.saveSchedule({
        name,
        rawText,
        parserKey: window.selectedParserKey || "",
        parsedGames: window.GAME_LIST || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      modal.classList.add("hidden");
      refreshScheduleDropdown();
      alert(`✅ Schedule "${name}" saved.`);
    });

    cancelBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // 🟢 Public API
  window.refreshScheduleDropdown = refreshScheduleDropdown;

  window.initSharedScheduleUIv2 = function () {
    refreshScheduleDropdown();
    attachLoadListener();
    attachDeleteListener();
    attachRenameListener();
    attachSaveModalLogic();

  };
})();

window.initializeGameSelection = function (games) {
  if (!Array.isArray(games)) {
    console.warn("⚠️ initializeGameSelection called with no games");
    return;
  }

  let selectedCount = 0;

  games.forEach(g => {
    g.selected = true;   // ✅ THIS IS THE KEY
    selectedCount++;
  });

  console.log(
    "✅ Selection initialized:",
    selectedCount,
    "of",
    games.length
  );
};
