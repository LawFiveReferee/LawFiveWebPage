/* ============================================================================
   Shared Schedule Store V2: schedule-store-v2
   - Centralized save / load / rename / delete
   - Stable IDs (name is editable)
   - Stores parsed games + parserKey
============================================================================ */

const SCHEDULE_V2_KEY = "schedulesV2";

/* ------------------------------------------------------------
   Internal helpers
------------------------------------------------------------ */

function _loadRaw() {
  try {
    const raw = localStorage.getItem(SCHEDULE_V2_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.error("ScheduleStoreV2 load error:", err);
    return [];
  }
}

function _saveRaw(arr) {
  try {
    localStorage.setItem(SCHEDULE_V2_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error("ScheduleStoreV2 save error:", err);
  }
}

function _generateId() {
  return `sched-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/* ------------------------------------------------------------
   Public API
------------------------------------------------------------ */

const ScheduleStoreV2 = {
  /**
   * Save or update a schedule
   *
   * If schedule.id exists → update
   * If not → create new
   */
  saveSchedule(schedule) {
    if (!schedule || typeof schedule.name !== "string" || !schedule.name.trim()) {
      console.warn("ScheduleStoreV2.saveSchedule(): missing name");
      return null;
    }

    const list = _loadRaw();
    const now = new Date().toISOString();

    let entry;
    let idx = -1;

    if (schedule.id) {
      idx = list.findIndex(s => s.id === schedule.id);
    }

    if (idx >= 0) {
      // Update existing
      entry = {
        ...list[idx],
        ...schedule,
        name: schedule.name.trim(),
        updatedAt: now
      };
      list[idx] = entry;
    } else {
      // Create new
      entry = {
        id: _generateId(),
        name: schedule.name.trim(),
        rawText: schedule.rawText || "",
        parserKey: schedule.parserKey || "",
        parsedGames: Array.isArray(schedule.parsedGames)
          ? schedule.parsedGames
          : [],
        createdAt: now,
        updatedAt: now
      };
      list.push(entry);
    }

    _saveRaw(list);
    return entry;
  },

  /**
   * Return all saved schedules
   */
  getAllSchedules() {
    return _loadRaw();
  },

  /**
   * Find by ID (preferred)
   */
  getScheduleById(id) {
    if (!id) return null;
    return _loadRaw().find(s => s.id === id) || null;
  },

  /**
   * Find by name (for UI dropdowns)
   */
  getScheduleByName(name) {
    if (!name) return null;
    return _loadRaw().find(s => s.name === name) || null;
  },

  /**
   * Rename a schedule safely
   */
  renameSchedule(id, newName) {
    if (!id || !newName || !newName.trim()) return false;

    const list = _loadRaw();
    const idx = list.findIndex(s => s.id === id);
    if (idx < 0) return false;

    list[idx].name = newName.trim();
    list[idx].updatedAt = new Date().toISOString();
    _saveRaw(list);
    return true;
  },

  /**
   * Delete by ID (preferred)
   */
  deleteScheduleById(id) {
    if (!id) return;
    const list = _loadRaw().filter(s => s.id !== id);
    _saveRaw(list);
  },

  /**
   * Delete by name (legacy / convenience)
   */
	deleteScheduleByName(name) {
		if (!name) return;
		const list = _loadRaw().filter(s => s.name !== name);
		_saveRaw(list);
	}
	};
/* ------------------------------------------------------------
   Expose globally + module export
------------------------------------------------------------ */

// Safe global assignment
window.ScheduleStoreV2 = ScheduleStoreV2;

// Backward-compatible alias:
// Try to assign only if writable, else skip
try {
  Object.defineProperty(window, "ScheduleStore", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: ScheduleStoreV2
  });
} catch (err) {
  console.warn("⚠️ Could not alias ScheduleStore as a writable global; using ScheduleStoreV2 only.", err);
}

// Module exports
export default ScheduleStoreV2;
export { ScheduleStoreV2 as ScheduleStore };

