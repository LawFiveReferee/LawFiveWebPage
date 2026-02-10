
export async function createPdf({
  game = null,
  team = null,
  template
}) {
  const templateBytes = await fetch(
    `./templates/${template.pdf}?v=${Date.now()}`
  ).then(r => r.arrayBuffer());

  const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  function setField(name, value) {
    try {
      const field = form.getTextField(name);
      if (field) field.setText(value ?? "");
    } catch {
      // field does not exist in this template — ignore
    }
  }

  /* -------------------------
     Game fields (safe)
  ------------------------- */
  if (game) {
    setField("GameDate", game.match_date);
    setField("GameTime", game.match_time);
    setField("GameLocation", game.location);
    setField("AgeDiv", game.age_division);

    setField("HomeTeam", game.home_team);
    setField("AwayTeam", game.away_team);

    // officials, referees, notes, etc.
    setField("Assigner", game.assigner?.name);
    setField("Payer", game.payer?.name);
  }

  /* -------------------------
     Team / roster fields (safe)
  ------------------------- */
  if (team) {
    setField("TeamName", team.teamName);
    setField("TeamColors", team.teamColors);
    setField("TeamCoach", team.teamCoach);

    const roster =
      game?.lineupOverrides?.[team.teamId] ||
      team.roster ||
      [];

    roster.slice(0, 20).forEach((p, i) => {
      setField(`Player${i + 1}_Name`, p.name);
      setField(`Player${i + 1}_Number`, p.number);
    });
  }

  form.flatten();
  return pdfDoc.save();
}

/*export async function createPdfForLineup(team, game) {
	const tpl = window.TEMPLATE_LIST?.[window.selectedTemplateIndex];
	if (!tpl) throw new Error("No template selected.");

	const templateBytes = await fetch(`./templates/${tpl.pdf}?v=${Date.now()}`)
		.then((r) => r.arrayBuffer());

	const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
	const form = pdfDoc.getForm();

	function setField(name, value) {
		try {
			const field = form.getTextField(name);
			if (field) {
				field.setText(value || "");
				console.log(`✅ Set field "${name}" =`, `"${value}"`);
			} else {
				console.warn(`⚠️ Field "${name}" not found`);
			}
		} catch (err) {
			console.warn(`⚠️ Field "${name}" not found or not writable`);
		}
	}

	// --- Game Info ---
	if (game) {
		setField("GameDate", game.gameDate);
		setField("GameTime", game.gameTime);
		setField("GameLocation", game.gameLocation);
		setField("AgeDiv", game.ageDiv);

		// Determine if team is home or away
		const isHome = team.teamId === game.homeTeamRaw;
		const opponentId = isHome ? game.awayTeamRaw : game.homeTeamRaw;

		setField("HomeX", isHome ? "X" : "");
		setField("VisitorX", isHome ? "" : "X");

		setField("HomeID", isHome ? team.teamId : opponentId);
		setField("VisitorID", isHome ? opponentId : team.teamId);
	}

	// --- Team Info ---
	setField("TeamName", team.teamName);
	setField("TeamColors", team.teamColors);
	setField("TeamCoach", team.teamCoach);
	setField("TeamAsstCoach", team.teamAsstCoach);
	setField("TeamID", team.teamId);
	setField("AgeDiv", team.ageDiv); // backup in case it's not in game

	// --- Roster (up to 15) ---
	const roster = game?.customRoster || team.roster || [];
	for (let i = 0; i < 15; i++) {
		const p = roster[i] || {
			number: "",
			name: ""
		};
		setField(`Player${i + 1}_Name`, p.name);
		setField(`Player${i + 1}_Number`, p.number);
	}

	form.flatten();
	return await pdfDoc.save();
};

export async function createPdfForGameCard(game) {
  const team = window.TeamStore?.getCurrentTeam?.();

  if (!team) {
    throw new Error("No team selected for game PDF.");
  }

  // Reuse lineup engine for now
  return createPdfForLineup(team, game);
}
*/
