/* ============================================================
   AYSO REGION SCHEDULE PARSER
============================================================ */

export function parseAYSO(raw) {
	if (!raw.trim()) return [];

	const lines = raw.replace(/\r/g, "").split("\n").filter(l => l.trim());

	const games = [];

	for (const line of lines) {
		const cols = line.split(/,|\t/).map(x => x.trim());

		const g = {
			id: crypto.randomUUID(),
			game_number: cols[0] || "",
			age_division: cols[1] || "",
			home_team: cols[2] || "",
			away_team: cols[3] || "",
			match_date: cols[4] || "",
			match_time: cols[5] || "",
			location: cols[6] || "",
			field: cols[7] || "",
			referee1: "",
			referee2: "",
			referee3: "",
			assigner: {
				name: "",
				phone: "",
				email: ""
			},
			payer: {
				name: "",
				phone: "",
				email: ""
			},
			notes: "",
			selected: true
		};

		games.push(g);
	}

	return games;
}

window.parseAYSO = parseAYSO;