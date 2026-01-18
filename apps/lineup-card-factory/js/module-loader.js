/* ============================================================
   ES MODULE LOADER — Lineup Card Factory
   Loads modules and then boots the UI once DOM is ready.
============================================================ */

console.log("✅ module-loader.js starting…");

// —————————————————————————————
// Core helpers
// —————————————————————————————

import "./dom-helpers.js";
console.log("✅ dom-helpers loaded");

import "./parser-standardizer.js";
console.log("✅ parser-standardizer loaded");

// —————————————————————————————
// Parsers
// —————————————————————————————

import "./parser.js";
console.log("✅ parser.js loaded");

import "./parser-ayso.js";
console.log("✅ parser-ayso loaded");

import "./parser-arbiter.js";
console.log("✅ parser-arbiter loaded");

import "./parser-csv.js";
console.log("✅ parser-csv loaded");

import "./parser-compact.js";
console.log("✅ parser-compact loaded");

import "./parser-arbiter-email.js";
console.log("✅ parser-arbiter-email loaded");

import "./parser-glendale-table.js";
console.log("✅ parser-glendale-table loaded");

import "./parser-arbiter-csv-schedule.js";
console.log("✅ parser-arbiter-csv-schedule loaded");

import "./parser-ayso-playoffs.js";
console.log("✅ parser-ayso-playoffs loaded");

import "./parser-generic-mapper.js";
console.log("✅ parser-generic-mapper loaded");

// —————————————————————————————
// UI modules
// —————————————————————————————

import "./mapping-ui.js";
console.log("✅ mapping-ui loaded");

import "./filter-rules.js";
console.log("✅ filter-rules loaded");

import "./bulk-edit.js";
console.log("✅ bulk-edit loaded");

// —————————————————————————————
// Main app
// —————————————————————————————

import "./lineup-card-factory.js";
console.log("✅ lineup-card-factory.js loaded");

// UI Shared .js

console.log("✅ constants.js loaded");
import "../../shared/schedule-store.js";
console.log("✅ schedule-store.js loaded");
import "../../shared/team-store.js";
console.log("✅  team-store.jsloaded");
import "../../shared/carousel-ui.js";
console.log("✅ carousel-ui.js loaded");
// —————————————————————————————
// ONE SINGLE BOOTSTRAP
// —————————————————————————————

function bootLineupCardFactory() {
  console.log("✅ DOM ready — booting Lineup Card Factory…");

  // Initialize collapsibles
  if (typeof initCollapsibles === "function") {
    initCollapsibles();
  } else {
    console.warn("⚠️ initCollapsibles() not found");
  }

  // Initialize UI
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
