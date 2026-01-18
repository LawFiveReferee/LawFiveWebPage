``
`js
/* ============================================================
   Game Card Factory — Unified Parser Core
   Handles:
     • Registration
     • Standardized Output
     • Discovery from JSON
     • Parser validation
============================================================ */

/* Global registry */
window.PARSER_REGISTRY = [];

/* ============================================================
   1. Standard Output Normalizer
   Every parser output is passed through this to guarantee:
   {
     id, selected,
     game_number, match_date, match_time,
     age_division, home_team, away_team,
     location, field,
     referee1, referee2, referee3,
     assigner:{name,email,phone},
     payer:{name,email,phone},
     notes,
     home_colors, away_colors
   }
============================================================ */
window.normalizeParserOutput = function normalizeParserOutput(list) {
  if (!Array.isArray(list)) return [];

  return list.map(item => {
    const g = typeof item === "object" ? { ...item } : {};

    return {
      id: g.id || crypto.randomUUID(),
      selected: g.selected !== false,

      game_number: g.game_number || "",
      match_date: g.match_date || "",
      match_time: g.match_time || "",

      age_division: g.age_division || "",
      home_team: g.home_team || "",
      away_team: g.away_team || "",

      location: g.location || "",
      field: g.field || "",

      referee1: g.referee1 || "",
      referee2: g.referee2 || "",
      referee3: g.referee3 || "",

      assigner: {
        name:  g.assigner?.name  || "",
        email: g.assigner?.email || "",
        phone: g.assigner?.phone || ""
      },

      payer: {
        name:  g.payer?.name  || "",
        email: g.payer?.email || "",
        phone: g.payer?.phone || ""
      },

      notes: g.notes || "",
      home_colors: g.home_colors || "",
      away_colors: g.away_colors || ""
    };
  });
};

/* ============================================================
   2. Register Parser
   Called once per parser file:
     window.registerParser("arbiter", "Arbiter Game View", parseFn)
============================================================ */
window.registerParser = function registerParser(key, name, parseFn, description="") {
  window.PARSER_REGISTRY.push({
    key,
    name,
    description,
    parseFn
  });
};

/* ============================================================
   3. Load Parsers from JSON
   parser-list.json references the *keys* registered by the
   parser JS files. Example JSON entry:
     { "key":"arbiter" }
   The function below connects the JSON list to actual parseFns.
============================================================ */
window.loadParserList = async function loadParserList() {
  console.log("Loading parser-list.json…");

  try {
    const res = await fetch("js/parser-list.json", { cache:"no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const parserSpecs = await res.json();
    if (!Array.isArray(parserSpecs)) throw new Error("JSON not array");

    window.PARSER_LIST = parserSpecs.map(spec => {
      const p = window.PARSER_REGISTRY.find(r => r.key === spec.key);

      if (!p) {
        console.warn("Parser key missing in registry:", spec.key);
        return { key: spec.key, name:"(missing)", parseFn:()=>[], description:"Missing parser implementation" };
      }

      return p;
    });

    console.log("Loaded PARSER_LIST:", window.PARSER_LIST);

    // restore last parser
    const storedKey = localStorage.getItem("fastCardFactoryParserKey");
    const idx = window.PARSER_LIST.findIndex(p => p.key === storedKey);

    window.selectedParserIndex = idx >= 0 ? idx : 0;
    window.selectedParserKey = window.PARSER_LIST[window.selectedParserIndex].key;

  } catch (err) {
    console.error("Failed loading parser-list:", err);
    window.PARSER_LIST = [];
    window.selectedParserIndex = 0;
    window.selectedParserKey = null;
  }
};
`
``