
/**
 * CSV line parser that respects quoted commas.
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && line[i - 1] !== "\\") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

/**
 * Detect Arbiter footer lines like:
 * "Wednesday, January 28, 2026, 8:20 PM",Created by ArbiterSports.com,Page 3 of,6
 */
function isArbiterFooter(line) {
  return (
    /Created by ArbiterSports\.com/i.test(line) &&
    /Page\s+\d+\s+of/i.test(line)
  );
}

/**
 * Detect repeated page timestamp lines without "Page X of Y"
 */
function isArbiterTimestamp(line) {
  return /^"\w+,\s+\w+\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}\s+(AM|PM)"/i.test(
    line
  );
}

function parseArbiterPlainText(rawText) {
  if (typeof rawText !== "string") return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const games = [];
  let headerCols = null;

  const isGameHeader = (line) =>
    line.startsWith("Game,") &&
    line.includes("Date & Time") &&
    line.includes("Home") &&
    line.includes("Away");

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 🚫 Stop entirely on footer
    if (isArbiterFooter(line)) { i++; continue;
      console.log("[ArbiterPlainText] Footer detected — stopping parse");
    }

    // Skip timestamp-only lines
    if (isArbiterTimestamp(line)) {
      i++;
      continue;
    }

    // Detect header row
    if (isGameHeader(line)) {
      headerCols = parseCsvLine(line);
      i++;
      continue;
    }

    if (!headerCols) {
      i++;
      continue;
    }

    const parts = parseCsvLine(line);

    // Game row = numeric first column & correct column count
    if (
      parts.length === headerCols.length &&
      /^[0-9]+$/.test(parts[0])
    ) {
      const getField = name => {
        const idx = headerCols.indexOf(name);
        return idx >= 0 && idx < parts.length ? parts[idx] : "";
      };

      const game_number = getField("Game");

      // Date & Time
      const dateTime = getField("Date & Time");
      let match_date = "";
      let match_time = "";

      const dtMatch = dateTime.match(
        /([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}).*?([0-9]{1,2}:[0-9]{2}\s*[APMapm]*)/
      );
      if (dtMatch) {
        match_date = dtMatch[1];
        match_time = dtMatch[2];
      }

      const age_division = getField("Sport & Level");
      const location = getField("Site");
      const home_team = getField("Home");
      const away_team = getField("Away");

      const referees = [];
      i++;

      // Collect officials until next game or header or footer
      while (i < lines.length) {
        const nextLine = lines[i];

        if (isArbiterFooter(nextLine) || isArbiterTimestamp(nextLine)) {
          break;
        }

        if (isGameHeader(nextLine)) {
          break;
        }

        const nextParts = parseCsvLine(nextLine);

        if (
          nextParts.length === headerCols.length &&
          /^[0-9]+$/.test(nextParts[0])
        ) {
          break;
        }

        // Referee / official rows
        if (nextParts.length > 1 && !/^[0-9]+$/.test(nextParts[0])) {
          const role = nextParts[0] || "";
          const name = nextParts[1] || "";

          if (role && name) {
            let email = "";
            let phone = "";

            for (let c = 2; c < nextParts.length; c++) {
              const cell = nextParts[c] || "";
              if (/@/.test(cell)) email = cell;
              if (/^(C:|H:|W:)/i.test(cell)) {
                phone = cell.replace(/^(C:|H:|W:)\s*/i, "").trim();
              }
            }

            referees.push({ role, name, email, phone });
          }
        }

        i++;
      }

      games.push({
        id: `arbiter-plain-${game_number}`,
        game_number,
        match_date,
        match_time,
        age_division,
        location,
        home_team,
        away_team,
        referees
      });

      continue;
    }

    i++;
  }

  console.log(`[ArbiterPlainText] Parsed ${games.length} games`);
  return games;
}

ScheduleParser.registerParser({
  key: "arbiter-plain-text",
  name: "Arbiter — Plain Text",
  parse: parseArbiterPlainText
});
