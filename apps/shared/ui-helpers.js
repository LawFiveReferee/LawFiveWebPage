function showModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return console.warn(`[showModal] "${id}" not found`);
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}
 export function closeEditModal() {
  const modal = document.getElementById("sharedEditModal");
  if (!modal) return;

  const modalContent = modal.querySelector(".modal-content");
  const toggleBtn = modal.querySelector("#toggleHiddenFieldsBtn");

  // Reset visibility state
  modalContent?.classList.remove("show-all-fields");

  if (toggleBtn) {
    toggleBtn.textContent = "Show Hidden Fields";
  }

  // Hide modal
  modal.classList.add("hidden");
  modal.classList.remove("show");
}


//import { closeEditModal } from "./ui-helpers.js";

export function saveEditChanges(gameId) {
  console.log("[saveEditChanges] Saving game:", gameId);

  const game = window.GAME_LIST?.find(g => g.id === gameId);
  if (!game) {
    console.error("[saveEditChanges] Game not found:", gameId);
    return;
  }

  const modal = document.getElementById("sharedEditModal");
  if (!modal) {
    console.error("[saveEditChanges] Modal not found");
    return;
  }

  /* ----------------------------------
     1. Save standard game fields
  ---------------------------------- */
  modal.querySelectorAll("[data-field]").forEach(el => {
    const value =
      typeof el.value === "string" ? el.value : null;
    if (value === null) return;

    const path = el.dataset.field;
    if (!path) return;

    const parts = path.split(".");
    let target = game;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (/^\d+$/.test(part)) {
        const idx = Number(part);
        if (!Array.isArray(target)) return;
        target[idx] ??= {};
        target = target[idx];
      } else {
        target[part] ??= {};
        target = target[part];
      }
    }

    target[parts.at(-1)] = value;
  });

  /* ----------------------------------
     2. Save lineup override (Lineup Card Factory)
  ---------------------------------- */
  const selectedTeam = window.TeamStore?.getCurrentTeam?.();
  const teamId = selectedTeam?.teamId;

  if (teamId) {
    const rosterInputs = modal.querySelectorAll(
      "[data-roster-index][data-roster-field]"
    );

    if (rosterInputs.length) {
      const rosterMap = {};

      rosterInputs.forEach(el => {
        if (typeof el.value !== "string") return;

        const idx = el.dataset.rosterIndex;
        const field = el.dataset.rosterField;
        if (!idx || !field) return;

        rosterMap[idx] ??= {};
        rosterMap[idx][field] = el.value.trim();
      });

      const roster = Object.values(rosterMap).filter(
        p => p.number || p.name
      );

      game.lineupOverrides ??= {};
      game.lineupOverrides[teamId] = roster;

      console.log(
        "[saveEditChanges] Updated lineup override:",
        roster
      );
    }
  }

  /* ----------------------------------
     3. Save referee crew
  ---------------------------------- */
  const refInputs = modal.querySelectorAll(
    "[data-ref-index][data-ref-field]"
  );

  if (refInputs.length) {
    const refMap = {};

    refInputs.forEach(el => {
      if (typeof el.value !== "string") return;

      const idx = el.dataset.refIndex;
      const field = el.dataset.refField;
      if (!idx || !field) return;

      refMap[idx] ??= {};
      refMap[idx][field] = el.value.trim();
    });

    game.referees = Object.values(refMap).filter(
      r => r.name || r.email || r.phone
    );
  }

  /* ----------------------------------
     4. Close modal & refresh UI (single entry point)
  ---------------------------------- */
  closeEditModal();
  onSelectionChanged();
}
window.saveEditChanges = saveEditChanges;

function hideModal(id) {
  closeEditModal();
  renderCards?.();
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
}
window.showModal = showModal;
window.hideModal = hideModal;
// apps/shared/ui-helpers.js
export function updateSelectedCountUI() {
  const selected = window.GAME_LIST?.filter(g => g.selected).length || 0;
  const total = window.GAME_LIST?.length || 0;

  const statusEls = document.querySelectorAll(".status-line.selected-count");
  statusEls.forEach(el => {
    el.textContent = `${selected} of ${total} games selected`;
  });
}
window.updateSelectedCountUI = updateSelectedCountUI;

function buildSharedEditFields(game) {
  return `
    <h3>Edit Game</h3>

    <div class="field-wrapper">
      <label>Date</label>
      <input type="date" data-field="match_date" value="${game.match_date || ""}">
    </div>

    <div class="field-wrapper">
      <label>Time</label>
      <input type="time" data-field="match_time" value="${game.match_time || ""}">
    </div>

    <div class="field-wrapper">
      <label>Location</label>
      <input type="text" data-field="location" value="${game.location || ""}">
    </div>

    <div class="field-wrapper">
      <label>Home Team</label>
      <input type="text" data-field="home_team" value="${game.home_team || ""}">
    </div>

    <div class="field-wrapper">
      <label>Away Team</label>
      <input type="text" data-field="away_team" value="${game.away_team || ""}">
    </div>
  `;
}
window.buildSharedEditFields = buildSharedEditFields;

export function enterEditMode(gameId) {
  console.log("[enterEditMode] Opening modal for game:", gameId);

  const modal = document.getElementById("sharedEditModal");
  const modalContent = modal?.querySelector(".modal-content");
  const body = document.getElementById("sharedEditModalBody");
  const saveBtn = document.getElementById("sharedSaveEditBtn");
  const cancelBtn = document.getElementById("sharedCancelEditBtn");

  if (!modal || !body || !modalContent) {
    console.error("[enterEditMode] Modal elements missing");
    return;
  }

  // 🧼 Reset hidden-field visibility and toggle button
  modalContent.classList.remove("show-all-fields");
  const toggleBtn = modal.querySelector("#toggleHiddenFieldsBtn");
  if (toggleBtn) toggleBtn.textContent = "Show Hidden Fields";

  const g = window.GAME_LIST?.find(x => x.id === gameId);
  if (!g) {
    console.error("[enterEditMode] Game not found:", gameId);
    return;
  }


  /* ----------------------------------
     Build modal content
  ---------------------------------- */
  if (typeof buildEditModalContent !== "function") {
    console.error("[enterEditMode] Missing buildEditModalContent()");
    return;
  }

  body.innerHTML = buildEditModalContent(g);

  /* ----------------------------------
     Show modal
  ---------------------------------- */
  modal.classList.remove("hidden");
  modal.classList.add("show");

  /* ----------------------------------
     Buttons
  ---------------------------------- */
  cancelBtn.onclick = () => {
    modal.classList.add("hidden");
    modal.classList.remove("show");
  };

  saveBtn.onclick = () => {
    if (typeof saveEditChanges === "function") {
      saveEditChanges(gameId);
    }
    modal.classList.add("hidden");
    modal.classList.remove("show");
  };
}

window.enterEditMode = enterEditMode;

/// Global delegated listener for edit and PDF buttons
document.body.addEventListener("click", e => {
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const gameId = editBtn.dataset.gameid;
    if (gameId) {
      console.log("[EditButton] Clicked for:", gameId);
      window.enterEditMode?.(gameId);
    }
    return;
  }

  const pdfBtn = e.target.closest(".pdf-btn");
  if (pdfBtn) {
    const gameId = pdfBtn.dataset.gameid;
    if (gameId) {
      window.generateSinglePdfById?.(gameId);
    }
  }
});

export function getValue(obj, path) {
  return path.split('.').reduce((o, key) => (o ? o[key] : ""), obj);
}

export function buildFieldEditor(game, fields) {
  return fields.map(field => {
    const rawValue = getValue(game, field) ?? "";
    const isEmpty = rawValue.toString().trim() === "";

    return `
      <div class="field-wrapper ${isEmpty ? "empty-field" : ""}" data-field-group="${field}">
        <label>${prettifyFieldLabel(field)}</label>
        <input
          type="text"
          value="${rawValue}"
          data-field="${field}"
        />
      </div>
    `;
  }).join("");
}

/*document.body.addEventListener("click", e => {
  if (e.target.id === "toggleHiddenFieldsBtn") {
    //const modalContent = document.querySelector(".modal-content");
    const modalContent = e.target.closest(".modal-content");
    const showing = modalContent.classList.toggle("show-all-fields");

    e.target.textContent = showing
      ? "Hide Empty Fields"
      : "Show Empty Fields";
  }
});*/

document.body.addEventListener("click", e => {
  if (e.target.id === "toggleHiddenFieldsBtn") {
    const modalContent = e.target.closest(".modal-content");
    if (!modalContent) return;

    const showing = modalContent.classList.toggle("show-all-fields");

    e.target.textContent = showing
      ? "Hide Empty Fields"
      : "Show Hidden Fields";
  }
});

export function prettifyFieldLabel(field) {
  return field
    .replace(/\[\]/g, "")                   // remove []
    .replace(/\.\w+/g, s => " " + s.slice(1))
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}
