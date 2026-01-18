// ✅ Correct module version
console.log("✅ module-loader.js starting…");

// Core helpers
import "./dom-helpers.js";
console.log("✅ dom-helpers loaded");

import "./parser-standardizer.js";
console.log("✅ parser-standardizer loaded");

// Parsers
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

// UI modules
import "./mapping-ui.js";
console.log("✅ mapping-ui loaded");

import "./filter-rules.js";
console.log("✅ filter-rules loaded");

import "./bulk-edit.js";
console.log("✅ bulk-edit loaded");

// UI Shared .js

console.log("✅ constants.js loaded");
import "../../shared/schedule-store.js";
console.log("✅ schedule-store.js loaded");
import "../../shared/team-store.js";
console.log("✅  team-store.jsloaded");
import "../../shared/carousel-ui.js";
console.log("✅ carousel-ui.js loaded");

import "../../shared/parser-store.js";
console.log("✅ parser-store.js loaded");

import "../../shared/parser-ui.js";
console.log("✅ parser-ui.js loaded");

// Main app last
import "./app.js";
console.log("✅ app.js loaded via module-loader");

// Boot ONLY when DOM is ready (so collapsible panels exist)
function bootWhenReady() {
  if (window.__GCF_BOOTED__) return;
  window.__GCF_BOOTED__ = true;

  if (typeof window.bootGameCardFactory === "function") {
    window.bootGameCardFactory();
  }

  // ✅ NEW: Mapping panel open/save/cancel handlers

const openBtn = document.getElementById("openGenericMapping");
if (openBtn) {
  openBtn.addEventListener("click", () => {
    const rawInput = document.getElementById("rawInput")?.value || "";
    const headers = (rawInput.split("\n")[0] || "")
      .split(/[\t|,]/)
      .map(x => x.trim());
    const profileKey = "user-defined";

    if (typeof window.openGenericMappingUI === "function") {
      window.openGenericMappingUI(headers, profileKey, rawInput);
    } else {
      console.error("❌ openGenericMappingUI() is not available.");
    }
  });
}
  const cancelBtn = document.getElementById("mappingCancelBtn");
  const saveBtn = document.getElementById("mappingSaveBtn");

  const panel = document.getElementById("genericMappingPanel");

	// Open Mapping UI
	if (openBtn && panel) {
	  openBtn.addEventListener("click", () => {

		// If Game Card Factory global helper exists
		if (typeof window.openGenericMappingPanel === "function") {

		  // Pass the parser output and raw input to open mapping controls
		  // Note: Game Card Factory stores the parsed schedule text input in window.rawInput
		  // and uses window.selectedParserIndex & window.PARSER_LIST.

		  openGenericMappingPanel();

		} else {
		  console.warn("Mapping UI function openGenericMappingPanel() not found");
		}

		// Show panel
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

// DOM ready listener
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootWhenReady, { once: true });
} else {
  bootWhenReady();
}
