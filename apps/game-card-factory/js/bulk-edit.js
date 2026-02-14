/* ============================================================
   Game Card Factory — bulk-edit.js
   Clean, standalone bulk-edit + history manager
============================================================ */

/* ---------- Local DOM helper (module-safe) ---------- */
const $ = (sel) => document.querySelector(sel);

/* ---------- Local storage keys ---------- */
const NOTES_HISTORY_KEY    = "fastCardFactoryNotesHistory";
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
  if (Array.isArray(window.GAME_LIST)) return window.GAME_LIST;
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
  const notesInput   = $("#bulkGameInfoInput");
  const dateInput    = $("#bulkDate");
  const divInput     = $("#bulkDivision");
  const locInput     = $("#bulkLocation");
  const fieldInput   = $("#bulkField");
  const homeColors   = $("#bulkHomeColors");
  const awayColors   = $("#bulkAwayColors");

  const assignerHistorySelect = $("#bulkAssignerHistory");
  const assignName  = $("#bulkAssignName");
  const assignPhone = $("#bulkAssignPhone");
  const assignEmail = $("#bulkAssignEmail");

  const payerName   = $("#bulkPayerName");
  const payerPhone  = $("#bulkPayerPhone");
  const payerEmail  = $("#bulkPayerEmail");

  /* ---- New rule fields ---- */
  const teamSizeInput      = $("#bulkTeamSize");
  const halfLengthInput    = $("#bulkHalfLength");
  const tieTypeInput       = $("#bulkTieType");
  const etMinutesGroup     = $("#bulkEtMinutesGroup");
  const etMinutesInput     = $("#bulkEtMinutes");

  const applyBtn    = $("#applyBulkEditBtn");
  const clearBtn    = $("#clearBulkEditBtn");
  if (!notesUnified || !notesInput || !applyBtn || !clearBtn) {
    console.warn("Bulk Edit: required DOM elements not found, aborting init.");
    return;
  }

	tieTypeInput.addEventListener("change", () => {
	  if (tieTypeInput.value === "ET+PK") {
		etMinutesInput.classList.remove("hidden");
	     etMinutesInput.focus();
} else {
		etMinutesInput.classList.add("hidden");
		etMinutesInput.value = "";
	  }
	});

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

  notesUnified.addEventListener("change", () => {
    if (notesUnified.value) {
      notesInput.value = notesUnified.value;
    }
  });

  notesInput.addEventListener("change", () => {
    const txt = notesInput.value.trim();
    if (!txt) return;

    if (
      !DEFAULT_NOTES_PRESETS.includes(txt) &&
      !notesHistory.includes(txt)
    ) {
      notesHistory.unshift(txt);
      notesHistory = notesHistory.slice(0, 20);
      saveUsedNotes(notesHistory);
      rebuildUnifiedNotesMenu();
    }
  });

  /* ============================================================
     Assigner history
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
      assignName.value  = parts[0] || "";
      assignPhone.value = parts[1] || "";
      assignEmail.value = parts[2] || "";
    });
  }

  /* ============================================================
     Tie Type → show/hide ET minutes
  ============================================================ */
  if (tieTypeInput) {
    tieTypeInput.addEventListener("change", () => {
      if (tieTypeInput.value === "ET+PK") {
        etMinutesGroup.classList.remove("hidden");
      } else {
        etMinutesGroup.classList.add("hidden");
        if (etMinutesInput) etMinutesInput.value = "";
      }
    });
  }

  /* ============================================================
     Clear Bulk Edit Fields
  ============================================================ */
  clearBtn.addEventListener("click", () => {
    notesUnified.value = "";
    notesInput.value   = "";
    if (dateInput)  dateInput.value  = "";
    if (divInput)   divInput.value   = "";
    if (locInput)   locInput.value   = "";
    if (fieldInput) fieldInput.value = "";
    if (homeColors) homeColors.value = "";
    if (awayColors) awayColors.value = "";
    if (assignerHistorySelect) assignerHistorySelect.value = "";
    if (assignName)  assignName.value  = "";
    if (assignPhone) assignPhone.value = "";
    if (assignEmail) assignEmail.value = "";
    if (payerName)  payerName.value  = "";
    if (payerPhone) payerPhone.value = "";
    if (payerEmail) payerEmail.value = "";

    if (teamSizeInput)   teamSizeInput.value = "";
    if (halfLengthInput) halfLengthInput.value = "";
    if (tieTypeInput)    tieTypeInput.value = "";
    if (etMinutesInput)  etMinutesInput.value = "";
    etMinutesGroup.classList.add("hidden");
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

    if (window.pushHistory) window.pushHistory();

    // Pull values from UI
    const newNotes  = (notesInput.value || notesUnified.value || "").trim();
    const newDate   = dateInput ? dateInput.value.trim() : "";
    const newDiv    = divInput ? divInput.value.trim() : "";
    const newLoc    = locInput ? locInput.value.trim() : "";
    const newField  = fieldInput ? fieldInput.value.trim() : "";
    const newHomeColors = homeColors ? homeColors.value.trim() : "";
    const newAwayColors = awayColors ? awayColors.value.trim() : "";

    const newAssignName  = assignName ? assignName.value.trim() : "";
    const newAssignPhone = assignPhone ? assignPhone.value.trim() : "";
    const newAssignEmail = assignEmail ? assignEmail.value.trim() : "";

    const newPayerName  = payerName ? payerName.value.trim() : "";
    const newPayerPhone = payerPhone ? payerPhone.value.trim() : "";
    const newPayerEmail = payerEmail ? payerEmail.value.trim() : "";

    const newTeamSize = teamSizeInput ? teamSizeInput.value : "";
    const newHalfLen  = halfLengthInput ? Number(halfLengthInput.value) : NaN;
    const newTieType  = tieTypeInput ? tieTypeInput.value : "";
    const newETMins   = etMinutesInput ? Number(etMinutesInput.value) : NaN;

    selected.forEach(g => {
      if (newNotes) g.notes = newNotes;
      if (newDate)  g.match_date = newDate;
      if (newDiv)   g.age_division = newDiv;
      if (newLoc)   g.location     = newLoc;
      if (newField) g.field        = newField;
      if (newHomeColors) g.home_colors = newHomeColors;
      if (newAwayColors) g.away_colors = newAwayColors;

      if (!g.assigner || typeof g.assigner !== "object") {
        g.assigner = { name: "", phone: "", email: "" };
      }
      if (!g.payer || typeof g.payer !== "object") {
        g.payer = { name: "", phone: "", email: "" };
      }

      if (newAssignName)  g.assigner.name  = newAssignName;
      if (newAssignPhone) g.assigner.phone = newAssignPhone;
      if (newAssignEmail) g.assigner.email = newAssignEmail;

      if (newPayerName)  g.payer.name  = newPayerName;
      if (newPayerPhone) g.payer.phone = newPayerPhone;
      if (newPayerEmail) g.payer.email = newPayerEmail;

      if (newTeamSize) g.team_size = newTeamSize;
      if (!isNaN(newHalfLen) && halfLengthInput.value !== "") {
        g.half_length = newHalfLen;
      }
      if (newTieType) {
        g.tie_breaking = { type: newTieType };
        if (newTieType === "ET+PK" && !isNaN(newETMins)) {
          g.tie_breaking.et_minutes = newETMins;
        } else {
          delete g.tie_breaking?.et_minutes;
        }
      }
    });

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

    if (newAssignName || newAssignPhone || newAssignEmail) {
      const combined = [newAssignName, newAssignPhone, newAssignEmail].filter(Boolean).join(" — ");
      if (combined) {
        let list = loadUsedAssigners();
        if (!list.includes(combined)) {
          list.unshift(combined);
          list = list.slice(0, 20);
          saveUsedAssigners(list);
          rebuildAssignerHistoryOptions();
        }
      }
    }

	onSelectionChanged();

  });

  /* ============================================================
     Manage History Modal
  ============================================================ */
  const historyModal      = $("#historyModal");
  const notesHistoryList  = $("#notesHistoryList");
  const assignerHistoryList = $("#assignerHistoryList");
  const manageBtn         = $("#toggleHistoryManager");
  const closeModalBtn     = $("#closeHistoryModal");

  function renderHistoryLists() {
    if (!notesHistoryList || !assignerHistoryList) return;

    const notes = loadUsedNotes();
    const assigners = loadUsedAssigners();

    notesHistoryList.innerHTML = "";
    notes.forEach((note, idx) => {
      const row = document.createElement("div");
      row.className = "history-row";

      const span = document.createElement("span");
      span.textContent = note;

      const btn = document.createElement("button");
      btn.textContent = "Delete";
      btn.className = "secondary";
      btn.style.fontSize = "12px";
      btn.addEventListener("click", () => {
        const updated = loadUsedNotes().filter((_, i) => i !== idx);
        saveUsedNotes(updated);
        renderHistoryLists();
      });

      row.appendChild(span);
      row.appendChild(btn);
      notesHistoryList.appendChild(row);
    });

    assignerHistoryList.innerHTML = "";
    assigners.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "history-row";

      const span = document.createElement("span");
      span.textContent = item;

      const btn = document.createElement("button");
      btn.textContent = "Delete";
      btn.className = "secondary";
      btn.style.fontSize = "12px";
      btn.addEventListener("click", () => {
        const updated = loadUsedAssigners().filter((_, i) => i !== idx);
        saveUsedAssigners(updated);
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
