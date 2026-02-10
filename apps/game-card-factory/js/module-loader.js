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
// Early in your main app.js or shared script
window.games = games; // wherever `games` is defined
window.$ = (sel) => document.querySelector(sel);

/* ================================
   1. Load Shared Core Modules
================================== */
// Core schedule parser registry (defines window.ScheduleParser)
import "../../shared/schedule-parser.js";
console.log("✅ ScheduleParser loaded");

// Register all built-in + user parsers
import "../../shared/parsers/index.js";
console.log("✅ Parsers registered");

// Shared schedule parser + store
 import "../../shared/schedule-store-v2.js";
ScheduleStoreV2 ||= ScheduleStore; // ← Ensure attached to window
console.log("✅ Shared schedule parser/store loaded");

// Shared team + parser registry
import "../../shared/team-store.js";
 console.log("✅ Shared team loaded");

// Shared UI (carousel + DOM helpers)
import "../../shared/carousel-ui.js";
console.log("✅ Shared carousel  loaded");


import "../../shared/dom-helpers.js";
console.log("✅ DOM helpers loaded");

import { refreshImportCarousel } from "../../shared/carousel-ui.js";
console.log("✅ Shared carousel + DOM helpers loaded");

// Shared schedule UI (after everything else)
import "../../shared/schedule-ui-v2.js";
console.log("✅ Shared schedule-ui-v2.js loaded");

import "../../shared/filtering.js";
console.log("✅ shared/filtering.js loaded");


import "../../shared/status.js";
console.log("✅ shared/status.js loaded");

import { refreshScheduleDropdown } from "../../shared/utils.js";
import  "../../shared/game-normalizer.js";

import { updateSelectedCountUI } from "../../shared/ui-helpers.js";
window.updateSelectedCountUI = updateSelectedCountUI;

import "../../shared/pdf-utils.js";
console.log("✅ pdf-utils loaded");

import "../../shared/pdf-controller.js";
console.log("✅ pdf-controller loaded");

import "../../shared/pdf-engine.js";
console.log("✅ pdf-engine loaded");

/* ================================
   2. Factory-specific Modules
================================== */




import "../../shared/utils.js";

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
    await waitForElement("#parseScheduleBtn");



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
