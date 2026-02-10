// apps/shared/parsers/index.js

// --------------------------------------------------
// Ensure ScheduleParser exists
// --------------------------------------------------
import "../schedule-parser.js";

// --------------------------------------------------
// Built-in parsers (self-registering)
// --------------------------------------------------
import "./parser-arbiter-plain-text.js";
import "./parser-arbiter-email.js";
import "./parser-arbiter-csv-schedule.js";
import "./parser-arbiter-game-details.js";
import "./parser-arbiter.js";

import "./parser-ayso.js";
import "./parser-ayso-playoffs.js";

import "./parser-compact.js";
import "./parser-csv.js";
import "./parser-glendale-table.js";

// --------------------------------------------------
// User-defined mapping parsers (via ParserStore)
// --------------------------------------------------
try {
  const store = window.ParserStore;

  if (store?.loadSavedParsers) {
    const mappings = store.loadSavedParsers() || [];

    mappings.forEach(mapping => {
      if (!mapping?.key || typeof mapping.parse !== "function") return;

      ScheduleParser.registerParser({
        key: mapping.key,
        name: mapping.name || mapping.key,
        parse: raw => mapping.parse(raw)
      });
    });

    if (mappings.length) {
      console.log(`🧩 Registered ${mappings.length} user parser mapping(s)`);
    }
  }
} catch (err) {
  console.error("❌ Failed to load user parser mappings:", err);
}

console.log("✅ All parsers loaded and registered");
