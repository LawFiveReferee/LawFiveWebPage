export const $  = (sel) => document.querySelector(sel);
export const $all = (sel) => Array.from(document.querySelectorAll(sel));

window.$ = $;
window.$all = $all;
/* ============================================================
   Collapsible Panels
function initCollapsibles() {
  const panels = document.querySelectorAll(".collapsible-panel");

  panels.forEach(panel => {
    const header = panel.querySelector(".collapsible-header");
    const body   = panel.querySelector(".collapsible-body");
    const icon   = header?.querySelector(".collapsible-icon");

    if (!header || !body) return;

    // Start collapsed unless explicitly marked open
    if (!panel.classList.contains("open")) {
      body.style.display = "none";
      if (icon) icon.textContent = "+";
    }

    header.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("open");

      body.style.display = isOpen ? "block" : "none";
      if (icon) icon.textContent = isOpen ? "−" : "+";
    });
  });

  console.log("✅ Collapsibles initialized");
}

window.initCollapsibles = initCollapsibles;
============================================================ */
