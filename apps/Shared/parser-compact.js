/* ============================================================
   COMPACT SINGLE-LINE PARSER
   Shared ScheduleParser-compatible parser
============================================================ */

function parseCompact(raw) {
  if (!raw || !raw.trim()) return [];

  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const games = [];

  for (const line of lines) {
    // Accept comma, tab, or pipe
    const cols = line.split(/,|\t|\|/).map(c => c.trim());

    const game = {
      id: crypto.randomUUID(),

      age_division: cols[0] || "",
      match_date:  cols[1] || "",
      match_time:  cols[2] || "",
      field:       cols[3] || "",
      home_team:   cols[4] || "",
      away_team:   cols[5] || "",

      referee1: cols[6] || "",
      referee2: cols[7] || "",
      referee3: cols[8] || "",

      location: "",
      game_number: "",

      assigner: {
        name: "",
        phone: "",
        email: ""
      },

      payer: {
        name: "",
        phone: "",
        email: ""
      },

      notes: "",
      selected: true
    };

    // Require at least teams
    if (!game.home_team || !game.away_team) continue;

    games.push(game);
  }

  return games;
}

// Optional global (debug / legacy)
window.parseCompact = parseCompact;

// ✅ Correct ScheduleParser registration
ScheduleParser.registerParser({
  key: "compact",
  name: "Compact Line Format",
  parse: parseCompact
});
