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
      renderPreviewCards?.();
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
      renderPreviewCards?.();
      updateStatusLines?.();
      updateSelectedCountUI?.();

      const defaultName = raw.split(/\r?\n/)[0]?.trim() || "";
      showSaveScheduleModal(defaultName);
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
  const saveBtn = document.getElementById("saveScheduleBtn");
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
    if (typeof renderPreviewCards === "function") renderPreviewCards();
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
    showSaveScheduleModal(raw.split(/\r?\n/)[0]?.trim() || "");
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
    if (typeof renderPreviewCards === "function") renderPreviewCards();
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

// Expose init so factories can load it
window.initSharedScheduleUIv2 = initSharedScheduleUIv2;

function refreshScheduleDropdown() {
  const sel = document.getElementById("scheduleSelect");
  if (!sel) return;

  sel.innerHTML = `<option value="">— Select Schedule —</option>`;
  const all = ScheduleStoreV2.getAllSchedules();
  all.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
}

document.getElementById("saveScheduleBtn")?.addEventListener("click", () => {
  const nameEl = document.getElementById("scheduleSaveName");
  const name = nameEl?.value.trim();
  if (!name) return alert("Enter a name for this schedule.");

  const rawText = document.getElementById("rawInput")?.value || "";

  const schedule = {
    id: null,  // Let ScheduleStoreV2 generate it
    name,
    parserKey: localStorage.getItem("selectedScheduleParserKey"),
    rawText,
    parsedGames: window.GAME_LIST || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  ScheduleStoreV2.saveSchedule(schedule);
  refreshScheduleDropdown();
  alert(`Schedule "${name}" saved.`);
});

document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
  const sel = document.getElementById("scheduleSelect");
  const name = sel?.value;
  if (!name) return alert("Select a schedule first.");

  const schedule = ScheduleStoreV2.getScheduleByName(name);
  if (!schedule) return alert("Schedule not found.");

  document.getElementById("rawInput").value = schedule.rawText;

  window.GAME_LIST = schedule.parsedGames || [];
  localStorage.setItem("selectedScheduleParserKey", schedule.parserKey);
  document.getElementById("parserSelect").value = schedule.parserKey;

  renderCards();
  updateStatusLines();
  refreshScheduleDropdown();
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
});

function showSaveScheduleModal(defaultName, onSave) {
  const modal = document.getElementById("scheduleSaveModal");
  const input = document.getElementById("scheduleNameInput");
  const confirmBtn = document.getElementById("saveScheduleConfirmBtn");
  const cancelBtn = document.getElementById("saveScheduleCancelBtn");

  input.value = defaultName || "";

  modal.classList.remove("hidden");

  const cleanup = () => {
    confirmBtn.removeEventListener("click", confirmHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
  };

  const confirmHandler = () => {
    const name = input.value.trim();
    modal.classList.add("hidden");
    cleanup();
    if (name) onSave(name);
  };

  const cancelHandler = () => {
    modal.classList.add("hidden");
    cleanup();
  };

  confirmBtn.addEventListener("click", confirmHandler);
  cancelBtn.addEventListener("click", cancelHandler);
}
window.initSharedScheduleUIv2 = initSharedScheduleUIv2;
