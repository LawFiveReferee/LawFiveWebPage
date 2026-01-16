/* ============================================================
   ARBITER EMAIL PARSER (MULTI-EMAIL VERSION)
   Supports multiple pasted emails back-to-back
   Uses greeting-line referee as Referee 1
============================================================ */

function parseArbiterEmail(raw) {
  if (!raw || !raw.trim()) return [];

  const text = raw.replace(/\r/g, "");
  const blocks = splitEmailBlocks(text);

  const games = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    if (!lines.length) continue;

    /* ---------------------------------------------------------
       1. Referee from greeting line
          Format: "Ed Stockly, you have a game..."
    --------------------------------------------------------- */
    let recipientRef = "";
    const m0 = lines[0].match(/^([^,]+),/);
    if (m0) recipientRef = m0[1].trim();

    // Helper to normalize ref info
    const refToText = (name, email, phone) =>
      [name, email, phone].filter(Boolean).join(" — ");

    /* ---------------------------------------------------------
       2. Simple label extractor
    --------------------------------------------------------- */
    const findValue = (label) => {
      const re = new RegExp("^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*(.+)$", "i");
      for (const l of lines) {
        const m = l.match(re);
        if (m) return m[1].trim();
      }
      return "";
    };

    const gameNumber = findValue("Game Number");
    const dateTime   = findValue("Date & Time");
    const sportLevel = findValue("Sport & Level");
    const site       = findValue("Site");
    const home       = findValue("Home");
    const away       = findValue("Away");

    /* ---------------------------------------------------------
       3. Officials section
    --------------------------------------------------------- */
    const officialsStart = lines.findIndex(l => /^Officials$/i.test(l));
    const listedRefs = [];

    if (officialsStart >= 0) {
      for (let i = officialsStart + 1; i < lines.length; i++) {
        const l = lines[i];
        if (!l || /^Contacts$/i.test(l)) break;

        // Format: "Name   email   phone"
        const parts = l.split(/\s+/);
        if (!parts.length) continue;

        const rawName = parts.slice(0, 2).join(" ");
        const email   = parts.find(p => p.includes("@")) || "";
        const phone   = parts.find(p => /^\d{3}/.test(p)) || "";

        listedRefs.push({ name: rawName.trim(), email, phone });
      }
    }

    /* ---------------------------------------------------------
       4. Contacts section → payer
    --------------------------------------------------------- */
    const contactsStart = lines.findIndex(l => /^Contacts$/i.test(l));

    let payerName = "";
    let payerEmail = "";
    let payerPhone = "";

    if (contactsStart >= 0) {
      for (let i = contactsStart + 1; i < lines.length; i++) {
        const l = lines[i];
        if (!l) break;

        const parts = l.split(/\s+/);
        const name = parts.slice(0, 2).join(" ").trim();
        const email = parts.find(p => p.includes("@")) || "";
        const phone = parts.find(p => /^\d{3}/.test(p)) || "";

        if (email && !payerEmail) {
          payerName = name;
          payerEmail = email;
          payerPhone = phone;
        }
      }
    }

    /* ---------------------------------------------------------
       5. Date + Time split
    --------------------------------------------------------- */
    let match_date = "";
    let match_time = "";

    if (dateTime) {
      const mm = dateTime.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.*)$/);
      if (mm) {
        match_date = mm[1];
        match_time = mm[2];
      }
    }

    /* ---------------------------------------------------------
       6. Assign referees using your rule:
          Ref 1 → greeting line referee
          Ref 3 → first listed official
          Ref 2 → second listed official (rare)
    --------------------------------------------------------- */
    let referee1 = recipientRef ? refToText(recipientRef, "", "") : "";
    let referee2 = "";
    let referee3 = "";

    if (listedRefs.length >= 1) {
      referee3 = refToText(listedRefs[0].name, listedRefs[0].email, listedRefs[0].phone);
    }
    if (listedRefs.length >= 2) {
      referee2 = refToText(listedRefs[1].name, listedRefs[1].email, listedRefs[1].phone);
    }

    /* ---------------------------------------------------------
       7. Build final standardized object
    --------------------------------------------------------- */
    games.push({
      id: crypto.randomUUID(),

      game_number: gameNumber || "",
      match_date,
      match_time,
      age_division: sportLevel || "",
      home_team: home || "",
      away_team: away || "",
      location: site || "",
      field: "",

      referee1,
      referee2,
      referee3,

      assigner: { name:"", phone:"", email:"" },

      payer: {
        name: payerName,
        phone: payerPhone,
        email: payerEmail
      },

      notes: "",
      selected: true
    });
  }

  return games;
}

/* ============================================================
   SPLIT INTO MULTIPLE EMAIL BLOCKS
   (each begins with a greeting: "Name, you have a game...")
============================================================ */
function splitEmailBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let current = [];

  const isHeader = (l) => /^[^,]+,\s+you have a game/i.test(l.trim());

  for (const l of lines) {
    if (isHeader(l)) {
      if (current.length) blocks.push(current.join("\n"));
      current = [l];
    } else {
      current.push(l);
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  return blocks;
}

window.parseArbiterEmail = parseArbiterEmail;
