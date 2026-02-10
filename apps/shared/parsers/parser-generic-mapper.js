console.log("✅ Generic Mapper Parser loaded");

/* Utility: Detect header vs data */
function looksLikeData(headers) {
  let numericCount = 0;
  for (const h of headers) {
    if (/^\d/.test(h)) numericCount++;
  }
  return numericCount >= Math.floor(headers.length * 0.6);
}

/* Load saved mapping from localStorage */
function loadMapping(key) {
  try {
    const raw = localStorage.getItem("mapping_" + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* Main parser function */
function parseGenericSchedule(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const delimiter = "\t";
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim());
  const profileKey = "generic-default-profile";
  const saved = loadMapping(profileKey);

  if (!saved || looksLikeData(headers)) {
    console.warn("⚠️ No mapping found — opening UI");
    window.openGenericMappingUI?.(headers, profileKey, rawText);
    return [];
  }

  const mapping = Array.isArray(saved.mapping) ? saved.mapping : null;
  if (!mapping) return [];

  const games = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map(c => c.trim());
    const g = {};

    for (let col = 0; col < mapping.length; col++) {
      if (!mapping[col]) continue;
      g[mapping[col]] = row[col] || "";
    }

    if (!g.home_team || !g.away_team) continue;

    games.push({
      id: crypto.randomUUID(),
      game_number: g.game_number || "",
      match_date: g.match_date || "",
      match_time: g.match_time || "",
      age_division: g.age_division || "",
      home_team: g.home_team,
      away_team: g.away_team,
      location: g.location || "",
      field: g.field || "",
      referee1: g.referee1 || "",
      referee2: g.referee2 || "",
      referee3: g.referee3 || "",
      notes: g.notes || "",
      selected: true
    });
  }

  return games;
}

/* Register parsers */
ScheduleParser.registerParser({
  key: "generic",
  name: "Generic Schedule Mapper",
  parse: parseGenericSchedule
});

ScheduleParser.registerParser({
  key: "generic-mapper",
  name: "Generic Schedule Mapper",
  parse: parseGenericSchedule
});
