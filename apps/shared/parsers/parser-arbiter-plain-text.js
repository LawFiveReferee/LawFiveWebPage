/* ============================================================
   PARSER — Arbiter Plain Text
   - Handles Arbiter plain export
   - Strips footer lines safely
   - Prevents Total/footer from becoming referees
   - Outputs normalized GAME objects
============================================================ */

console.log("Parser: arbiter-plain-text loaded");

function stripArbiterFooter(lines) {
  if (
    lines.length >= 2 &&
    lines[lines.length - 2].startsWith("Total:") &&
    lines[lines.length - 1].includes("ArbiterSports.com")
  ) {
    return lines.slice(0, -2);
  }
  return lines;
}

function isGameHeader(line) {
  // Game line format:
  // 2649,2/4/2026(Wed) 3:00 PM,...
  return /^\d+,\d{1,2}\/\d{1,2}\/\d{4}/.test(line);
}

function isRefereeLine(line) {
  return (
    line.startsWith("SR-Referee") ||
    line.startsWith("JR-Referee") ||
    line.startsWith("AR") ||
    line.startsWith("Referee")
  );
}

export function parse(rawText) {
  if (!rawText) return [];

  let lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  lines = stripArbiterFooter(lines);

  const games = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!isGameHeader(line)) {
      i++;
      continue;
    }

    const parts = line.split(",");

    const gameNumber = parts[0]?.trim() || "";
    const dateTime = parts[1] || "";
    const ageDivision = parts[2]?.trim() || "";
    const location = parts[3]?.replace(/^"|"$/g, "") || "";
    const homeTeam = parts[4]?.trim() || "";
    const awayTeam = parts[5]?.trim() || "";

    const dateMatch = dateTime.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
    const timeMatch = dateTime.match(/\d{1,2}:\d{2}\s?[AP]M/);

    const matchDate = dateMatch ? dateMatch[1] : "";
    const matchTime = timeMatch ? timeMatch[0] : "";

    const game = {
      id: `arbiter-plain-${gameNumber}`,
      game_number: gameNumber,
      match_date: matchDate,
      match_time: matchTime,
      age_division: ageDivision,
      location,
      home_team: homeTeam,
      away_team: awayTeam,
      referees: [],
      selected: true
    };

    i++;

    // Parse referee block
    while (i < lines.length && isRefereeLine(lines[i])) {
      const refParts = lines[i].split(",");

      const role  = refParts[0]?.trim() || "";
      const name  = refParts[1]?.trim() || "";
      const phoneMatch = lines[i].match(/C:\s?([\d\-]+)/);
      const phone = phoneMatch ? phoneMatch[1] : "";

      game.referees.push({
        role,
        name,
        email: "",
        phone
      });

      i++;
    }

    games.push(game);
  }

  return games;
}
const key = "arbiter-plain-text";
const name = "Arbiter Plain Text";

if (window.ScheduleParser?.registerParser) {
  window.ScheduleParser.registerParser({
    key,
    name,
    parse
  });
  console.log("✅ Arbiter Plain Text parser registered");
} else {
  console.warn("⚠️ ScheduleParser not available during arbiter-plain-text registration");
}
