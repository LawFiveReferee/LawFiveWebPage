/* =============================================================================
   Shared Schedule Store — schedule-store.js
   Provides an abstraction for parsing, storing, and selecting schedules
   Used by both Game Card Factory and Lineup Card Factory
============================================================================= */

import { normalizeGameObject } from "./parser-utils.js";

// Key used in localStorage
const STORAGE_KEY = "savedSchedules";

/**
 * Load all saved schedules from localStorage
 * @returns {Array}
 */
function loadAllSchedules() {
  try {
    const json = localStorage.getItem(STORAGE_KEY) || "[]";
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("scheduleStore.loadAll() parse error:", err);
    return [];
  }
}

/**
 * Save updated schedule list
 * @param {Array} list
 */
function saveAllSchedules(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("scheduleStore.saveAll() error:", err);
  }
}

/**
 * Generate a unique ID
 * Fallback if crypto.randomUUID isn’t available
 */
function generateId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a schedule object
 * @param {string} name
 * @param {string} rawText
 * @param {string} source
 */
function makeSchedule(name, rawText, source) {
  return {
    id: generateId(),
    name,
    rawText,
    importSource: source,
    dateCreated: new Date().toISOString(),
    games: []
  };
}

/**
 * Delete a saved schedule by ID
 * @param {string} id
 */
function deleteScheduleById(id) {
  const list = loadAllSchedules().filter(s => s.id !== id);
  saveAllSchedules(list);
}

/**
 * Update a saved schedule
 * @param {string} id
 * @param {Object} updates
 */
function updateScheduleById(id, updates) {
  const list = loadAllSchedules().map(s => {
    if (s.id === id) return { ...s, ...updates };
    return s;
  });
  saveAllSchedules(list);
}

/**
 * Main import function used by UI:
 * - Parses raw text using the selected parser
 * - Normalizes game fields
 * - Optionally saves as a saved schedule
 * - Updates global GAME_LIST
 *
 * @param {Object} config
 *   rawText  — schedule text to parse
 *   parserKey — which parser to use
 *   name     — if saving schedule, what name
 *   source   — source identifier
 *   save     — boolean, whether to save schedule
 */
function importSchedule({ rawText, parserKey = "generic", name, source = "", save = false }) {
  if (!rawText || !rawText.trim()) {
    console.warn("scheduleStore.importSchedule: no raw text provided");
    return [];
  }

  let rawGames = [];

  // Dispatch to appropriate parser
  try {
    switch (parserKey) {
      case "generic":
        rawGames = window.parseGenericMapped(rawText) || [];
        break;

      // TODO: add other built-in parser functions here, for example:
      // case "arbiter": rawGames = window.parseArbiterSchedule(rawText); break;
      // case "csv": rawGames = parseCSVSchedule(rawText); break;

      default:
        console.warn(`Unknown parserKey "${parserKey}", falling back to generic`);
        rawGames = window.parseGenericMapped(rawText) || [];
    }
  } catch (err) {
    console.error("scheduleStore.importSchedule parser error:", err);
    rawGames = [];
  }

  // Normalize each game object
  const games = rawGames.map(raw => normalizeGameObject(raw));

  // Optionally save schedule definition
  if (save) {
    const schedName = name || `Schedule ${new Date().toLocaleString()}`;
    const schedule = makeSchedule(schedName, rawText, source);
    schedule.games = games;

    const all = loadAllSchedules();
    const idx = all.findIndex(s => s.name === schedName);

    if (idx >= 0) {
      all[idx] = schedule;
    } else {
      all.push(schedule);
    }

    saveAllSchedules(all);
  }

  // Update global game list
  window.GAME_LIST = games;
  return games;
}

/**
 * Load a saved schedule by ID
 * - Populates the global GAME_LIST
 * @param {string} id
 */
function loadSavedSchedule(id) {
  const list = loadAllSchedules() || [];
  const schedule = list.find(s => s.id === id);

  if (!schedule) {
    console.warn(`scheduleStore.loadSavedSchedule: no schedule found for id="${id}"`);
    window.GAME_LIST = [];
    return [];
  }

  window.GAME_LIST = schedule.games || [];
  return schedule.games;
}

/**
 * Return the current saved schedules list
 */
function getSavedSchedules() {
  return loadAllSchedules();
}

// Expose the store API
export const ScheduleStore = {
  importSchedule,
  loadSavedSchedule,
  getSavedSchedules,
  deleteScheduleById,
  updateScheduleById
};
