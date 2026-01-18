/* ============================================================
   PARSER — Glendale / AYSO Columnar Schedule Tables

   Expected repeating header block (12 lines):

   Game #
   Div.
   Round
   Home Team
   Away Team
   Date
   Start Time
   Location
   Field
   Referee 1
   Referee 2
   Referee 3

   Each game after that is ALSO 12 lines in the SAME order.
============================================================ */

function parseGlendaleTable(raw) {
	if (!raw || !raw.trim()) return [];

	const text = raw.replace(/\r/g, "");
	let lines = text.split("\n").map(l => l.trim());

	// Drop empty lines
	lines = lines.filter(l => l.length > 0);

	const games = [];
	const HEADER_FIRST = /^Game\s*#$/i;
	const BLOCK_SIZE = 12;

	console.log("[Glendale] total non-empty lines:", lines.length);

	for (let i = 0; i < lines.length;) {
		const line = lines[i];

		// --- Skip header block: "Game #" + 11 more label lines ---
		if (HEADER_FIRST.test(line) && i + (BLOCK_SIZE - 1) < lines.length) {
			// Optional sanity check: next few lines look like "Div.", "Round", etc.
			// but we don't strictly require it — we just skip the 12-line header.
			i += BLOCK_SIZE;
			continue;
		}

		// Not enough lines left for a full game block: stop.
		if (i + (BLOCK_SIZE - 1) >= lines.length) {
			break;
		}

		// Take 12 lines as a game block
		const block = lines.slice(i, i + BLOCK_SIZE);
		const game = buildGameFromGlendaleBlock(block);

		if (game) {
			games.push(game);
		} else {
			console.warn("[Glendale] Skipped malformed block at index", i, block);
		}

		i += BLOCK_SIZE;
	}

	console.log("[Glendale] Parsed games:", games.length);
	return games;
}

/* ============================================================
   Build one game from a 12-line block
============================================================ */

function buildGameFromGlendaleBlock(block) {
	if (!block || block.length < 12) return null;

	const [
		game_number,
		age_division,
		round,
		home_team,
		away_team,
		match_date,
		match_time,
		location,
		field,
		ref1,
		ref2,
		ref3
	] = block.map(cleanGlendaleField);

	// Use global makeGameId if available (matches rest of app),
	// otherwise fall back to a local random id.
	let id = "";
	try {
		if (typeof window !== "undefined" && typeof window.makeGameId === "function") {
			id = window.makeGameId();
		} else if (crypto && crypto.randomUUID) {
			id = crypto.randomUUID();
		} else {
			id = "g-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
		}
	} catch (e) {
		id = "g-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
	}

	return {
		id,

		game_number,
		age_division,
		round,

		home_team,
		away_team,

		match_date, // raw "12/6/2025"
		match_time, // raw "8:00am"

		location,
		field,

		referee1: ref1,
		referee2: ref2,
		referee3: ref3,

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

		home_colors: "",
		away_colors: "",

		notes: "",
		selected: true
	};
}

/* ============================================================
   Cleaning utility
============================================================ */

function cleanGlendaleField(s) {
	if (!s) return "";
	return s
		.replace(/\s+/g, " ") // collapse multiple spaces
		.replace(/^"|"$/g, "") // strip leading/trailing quotes
		.trim();
}

// Expose to global so app.js can find it via parser-list.json
window.parseGlendaleTable = parseGlendaleTable;