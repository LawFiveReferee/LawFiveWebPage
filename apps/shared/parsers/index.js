// apps/shared/parsers/index.js

// --------------------------------------------------
// Ensure ScheduleParser exists
// --------------------------------------------------
import "../schedule-parser.js";

// --------------------------------------------------
// Built-in parsers (side-effect registration)
// --------------------------------------------------
import "./parser-arbiter-plain-text.js";
import "./parser-arbiter-game-details.js";
import "./parser-arbiter-email.js";
import "./parser-arbiter-csv-schedule.js";
import "./parser-ayso.js";
import "./parser-ayso-playoffs.js";
import "./parser-compact.js";
import "./parser-csv.js";
import "./parser-generic-mapper.js"; // registers generic + mapper

console.log("✅ All parsers registered");

// --------------------------------------------------
// Thin helpers for UI
// --------------------------------------------------
export function getAllParsers() {
  return ScheduleParser.getParserList();
}

export function getParserByKey(key) {
  return ScheduleParser.findParser(key);
}
