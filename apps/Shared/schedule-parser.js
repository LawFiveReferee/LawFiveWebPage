/* ============================================================================
   Shared Schedule Parser Registry
   - Central registry for all schedule parsers
   - ES module export + window global
   - Used by both Game Card Factory and Lineup Card Factory
============================================================================ */

const ScheduleParser = (() => {
  /** @type {{ key: string, name: string, parse: Function }[]} */
  const parsers = [];

  /* ------------------------------------------------------------
     Register a parser
  ------------------------------------------------------------ */
  function registerParser({ key, name, parse }) {
    if (!key || typeof parse !== "function") {
      console.warn("⚠️ Invalid parser registration:", { key, name });
      return;
    }

    const existingIndex = parsers.findIndex(p => p.key === key);

    if (existingIndex >= 0) {
      parsers[existingIndex] = { key, name, parse };
    } else {
      parsers.push({ key, name, parse });
    }
  }

  /* ------------------------------------------------------------
     Get all parsers (for UI)
  ------------------------------------------------------------ */
  function getParserList() {
    return parsers.slice();
  }

  /* ------------------------------------------------------------
     Find a parser by key
  ------------------------------------------------------------ */
  function findParser(key) {
    if (!key) return null;
    return parsers.find(p => p.key === key) || null;
  }

  /* ------------------------------------------------------------
     Parse raw schedule text
     Returns: { games: [], errors: [] }
  ------------------------------------------------------------ */
  function parse(rawText, parserKey) {
    const result = {
      games: [],
      errors: []
    };

    if (typeof rawText !== "string" || !rawText.trim()) {
      result.errors.push("No schedule text provided.");
      return result;
    }

    let parser = findParser(parserKey);

    if (!parser) {
      console.warn(
        `⚠️ Unknown parserKey "${parserKey}", falling back to generic`
      );
      parser = findParser("generic") || parsers[0];
    }

    if (!parser) {
      result.errors.push("No parsers available.");
      return result;
    }

    try {
      const games = parser.parse(rawText);

      if (!Array.isArray(games)) {
        result.errors.push(
          `Parser "${parser.key}" did not return an array.`
        );
        return result;
      }

      result.games = games;
    } catch (err) {
      console.error("❌ Parser error:", err);
      result.errors.push(err.message || String(err));
    }

    return result;
  }

  /* ------------------------------------------------------------
     Debug helper
  ------------------------------------------------------------ */
  function _debugDump() {
    return parsers.map(p => p.key);
  }

  return {
    registerParser,
    getParserList,
    findParser,
    parse,
    _debugDump
  };
})();

/* ------------------------------------------------------------
   Expose globally (legacy code support)
------------------------------------------------------------ */
window.ScheduleParser = ScheduleParser;

/* ------------------------------------------------------------
   ES module export
------------------------------------------------------------ */
export default ScheduleParser;
