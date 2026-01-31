// DOM shortcuts
function $(sel) {
  return document.querySelector(sel);
}
function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

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

function formatGameTime(raw) {
  const m = raw.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])/);
  if (!m) return raw;

  const hour = parseInt(m[1], 10);
  const mins = m[2];
  const ampm = m[3].toLowerCase();

  return (mins === "00" && hour !== 12) ? `${hour} ${ampm}` : `${hour}:${mins} ${ampm}`;
}

/* ============================================================
   UTILITY: Unique ID for games
============================================================ */

const makeGameId = () => {
  return (crypto?.randomUUID?.() || ("g-" + Math.random().toString(36).slice(2) + Date.now().toString(36)));
};
// shared/util.js
export function handleParseSchedule(options = {}) {
  const {
    rawInputId = "rawInput",
    parserSelectId = "parserSelect",
    outputDisplayId = "currentScheduleDisplay",
    onAfterParse = () => {}
  } = options;

  const rawInputEl = document.getElementById(rawInputId);
  const parserSelectEl = document.getElementById(parserSelectId);

  const rawText = rawInputEl?.value?.trim();
  if (!rawText) {
    alert("⚠️ Paste schedule text first.");
    return;
  }

  const parserKey = parserSelectEl?.value;
  window.selectedParserKey = parserKey;
  localStorage.setItem("selectedScheduleParserKey", parserKey);
  console.log("🛠 Parsing schedule using parser key:", parserKey);

  const { games, errors } = ScheduleParser.parse(rawText, parserKey);

  if (errors?.length) {
    console.warn("⚠️ Parse warnings/errors:", errors);
  }

  if (!Array.isArray(games) || games.length === 0) {
    console.error("❌ No games were parsed from the schedule.");
    alert("No games were parsed — check the format or selected parser.");
    return;
  }

  window.GAME_LIST = games;
  console.log(`✅ Parsed ${games.length} games using parser "${parserKey}".`);

  const displayEl = document.getElementById(outputDisplayId);
  if (displayEl) {
    displayEl.value = JSON.stringify(games, null, 2);
  }

  const schedulePanel = document.getElementById("scheduleDisplayPanel");
  if (schedulePanel?.classList.contains("collapsed")) {
    schedulePanel.classList.remove("collapsed");
  }

  onAfterParse(games);
}

// Expose globally
window.$ = $;
window.$all = $all;
window.formatGameDate = formatGameDate;
window.formatGameTime = formatGameTime;
window.makeGameId = makeGameId;

