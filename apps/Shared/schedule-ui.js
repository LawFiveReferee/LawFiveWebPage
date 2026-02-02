/**
 * Shared Schedule UI logic for both factories.
 * Exposes:
 *   - initSharedScheduleUI()
 *   - showSaveScheduleModal()
 */

function initSharedScheduleUI() {
  // Populate dropdown
  refreshScheduleDropdown();

  // Load schedule
  document.getElementById("loadScheduleBtn")?.addEventListener("click", () => {
    const sel = document.getElementById("scheduleSelect");
    const name = sel?.value;
    if (!name) return alert("Select a schedule first.");

    const schedule = ScheduleStoreV2.getScheduleByName(name);
    if (!schedule) return alert("Schedule not found.");

    document.getElementById("rawInput").value = schedule.rawText || "";
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

    const statusEl = document.getElementById("status-section-1");
    if (statusEl) statusEl.textContent = `Loaded schedule: ${name}`;
  });

  // Delete schedule
  document.getElementById("deleteScheduleBtn")?.addEventListener("click", () => {
    const sel = document.getElementById("scheduleSelect");
    const name = sel?.value;
    if (!name) return alert("Select a schedule first.");
    if (!confirm(`Delete schedule "${name}"?`)) return;

    ScheduleStoreV2.deleteScheduleByName(name);
    refreshScheduleDropdown();
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

    refreshScheduleDropdown();
    sel.value = newName.trim();
  });
}

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

/**
 * Show modal to save current schedule with optional default name.
 * Will validate and optionally confirm overwrites.
 */
// Expose globally
window.initSharedScheduleUI = initSharedScheduleUI;
