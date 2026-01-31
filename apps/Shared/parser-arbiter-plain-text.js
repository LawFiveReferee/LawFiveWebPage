import ScheduleParser from "./schedule-parser.js";

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

function parseArbiterPlainText(rawText) {
  if (typeof rawText !== "string") return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const games = [];
  let headerCols = null;

  const isGameHeader = (line) => {
    return (
      line.startsWith("Game,") &&
      line.includes("Date & Time") &&
      line.includes("Home") &&
      line.includes("Away")
    );
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect the game header
    if (isGameHeader(line)) {
      headerCols = parseCsvLine(line);
      i++;
      continue;
    }

    if (!headerCols) {
      i++;
      continue;
    }

    // Parse the current line with CSV splitter
    const parts = parseCsvLine(line);

    // If this row has the same column count *and* numeric first column → game row
    if (
      parts.length === headerCols.length &&
      /^[0-9]+$/.test(parts[0])
    ) {
      const getField = (name) => {
        const idx = headerCols.indexOf(name);
        return idx >= 0 && idx < parts.length ? parts[idx] : "";
      };

      const game_number = getField("Game");
      const dateTime = getField("Date & Time");
      let match_date = "", match_time = "";
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

      // Collect officials until next real game row or new header
      while (i < lines.length) {
        const nextLine = lines[i];

        // If next line is a game header again, break
        if (isGameHeader(nextLine)) {
          break;
        }

        const nextParts = parseCsvLine(nextLine);

        // If a numeric first column with full length found again, break
        if (
          nextParts.length === headerCols.length &&
          /^[0-9]+$/.test(nextParts[0])
        ) {
          break;
        }

        // If the first column is NOT numeric, treat as referees/officers
        if (nextParts.length > 1 && !/^[0-9]+$/.test(nextParts[0])) {
          const role = nextParts[0] || "";
          const name = nextParts[1] || "";
          if (role && name) {
            let email = "";
            let phone = "";
            for (let c = 2; c < nextParts.length; c++) {
              const cell = nextParts[c] || "";
              if (/@/.test(cell)) {
                email = cell;
              }
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

      continue; // re‑loop without i++
    }

    i++;
  }

  return games;
}

ScheduleParser.registerParser({
  key: "arbiter-plain-text",
  name: "Arbiter — Plain Text Schedule",
  parse: parseArbiterPlainText
});
