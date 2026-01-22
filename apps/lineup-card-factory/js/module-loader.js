/* ============================================================================
   ES MODULE LOADER — Lineup Card Factory
   Loads modules and then boots the UI once DOM is ready.
============================================================================ */

/* module‑loader.js — Updated Import Order */

// Shared first
import "../../shared/constants.js";

import "../../shared/schedule-store.js";
console.log("✅ schedule-store.js loaded");

import "../../shared/team-store.js";
console.log("✅ team-store.jsloaded");

// Load the parser store before any code that uses it
import "../../shared/parser-store.js";
console.log("✅ parser-store.js loaded");

import "../../shared/schedule-import.js";
console.log("✅ schedule-import.js loaded");


import "../../shared/carousel-ui.js";
console.log("✅ carousel-ui.js loaded");

import { refreshImportCarousel } from "../../shared/carousel-ui.js";
console.log("✅ refreshImportCarousel function loaded");



console.log("✅ Shared modules loaded");

// App modules next
import "./dom-helpers.js";
console.log("✅ dom-helpers loaded");

import "./parser-standardizer.js";
console.log("✅ parser-standardizer loaded");

// Parsers...
import "./parser.js";
console.log("✅ parser.js loaded");
import "./parser-ayso.js";
console.log("✅ parser-ayso loaded");
// ...other parser imports...
import "./parser-generic-mapper.js";
console.log("✅ parser-generic-mapper loaded");

// UI app modules
import "./mapping-ui.js";
console.log("✅ mapping-ui loaded");

import "./filter-rules.js";
console.log("✅ filter-rules loaded");

import "./bulk-edit.js";
console.log("✅ bulk-edit loaded");

// Finally lineup card factory script
import "./lineup-card-factory.js";
console.log("✅ lineup-card-factory.js loaded");
function initializeUI() {
  if (typeof loadSavedSchedules === "function") {
    loadSavedSchedules();
  }
  if (typeof refreshScheduleCarousel === "function") {
    refreshScheduleCarousel();
  }
  if (typeof updateScheduleStatus === "function") {
    updateScheduleStatus();
  }
  if (typeof refreshImportCarousel === "function") {
    refreshImportCarousel();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI, { once: true });
} else {
  initializeUI();
}
// —————————————————————————————
// ONE SINGLE BOOTSTRAP
// —————————————————————————————
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
