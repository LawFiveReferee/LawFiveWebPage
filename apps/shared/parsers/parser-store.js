/**
 * Shared Parser Store (ES5-compatible)
 * Provides load/save/add/delete for custom parsers in localStorage
 */

(function(global) {
  "use strict";

  var PARSER_KEY = "savedParsers";

  function loadSavedParsers() {
    try {
      var json = localStorage.getItem(PARSER_KEY) || "[]";
      var list = JSON.parse(json);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.error("parserStore.loadSavedParsers() parse error:", err);
      return [];
    }
  }

  function saveParsers(list) {
    try {
      localStorage.setItem(PARSER_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("parserStore.saveParsers() error:", err);
    }
  }

  function addOrUpdateParser(parser) {
    var list = loadSavedParsers();
    var updated = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === parser.key) {
        list[i] = parser;
        updated = true;
        break;
      }
    }
    if (!updated) {
      list.push(parser);
    }
    saveParsers(list);
  }

  function deleteParser(key) {
    var list = loadSavedParsers();
    var filtered = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].key !== key) {
        filtered.push(list[i]);
      }
    }
    saveParsers(filtered);
  }

  function loadAllParsers() {
    // Note: global.BUILT_IN_PARSERS must be defined elsewhere
    var builtins = global.BUILT_IN_PARSERS || [];
    var customs = loadSavedParsers();
    return builtins.concat(customs);
  }

  // Attach all methods to a global object
  global.ParserStore = {
    loadSavedParsers: loadSavedParsers,
    saveParsers: saveParsers,
    addOrUpdateParser: addOrUpdateParser,
    deleteParser: deleteParser,
    loadAllParsers: loadAllParsers
  };

})(window);
