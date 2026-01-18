/* ============================================================
   FILTER RULES — Game Card Factory
   - Builds filter rule UI in Section 2
   - Applies rules to window.games selection state
   - No global $/$$ collisions
============================================================ */

console.log("Filter rules loading…");

/* ============================================================
   Helpers (namespaced)
============================================================ */
const FR$ = (sel) => document.querySelector(sel);
const FR$$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ============================================================
   Vocabulary collection (optional)
============================================================ */
window.collectFilterVocabulary = function collectFilterVocabulary() {
	const refs = new Set();
	const teams = new Set();

	const list = window.games || [];
	list.forEach(g => {
		if (g.referee1) refs.add(g.referee1);
		if (g.referee2) refs.add(g.referee2);
		if (g.referee3) refs.add(g.referee3);

		if (g.home_team) teams.add(g.home_team);
		if (g.away_team) teams.add(g.away_team);
	});

	window._refNames = Array.from(refs).sort();
	window._teamNames = Array.from(teams).sort();
};

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
function parseIsoDateOnly(s) {
	if (!s) return null;
	const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const d = new Date(+m[1], +m[2] - 1, +m[3]);
	return isNaN(d.getTime()) ? null : d;
}

function getGameDateObj(g) {
	// Support either match_date_obj or match_date string
	if (g && g.match_date_obj instanceof Date) return g.match_date_obj;

	const raw = g?.match_date || g?.date || "";
	// try YYYY-MM-DD
	const iso = parseIsoDateOnly(raw);
	if (iso) return iso;

	// try MM/DD/YYYY
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
		case "age_division":
			return g.age_division || "";
		case "referee":
		case "refereeName":
			return `${g.referee1 || ""} ${g.referee2 || ""} ${g.referee3 || ""}`.trim();
		case "team":
			return `${g.home_team || ""} ${g.away_team || ""}`.trim();
		case "home":
			return g.home_team || "";
		case "away":
			return g.away_team || "";
		case "field":
			return g.field || "";
		case "location":
			return g.location || "";
		default:
			return "";
	}
}

function matchTextRule(g, rule) {
	const hay = textForField(g, rule.field).toLowerCase();
	const needle = String(rule.value || "").toLowerCase();

	switch (rule.op) {
		case "contains":
			return hay.includes(needle);
		case "not_contains":
			return !hay.includes(needle);
		case "is":
			return hay === needle;
		case "is_not":
			return hay !== needle;
		default:
			return false;
	}
}

function matchDateRule(g, rule) {
	const d = getGameDateObj(g);
	if (!d) return false;

	const start = parseIsoDateOnly(rule.start);
	const end = parseIsoDateOnly(rule.end);
	if (!start || !end) return false;

	// normalize to date-only range
	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	return d >= start && d <= end;
}

function gameMatchesRule(g, rule) {
	if (!rule || !rule.field || !rule.op) return false;
	if (rule.field === "date") return matchDateRule(g, rule);
	return matchTextRule(g, rule);
}

/* ============================================================
   Preset date ranges for date rule UI
============================================================ */
function presetDateRange(op) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);

	if (op === "todayTomorrow") {
		return {
			start: isoDate(today),
			end: isoDate(tomorrow)
		};
	}
	if (op === "next7") {
		const end = new Date(today);
		end.setDate(today.getDate() + 7);
		return {
			start: isoDate(today),
			end: isoDate(end)
		};
	}
	if (op === "next14") {
		const end = new Date(today);
		end.setDate(today.getDate() + 14);
		return {
			start: isoDate(today),
			end: isoDate(end)
		};
	}
	if (op === "specific") {
		return {
			start: isoDate(tomorrow),
			end: isoDate(tomorrow)
		};
	}
	if (op === "range") {
		const end = new Date(tomorrow);
		end.setDate(tomorrow.getDate() + 3);
		return {
			start: isoDate(tomorrow),
			end: isoDate(end)
		};
	}
	return null;
}

function isoDate(d) {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

/* ============================================================
   Build one rule row
============================================================ */
function buildOperatorOptions(field) {
	if (field === "date") {
		return [{
				v: "todayTomorrow",
				t: "Today & Tomorrow"
			},
			{
				v: "next7",
				t: "Next 7 Days"
			},
			{
				v: "next14",
				t: "Next 14 Days"
			},
			{
				v: "specific",
				t: "A Specific Date"
			},
			{
				v: "range",
				t: "A Date Range"
			}
		];
	}

	return [{
			v: "contains",
			t: "contains"
		},
		{
			v: "not_contains",
			t: "does not contain"
		},
		{
			v: "is",
			t: "is"
		},
		{
			v: "is_not",
			t: "is not"
		}
	];
}

function buildValueBox(field, op) {
	// dropdown from vocabulary for refereeName/team if available
	if (field === "refereeName") {
		const list = window._refNames || [];
		const options = list.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
		return `<select class="filter-value-input">${options}</select>`;
	}

	if (field === "team") {
		const list = window._teamNames || [];
		const options = list.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
		return `<select class="filter-value-input">${options}</select>`;
	}

	if (field === "date") {
		const preset = presetDateRange(op);
		const startVal = preset ? preset.start : "";
		const endVal = preset ? preset.end : "";

		return `
      <input type="date" class="date-start filter-value-input" value="${startVal}">
      <input type="date" class="date-end filter-value-input" value="${endVal}">
    `;
	}

	return `<input class="filter-value-input" type="text" value="">`;
}

function escapeHtml(s) {
	return String(s || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function addRuleRow(afterRow = null) {
	const cont = FR$("#filterRulesContainer");
	if (!cont) return;

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
	const opSel = row.querySelector(".filter-operator-select");
	const box = row.querySelector(".filter-value-box");

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
}

function clearAllRuleRows() {
	const cont = document.getElementById("filterRulesContainer");
	if (cont) cont.innerHTML = "";
}

function setRuleRowValues(row, rule) {
	const fieldSel = row.querySelector(".filter-field-select");
	const opSel = row.querySelector(".filter-operator-select");
	const box = row.querySelector(".filter-value-box");

	if (!fieldSel || !opSel || !box) return;

	// Field
	fieldSel.value = rule.field || fieldSel.value;

	// Rebuild operators for that field
	const ops = buildOperatorOptions(fieldSel.value);
	opSel.innerHTML = ops.map(o => `<option value="${o.v}">${o.t}</option>`).join("");
	opSel.value = rule.op || opSel.value;

	// Rebuild value UI
	box.innerHTML = buildValueBox(fieldSel.value, opSel.value);

	// Apply value(s)
	if (fieldSel.value === "date") {
		const startEl = row.querySelector(".date-start");
		const endEl = row.querySelector(".date-end");
		if (startEl && rule.start) startEl.value = rule.start;
		if (endEl && rule.end) endEl.value = rule.end;
	} else {
		const valEl = row.querySelector(".filter-value-input");
		if (valEl && typeof rule.value === "string") valEl.value = rule.value;
	}
}

function addRuleRowAndSet(rule) {
	addRuleRow(null);
	const rows = Array.from(document.querySelectorAll(".filter-rule-row"));
	const row = rows[rows.length - 1];
	if (row) setRuleRowValues(row, rule);
}


/* ============================================================
   Read rules from UI
============================================================ */
function getRulesFromUI() {
	const rows = FR$$(".filter-rule-row");
	const rules = [];

	rows.forEach(row => {
		const field = row.querySelector(".filter-field-select")?.value || "";
		const op = row.querySelector(".filter-operator-select")?.value || "";

		if (!field || !op) return;

		if (field === "date") {
			const start = row.querySelector(".date-start")?.value || "";
			const end = row.querySelector(".date-end")?.value || "";
			if (start && end) rules.push({
				field,
				op,
				start,
				end
			});
			return;
		}

		const val = row.querySelector(".filter-value-input")?.value?.trim() || "";
		if (val) rules.push({
			field,
			op,
			value: val
		});
	});

	return rules;
}

/* ============================================================
   Apply rules to selection
============================================================ */
function applyFilters(selectMatches) {
	const list = window.games || [];
	if (!list.length) {
		alert("No games extracted yet.");
		return;
	}

	const rules = getRulesFromUI();
	if (!rules.length) {
		alert("Add at least one rule.");
		return;
	}

	const modeEl = FR$("#filterMatchMode");
	const mode = modeEl ? modeEl.value : "all"; // "any" or "all"

	list.forEach(g => {
		let match = (mode === "all");

		for (const r of rules) {
			const ok = gameMatchesRule(g, r);

			if (mode === "any" && ok) {
				match = true;
				break;
			}
			if (mode === "all" && !ok) {
				match = false;
				break;
			}
		}

		if (match) {
			g.selected = !!selectMatches;
		}
	});

	if (typeof window.renderCards === "function") window.renderCards()
	updateSelectedCountUI()
	updateStatusLines();
	if (typeof window.updateStatusLines === "function") window.updateStatusLines();
}

/* ============================================================
   INIT — builds the first blank rule row and wires buttons
============================================================ */
window.initFilterControls = function initFilterControls() {
	console.log("initFilterControls() called");

	const cont = document.getElementById("filterRulesContainer");
	if (!cont) {
		console.warn("filterRulesContainer not found.");
		return;
	}

	// Refresh vocab (optional; helps dropdowns)
	if (typeof window.collectFilterVocabulary === "function") {
		window.collectFilterVocabulary();
	}

	// Ensure at least one row exists
	if (cont.children.length === 0) {
		cont.innerHTML = "";
		addRuleRow(null);
	}

	// Buttons (existing)
	const btnSelectAll = document.getElementById("filterSelectAllGamesBtn");
	if (btnSelectAll) {
		btnSelectAll.onclick = () => {
			(window.games || []).forEach(g => g.selected = true);
			if (typeof window.renderCards === "function") window.renderCards()
			updateSelectedCountUI()
			updateStatusLines();
			if (typeof window.updateStatusLines === "function") window.updateStatusLines();
		};
	}

	const btnDeselectAll = document.getElementById("filterDeselectAllGamesBtn");
	if (btnDeselectAll) {
		btnDeselectAll.onclick = () => {
			(window.games || []).forEach(g => g.selected = false);
			if (typeof window.renderCards === "function") window.renderCards()
			updateStatusLines()
			updateSelectedCountUI();
			if (typeof window.updateStatusLines === "function") window.updateStatusLines();
		};
	}

	const btnSelect = document.getElementById("filterSelectBtn");
	if (btnSelect) btnSelect.onclick = () => applyFilters(true);

	const btnDeselect = document.getElementById("filterDeselectBtn");
	if (btnDeselect) btnDeselect.onclick = () => applyFilters(false);

	const btnClear = document.getElementById("filterClearBtn");
	if (btnClear) {
		btnClear.onclick = () => {
			cont.innerHTML = "";
			addRuleRow(null);
		};
	}

	// ---------------------------
	// Presets UI
	// ---------------------------
	const presetSelect = document.getElementById("filterPresetSelect");
	const saveBtn = document.getElementById("filterSavePresetBtn");
	const deleteBtn = document.getElementById("filterDeletePresetBtn");
	const matchModeEl = document.getElementById("filterMatchMode");

	function refreshPresetDropdown(keepName) {
		if (!presetSelect) return;
		const names = listPresetNames();

		presetSelect.innerHTML = `<option value="">(none)</option>` +
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

		// match mode
		if (matchModeEl && (preset.matchMode === "any" || preset.matchMode === "all")) {
			matchModeEl.value = preset.matchMode;
		}

		// rules
		clearAllRuleRows();
		const rules = Array.isArray(preset.rules) ? preset.rules : [];

		if (rules.length === 0) {
			addRuleRow(null);
			return;
		}

		rules.forEach(r => addRuleRowAndSet(r));
	}

	if (presetSelect) {
		presetSelect.onchange = () => {
			const name = presetSelect.value;
			if (!name) {
				if (deleteBtn) deleteBtn.disabled = true;
				return;
			}
			loadPresetIntoUI(name);
			if (deleteBtn) deleteBtn.disabled = false;
		};
	}

	if (saveBtn) {
		saveBtn.onclick = () => {
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

			upsertPreset(name, {
				matchMode,
				rules
			});
			refreshPresetDropdown(name);
		};
	}

	if (deleteBtn) {
		deleteBtn.disabled = !(presetSelect && presetSelect.value);

		deleteBtn.onclick = () => {
			if (!presetSelect || !presetSelect.value) return;
			const name = presetSelect.value;

			const ok = confirm(`Delete saved filter "${name}"?`);
			if (!ok) return;

			deletePreset(name);
			refreshPresetDropdown("");
		};
	}

	refreshPresetDropdown("");
};
// Expose for debugging/other modules
window.addRuleRow = addRuleRow;
window.applyFilters = applyFilters;

console.log("Filter rules loaded…");