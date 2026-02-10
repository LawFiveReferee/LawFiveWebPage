/* ============================================================
   ARBITER GAME DETAILS PARSER — FIXED & ENHANCED
   - Correct date/time parsing
   - Proper referee crew extraction (name + email + phone)
   - SR-Referee → referee1
   - JR-Referee → referee2
   - Supports payer + assigner blocks
============================================================ */

export function parseArbiter(raw) {
  if (!raw.trim()) return [];

  raw = raw.replace(/\r/g, "");
  const blocks = raw.split(/Game\s+Details/).slice(1);

  const games = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim());

    if (!lines.length) continue;

    // ============================================================
    // Top game summary row
    // ============================================================
    const topIdx = lines.findIndex(l => /^Game\s+/i.test(l));
    if (topIdx < 0 || !lines[topIdx + 1]) continue;

    const cols = lines[topIdx + 1].split(/\t+/);

    const gameNumber = cols[0] || "";
    const dateTimeRaw = cols[1] || "";
    const sportLevel = cols[2] || "";
    const site = cols[3] || "";
    const home = cols[4] || "";
    const away = cols[5] || "";

    // ============================================================
    // Date / Time Parsing Fix
    // Arbiter uses: 12/5/2025 Fri 2:30 PM
    // ============================================================
    let match_date = "";
    let match_time = "";

    if (dateTimeRaw) {
      const firstSpace = dateTimeRaw.indexOf(" ");
      if (firstSpace > -1) {
        match_date = dateTimeRaw.slice(0, firstSpace).trim();
        const rest = dateTimeRaw.slice(firstSpace).trim();

        const timeMatch = rest.match(/\d{1,2}:\d{2}\s*(AM|PM)/i);
        if (timeMatch) match_time = timeMatch[0];
      }
    }

    // ============================================================
    // Initialize game object
    // ============================================================
    const g = {
      id: crypto.randomUUID(),

      game_number: gameNumber,
      match_date,
      match_time,
      age_division: sportLevel || "",
      location: site.replace(/,.*$/, ""),
      field: "",

      home_team: home,
      away_team: away,

      referee1: "",
      referee2: "",
      referee3: "",

      assigner: { name:"", phone:"", email:"" },
      payer:    { name:"", phone:"", email:"" },

      notes: "",
      selected: true
    };

    // ============================================================
    // Referee Crew Extraction FIX
    // Official rows look like:
    // Name | Accepted | SR-Referee | Distance | Email | Phone
    // ============================================================
    const offStart = lines.findIndex(l => /^Official/i.test(l));
    if (offStart >= 0) {
      for (let i = offStart + 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (!row || !/\t/.test(row)) break;

        const parts = row.split(/\t/).map(x => x.trim());
        if (parts.length < 4) break;

        const name  = parts[0] || "";
        const role  = parts[2] || "";
        const email = parts[4] || "";
        const phone = parts[5] || "";

        let combined = name;
        if (email) combined += ` — ${email}`;
        if (phone) combined += ` — ${phone}`;

        if (/SR-Ref/i.test(role)) g.referee1 = combined;
        else if (/JR-Ref/i.test(role)) g.referee2 = combined;
        else g.referee3 = combined;
      }
    }

    // ============================================================
    // Assigner Block
    // ============================================================
    const assIdx = lines.findIndex(l => /slot was assigned/i.test(l));
    if (assIdx >= 0 && lines[assIdx + 2]) {
      const row = lines[assIdx + 2].split(/\t/);
      g.assigner = {
        name:  row[0] || "",
        email: row[2] || "",
        phone: row[3] || ""
      };
    }

    // ============================================================
    // Payer Block
    // ============================================================
    const payIdx = lines.findIndex(l => /game is paid/i.test(l));
    if (payIdx >= 0 && lines[payIdx + 2]) {
      const row = lines[payIdx + 2].split(/\t/);
      g.payer = {
        name:  row[0] || "",
        email: row[1] || "",
        phone: row[2] || ""
      };
    }

    games.push(g);
  }

  return games;
}

window.parseArbiter = parseArbiter;
