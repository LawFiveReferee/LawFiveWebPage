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
function parsegenericmapperschedule(rawText) {
  return parseGenericMapped(rawText);
}

ScheduleParser.registerParser({
  key: "generic-mapper",
  name: "Generic Schedule Mapper",
  parse: parsegenericmapperschedule
});

// 👇 Register again under key "generic" as a fallback alias
ScheduleParser.registerParser({
  key: "generic",
  name: "Generic Schedule Mapper",
  parse: parsegenericmapperschedule
});
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
