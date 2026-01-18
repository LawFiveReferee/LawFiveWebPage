/* ============================================================
   TEXT ADVANCED PARSER (12-line blocks)
   - Supports:
     • Strict 12-line chunks with NO blank lines (your Arbiter-style data)
     • 12-line blocks separated by blank lines (older Card Factory format)
============================================================ */

function makeGameFromBlock(blockLines) {
	// Ensure at least 12 entries; pad with "" if shorter
	const b = blockLines.slice(0, 12);
	while (b.length < 12) b.push("");

	return {
		id: crypto.randomUUID(),

		// 12-line schema:
		//  0: Game #
		//  1: Age/Division
		//  2: Round
		//  3: Home
		//  4: Away
		//  5: Date
		//  6: Time
		//  7: Location
		//  8: Field
		//  9: Ref 1
		// 10: Ref 2
		// 11: Ref 3

		game_number: b[0] || "",
		age_division: b[1] || "",
		round: b[2] || "",
		home_team: b[3] || "",
		away_team: b[4] || "",
		match_date: b[5] || "",
		match_time: b[6] || "",
		location: b[7] || "",
		field: b[8] || "",
		referee1: b[9] || "",
		referee2: b[10] || "",
		referee3: b[11] || "",

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
}

export function parseTextAdvanced(raw) {
	if (!raw || !raw.trim()) return [];

	// First, normalize & strip empty lines
	const allLines = raw
		.replace(/\r/g, "")
		.split("\n")
		.map(l => l.trim())
		.filter(l => l !== "");

	const games = [];

	// ------------------------------------------------------------
	// MODE A: strict 12-line blocks, no blank lines between games
	// ------------------------------------------------------------
	if (allLines.length >= 12 && allLines.length % 12 === 0) {
		for (let i = 0; i < allLines.length; i += 12) {
			const blockLines = allLines.slice(i, i + 12);
			games.push(makeGameFromBlock(blockLines));
		}
		return games;
	}

	// ------------------------------------------------------------
	// MODE B: blocks separated by blank lines
	// (fallback for older formats)
	// ------------------------------------------------------------
	const rawLines = raw.replace(/\r/g, "").split("\n");
	let buf = [];

	for (const line of rawLines) {
		const t = line.trim();
		if (t === "") {
			if (buf.length >= 10) {
				games.push(makeGameFromBlock(buf));
			}
			buf = [];
		} else {
			buf.push(t);
		}
	}
	if (buf.length >= 10) {
		games.push(makeGameFromBlock(buf));
	}

	return games;
}

// Expose globally for parser registry
window.parseTextAdvanced = parseTextAdvanced;