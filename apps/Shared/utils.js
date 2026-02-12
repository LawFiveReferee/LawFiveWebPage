// DOM shortcuts
function $(sel) {
  return document.querySelector(sel);
}
window.$ = $;

function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}
window.$all = $all;

/* ============================================================
   UTILITY: Date / Time formatting
============================================================ */

function parseDateFlexible(raw) {
  if (!raw) return null;

  const m1 = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return new Date(+m1[3], +m1[1] - 1, +m1[2]);

  const m2 = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);

  return null;
}

function formatGameDate(raw) {
  const d = parseDateFlexible(raw);
  if (!d || isNaN(d.getTime())) return raw;

  const weekdays = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const months = ["Jan.","Feb.","March","April","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];

  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
window.formatGameDate = formatGameDate;

function formatGameTime(raw) {
  const m = raw.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])/);
  if (!m) return raw;

  const hour = parseInt(m[1], 10);
  const mins = m[2];
  const ampm = m[3].toLowerCase();

  return (mins === "00" && hour !== 12) ? `${hour} ${ampm}` : `${hour}:${mins} ${ampm}`;
}
window.formatGameTime = formatGameTime;

/* ============================================================
   UTILITY: Unique ID for games
============================================================ */

const makeGameId = () => {
  return (crypto?.randomUUID?.() || ("g-" + Math.random().toString(36).slice(2) + Date.now().toString(36)));
};
window.makeGameId = makeGameId;


// shared/util.js

export function handleParseSchedule(options = {}) {
  const {
    rawInputId = "rawInput",
    parserSelectId = "parserSelect",
    outputDisplayId = "currentScheduleDisplay",
    onAfterParse = () => {}
  } = options;

  // ---- Elements
  const rawInputEl = document.getElementById(rawInputId);

  const displayEl = document.getElementById(outputDisplayId);

  // ---- Validate input
  const rawText = rawInputEl?.value?.trim();
  if (!rawText) {
    throw new Error("No schedule text provided");
  }

	const parserKey =
	  window.selectedParserKey ||
	  document.getElementById("rawInput")?.dataset?.parserKey;

	if (!parserKey) {
	  console.warn("⚠️ No parser selected.");
	  return;
	}
  // ---- Persist parser selection
  window.selectedParserKey = parserKey;
  localStorage.setItem("selectedScheduleParserKey", parserKey);
  console.log("🛠 Parsing schedule using parser:", parserKey);

  // ---- Parse
  const { games, errors } = ScheduleParser.parse(rawText, parserKey);

  if (errors?.length) {
    console.warn("⚠️ Parse warnings:", errors);
  }

  if (!Array.isArray(games) || games.length === 0) {
    throw new Error("No games parsed from schedule");
  }

  // ---- Persist results (intentional global)
  window.GAME_LIST = games;

  console.log(`✅ Parsed ${games.length} games`);

  // ---- Show JSON preview
  if (displayEl) {
    displayEl.value = JSON.stringify(games, null, 2);
  }

  // ---- Ensure schedule panel is visible
  const schedulePanel = document.getElementById("section-schedule");
  if (schedulePanel?.classList.contains("collapsed")) {
    schedulePanel.classList.remove("collapsed");
  }

  // ---- Callback (UI orchestration lives OUTSIDE this function)
  onAfterParse(games);

  // ---- Return value for async / direct callers
  return games;
}

export function applyFilter(filterInputId = "filterInput") {
  const keyword = document.getElementById(filterInputId)?.value?.toLowerCase() || "";
  if (!Array.isArray(window.GAME_LIST)) return;

  window.GAME_LIST.forEach(game => {
    const match =
      game.home_team?.toLowerCase().includes(keyword) ||
      game.away_team?.toLowerCase().includes(keyword) ||
      game.age_division?.toLowerCase().includes(keyword) ||
      game.location?.toLowerCase().includes(keyword);

    game.selected = match;
  });

  if (typeof window.updateGameCountUI === "function") window.updateGameCountUI();
  if (typeof window.renderGameCards === "function") window.renderGameCards();
  if (typeof window.renderPreviewCards === "function") window.renderPreviewCards();
		updateStatusLines();
  if (typeof window.updateSelectedCountUI === "function") window.updateSelectedCountUI();
}

export function updateGameCountUI() {
  const total = window.GAME_LIST?.length || 0;
  const selected = window.GAME_LIST?.filter(g => g.selected).length || 0;

  document.querySelectorAll(".total-game-count").forEach(el => {
    el.textContent = total;
  });

  document.querySelectorAll(".selected-game-count").forEach(el => {
    el.textContent = selected;
  });
}

/* ============================================================
   SCHEDULE STORAGE (Shared, V2)
============================================================ */

const SCHEDULE_STORAGE_KEY = "savedSchedulesV2";

/**
 * Save a schedule under a key
 */
export function saveScheduleToStorage(key, gameList) {
  if (!key || !Array.isArray(gameList)) {
    console.warn("❌ saveScheduleToStorage: invalid arguments");
    return;
  }

  try {
    const saved =
      JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || {};

    saved[key] = {
      savedAt: new Date().toISOString(),
      games: gameList
    };

    localStorage.setItem(
      SCHEDULE_STORAGE_KEY,
      JSON.stringify(saved, null, 2)
    );

    console.log(
      `💾 Saved schedule "${key}" (${gameList.length} games)`
    );
  } catch (err) {
    console.error("❌ Failed to save schedule:", err);
  }
}

/**
 * Load a schedule by key
 */
export function loadScheduleFromStorage(key) {
  if (!key) return null;

  try {
    const saved =
      JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || {};

    return saved[key]?.games || null;
  } catch (err) {
    console.error("❌ Failed to load schedule:", err);
    return null;
  }
}

/**
 * Get list of saved schedule keys
 */
export function getSavedScheduleKeys() {
  try {
    const saved =
      JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || {};
    return Object.keys(saved);
  } catch {
    return [];
  }
}

/**
 * Delete a saved schedule
 */
export function deleteScheduleFromStorage(key) {
  if (!key) return;

  try {
    const saved =
      JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || {};

    if (saved[key]) {
      delete saved[key];
      localStorage.setItem(
        SCHEDULE_STORAGE_KEY,
        JSON.stringify(saved, null, 2)
      );
      console.log(`🗑 Deleted schedule "${key}"`);
    }
  } catch (err) {
    console.error("❌ Failed to delete schedule:", err);
  }
}

export function refreshScheduleDropdown() {
  const dropdown = document.getElementById("savedScheduleDropdown");
  if (!dropdown) return;

  // Clear existing
  dropdown.innerHTML = "";

  // Load keys from storage
  const keys = getSavedScheduleKeys();
  if (!keys.length) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "(No saved schedules)";
    dropdown.appendChild(opt);
    dropdown.disabled = true;
    return;
  }

  // Populate options
  keys.forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    dropdown.appendChild(opt);
  });

  dropdown.disabled = false;
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return console.warn(`[showModal] "${id}" not found`);
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
}
