/**
 * Shared schedule storage (v2)
 * Saves schedules with name, rawText, parserKey, parsedGames
 */

const SCHEDULE_V2_KEY = "scheduleStoreV2";

window.ScheduleStoreV2 = (function () {
  function _loadAllRaw() {
    try {
      return JSON.parse(localStorage.getItem(SCHEDULE_V2_KEY) || "[]") || [];
    } catch {
      return [];
    }
  }

  function _saveAllRaw(list) {
    localStorage.setItem(SCHEDULE_V2_KEY, JSON.stringify(list));
  }

  function saveSchedule({ name, rawText, parserKey, parsedGames }) {
    const list = _loadAllRaw();
    const idx = list.findIndex(s => s.name === name);
    const entry = { name, rawText, parserKey, parsedGames };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    _saveAllRaw(list);
  }

  function getAllSchedules() {
    return _loadAllRaw();
  }

  function getScheduleByName(name) {
    return _loadAllRaw().find(s => s.name === name) || null;
  }

  function deleteSchedule(name) {
    const list = _loadAllRaw().filter(s => s.name !== name);
    _saveAllRaw(list);
  }

  return {
    saveSchedule,
    getAllSchedules,
    getScheduleByName,
    deleteSchedule
  };
})();
