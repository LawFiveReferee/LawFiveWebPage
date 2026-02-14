/* ============================================================
   SHARED FILTER ENGINE
   - Builds filter rule UI
   - Applies rules to window.GAME_LIST selection state
   - Used by both Game & Lineup factories
   - IMPORTANT: No DOM work on import. Call initFilterEngine() after DOM ready.
============================================================ */

console.log("Shared filter-engine module loaded (no init yet).");

/* ============================================================
   Helpers (namespaced)
============================================================ */
const FR$  = (sel) => document.querySelector(sel);
const FR$$ = (sel) => Array.from(document.querySelectorAll(sel));

function getGameList() {
  return Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];
}

/* ============================================================
   Vocabulary collection (optional)
============================================================ */

window.collectFilterVocabulary = function collectFilterVocabulary() {
  const refs  = new Set();
  const teams = new Set();

  const list = Array.isArray(window.GAME_LIST) ? window.GAME_LIST : [];

  list.forEach(g => {

    // Collect referee names
    if (Array.isArray(g.referees)) {
      g.referees.forEach(r => {
        if (r?.name) refs.add(r.name.trim());
      });
    }

    // Collect team names
    if (g.home_team) teams.add(g.home_team.trim());
    if (g.away_team) teams.add(g.away_team.trim());
  });

  window._refNames  = Array.from(refs).sort((a,b) => a.localeCompare(b));
  window._teamNames = Array.from(teams).sort((a,b) => a.localeCompare(b));

  console.log("🔎 Referee vocabulary:", window._refNames);
};

// keep backward compat with your existing global name
window.collectFilterVocabulary = collectFilterVocabulary;

/* ============================================================
   Presets (localStorage)
============================================================ */
const FILTER_PRESETS_KEY = "gcf_filter_presets_v1";

function loadFilterPresets() {
  try {
    const raw = localStorage.getItem(FILTER_PRESETS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return (obj && typeof obj === "object") ? obj : {};
  } catch {
    return {};
  }
}

function saveFilterPresets(obj) {
  localStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(obj || {}));
}

function listPresetNames() {
  return Object.keys(loadFilterPresets()).sort((a, b) => a.localeCompare(b));
}

function getPresetByName(name) {
  const presets = loadFilterPresets();
  return presets[name] || null;
}

function upsertPreset(name, presetObj) {
  const presets = loadFilterPresets();
  presets[name] = presetObj;
  saveFilterPresets(presets);
}

function deletePreset(name) {
  const presets = loadFilterPresets();
  delete presets[name];
  saveFilterPresets(presets);
}

/* ============================================================
   Date parsing (for date rules)
============================================================ */
function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseIsoDateOnly(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}

function getGameDateObj(g) {
  if (g && g.match_date_obj instanceof Date) return g.match_date_obj;

  const raw = g?.match_date || g?.date || "";
  const iso = parseIsoDateOnly(raw);
  if (iso) return iso;

  const m = String(raw).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const d = new Date(+m[3], +m[1] - 1, +m[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/* ============================================================
   Rule matching
============================================================ */
function textForField(g, field) {
  switch (field) {

    case "age_division":	return g.age_division || "";

    case "referee":
    case "refereeName":
      if (Array.isArray(g.referees)) {
        return g.referees
          .map(r => r?.name || "")
          .join(" ")
          .trim();
      }
      return "";

    case "team":		return `${g.home_team || ""} ${g.away_team || ""}`.trim();
    case "home":		return g.home_team || "";
    case "away":		return g.away_team || "";
    case "location":	return g.location || "";
    case "field":		return g.field || "";

    default:
      return "";
  }
}

function matchTextRule(g, rule) {
  const hay = textForField(g, rule.field).toLowerCase();
  const needle = String(rule.value || "").toLowerCase();

  switch (rule.op) {
    case "contains":     return hay.includes(needle);
    case "not_contains": return !hay.includes(needle);
    case "is":           return hay === needle;
    case "is_not":       return hay !== needle;
    default:             return false;
  }
}

function matchDateRule(g, rule) {
  const d = getGameDateObj(g);
  if (!d) return false;

  const start = parseIsoDateOnly(rule.start);
  const end   = parseIsoDateOnly(rule.end);
  if (!start || !end) return false;

  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);

  return d >= start && d <= end;
}

function gameMatchesRule(g, rule) {
  if (!rule || !rule.field || !rule.op) return false;
  if (rule.field === "date") return matchDateRule(g, rule);
  return matchTextRule(g, rule);
}

/* ============================================================
   Date presets (UI helper)
============================================================ */
function presetDateRange(op) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (op === "todayTomorrow") {
    return { start: isoDate(today), end: isoDate(tomorrow) };
  }
  if (op === "next7") {
    const end = new Date(today); end.setDate(today.getDate() + 7);
    return { start: isoDate(today), end: isoDate(end) };
  }
  if (op === "next14") {
    const end = new Date(today); end.setDate(today.getDate() + 14);
    return { start: isoDate(today), end: isoDate(end) };
  }
  if (op === "specific") {
    return { start: isoDate(tomorrow), end: isoDate(tomorrow) };
  }
  if (op === "range") {
    const end = new Date(tomorrow); end.setDate(tomorrow.getDate() + 3);
    return { start: isoDate(tomorrow), end: isoDate(end) };
  }
  return null;
}

/* ============================================================
   UI builders
============================================================ */
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildOperatorOptions(field) {
  if (field === "date") {
    return [
      { v: "todayTomorrow", t: "Today & Tomorrow" },
      { v: "next7",         t: "Next 7 Days" },
      { v: "next14",        t: "Next 14 Days" },
      { v: "specific",      t: "A Specific Date" },
      { v: "range",         t: "A Date Range" }
    ];
  }

  return [
    { v: "contains",     t: "contains" },
    { v: "not_contains", t: "does not contain" },
    { v: "is",           t: "is" },
    { v: "is_not",       t: "is not" }
  ];
}

function buildValueBox(field, op) {
  if (field === "refereeName") {
    const list = window._refNames || [];
    const options = list.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
    return `<select class="filter-value-input"><option value=""></option>${options}</select>`;
  }

  if (field === "team") {
    const list = window._teamNames || [];
    const options = list.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
    return `<select class="filter-value-input"><option value=""></option>${options}</select>`;
  }

  if (field === "date") {
    const preset = presetDateRange(op);
    const startVal = preset ? preset.start : "";
    const endVal   = preset ? preset.end : "";
    return `
      <input type="date" class="date-start filter-value-input" value="${startVal}">
      <input type="date" class="date-end filter-value-input" value="${endVal}">
    `;
  }

  return `<input class="filter-value-input" type="text" value="">`;
}

function addRuleRow(afterRow = null) {
  const cont = document.getElementById("filterRulesContainer");
  if (!cont) return null;

  const row = document.createElement("div");
  row.className = "filter-rule-row";

  row.innerHTML = `
    <select class="filter-field-select">
      <option value="age_division">Age/Div</option>
      <option value="referee">Referees</option>
      <option value="refereeName">Referee Name</option>
      <option value="team">Team</option>
      <option value="home">Home</option>
      <option value="away">Away</option>
      <option value="location">Location</option>
      <option value="field">Field</option>
      <option value="date">Date</option>
    </select>

    <select class="filter-operator-select"></select>

    <div class="filter-value-box" style="flex:1;"></div>

    <button type="button" class="rule-btn rule-remove" title="Remove rule">−</button>
    <button type="button" class="rule-btn rule-add" title="Add rule">+</button>
  `;

  if (afterRow && afterRow.parentNode === cont) {
    cont.insertBefore(row, afterRow.nextSibling);
  } else {
    cont.appendChild(row);
  }

  const fieldSel = row.querySelector(".filter-field-select");
  const opSel    = row.querySelector(".filter-operator-select");
  const box      = row.querySelector(".filter-value-box");

  function refreshOperators() {
    const ops = buildOperatorOptions(fieldSel.value);
    opSel.innerHTML = ops.map(o => `<option value="${o.v}">${o.t}</option>`).join("");
  }

  function refreshValueBox() {
    box.innerHTML = buildValueBox(fieldSel.value, opSel.value);
  }

  fieldSel.addEventListener("change", () => {
    refreshOperators();
    refreshValueBox();
  });

  opSel.addEventListener("change", () => {
    refreshValueBox();
  });

  row.querySelector(".rule-add").addEventListener("click", () => addRuleRow(row));
  row.querySelector(".rule-remove").addEventListener("click", () => row.remove());

  refreshOperators();
  refreshValueBox();

  return row;
}

function clearAllRuleRows() {
  const cont = document.getElementById("filterRulesContainer");
  if (cont) cont.innerHTML = "";
}

function setRuleRowValues(row, rule) {
  const fieldSel = row.querySelector(".filter-field-select");
  const opSel    = row.querySelector(".filter-operator-select");
  const box      = row.querySelector(".filter-value-box");

  if (!fieldSel || !opSel || !box) return;

  fieldSel.value = rule.field || fieldSel.value;

  const ops = buildOperatorOptions(fieldSel.value);
  opSel.innerHTML = ops.map(o => `<option value="${o.v}">${o.t}</option>`).join("");
  opSel.value = rule.op || opSel.value;

  box.innerHTML = buildValueBox(fieldSel.value, opSel.value);

  if (fieldSel.value === "date") {
    const startEl = row.querySelector(".date-start");
    const endEl   = row.querySelector(".date-end");
    if (startEl && rule.start) startEl.value = rule.start;
    if (endEl && rule.end) endEl.value = rule.end;
  } else {
    const valEl = row.querySelector(".filter-value-input");
    if (valEl && typeof rule.value === "string") valEl.value = rule.value;
  }
}

function addRuleRowAndSet(rule) {
  const row = addRuleRow(null);
  if (row) setRuleRowValues(row, rule);
}

function getRulesFromUI() {
  const rows = FR$$(".filter-rule-row");
  const rules = [];

  rows.forEach(row => {
    const field = row.querySelector(".filter-field-select")?.value || "";
    const op    = row.querySelector(".filter-operator-select")?.value || "";
    if (!field || !op) return;

    if (field === "date") {
      const start = row.querySelector(".date-start")?.value || "";
      const end   = row.querySelector(".date-end")?.value || "";
      if (start && end) rules.push({ field, op, start, end });
      return;
    }

    const val = row.querySelector(".filter-value-input")?.value?.trim() || "";
    if (val) rules.push({ field, op, value: val });
  });

  return rules;
}

/* ============================================================
   Apply rules to selection
============================================================ */
function applyFilters(selectMatches) {
  const list = getGameList();
  if (!list.length) {
    alert("No games extracted yet.");
    return;
  }

  const rules = getRulesFromUI();
  if (!rules.length) {
    alert("Add at least one rule.");
    return;
  }

  const modeEl = document.getElementById("filterMatchMode");
  const mode = modeEl ? modeEl.value : "all"; // "any" or "all"

  list.forEach(g => {
    let match = (mode === "all");

    for (const r of rules) {
      const ok = gameMatchesRule(g, r);
      if (mode === "any" && ok) { match = true; break; }
      if (mode === "all" && !ok) { match = false; break; }
    }

    if (match) {
      g.selected = !!selectMatches;
    }
  });

  window.onSelectionChanged?.();
}

// keep backward compat
window.applyFilters = applyFilters;

/* ============================================================
   Public init — call after DOM ready
============================================================ */
export function initFilterEngine() {
  const cont = document.getElementById("filterRulesContainer");
  if (!cont) {
    console.warn("initFilterEngine(): #filterRulesContainer not found (filter UI will not initialize).");
    return;
  }

  // Refresh vocab so dropdowns can use it
  collectFilterVocabulary();

  // Ensure at least one rule row exists
  if (cont.children.length === 0) {
    clearAllRuleRows();
    addRuleRow(null);
  }

  // ---- Global Select/Deselect buttons (your IDs)
  const selectAllBtn = document.getElementById("selectAllGamesBtn");
  if (selectAllBtn && !selectAllBtn.dataset.bound) {
    selectAllBtn.dataset.bound = "1";
    selectAllBtn.addEventListener("click", () => {
      getGameList().forEach(g => g.selected = true);
      window.onSelectionChanged?.();
    });
  }

  const deselectAllBtn = document.getElementById("deselectAllGamesBtn");
  if (deselectAllBtn && !deselectAllBtn.dataset.bound) {
    deselectAllBtn.dataset.bound = "1";
    deselectAllBtn.addEventListener("click", () => {
      getGameList().forEach(g => g.selected = false);
      window.onSelectionChanged?.();
    });
  }

  // ---- Rule buttons (your IDs)
  const applyBtn = document.getElementById("applyFilterBtn");
  if (applyBtn && !applyBtn.dataset.bound) {
    applyBtn.dataset.bound = "1";
    applyBtn.addEventListener("click", () => {
      // "Apply Filter" is ambiguous in your UI; keep it as "Select Matching"
      // so users see an immediate effect.
      applyFilters(true);
    });
  }

  const clearBtn = document.getElementById("clearFilterBtn");
  if (clearBtn && !clearBtn.dataset.bound) {
    clearBtn.dataset.bound = "1";
    clearBtn.addEventListener("click", () => {
      clearAllRuleRows();
      addRuleRow(null);
    });
  }

  const selectMatchingBtn = document.getElementById("selectMatchingBtn");
  if (selectMatchingBtn && !selectMatchingBtn.dataset.bound) {
    selectMatchingBtn.dataset.bound = "1";
    selectMatchingBtn.addEventListener("click", () => applyFilters(true));
  }

  const deselectMatchingBtn = document.getElementById("deselectMatchingBtn");
  if (deselectMatchingBtn && !deselectMatchingBtn.dataset.bound) {
    deselectMatchingBtn.dataset.bound = "1";
    deselectMatchingBtn.addEventListener("click", () => applyFilters(false));
  }

  // ---- Presets UI (optional; only if elements exist)
  const presetSelect = document.getElementById("filterPresetSelect");
  const saveBtn      = document.getElementById("filterSavePresetBtn");
  const deleteBtn    = document.getElementById("filterDeletePresetBtn");
  const matchModeEl  = document.getElementById("filterMatchMode");

  function refreshPresetDropdown(keepName) {
    if (!presetSelect) return;
    const names = listPresetNames();

    presetSelect.innerHTML =
      `<option value="">(none)</option>` +
      names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");

    if (keepName && names.includes(keepName)) {
      presetSelect.value = keepName;
    } else {
      presetSelect.value = "";
    }

    if (deleteBtn) deleteBtn.disabled = !presetSelect.value;
  }

  function loadPresetIntoUI(name) {
    const preset = getPresetByName(name);
    if (!preset) return;

    if (matchModeEl && (preset.matchMode === "any" || preset.matchMode === "all")) {
      matchModeEl.value = preset.matchMode;
    }

    clearAllRuleRows();
    const rules = Array.isArray(preset.rules) ? preset.rules : [];

    if (rules.length === 0) {
      addRuleRow(null);
      return;
    }

    rules.forEach(r => addRuleRowAndSet(r));
  }

  if (presetSelect && !presetSelect.dataset.bound) {
    presetSelect.dataset.bound = "1";
    presetSelect.addEventListener("change", () => {
      const name = presetSelect.value;
      if (!name) {
        if (deleteBtn) deleteBtn.disabled = true;
        return;
      }
      loadPresetIntoUI(name);
      if (deleteBtn) deleteBtn.disabled = false;
    });
  }

  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = "1";
    saveBtn.addEventListener("click", () => {
      const rules = getRulesFromUI();
      const matchMode = matchModeEl ? matchModeEl.value : "all";

      if (!rules.length) {
        alert("Add at least one rule before saving.");
        return;
      }

      const name = prompt("Save filter as:", "");
      if (!name) return;

      const presets = loadFilterPresets();
      if (presets[name]) {
        const ok = confirm(`"${name}" already exists. Replace it?`);
        if (!ok) return;
      }

      upsertPreset(name, { matchMode, rules });
      refreshPresetDropdown(name);
    });
  }

  if (deleteBtn && !deleteBtn.dataset.bound) {
    deleteBtn.dataset.bound = "1";
    deleteBtn.disabled = !(presetSelect && presetSelect.value);

    deleteBtn.addEventListener("click", () => {
      if (!presetSelect || !presetSelect.value) return;
      const name = presetSelect.value;

      const ok = confirm(`Delete saved filter "${name}"?`);
      if (!ok) return;

      deletePreset(name);
      refreshPresetDropdown("");
    });
  }

  refreshPresetDropdown("");

  // Expose optional helpers for debugging
  window.addRuleRow = addRuleRow;
  window.initFilterControls = initFilterEngine;

  console.log("initFilterEngine(): filter UI initialized.");
}
