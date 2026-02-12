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

window.games = games; // wherever `games` is defined
window.$ = (sel) => document.querySelector(sel);
import "../../shared/pdf-utils.js";
console.log("✅ pdf-utils loaded");

// Core schedule parser registry (defines window.ScheduleParser)
import "../../shared/schedule-parser.js";
console.log("✅ ScheduleParser loaded");

// Register all built-in + user parsers
import "../../shared/parsers/index.js";
console.log("✅ Parsers registered");

import "../../shared/pdf-controller.js";
console.log("✅ pdf-controller loaded");

import "../../shared/pdf-engine.js";
console.log("✅ pdf-engine loaded");


import "../../shared/schedule-store-v2.js";
console.log("✅ shared/schedule-store-v2.js loaded");

import "../../shared/schedule-ui-v2.js";
console.log("✅ shared/schedule-ui-v2.js loaded");

import "../../shared/filtering.js";
console.log("✅ shared/filtering.js loaded");

import "../../shared/status.js";
console.log("✅ shared/status.js loaded");



// Shared constants (if needed)
import "../../shared/constants.js";
console.log("✅ shared/constants.js loaded");


if (typeof populateParserSelect === "function") populateParserSelect();

// Shared team store, parser store, etc.
import "../../shared/team-store.js";
console.log("✅ shared/team-store.js loaded");

// Shared UI support
import "../../shared/carousel-ui.js";
console.log("✅ shared/carousel-ui.js loaded");


import "../../shared/carousel-ui.js";
console.log("✅ shared/carousel-ui.js loaded");

import  "../../shared/game-normalizer.js";

import { updateSelectedCountUI } from "../../shared/ui-helpers.js";


console.log("✅ All shared modules loaded");
// DOM helpers
import "../../shared/dom-helpers.js";
console.log("✅ dom-helpers.js (shared)loaded");

/* ================================
   Lineup Card Factory App Modules
================================== */
import { refreshScheduleDropdown } from "../../shared/utils.js";



// Legacy parser mappings (if still used)

import "../../shared/team-store.js"
console.log("✅ team-store.js loaded");

// UI modules
import "../../shared/mapping-ui.js";
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

/* ================================================================
   INITIALIZE SHARED UI
================================================================= */

function initializeUI() {
  // Legacy dropdown support (safe fallback)
  if (typeof populateParserSelect === "function") {
    populateParserSelect();
  }

  // Refresh shared import carousel
  if (typeof window.refreshImportCarousel === "function") {
    window.refreshImportCarousel();
  }
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


/* ================================================================
   DOM READY HANDLING (SINGLE ENTRY POINT)
================================================================= */

function onDomReady() {
  initializeUI();
  bootLineupCardFactory();

  if (typeof refreshScheduleDropdown === "function") {
    refreshScheduleDropdown();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onDomReady, { once: true });
} else {
  onDomReady();
}
