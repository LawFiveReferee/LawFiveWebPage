/* ============================================================
   CSV / SPREADSHEET PARSER
============================================================ */

export function parseCSV(raw) {
	if (!raw.trim()) return [];

	const lines = raw.replace(/\r/g, "").split("\n").filter(l => l.trim());
	const header = lines[0].split(/,|\t/).map(h => h.trim().toLowerCase());

	const games = [];

	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i].split(/,|\t/);

		const get = h => {
			const idx = header.indexOf(h.toLowerCase());
			return idx >= 0 ? (cols[idx] || "").trim() : "";
		};

		const g = {
			id: crypto.randomUUID(),
			game_number: get("game") || get("game_number"),
			match_date: get("date") || "",
			match_time: get("time") || "",
			age_division: get("age") || get("division") || get("age/div"),
			home_team: get("home"),
			away_team: get("away"),
			location: get("location") || "",
			field: get("field") || "",
			referee1: get("ref1") || "",
			referee2: get("ref2") || "",
			referee3: get("ref3") || "",
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

window.parseCSV = parseCSV;

/* ============================================================
   CSV / SPREADSHEET PARSER
============================================================ */

// parse-CSV.js

function parsecsvschedule(rawText) {
  // your parsing logic here
  return parsedGames;
}

ScheduleParser.registerParser({
  key: "csv",
  name: "Google Sheets / CSV",
  parse: parseCSV // or whatever your actual implementation is named
});
