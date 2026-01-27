// schedule-utils.js
// ----------------------------------------
// SCHEDULE STORE (persistent via localStorage)
// ----------------------------------------

const SCHEDULE_STORAGE_KEY = "savedSchedules";

/**
 * Load all saved schedules from localStorage.
 * Returns an array of objects:
 *   { name, parserKey, rawText, parsedGames }
 */
function loadSchedulesFromStorage() {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("❌ Failed to load saved schedules:", err);
    return [];
  }
}

/**
 * Save the entire schedule list back to localStorage.
 */
function saveSchedulesToStorage(list) {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("❌ Failed to save schedules:", err);
  }
}

/**
 * Return all saved schedules.
 */
function getAllSchedules() {
  return loadSchedulesFromStorage();
}

/**
 * Find a schedule by its `name` (case‑insensitive).
 */
function getScheduleByName(name) {
  if (!name) return null;
  const list = loadSchedulesFromStorage();
  return list.find(
    s => String(s.name).toLowerCase() === String(name).toLowerCase()
  ) || null;
}

/**
 * Add a new schedule or update an existing one
 * (identified by schedule.name).
 */
function addOrUpdateSchedule(schedule) {
  if (!schedule || !schedule.name) {
    console.warn("⚠️ Cannot save schedule without a name");
    return;
  }

  const list = loadSchedulesFromStorage();
  const idx = list.findIndex(
    s => String(s.name).toLowerCase() === String(schedule.name).toLowerCase()
  );

  if (idx >= 0) {
    list[idx] = schedule;
  } else {
    list.push(schedule);
  }

  saveSchedulesToStorage(list);
}

/**
 * Remove a schedule by its name.
 */
function deleteScheduleByName(name) {
  if (!name) return;
  const list = loadSchedulesFromStorage().filter(
    s => String(s.name).toLowerCase() !== String(name).toLowerCase()
  );
  saveSchedulesToStorage(list);
}

function saveSchedule(schedule) {
  addOrUpdateSchedule(schedule);
}


// Expose globally for both factories to use
window.ScheduleStore = {
  getAllSchedules,
  getScheduleByName,
  addOrUpdateSchedule,
  deleteScheduleByName,
  importSchedule,        // if you want automatic naming
  saveSchedule           // recommended wrapper
};

function refreshScheduleDropdown() {
  const sel = document.getElementById("scheduleSelect");
  if (!sel) return;

  sel.innerHTML = "";
  const list = window.ScheduleStore.getAllSchedules();
  list.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });

  // Optionally add a placeholder
  if (!sel.options.length) {
    sel.innerHTML = "<option disabled>No saved schedules</option>";
  }
}
window.refreshScheduleDropdown = refreshScheduleDropdown;

document.addEventListener("DOMContentLoaded", () => {

  refreshScheduleDropdown();

  document
    .getElementById("loadScheduleBtn")
    ?.addEventListener("click", () => {
      const sel = document.getElementById("scheduleSelect");
      const name = sel?.value;
      const sched = window.ScheduleStore.getScheduleByName(name);
      if (!sched) return alert("Select a saved schedule first.");

      // Populate raw schedule text + parser if needed
      document.getElementById("rawInput").value = sched.rawText;

      // Update parser UI if desired
      // (you already have parserName/description logic)

      // Show parsedGames
      window.GAME_LIST = sched.parsedGames || [];
      // Render preview cards or whatever makes sense
      // (GameCardFactory has UI for that)

      document.getElementById("status-section-1").textContent =
        `Loaded schedule "${name}"`;
    });

  document
    .getElementById("deleteScheduleBtn")
    ?.addEventListener("click", () => {
      const sel = document.getElementById("scheduleSelect");
      const name = sel?.value;
      if (!name) return alert("Select a saved schedule first.");
      if (!confirm(`Delete schedule "${name}"?`)) return;
      window.ScheduleStore.deleteScheduleByName(name);
      refreshScheduleDropdown();
    });

  document
    .getElementById("renameScheduleBtn")
    ?.addEventListener("click", () => {
      const sel = document.getElementById("scheduleSelect");
      const name = sel?.value;
      if (!name) return alert("Select a schedule first.");
      const newName = prompt("Enter a new name:", name);
      if (!newName || newName.trim() === "" || newName === name) return;

      const sched = window.ScheduleStore.getScheduleByName(name);
      if (!sched) return;

      // Remove old entry and save under new name
      window.ScheduleStore.deleteScheduleByName(name);
      sched.name = newName.trim();
      window.ScheduleStore.addOrUpdateSchedule(sched);

      refreshScheduleDropdown();
      sel.value = newName.trim();
    });
});

console.log("✅ ScheduleStore initialized");

function refreshScheduleDropdown() {
  const sel = document.getElementById("scheduleSelect");
  if (!sel) return;

  sel.innerHTML = "";
  const list = window.ScheduleStore.getAllSchedules();
  list.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });

  if (!sel.options.length) {
    sel.innerHTML = "<option disabled>No saved schedules</option>";
  }
}
window.refreshScheduleDropdown = refreshScheduleDropdown;
