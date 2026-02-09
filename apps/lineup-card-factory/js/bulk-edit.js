/* ============================================================
   Game Card Factory — bulk-edit.js
   Clean, standalone bulk-edit + history manager
============================================================ */

/* ---------- Local DOM helper (module-safe) ---------- */
const $ = (sel) => document.querySelector(sel);

/* ---------- Local storage keys ---------- */
const NOTES_HISTORY_KEY = "fastCardFactoryNotesHistory";
const ASSIGNER_HISTORY_KEY = "fastCardFactoryAssignerHistory";

/* ---------- Default notes presets ---------- */
const DEFAULT_NOTES_PRESETS = [
	"No Ties: 2 five minute extra time then penalty shoot-out",
	"No Ties: 2 ten minute extra time then penalty shoot-out",
	"No Ties: no extra time, straight to penalty shoot-out",
	"Playoff Game",
	"Friendly Game",
	"Rescheduled Game"
];

/* ============================================================
   Helpers to access global games safely
============================================================ */
function getGames() {
	if (Array.isArray(window.games)) return window.games;
	return [];
}

/* ============================================================
   Helpers: Notes history
============================================================ */
function loadUsedNotes() {
	try {
		const raw = localStorage.getItem(NOTES_HISTORY_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.error("loadUsedNotes error:", e);
		return [];
	}
}

function saveUsedNotes(list) {
	try {
		localStorage.setItem(NOTES_HISTORY_KEY, JSON.stringify(list));
	} catch (e) {
		console.error("saveUsedNotes error:", e);
	}
}

/* ============================================================
   Helpers: Assigner history
============================================================ */
function loadUsedAssigners() {
	try {
		const raw = localStorage.getItem(ASSIGNER_HISTORY_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.error("loadUsedAssigners error:", e);
		return [];
	}
}

function saveUsedAssigners(list) {
	try {
		localStorage.setItem(ASSIGNER_HISTORY_KEY, JSON.stringify(list));
	} catch (e) {
		console.error("saveUsedAssigners error:", e);
	}
}

/* ============================================================
   Bulk Edit Controls
============================================================ */
function initBulkEditControls() {
	console.log("Bulk Edit: init");

	/* ---------- DOM refs ---------- */
	const notesUnified = $("#bulkNotesUnified");
	const notesInput = $("#bulkGameInfoInput");
	const dateInput = $("#bulkDate");
	const divInput = $("#bulkDivision");
	const locInput = $("#bulkLocation");
	const fieldInput = $("#bulkField");
	const homeColors = $("#bulkHomeColors");
	const awayColors = $("#bulkAwayColors");

	const assignerHistorySelect = $("#bulkAssignerHistory");
	const assignName = $("#bulkAssignName");
	const assignPhone = $("#bulkAssignPhone");
	const assignEmail = $("#bulkAssignEmail");

	const payerName = $("#bulkPayerName");
	const payerPhone = $("#bulkPayerPhone");
	const payerEmail = $("#bulkPayerEmail");

	const applyBtn = $("#applyBulkEditBtn");
	const clearBtn = $("#clearBulkEditBtn");

	if (!notesUnified || !notesInput || !applyBtn || !clearBtn) {
		console.warn("Bulk Edit: required DOM elements not found, aborting init.");
		return;
	}

	// Start with blank date so we only update when user enters one
	if (dateInput) dateInput.value = "";

	/* ============================================================
	   Unified Notes dropdown = DEFAULT_PRESETS + history
	============================================================ */
	let notesHistory = loadUsedNotes();

	function rebuildUnifiedNotesMenu() {
		const combined = [...DEFAULT_NOTES_PRESETS];

		notesHistory.forEach((n) => {
			if (!combined.includes(n)) combined.push(n);
		});

		notesUnified.innerHTML =
			`<option value="">— choose or type below —</option>` +
			combined.map(n => `<option>${n}</option>`).join("");
	}

	rebuildUnifiedNotesMenu();

	// When user chooses from dropdown, copy into text field
	notesUnified.addEventListener("change", () => {
		if (notesUnified.value) {
			notesInput.value = notesUnified.value;
		}
	});

	// When user types a new note, persist to history
	notesInput.addEventListener("change", () => {
		const txt = notesInput.value.trim();
		if (!txt) return;

		if (
			!DEFAULT_NOTES_PRESETS.includes(txt) &&
			!notesHistory.includes(txt)
		) {
			notesHistory.unshift(txt);
			notesHistory = notesHistory.slice(0, 20); // cap length
			saveUsedNotes(notesHistory);
			rebuildUnifiedNotesMenu();
		}
	});

	/* ============================================================
	   Assigner history (dropdown + autofill)
	============================================================ */
	let assignerHistory = loadUsedAssigners();

	function rebuildAssignerHistoryOptions() {
		if (!assignerHistorySelect) return;
		assignerHistorySelect.innerHTML =
			`<option value="">— Choose —</option>` +
			assignerHistory.map(a => `<option>${a}</option>`).join("");
	}

	rebuildAssignerHistoryOptions();

	if (assignerHistorySelect && assignName && assignPhone && assignEmail) {
		assignerHistorySelect.addEventListener("change", () => {
			const v = assignerHistorySelect.value;
			if (!v) return;

			const parts = v.split(" — ");
			assignName.value = parts[0] || "";
			assignPhone.value = parts[1] || "";
			assignEmail.value = parts[2] || "";
		});
	}

	/* ============================================================
	   Clear Bulk Edit Fields
	============================================================ */
	clearBtn.addEventListener("click", () => {
		notesUnified.value = "";
		notesInput.value = "";

		if (dateInput) dateInput.value = "";
		if (divInput) divInput.value = "";
		if (locInput) locInput.value = "";
		if (fieldInput) fieldInput.value = "";

		if (homeColors) homeColors.value = "";
		if (awayColors) awayColors.value = "";

		if (assignerHistorySelect) assignerHistorySelect.value = "";
		if (assignName) assignName.value = "";
		if (assignPhone) assignPhone.value = "";
		if (assignEmail) assignEmail.value = "";

		if (payerName) payerName.value = "";
		if (payerPhone) payerPhone.value = "";
		if (payerEmail) payerEmail.value = "";
	});

	/* ============================================================
	   Apply Bulk Edits
	============================================================ */
	applyBtn.addEventListener("click", () => {
		const games = getGames();
		const selected = games.filter(g => g.selected);

		if (!selected.length) {
			alert("No games selected.");
			return;
		}

		if (!confirm(`Apply edits to ${selected.length} game(s)?`)) return;

		// Undo snapshot if available
		if (window.pushHistory) window.pushHistory();

		// Pull values from UI
		const newNotes =
			(notesInput.value || notesUnified.value || "").trim();

		const newDate = dateInput ? dateInput.value.trim() : "";
		const newDiv = divInput ? divInput.value.trim() : "";
		const newLoc = locInput ? locInput.value.trim() : "";
		const newField = fieldInput ? fieldInput.value.trim() : "";

		const newHomeColors = homeColors ? homeColors.value.trim() : "";
		const newAwayColors = awayColors ? awayColors.value.trim() : "";

		const newAssignName = assignName ? assignName.value.trim() : "";
		const newAssignPhone = assignPhone ? assignPhone.value.trim() : "";
		const newAssignEmail = assignEmail ? assignEmail.value.trim() : "";

		const newPayerName = payerName ? payerName.value.trim() : "";
		const newPayerPhone = payerPhone ? payerPhone.value.trim() : "";
		const newPayerEmail = payerEmail ? payerEmail.value.trim() : "";

		// Apply to each selected game
		selected.forEach(g => {
			// Ensure assigner/payer are objects so renderCards & PDFs behave
			if (typeof g.assigner !== "object" || !g.assigner) {
				g.assigner = {
					name: "",
					phone: "",
					email: ""
				};
			}
			if (typeof g.payer !== "object" || !g.payer) {
				g.payer = {
					name: "",
					phone: "",
					email: ""
				};
			}

			if (newNotes) g.notes = newNotes;
			if (newDate) g.match_date = newDate; // ISO date; formatter handles it
			if (newDiv) g.age_division = newDiv;
			if (newLoc) g.location = newLoc;
			if (newField) g.field = newField;

			if (newHomeColors) g.home_colors = newHomeColors;
			if (newAwayColors) g.away_colors = newAwayColors;

			if (newAssignName || newAssignPhone || newAssignEmail) {
				g.assigner.name = newAssignName || g.assigner.name;
				g.assigner.phone = newAssignPhone || g.assigner.phone;
				g.assigner.email = newAssignEmail || g.assigner.email;
			}

			if (newPayerName || newPayerPhone || newPayerEmail) {
				g.payer.name = newPayerName || g.payer.name;
				g.payer.phone = newPayerPhone || g.payer.phone;
				g.payer.email = newPayerEmail || g.payer.email;
			}
		});

		// Save & merge new notes into history
		if (newNotes) {
			let list = loadUsedNotes();
			if (!list.includes(newNotes)) {
				list.unshift(newNotes);
				list = list.slice(0, 20);
				saveUsedNotes(list);
				notesHistory = list;
				rebuildUnifiedNotesMenu();
			}
		}

		// Save & merge new assigner into history
		if (newAssignName || newAssignPhone || newAssignEmail) {
			const combined = [newAssignName, newAssignPhone, newAssignEmail]
				.filter(Boolean)
				.join(" — ");

			if (combined) {
				let list = loadUsedAssigners();
				if (!list.includes(combined)) {
					list.unshift(combined);
					list = list.slice(0, 20);
					saveUsedAssigners(list);
					assignerHistory = list;
					rebuildAssignerHistoryOptions();
				}
			}
		}

		// Re-render preview and status lines
		onSelectionChanged();
	});

	/* ============================================================
     Manage History Modal (Section 6 button)
============================================================ */
	const historyModal = $("#historyModal");
	const notesHistoryList = $("#notesHistoryList");
	const assignerHistoryList = $("#assignerHistoryList");
	const manageBtn = $("#toggleHistoryManager");
	const closeModalBtn = $("#closeHistoryModal");

	function renderHistoryLists() {
		if (!notesHistoryList || !assignerHistoryList) return;

		const notes = loadUsedNotes();
		const assigners = loadUsedAssigners();

		// Notes list
		notesHistoryList.innerHTML = "";
		notes.forEach((note, idx) => {
			const row = document.createElement("div");
			row.className = "history-row";
			row.style.display = "flex";
			row.style.justifyContent = "space-between";
			row.style.alignItems = "center";
			row.style.marginBottom = "6px";

			const span = document.createElement("span");
			span.textContent = note;

			const btn = document.createElement("button");
			btn.textContent = "Delete";
			btn.className = "secondary";
			btn.style.fontSize = "12px";
			btn.style.marginLeft = "8px";
			btn.addEventListener("click", () => {
				const updated = loadUsedNotes().filter((_, i) => i !== idx);
				saveUsedNotes(updated);
				notesHistory = updated;
				rebuildUnifiedNotesMenu();
				renderHistoryLists();
			});

			row.appendChild(span);
			row.appendChild(btn);
			notesHistoryList.appendChild(row);
		});

		// Assigner list
		assignerHistoryList.innerHTML = "";
		assigners.forEach((item, idx) => {
			const row = document.createElement("div");
			row.className = "history-row";
			row.style.display = "flex";
			row.style.justifyContent = "space-between";
			row.style.alignItems = "center";
			row.style.marginBottom = "6px";

			const span = document.createElement("span");
			span.textContent = item;

			const btn = document.createElement("button");
			btn.textContent = "Delete";
			btn.className = "secondary";
			btn.style.fontSize = "12px";
			btn.style.marginLeft = "8px";
			btn.addEventListener("click", () => {
				const updated = loadUsedAssigners().filter((_, i) => i !== idx);
				saveUsedAssigners(updated);
				assignerHistory = updated;
				rebuildAssignerHistoryOptions();
				renderHistoryLists();
			});

			row.appendChild(span);
			row.appendChild(btn);
			assignerHistoryList.appendChild(row);
		});
	}

	if (manageBtn && historyModal) {
		manageBtn.addEventListener("click", () => {
			renderHistoryLists();
			historyModal.style.display = "flex";
		});
	}

	if (closeModalBtn && historyModal) {
		closeModalBtn.addEventListener("click", () => {
			historyModal.style.display = "none";
		});
	}
}

/* Expose init for app.js */
window.initBulkEditControls = initBulkEditControls;
