
function parseArbiterGameDetails(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trimEnd())
    .filter(l => l.length > 0);

  // ---------- 1. FIND GAME TABLE ----------
  const headerIdx = lines.findIndex(l =>
    l.startsWith("Game\t") &&
    l.includes("Date & Time") &&
    l.includes("Home") &&
    l.includes("Away")
  );

  if (headerIdx === -1 || !lines[headerIdx + 1]) {
    console.warn("Arbiter parser: Game table not found");
    return [];
  }

  const headerCols = lines[headerIdx].split("\t");
  const dataCols = lines[headerIdx + 1].split("\t");

  const col = (name) => headerCols.indexOf(name);

  const game_number = dataCols[col("Game")] || "";
  const dateTimeRaw = dataCols[col("Date & Time")] || "";
  const age_division = dataCols[col("Sport & Level")] || "";
  const location = dataCols[col("Site")] || "";
  const home_team = dataCols[col("Home")] || "";
  const away_team = dataCols[col("Away")] || "";

  // Parse date + time
  let match_date = "";
  let match_time = "";
  const m = dateTimeRaw.match(/(\d{1,2}\/\d{1,2}\/\d{4}).*?(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (m) {
    match_date = m[1];
    match_time = m[2];
  }
// —————————————
// Extract Officials (name + email + phone)
// —————————————
let referee1 = "", referee2 = "", referee3 = "";
let referee1_email = "", referee2_email = "", referee3_email = "";
let referee1_phone = "", referee2_phone = "", referee3_phone = "";

// Find the index of the "Official" header row
const officialHeaderIdx = lines.findIndex(l =>
  l.toLowerCase().startsWith("official\t")
);

if (officialHeaderIdx !== -1) {
  // Iterate over each row after the header until we hit a next section
  let officialCount = 0;
  for (let i = officialHeaderIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");

    // Stop when we hit assigner/payer blocks
    if (/Your slot was assigned by/i.test(cols.join(" "))) break;

    // Must have a name in first column
    const name = (cols[0] || "").trim();
    if (!name) continue;

    // Email is column 4, phone is column 5
    const email = (cols[4] || "").trim();
    const phone = (cols[5] || "").trim();

    if (officialCount === 0) {
      referee1 = name;
      referee1_email = email;
      referee1_phone = phone;
    } else if (officialCount === 1) {
      referee2 = name;
      referee2_email = email;
      referee2_phone = phone;
    } else if (officialCount === 2) {
      referee3 = name;
      referee3_email = email;
      referee3_phone = phone;
    }
    officialCount++;
  }
}
  // ---------- 3. ASSIGNER ----------
  const assigner = { name: "", email: "", phone: "" };
  const assignerIdx = lines.findIndex(l => l.startsWith("Your slot was assigned by"));
  if (assignerIdx !== -1 && lines[assignerIdx + 2]) {
    const cols = lines[assignerIdx + 2].split("\t");
    assigner.name = cols[0] || "";
    assigner.email = cols[2] || "";
    assigner.phone = cols[3] || "";
  }

  // ---------- 4. PAYER ----------
  const payer = { name: "", email: "", phone: "" };
  const payerIdx = lines.findIndex(l => l.startsWith("Your game is paid by"));
  if (payerIdx !== -1 && lines[payerIdx + 2]) {
    const cols = lines[payerIdx + 2].split("\t");
    payer.name = cols[0] || "";
    payer.email = cols[1] || "";
    payer.phone = cols[2] || "";
  }

return [{
  id: `arbiter-${game_number}`,
  game_number,
  match_date,
  match_time,
  age_division,
  location,
  home_team,
  away_team,

  referee1,
  referee1_email,
  referee1_phone,

  referee2,
  referee2_email,
  referee2_phone,

  referee3,
  referee3_email,
  referee3_phone,

  assigner,
  payer,
  notes: ""
}];
}

ScheduleParser.registerParser({
  key: "arbiter-game-details",
  name: "Arbiter – Game Details",
  parse: parseArbiterGameDetails
});
