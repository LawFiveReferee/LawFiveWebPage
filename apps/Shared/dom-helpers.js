export const $ = (sel) => document.querySelector(sel);
export const $all = (sel) => Array.from(document.querySelectorAll(sel));

window.$ = $;
window.$all = $all;

/* ============================================================
   Collapsible Panels — robust and DOM‑safe
============================================================ */

/* ============================================================
   Collapsible Panels — robust initializer
   Works regardless of DOM insertion order
============================================================ */

export function initCollapsibles() {
  console.log("✅ Collapsible panels function called ");
  const panels = document.querySelectorAll(".collapsible-panel");
  panels.forEach(panel => {
    const header = panel.querySelector(".collapsible-header");
    const body = panel.querySelector(".collapsible-body");

    if (header && body) {
      header.addEventListener("click", () => {
        panel.classList.toggle("open");
        body.classList.toggle("open");

        const icon = header.querySelector(".collapsible-icon");
        if (icon) {
          icon.textContent = panel.classList.contains("open") ? "−" : "+";
        }
      });
    }
  });
  console.log("✅ Collapsible panels initialized (" + panels.length + ")");
}
window.initCollapsibles = initCollapsibles;
