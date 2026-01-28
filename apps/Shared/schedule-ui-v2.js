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

  sel.innerHTML = "";

  const list = ScheduleParser.getParserList();
  if (!list.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(no parsers)";
    sel.appendChild(opt);
    return;
  }

  list.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.key;
    opt.textContent = p.name || p.key;
    sel.appendChild(opt);
  });

  // Restore previously selected parser if valid
  const stored = localStorage.getItem("selectedScheduleParserKey");
  if (stored && sel.querySelector(`option[value="${stored}"]`)) {
    sel.value = stored;
  } else {
    sel.value = list[0].key;
  }

  // Persist selection on change
  sel.addEventListener("change", () => {
    localStorage.setItem("selectedScheduleParserKey", sel.value);
  });
}

window.populateParserSelect = populateParserSelect;

