/**
 * Shared UI for schedule management
 * Requires:
 *   window.ScheduleParser
 *   window.ScheduleStoreV2
 *   DOM elements:
 *     #scheduleSelect, #loadScheduleBtn, #deleteScheduleBtn, #renameScheduleBtn
 *     #rawInput, #parseBtn
 *     schedule save modal with #scheduleSaveModal, #scheduleNameInput, #confirmSaveScheduleBtn, #cancelSaveScheduleBtn
 */

(function () {
  function refreshDropdown() {
    const sel = document.getElementById("scheduleSelect");
    if (!sel) return;
    sel.innerHTML = "";
    const list = ScheduleStoreV2.getAllSchedules();
    if (!list.length) {
      sel.innerHTML = "<option disabled>No saved schedules</option>";
      return;
    }
    list.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  }

  function getDefaultScheduleName() {
  const parserName = (window.selectedParserKey || "")
    .split("-")[0]
    .trim()
    .replace(/\s+/g, "");

  const games = window.GAME_LIST || [];
  const numGames = games.length;

  if (numGames === 0) return `${parserName}-0 games`;

  const dates = games
    .map(g => new Date(g.date))
    .filter(d => !isNaN(d));

  if (!dates.length) return `${parserName}-${numGames} games`;

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const format = d => `${d.getMonth() + 1}-${d.getDate()}-${String(d.getFullYear()).slice(-2)}`;

  if (format(minDate) === format(maxDate)) {
    return `${parserName}-${numGames} games - ${format(minDate)}`;
  } else {
    return `${parserName}-${numGames} games - ${format(minDate)} - ${format(maxDate)}`;
  }
}
window.getDefaultScheduleName = getDefaultScheduleName;
  function attachLoad() {
    document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
      const sel = document.getElementById("scheduleSelect");
      const name = sel?.value;
      if (!name) return alert("Select a saved schedule first.");

      const schedule = ScheduleStoreV2.getScheduleByName(name);
      if (!schedule) return alert("Schedule not found.");

      document.getElementById("rawInput").value = schedule.rawText;

      const { games, errors } = ScheduleParser.parse(schedule.rawText, schedule.parserKey);
      if (errors.length) console.warn(errors);

      window.GAME_LIST = games;
      // ✅ Select all by default
	window.GAME_LIST.forEach(game => game.selected = true);

	renderCards?.();
      updateStatusLines?.();
      updateSelectedCountUI?.();
    });
  }

  function attachDelete() {
    document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
      const sel = document.getElementById("scheduleSelect");
      const name = sel?.value;
      if (!name) return alert("Select a saved schedule first.");
      if (!confirm(`Delete schedule "${name}"?`)) return;

      ScheduleStoreV2.deleteSchedule(name);
      refreshDropdown();
    });
  }

  function attachRename() {
    document.getElementById("renameScheduleBtn")?.addEventListener("click", () => {
      const sel = document.getElementById("scheduleSelect");
      const oldName = sel?.value;
      if (!oldName) return alert("Select a schedule first.");
      const newName = prompt("Enter a new name:", oldName);
      if (!newName || newName.trim() === "" || newName === oldName) return;

      const schedule = ScheduleStoreV2.getScheduleByName(oldName);
      if (!schedule) return;

      ScheduleStoreV2.deleteSchedule(oldName);
      schedule.name = newName.trim();
      ScheduleStoreV2.saveSchedule(schedule);

      refreshDropdown();
      sel.value = newName.trim();
    });
  }
function getDefaultScheduleName() {
  const games = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
  const count = games.length;

  // Parser name → short prefix (before dash)
  let parserLabel = "Schedule";
  const parserKey = window.selectedParserKey || "";
  if (parserKey.includes("arbiter")) parserLabel = "Arbiter";
  else if (parserKey) parserLabel = parserKey.split("-")[0];

  if (!count) {
    return `${parserLabel}-0 games`;
  }

  // Collect valid dates
  const dates = games
    .map(g => g.match_date)
    .map(d => new Date(d))
    .filter(d => !isNaN(d));

  if (!dates.length) {
    return `${parserLabel}-${count} games`;
  }

  dates.sort((a, b) => a - b);

  const formatDate = d =>
    `${d.getMonth() + 1}-${d.getDate()}-${String(d.getFullYear()).slice(-2)}`;

  const first = formatDate(dates[0]);
  const last = formatDate(dates[dates.length - 1]);

  return first === last
    ? `${parserLabel}-${count} games - ${first}`
    : `${parserLabel}-${count} games - ${first} - ${last}`;
}

  function attachParse() {
    document.getElementById("parseBtn")?.addEventListener("click", () => {
      const raw = document.getElementById("rawInput")?.value.trim() || "";
      if (!raw) {
        alert("Paste schedule text first.");
        return;
      }

	const parserKey = document.getElementById("parserSelect")?.value;

      const { games, errors } = ScheduleParser.parse(raw, currentParser);
      if (errors.length) console.warn(errors);

      window.GAME_LIST = games;
      // ✅ Select all by default
	window.GAME_LIST.forEach(game => game.selected = true);
	renderCards?.();
      updateStatusLines?.();
      updateSelectedCountUI?.();

      const defaultName = raw.split(/\r?\n/)[0]?.trim() || "";
      console.log("[Caller] showSaveScheduleModal about to be called");
	document.addEventListener("DOMContentLoaded", () => {
		showSaveScheduleModal(defaultName);
	});
    });
  }

  function init() {
    refreshDropdown();
    attachLoad();
    attachDelete();
    attachRename();
    attachParse();
  }

  window.initSharedScheduleUIv2 = init;
})();
function populateParserSelect() {
  const sel = document.getElementById("parserSelect");
  if (!sel || typeof ScheduleParser?.getParserList !== "function") return;

  const parserList = ScheduleParser.getParserList();
  sel.innerHTML = ""; // Clear existing options

  if (!parserList.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(No parsers available)";
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }

  // Add each available parser as an option
  parserList.forEach(parser => {
    const opt = document.createElement("option");
    opt.value = parser.key;
    opt.textContent = parser.name || parser.key;
    sel.appendChild(opt);
  });

  sel.disabled = false;

  // Restore saved selection from localStorage, or default to the first parser
  const storedKey = localStorage.getItem("selectedScheduleParserKey");
  const defaultKey = parserList[0].key;
  const selectedKey = parserList.some(p => p.key === storedKey) ? storedKey : defaultKey;

  sel.value = selectedKey;
  window.selectedParserKey = selectedKey;

  // Keep localStorage and global in sync on change
  sel.addEventListener("change", () => {
    const current = sel.value;
    localStorage.setItem("selectedScheduleParserKey", current);
    window.selectedParserKey = current;
  });
}

// Expose for external usage
window.populateParserSelect = populateParserSelect;
function initSharedScheduleUIv2() {
  // —————————————
  // ELEMENT REFERENCES
  // —————————————

  const parserSelect = document.getElementById("parserSelect");
  const rawInput = document.getElementById("rawInput");
  const parseBtn = document.getElementById("parseScheduleBtn");
  const saveBtn = document.getElementById("saveScheduleBtnLibrary");
  const statusEl = document.getElementById("scheduleParseStatus");

  const scheduleSelect = document.getElementById("scheduleSelect");
  const loadBtn = document.getElementById("loadScheduleBtn");
  const deleteBtn = document.getElementById("deleteScheduleBtn");
  const renameBtn = document.getElementById("renameScheduleBtn");

	if (!rawInput || !parserSelect || !parseBtn || !saveBtn) {
	  console.warn("⚠️ Shared Schedule UI elements missing", {
		rawInput,
		parserSelect,
		parseBtn,
		saveBtn,
	  });
	  return;
	}

  // —————————————
  // HELPER: REFRESH SAVED SCHEDULE DROPDOWN
  // —————————————

  function refreshSavedScheduleDropdown() {
    if (!scheduleSelect) return;

    scheduleSelect.innerHTML = "";
    const schedules = ScheduleStoreV2.getAllSchedules();

    if (!schedules.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(No saved schedules)";
      scheduleSelect.appendChild(opt);
      scheduleSelect.disabled = true;
      return;
    }

    schedules.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      scheduleSelect.appendChild(opt);
    });

    scheduleSelect.disabled = false;
  }

  refreshSavedScheduleDropdown();

  // —————————————
  // PARSE BUTTON
  // —————————————

  parseBtn.addEventListener("click", () => {
    const raw = rawInput.value.trim();
    if (!raw) {
      statusEl && (statusEl.textContent = "⚠️ Paste schedule text first.");
      return;
    }

    const parserKey = parserSelect.value;
    const { games, errors } = ScheduleParser.parse(raw, parserKey);

    // store games globally for preview/use
    window.GAME_LIST = games;

    statusEl && (statusEl.textContent =
      errors.length
        ? `⚠️ Errors parsing: ${errors.join("; ")}`
        : `✅ Parsed ${games.length} game${games.length !== 1 ? "s" : ""}.`);

    // Optionally render preview here if you have preview logic
    if (typeof renderCards === "function") renderCards();
  });

  // —————————————
  // SAVE BUTTON
  // —————————————

  saveBtn.addEventListener("click", () => {
    const raw = rawInput.value.trim();
    if (!raw) {
      alert("⚠️ Nothing to save — paste or load first.");
      return;
    }

    // Extract games before saving
    const parserKey = parserSelect.value;
    const { games } = ScheduleParser.parse(raw, parserKey);

    // Open the modal to ask for a name
    console.log("[Caller] showSaveScheduleModal about to be called");
	document.addEventListener("DOMContentLoaded", () => {
		showSaveScheduleModal(raw.split(/\r?\n/)[0]?.trim() || "");
	});
  });

  // —————————————
  // LOAD BUTTON
  // —————————————

  loadBtn?.addEventListener("click", () => {
    const name = scheduleSelect?.value;
    if (!name) return alert("Select a saved schedule first.");

    const sched = ScheduleStoreV2.getScheduleByName(name);
    if (!sched) return alert("Schedule not found.");

    // Fill raw text and select parser
    rawInput.value = sched.rawText;
    if (sched.parserKey && parserSelect.querySelector(`option[value="${sched.parserKey}"]`)) {
      parserSelect.value = sched.parserKey;
      localStorage.setItem("selectedScheduleParserKey", sched.parserKey);
    }

    // Use saved parsed games
    window.GAME_LIST = Array.isArray(sched.parsedGames) ? sched.parsedGames : [];

    statusEl && (statusEl.textContent = `Loaded schedule: "${name}".`);
    if (typeof renderCards === "function") renderCards();
  });

  // —————————————
  // DELETE BUTTON
  // —————————————

  deleteBtn?.addEventListener("click", () => {
    const name = scheduleSelect?.value;
    if (!name) return alert("Select a schedule to delete.");
    if (!confirm(`Delete schedule "${name}"?`)) return;

    ScheduleStoreV2.deleteSchedule(name);
    refreshSavedScheduleDropdown();
  });

  // —————————————
  // RENAME BUTTON
  // —————————————

  renameBtn?.addEventListener("click", () => {
    const name = scheduleSelect?.value;
    if (!name) return alert("Select a schedule to rename.");

    const newName = prompt("Enter a new name:", name);
    if (!newName || !newName.trim() || newName === name) return;

    const schedule = ScheduleStoreV2.getScheduleByName(name);
    if (!schedule) return alert("Schedule not found.");

    // Remove old, save new
    ScheduleStoreV2.deleteSchedule(name);
    schedule.name = newName.trim();
    ScheduleStoreV2.saveSchedule(schedule);

    refreshSavedScheduleDropdown();
    scheduleSelect.value = newName.trim();
  });
}

/* ============================================================
   Shared Schedule UI v2 — Save / Load Logic
============================================================ */

function refreshScheduleDropdown() {
  const sel = document.getElementById("scheduleSelect");
  if (!sel || !window.ScheduleStoreV2) return;

  sel.innerHTML = `<option value="">— Select Schedule —</option>`;

  const all = ScheduleStoreV2.getAllSchedules();
  all.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
}

// expose globally
window.refreshScheduleDropdown = refreshScheduleDropdown;

/* ============================================================
   SAVE SCHEDULE (Library button only)
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveScheduleBtnLibrary");

  if (!saveBtn) {
    console.warn("⚠️ Save Schedule button (#saveScheduleBtnLibrary) not found.");
    return;
  }

  saveBtn.addEventListener("click", () => {
    const defaultName = getDefaultScheduleName(); // your logic to build default
    console.log("[Save Button] Opening Save Modal with default:", defaultName);

    const modal = document.getElementById("scheduleSaveModal");
    const input = document.getElementById("scheduleNameInput");

    if (!modal || !input) {
      console.error("❌ Save Schedule modal elements missing");
      return;
    }

    // Show modal and pass save callback
    showSaveScheduleModal(defaultName, name => {
      console.log("[SaveCallback] Saving schedule:", name);

	ScheduleStoreV2.saveSchedule({
	  name,
	  rawText: document.getElementById("rawInput")?.value || "",
	  parserKey: window.selectedParserKey || "",
	  parsedGames: window.GAME_LIST || [],
	  createdAt: new Date().toISOString(),
	  updatedAt: new Date().toISOString()
	});
      refreshScheduleDropdown();
      alert(`✅ Schedule "${name}" saved.`);
    });
  });
});

/* ============================================================
   CONFIRM SAVE
============================================================ */

document.getElementById("confirmSaveScheduleBtn")?.addEventListener("click", () => {
  const input = document.getElementById("scheduleNameInput");
  const name = input?.value?.trim();

  if (!name) {
    alert("Enter a schedule name.");
    return;
  }

  const rawText = document.getElementById("rawInput")?.value || "";

  const schedule = {
    id: null,
    name,
    parserKey: localStorage.getItem("selectedScheduleParserKey"),
    rawText,
    parsedGames: window.GAME_LIST,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  ScheduleStoreV2.saveSchedule(schedule);
  refreshScheduleDropdown();

  document.getElementById("saveScheduleModal")?.classList.add("hidden");
  alert(`Schedule "${name}" saved.`);
});

/* ============================================================
   CANCEL SAVE
============================================================ */

document.getElementById("cancelSaveScheduleBtn")?.addEventListener("click", () => {
  document.getElementById("saveScheduleModal")?.classList.add("hidden");
});

/* ============================================================
   LOAD SCHEDULE
============================================================ */
function loadScheduleByName(scheduleName) {
  if (!scheduleName) {
    alert("Select a schedule first.");
    return;
  }

  const schedule = ScheduleStoreV2.getScheduleByName(scheduleName);
  if (!schedule) {
    alert("Schedule not found.");
    return;
  }

  console.log(`[LoadSchedule] loading schedule "${scheduleName}"`, schedule);

  // Fill raw input
  const rawInputEl = document.getElementById("rawInput");
  if (rawInputEl) {
    rawInputEl.value = schedule.rawText || "";
  }

  // Restore parser selection
  if (schedule.parserKey) {
    window.selectedParserKey = schedule.parserKey;
    localStorage.setItem("selectedScheduleParserKey", schedule.parserKey);

    const parserSelector = document.getElementById("parserSelect");
    if (parserSelector) {
      parserSelector.value = schedule.parserKey;
    }
  }

  // Restore the parsed games list
  window.GAME_LIST = Array.isArray(schedule.parsedGames)
    ? schedule.parsedGames
    : [];

  // Update dependent UIs
  if (typeof renderCards === "function") renderCards(window.GAME_LIST);
  if (typeof updateStatusLines === "function") updateStatusLines();
  if (typeof updateSelectedCountUI === "function") updateSelectedCountUI();

  const displayEl = document.getElementById("currentScheduleDisplay");
  if (displayEl) {
    displayEl.value = JSON.stringify(window.GAME_LIST, null, 2);
  }

  console.log(`[LoadSchedule] schedule "${scheduleName}" loaded successfully.`);
}


 document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;

  if (!name) {
    alert("Select a schedule first.");
    return;
  }

  const schedule = ScheduleStoreV2.getScheduleByName(name);
  if (!schedule) {
    alert("Schedule not found.");
    return;
  }

  document.getElementById("rawInput").value = schedule.rawText || "";
  window.GAME_LIST = schedule.parsedGames || [];

  localStorage.setItem("selectedScheduleParserKey", schedule.parserKey);
  const parserSel = document.getElementById("parserSelect");
  if (parserSel) parserSel.value = schedule.parserKey;

  const display = document.getElementById("currentScheduleDisplay");
  if (display) {
    display.value = JSON.stringify(window.GAME_LIST, null, 2);
  }
// ✅ Select all by default
window.GAME_LIST.forEach(game => game.selected = true);

  renderCards?.();
  updateStatusLines?.();
  updateSelectedCountUI?.();
});
document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;
  if (!name) return alert("Select a schedule to delete.");
  if (!confirm(`Delete schedule "${name}"?`)) return;

  ScheduleStoreV2.deleteScheduleByName(name);
  refreshScheduleDropdown();
});
document.addEventListener("DOMContentLoaded", () => {
  refreshScheduleDropdown();

  const loadBtn = document.getElementById("loadScheduleBtn");
  const scheduleSelect = document.getElementById("scheduleSelect");

  if (loadBtn && scheduleSelect) {
    loadBtn.addEventListener("click", () => {
      const selectedName = scheduleSelect.value;
      loadScheduleByName(selectedName);
    });
  }

  // Also populate dropdown on init
	refreshScheduleDropdown?.();
	window.GAME_LIST.forEach(game => game.selected = true);

  renderCards?.();
  updateStatusLines?.();
  updateSelectedCountUI?.();

});




function showSaveScheduleModal(defaultName, onSave) {
  console.log("[showSaveScheduleModal] called with:", defaultName);

  const modal = document.getElementById("scheduleSaveModal");
  const input = document.getElementById("scheduleNameInput");
  const confirmBtn = document.getElementById("saveScheduleConfirmBtn");
  const cancelBtn = document.getElementById("saveScheduleCancelBtn");
  const errorEl = document.getElementById("scheduleSaveError");

  console.log("[showSaveScheduleModal] modal:", modal);
  console.log("[showSaveScheduleModal] input:", input);
  console.log("[showSaveScheduleModal] confirmBtn:", confirmBtn);
  console.log("[showSaveScheduleModal] cancelBtn:", cancelBtn);
  console.log("[showSaveScheduleModal] errorEl:", errorEl);

  if (!modal || !input || !confirmBtn || !cancelBtn || !errorEl) {
    console.error("❌ Save Schedule modal elements missing");
    return;
  }

  // Prefill name and show modal
  input.value = defaultName || "";
  errorEl.classList.add("hidden");
  modal.classList.remove("hidden");

  const cleanup = () => {
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    console.log("[showSaveScheduleModal] Listeners removed");
  };

  function handleConfirm() {
    const name = input.value.trim();
    if (!name) {
      errorEl.textContent = "Schedule name is required.";
      errorEl.classList.remove("hidden");
      return;
    }

    console.log("[showSaveScheduleModal] Saving with name:", name);
    cleanup();
    modal.classList.add("hidden");
    onSave?.(name);
  }

  function handleCancel() {
    console.log("[showSaveScheduleModal] Cancel clicked");
    cleanup();
    modal.classList.add("hidden");
  }

  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
  console.log("[showSaveScheduleModal] Listeners attached, modal shown");
}

 window.showSaveScheduleModal = showSaveScheduleModal;
