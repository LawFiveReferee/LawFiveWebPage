/* ============================================================================
   ES MODULE LOADER — Lineup Card Factory
   Loads shared modules first, then app modules, then boots the UI.
============================================================================ */
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
   Shared Modules (must load first)
================================== */

/* ================================
   Shared Parsers
================================== */
import "../../shared/parser-arbiter-game-details.js";
console.log("✅ parser-arbiter-game-details loaded");

import "../../shared/parser-arbiter-plain-text.js";
console.log("✅ parser-arbiter-plain-text.js loaded");

// Shared constants (if needed)
import "../../shared/constants.js";
console.log("✅ shared/constants.js loaded");

// Shared schedule parser + schedule store v2 + shared schedule UI v2
import "../../shared/schedule-parser.js";
console.log("✅ shared/schedule-parser.js loaded");

import "../../shared/schedule-store-v2.js";
console.log("✅ shared/schedule-store-v2.js loaded");

if (typeof populateParserSelect === "function") populateParserSelect();
if (typeof initSharedScheduleUIv2 === "function") initSharedScheduleUIv2();

import "../../shared/schedule-ui-v2.js";
console.log("✅ shared/schedule-ui-v2.js loaded");

// Legacy schedule import (if still used for compatibility)
import "../../shared/schedule-import.js";
console.log("✅ shared/schedule-import.js loaded");

// Shared team store, parser store, etc.
import "../../shared/team-store.js";
console.log("✅ shared/team-store.js loaded");

import "../../shared/parser-store.js";
console.log("✅ shared/parser-store.js loaded");

// Shared UI support
import "../../shared/carousel-ui.js";
console.log("✅ shared/carousel-ui.js loaded");

import { refreshImportCarousel } from "../../shared/carousel-ui.js";
console.log("✅ refreshImportCarousel function loaded");


console.log("✅ All shared modules loaded");
// DOM helpers
import "../../shared/dom-helpers.js";
console.log("✅ dom-helpers.js (shared)loaded");

/* ================================
   Lineup Card Factory App Modules
================================== */


// Parser standardization (legacy)
//import "./parser-standardizer.js";
//console.log("✅ parser-standardizer.js loaded");

// Legacy parser mappings (if still used)
//import "./parser.js";
//console.log("✅ parser.js loaded");

//import "./parser-ayso.js";
//console.log("✅ parser-ayso.js loaded");

// Generic mapper and other parser support
//import "./parser-generic-mapper.js";
//console.log("✅ parser-generic-mapper.js loaded");

// UI modules
import "./mapping-ui.js";
console.log("✅ mapping-ui.js loaded");

import "./filter-rules.js";
console.log("✅ filter-rules.js loaded");

import "./bulk-edit.js";
console.log("✅ bulk-edit.js loaded");

// Primary App
import "./lineup-card-factory.js";
console.log("✅ lineup-card-factory.js loaded");

/* ================================================================
   INITIAL UI WIRING (before the factory boots)
   — This runs once DOMContentLoaded fires before bootLineupCardFactory()
================================================================= */

function initializeUI() {
  // Populate parser dropdown (shared v2 UI)
  if (typeof populateParserSelect === "function") {
    populateParserSelect();
  }

  // Initialize shared schedule UI (v2)
  if (typeof initSharedScheduleUIv2 === "function") {
    initSharedScheduleUIv2();
  }

  // Refresh any legacy import carousels
  if (typeof refreshImportCarousel === "function") {
    refreshImportCarousel();
  }
}

// Attach initializeUI on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI, { once: true });
} else {
  initializeUI();
}

/* ================================================================
   BOOTSTRAP: Boot the rest of the Lineup Card Factory
================================================================= */

function bootLineupCardFactory() {
  console.log("✅ DOM ready — booting Lineup Card Factory…");

  if (typeof initCollapsibles === "function") {
    initCollapsibles();
  } else {
    console.warn("⚠️ initCollapsibles() not found");
  }

  if (typeof initUI === "function") {
    initUI();
  } else {
    console.warn("⚠️ initUI() not found");
  }
}

// Only call once when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootLineupCardFactory, { once: true });
} else {
  bootLineupCardFactory();
}
document.addEventListener("DOMContentLoaded", () => {
  refreshScheduleDropdown();
});
