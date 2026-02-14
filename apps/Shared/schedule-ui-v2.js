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

  console.log("📦 Loading schedule:", sched);

  // Persist active schedule
  if (sched.id) {
    localStorage.setItem("currentScheduleIdV2", sched.id);
  }

  // Clone parsed games
  const cloned = Array.isArray(sched.parsedGames)
    ? JSON.parse(JSON.stringify(sched.parsedGames))
    : [];

  window.GAME_LIST = cloned;

  console.log("🎮 GAME_LIST length:", window.GAME_LIST.length);

  // 🔥 IMPORTANT: Initialize selection explicitly
  window.GAME_LIST.forEach(g => {
    g.selected = true;
  });

  // Sync raw input
  const rawInput = document.getElementById("rawInput");
  if (rawInput) {
    rawInput.value = sched.rawText || "";
  }

  // Update JSON display
  const display = document.getElementById("currentScheduleDisplay");
  if (display) {
    display.value = JSON.stringify(window.GAME_LIST, null, 2);
  }

  localStorage.setItem("lastSelectedSchedule", name);

  // Render
  if (typeof window.onSelectionChanged === "function") {
    window.onSelectionChanged();
  }
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
      const loadStatus = document.getElementById("scheduleLoadStatus");
		if (loadStatus) {
		  loadStatus.textContent =
			`${window.GAME_LIST.length} games loaded from schedule.`;
		}
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
		if (sched?.id) {
  			localStorage.setItem("currentScheduleIdV2", sched.id);
		}
      ScheduleStoreV2.deleteScheduleByName(oldName);
      schedule.name = newName.trim();
      ScheduleStoreV2.saveSchedule(schedule);

      refreshScheduleDropdown();
		window.GAME_LIST = loadedGames;
		const loadStatus = document.getElementById("scheduleLoadStatus");
		if (loadStatus) {
		  loadStatus.textContent =
			`${window.GAME_LIST.length} games loaded from schedule.`;
		}
		initializeGameSelection(window.GAME_LIST);
		onSelectionChanged();

      sel.value = newName.trim();
    });
  }

 function attachSaveModalLogic() {
  const confirmBtn = document.getElementById(saveConfirmBtnId);
  const cancelBtn  = document.getElementById(saveCancelBtnId);
  const input      = document.getElementById(scheduleNameInputId);
  const modal      = document.getElementById(saveModalId);

  if (!modal || !input || !confirmBtn || !cancelBtn) {
    console.warn("⚠️ Save schedule modal elements missing.");
    return;
  }

  // Prevent duplicate bindings if init runs twice
  if (confirmBtn.dataset.bound === "1") return;
  confirmBtn.dataset.bound = "1";
  cancelBtn.dataset.bound = "1";

  const hideModal = () => {
    modal.classList.add("hidden");
    input.value = "";
  };

  cancelBtn.addEventListener("click", () => {
    hideModal();
  });

  confirmBtn.addEventListener("click", () => {
    const name = (input.value || "").trim();
    if (!name) {
      alert("Schedule name required.");
      input.focus();
      return;
    }

    const rawText = document.getElementById("rawInput")?.value || "";
    const parserKey = window.selectedParserKey || "";

    // Defensive clone so later UI edits don't mutate the stored schedule
    const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
    const parsedGames = JSON.parse(JSON.stringify(games));

    const saved = ScheduleStoreV2.saveSchedule({
      name,
      rawText,
      parserKey,
      parsedGames
    });

    if (!saved || !saved.id) {
      alert("⚠️ Could not save schedule.");
      return;
    }

    // ✅ Persist the active schedule so navigation between factories stays in sync
    try {
      localStorage.setItem("currentScheduleIdV2", saved.id);
    } catch (err) {
      console.warn("⚠️ Could not persist currentScheduleIdV2:", err);
    }

    hideModal();
    refreshScheduleDropdown();

    // If you have a central "set current schedule display" helper, call it here.
    // Otherwise, the dropdown refresh + existing display logic will update on next load.
    alert(`✅ Schedule "${saved.name}" saved.`);
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

    // 🔄 Auto-load active schedule across factories
    const activeId = localStorage.getItem("currentScheduleIdV2");
    if (activeId) {
      const active = ScheduleStoreV2.getScheduleById(activeId);
      if (active) {
        loadScheduleByName(active.name);
      }
    }
  };

})();
