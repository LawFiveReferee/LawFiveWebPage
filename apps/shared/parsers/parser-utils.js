// parser-utils.js
// Shared parsing helpers for schedules

// Normalize a raw game object from any parser
export function normalizeGameObject(raw) {
	return {
		id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
		league: raw.league || "",
		competition: raw.competition || "",
		ageDiv: raw.age_division || raw.ageDiv || "",
		round: raw.round || "",
		tieHandling: raw.tieHandling || raw.tie_handling || "",
		gameDate: raw.match_date || raw.gameDate || "",
		gameTime: raw.match_time || raw.gameTime || "",
		gameDateTime: raw.match_date_time ||
			(raw.match_date && raw.match_time ?
				`${raw.match_date} ${raw.match_time}` :
				raw.gameDateTime || ""),
		gameLocation: raw.location || raw.gameLocation || "",
		gameField: raw.field || raw.gameField || "",
		gameLengthOfHalf: raw.lengthOfHalf || raw.gameLengthOfHalf || "",
		homeTeamRaw: raw.home_team || raw.gameHomeTeam || "",
		awayTeamRaw: raw.away_team || raw.gameAwayTeam || "",
		referee1: raw.referee1 || "",
		referee2: raw.referee2 || "",
		referee3: raw.referee3 || "",
		selected: raw.selected ?? true
	};
}

// Core wrapper for the generic mapper
export function parseGenericSchedule(rawText) {
	let rawList = [];
	try {
		rawList = window.parseGenericMapped(rawText) || [];
	} catch (err) {
		console.error("Generic schedule parse error:", err);
	}
	return rawList.map(normalizeGameObject);
}

// Add other shared parser wrappers here if needed.
// Example:
// export function parseArbiterSchedule(rawText) { ... }
// export function parseCSVSchedule(rawText) { ... }