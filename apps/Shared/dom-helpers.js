/* ============================================================
   Collapsible Panels — clean deterministic initializer
   - Single state class: .open on panel
   - Body visibility controlled via CSS
   - Prevents duplicate listener binding
============================================================ */

export function initCollapsibles() {
  console.log("✅ Collapsible panels function called");

  const panels = document.querySelectorAll(".collapsible-panel");

  panels.forEach(panel => {
    const header = panel.querySelector(".collapsible-header");
    const body   = panel.querySelector(".collapsible-body");
    const icon   = header?.querySelector(".collapsible-icon");

    if (!header || !body) return;

    // Prevent double-binding
    if (header.dataset.bound === "1") return;
    header.dataset.bound = "1";

    // Ensure clean initial state (collapsed)
    panel.classList.remove("open");
    if (icon) icon.textContent = "+";

    header.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("open");

      if (icon) {
        icon.textContent = isOpen ? "−" : "+";
      }
    });
  });

  console.log("✅ Collapsible panels initialized (" + panels.length + ")");
}

window.initCollapsibles = initCollapsibles;
