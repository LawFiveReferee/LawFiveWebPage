// ================================
// Game Card Factory — Module Loader
// ================================

console.log("✅ module-loader.js starting…");

/* ====================================================
   1) Shared Modules (load these before everything else)
==================================================== */

// Shared schedule parser + v2 store + shared schedule UI
import "../../shared/schedule-parser.js";
console.log("✅ shared/schedule-parser.js loaded");

import "../../shared/schedule-store-v2.js";
console.log("✅ shared/schedule-store-v2.js loaded");

import "../../shared/schedule-ui-v2.js";
console.log("✅ shared/schedule-ui-v2.js loaded");

// Shared team store (used in both factories)
import "../../shared/team-store.js";
console.log("✅ shared/team-store.js loaded");

// Shared parser store (if still used for game parsers)
import "../../shared/parser-store.js";
console.log("✅ shared/parser-store.js loaded");

// Shared UI support modules
import "../../shared/carousel-ui.js";
console.log("✅ shared/carousel-ui.js loaded");

import { refreshImportCarousel } from "../../shared/carousel-ui.js";
console.log("✅ refreshImportCarousel function loaded");

/* ====================================================
   2) Core Helpers
==================================================== */

import "./dom-helpers.js";
console.log("✅ dom-helpers.js loaded");

import "./parser-standardizer.js";
console.log("✅ parser-standardizer.js loaded");

/* ====================================================
   3) Game Card Parsers
==================================================== */

import "./parser.js";
console.log("✅ parser.js loaded");

import "./parser-ayso.js";
console.log("✅ parser-ayso.js loaded");

import "./parser-arbiter.js";
console.log("✅ parser-arbiter.js loaded");

import "./parser-csv.js";
console.log("✅ parser-csv.js loaded");

import "./parser-compact.js";
console.log("✅ parser-compact.js loaded");

import "./parser-arbiter-email.js";
console.log("✅ parser-arbiter-email.js loaded");

import "./parser-glendale-table.js";
console.log("✅ parser-glendale-table.js loaded");

import "./parser-arbiter-csv-schedule.js";
console.log("✅ parser-arbiter-csv-schedule.js loaded");

import "./parser-ayso-playoffs.js";
console.log("✅ parser-ayso-playoffs.js loaded");

import "./parser-generic-mapper.js";
console.log("✅ parser-generic-mapper.js loaded");

/* ====================================================
   4) UI Modules
==================================================== */

import "./mapping-ui.js";
console.log("✅ mapping-ui.js loaded");

import "./filter-rules.js";
console.log("✅ filter-rules.js loaded");

import "./bulk-edit.js";
console.log("✅ bulk-edit.js loaded");

/* ====================================================
   5) Main App Script
==================================================== */

import "./app.js";
console.log("✅ app.js loaded via module-loader");

/* ====================================================
   6) DOM Ready / Boot Logic
==================================================== */

function bootWhenReady() {
  if (window.__GCF_BOOTED__) return;
  window.__GCF_BOOTED__ = true;

  // 1) Populate parser dropdown from shared parser registry
  if (typeof populateParserSelect === "function") {
    populateParserSelect();
  } else {
    console.warn("⚠️ populateParserSelect() not found");
  }

  // 2) Initialize shared schedule UI v2
  if (typeof initSharedScheduleUIv2 === "function") {
    initSharedScheduleUIv2();
  } else {
    console.warn("⚠️ initSharedScheduleUIv2() not found");
  }

  // 3) Now boot the factory app
  if (typeof window.bootGameCardFactory === "function") {
    window.bootGameCardFactory();
  } else {
    console.warn("⚠️ bootGameCardFactory() not found");
  }

  // 4) Legacy mapping panel – if you still use it (optional)
  const openBtn = document.getElementById("openGenericMapping");
  const cancelBtn = document.getElementById("mappingCancelBtn");
  const saveBtn = document.getElementById("mappingSaveBtn");
  const panel = document.getElementById("genericMappingPanel");

  if (openBtn && panel) {
    openBtn.addEventListener("click", () => {
      if (typeof window.openGenericMappingPanel === "function") {
        openGenericMappingPanel();
      }
      panel.classList.remove("hidden");
    });
  }

  if (cancelBtn && panel) {
    cancelBtn.addEventListener("click", () => {
      panel.classList.add("hidden");
    });
  }

  if (saveBtn && panel) {
    saveBtn.addEventListener("click", () => {
      if (typeof window.saveMappingProfileLogic === "function") {
        window.saveMappingProfileLogic();
      }
      panel.classList.add("hidden");
    });
  }
}

// Attach to DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootWhenReady, { once: true });
} else {
  bootWhenReady();
}
