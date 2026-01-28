console.log("Generic Mapper Parser loaded…");

/* ============================================================
   Detect when first row is actually data, not headers
============================================================ */
function looksLikeData(headers) {
	let numericCount = 0;
	headers.forEach(h => {
		if (/^\d/.test(h)) numericCount += 1;
	});

	return numericCount >= Math.floor(headers.length * 0.6);
}

/* ============================================================
   Main Generic Mapper Parser (index-based mapping)
============================================================ */
function parseGenericMapped(raw) {
	console.log("parseGenericMapped invoked");

	if (!raw || !raw.trim()) return [];

	const delimiter = "\t"; // 🔒 Force tab delimiter
	console.log("✅ Using delimiter: TAB");

	const lines = raw
		.split(/\r?\n/)
		.filter(l => (l || "").trim().length > 0);

	if (lines.length < 1) return [];

	const headers = (lines[0] || "").split(delimiter).map(h => (h ?? "").trim());
	console.log("🧠 Header row parsed:", headers);

	const profileKey = "generic-default-profile";
	const saved = loadMapping(profileKey);

	if (!saved || looksLikeData(headers)) {
		console.warn("❌ No saved mapping found — opening mapping UI.");
		window.openGenericMappingUI(headers, profileKey, raw);
		return [];
	}

	const mappingArr = Array.isArray(saved.mapping) ? saved.mapping : null;
	const mappingObj =
		(!mappingArr && saved && typeof saved === "object") ? saved : null;

	if (!mappingArr && !mappingObj) {
		console.warn("❌ No valid mapping object found.");
		window.openGenericMappingUI(headers, profileKey, raw);
		return [];
	}

	const games = [];
	let skippedRows = 0;

	for (let i = 1; i < lines.length; i++) {
		const row = (lines[i] || "").split(delimiter).map(c => (c ?? "").trim());
		if (!row.length) continue;

		const g = {};

		// Apply mapping (NEW index-based)
		if (mappingArr) {
			for (let colIndex = 0; colIndex < mappingArr.length; colIndex++) {
				const stdField = mappingArr[colIndex];
				if (!stdField) continue;
				g[stdField] = (row[colIndex] || "").trim();
			}
		}

		// Fallback: OLD mapping by header name
		else if (mappingObj) {
			const headerIndex = {};
			headers.forEach((h, idx) => (headerIndex[h] = idx));

			for (const inputCol in mappingObj) {
				if (!Object.prototype.hasOwnProperty.call(mappingObj, inputCol)) continue;
				const stdField = mappingObj[inputCol];
				const colIndex = headerIndex[inputCol];
				g[stdField] = colIndex >= 0 ? (row[colIndex] || "").trim() : "";
			}
		}

		// ✅ Debug output
		console.log(`[Row ${i}] Home: ${g.home_team} | Away: ${g.away_team} | Date: ${g.match_date} | Time: ${g.match_time}`);

		// ✅ Required fields (game_number removed from required list)
		if (!g.home_team || !g.away_team) {
			console.warn(`⚠️ Skipped row ${i}: Missing required fields`);
			skippedRows++;
			continue;
		}

		games.push({
			id: crypto.randomUUID(),

			game_number: g.game_number || "",
			match_date: g.match_date || "",
			match_time: g.match_time || "",
			age_division: g.age_division || "",
			home_team: g.home_team,
			away_team: g.away_team,
			location: g.location || "",
			field: g.field || "",

			home_coach: g.home_coach || "",
			away_coach: g.away_coach || "",

			home_colors: "",
			away_colors: "",

			referee1: g.referee1 || "",
			referee2: g.referee2 || "",
			referee3: g.referee3 || "",

			payer: g.payer || "",
			assigner: g.assigner || "",

			notes: g.notes || "",
			selected: true
		});
	}

	console.log(`✅ Parsed ${games.length} games | Skipped: ${skippedRows}`);

	if (games.length === 0) {
		alert("Your mapping was applied, but none of the rows contained\nrequired fields (Home Team, Away Team).");
	}

	return games;
}

/* ============================================================
   Load mapping profile from localStorage
============================================================ */
function loadMapping(key) {
	try {
		const raw = localStorage.getItem("mapping_" + key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

window.parseGenericMapped = parseGenericMapped;

/* ============================================================
   Load mapping profile from localStorage
============================================================ */

// parse-generic-mapper.js

function parsegenericmapperschedule(rawText) {
  // your parsing logic here
  return parsedGames;
}

ScheduleParser.registerParser({
  key: "generic-mapper",
  name: "Generic Schedule Mapper",
  parse: parsegeneric-mapperschedule
});
