/**schedule-import.js
 * Schedule Import Helper (ES5-compatible)
 * Handles parsing a raw schedule string using a selected parser
 */

(function(global) {
  "use strict";

  function parseAndImport(rawText, parserKey) {
    if (!rawText || !parserKey) {
      console.warn("parseAndImport called without required inputs.");
      return [];
    }

    var selectedParser = (global.BUILT_IN_PARSERS || []).find(function(p) {
      return p.key === parserKey;
    });

    if (!selectedParser || typeof selectedParser.parse !== "function") {
      console.error("Parser not found or invalid:", parserKey);
      return [];
    }

    try {
      var games = selectedParser.parse(rawText);
      console.log("✅ Parsed " + games.length + " games");
      return games;
    } catch (err) {
      console.error("Error while parsing with " + parserKey + ":", err);
      return [];
    }
  }

  global.ScheduleImport = {
    parseAndImport: parseAndImport
  };

})(window);

// schedule-import.js
function parseAndImport(rawText, parserKey) {
  if (!rawText || !parserKey) {
    console.warn("parseAndImport called without required inputs.");
    return [];
  }

  // very simplified default parsing
  const lines = rawText.trim().split("\n").filter(Boolean);
  return lines.map((line, i) => ({
    id: `auto-${i}`,
    raw: line,
    parserKey
  }));
}

// Attach to global object so other scripts can access it
window.ScheduleImport = {
  parseAndImport
};
