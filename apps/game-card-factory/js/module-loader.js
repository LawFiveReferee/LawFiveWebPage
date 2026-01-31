// ================================
// Game Card Factory — Module Loader
// ================================

console.log("✅ module-loader.js starting…");
function waitForElement(selector, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}
/* ================================
   1. Load Shared Core Modules
================================== */

// Shared parsers (must come first)
import "../../shared/parser-arbiter-game-details.js";
import "../../shared/parser-arbiter-plain-text.js";
console.log("✅ Shared basic parsers loaded");

// Shared schedule parser + store
import "../../shared/schedule-parser.js";
import "../../shared/schedule-store-v2.js";
ScheduleStoreV2 ||= ScheduleStore; // ← Ensure attached to window
console.log("✅ Shared schedule parser/store loaded");

// Shared team + parser registry
import "../../shared/team-store.js";
import "../../shared/parser-store.js";
console.log("✅ Shared team + parser store loaded");

// Shared UI (carousel + DOM helpers)
import "../../shared/carousel-ui.js";
import "../../shared/dom-helpers.js";
import { refreshImportCarousel } from "../../shared/carousel-ui.js";
console.log("✅ Shared carousel + DOM helpers loaded");

// Shared schedule UI (after everything else)
import "../../shared/schedule-ui-v2.js";
console.log("✅ Shared schedule-ui-v2.js loaded");

/* ================================
   2. Factory-specific Modules
================================== */

// Helpers + standardizers
import "./parser-standardizer.js";

// Custom parsers
import "./parser.js";
import "./parser-ayso.js";
import "./parser-arbiter.js";
import "./parser-csv.js";
import "./parser-compact.js";
import "./parser-arbiter-email.js";
import "./parser-glendale-table.js";
import "./parser-arbiter-csv-schedule.js";
import "./parser-ayso-playoffs.js";
import "./parser-generic-mapper.js";
console.log("✅ GameCard parsers loaded");

// UI modules
import "./mapping-ui.js";
import "./filter-rules.js";
import "./bulk-edit.js";
console.log("✅ GameCard UI modules loaded");

// App bootstrap
import "./app.js";
console.log("✅ app.js loaded via module-loader");

/* ================================
   3. Boot Sequence (When Ready)
================================== */
 async function bootWhenReady() {
  if (window.__GCF_BOOTED__) return;
  window.__GCF_BOOTED__ = true;

  console.log("🚀 Booting Game Card Factory…");

  try {
    // Wait for required elements to appear in DOM
    await waitForElement("#rawInput");
    await waitForElement("#parserSelect");
    await waitForElement("#parseScheduleBtn");
    await waitForElement("#saveScheduleBtn");

    if (typeof populateParserSelect === "function") {
      populateParserSelect();
    }

    if (typeof initSharedScheduleUIv2 === "function") {
      initSharedScheduleUIv2();
    }

    if (typeof window.bootGameCardFactory === "function") {
      window.bootGameCardFactory();
    }

    // Optional legacy mapping panel glue
    const panel = document.getElementById("genericMappingPanel");
    document.getElementById("openGenericMapping")?.addEventListener("click", () => {
      window.openGenericMappingPanel?.();
      panel?.classList.remove("hidden");
    });
    document.getElementById("mappingCancelBtn")?.addEventListener("click", () =>
      panel?.classList.add("hidden")
    );
    document.getElementById("mappingSaveBtn")?.addEventListener("click", () => {
      window.saveMappingProfileLogic?.();
      panel?.classList.add("hidden");
    });

  } catch (err) {
    console.error("❌ Boot failed:", err);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootWhenReady, { once: true });
} else {
  bootWhenReady();
}
