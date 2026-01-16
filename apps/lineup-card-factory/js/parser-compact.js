/* ============================================================
   COMPACT SINGLE-LINE PARSER
============================================================ */

export function parseCompact(raw) {
  if (!raw.trim()) return [];

  const lines = raw.replace(/\r/g, "").split("\n").filter(l => l.trim());

  const games = [];

  for (const l of lines) {
    const cols = l.split(/,|\t|\|/).map(x => x.trim());

    const g = {
      id: crypto.randomUUID(),
      age_division: cols[0] || "",
      match_date:   cols[1] || "",
      match_time:   cols[2] || "",
      field:        cols[3] || "",
      home_team:    cols[4] || "",
      away_team:    cols[5] || "",
      referee1:     cols[6] || "",
      referee2:     cols[7] || "",
      referee3:     cols[8] || "",
      location:     "",
      game_number:  "",
      assigner:     { name:"", phone:"", email:"" },
      payer:        { name:"", phone:"", email:"" },
      notes:        "",
      selected:     true
    };

    games.push(g);
  }

  return games;
}

window.parseCompact = parseCompact;
