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


// Global delegated listener for edit and PDF buttons
document.body.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const gameId = editBtn.dataset.gameid;
    if (gameId) {
      console.log("[EditButton] Clicked for:", gameId);
      enterEditMode(gameId);
    }
    return;
  }

  const pdfBtn = e.target.closest(".pdf-btn");
  if (pdfBtn) {
    const gameId = pdfBtn.dataset.gameid;
    if (gameId) {
      console.log("[PDFButton] Clicked for:", gameId);
      generateSinglePdfById(gameId);
    }
  }
});
