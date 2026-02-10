console.log("AYSO Playoffs parser loading…");

window.parseAysoPlayoffs = function (raw) {
  if (!raw || !raw.trim()) return [];

  const delimiter = raw.includes("\t") ? "\t" : ",";
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim());

  const normalizeHeader = (h) => {
    const key = h.toLowerCase();

    if (key === "#" || key === "game" || key === "id") return "game_number";
    if (key.includes("round")) return "round";
    if (key.includes("home")) return "home_team";
    if (key.includes("away")) return "away_team";
    if (key.includes("date")) return "match_date";
    if (key.includes("time")) return "match_time";
    if (key.includes("location")) return "location";
    if (key.includes("field")) return "field";
    if (key.includes("age") || key.includes("div")) return "age_division";
    if (key.includes("referee") || key.includes("center")) return "referee1";
    if (key.includes("ar1")) return "referee2";
    if (key.includes("ar2")) return "referee3";

    return h.replace(/\s+/g, "_");
  };

  const mappedHeaders = headers.map(normalizeHeader);
  console.log("Mapped:", mappedHeaders);

  const games = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map(c => c.trim());
    const g = {};

    // Fill all known fields
    for (let c = 0; c < mappedHeaders.length; c++) {
      g[mappedHeaders[c]] = row[c] || "";
    }

    // Minimal validation
    if (!g.game_number || !g.home_team || !g.away_team) continue;

    games.push({
      id: crypto.randomUUID(),

      game_number:  g.game_number,
      match_date:   g.match_date || "",
      match_time:   g.match_time || "",

      age_division: g.age_division || "",
      home_team:    g.home_team,
      away_team:    g.away_team,

      location: g.location || "",
      field:    g.field || "",

      home_colors: "",
      away_colors: "",

      referee1: g.referee1 || "",
      referee2: g.referee2 || "",
      referee3: g.referee3 || "",

      assigner: { name:"", phone:"", email:"" },
      payer:    { name:"", phone:"", email:"" },

      notes: "",
      selected: true
    });
  }

  return games;
};
