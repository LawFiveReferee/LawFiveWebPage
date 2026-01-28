/* ============================================================
   PARSER STANDARDIZATION MODULE — SAFE FOR OBFUSCATION
   No export/import keywords anywhere.
============================================================ */

function normalizeGame(raw) {
	if (!raw || typeof raw !== "object") raw = {};

	const str = v => (v == null ? "" : String(v).trim());

	const normalizePerson = (p) => {
		if (!p || typeof p !== "object") {
			return {
				name: "",
				phone: "",
				email: ""
			};
		}
		return {
			name: str(p.name),
			phone: str(p.phone),
			email: str(p.email)
		};
	};

	const normalizeRefs = (raw) => {
		let r1 = str(raw.referee1 || raw.ref1);
		let r2 = str(raw.referee2 || raw.ref2 || raw.jr_ref);
		let r3 = str(raw.referee3 || raw.ref3);

		if (Array.isArray(raw.refs)) {
			if (raw.refs[0]) r1 = raw.refs[0];
			if (raw.refs[1]) r2 = raw.refs[1];
			if (raw.refs[2]) r3 = raw.refs[2];
		}

		return {
			r1,
			r2,
			r3
		};
	};

	const refs = normalizeRefs(raw);

	return {
		id: raw.id || crypto.randomUUID(),

		game_number: str(raw.game_number),

		match_date: str(raw.match_date),
		match_time: str(raw.match_time),

		age_division: str(raw.age_division),
		home_team: str(raw.home_team),
		away_team: str(raw.away_team),

		location: str(raw.location),
		field: str(raw.field),

		home_colors: str(raw.home_colors),
		away_colors: str(raw.away_colors),

		referee1: refs.r1,
		referee2: refs.r2,
		referee3: refs.r3,

		assigner: normalizePerson(raw.assigner),
		payer: normalizePerson(raw.payer),

		notes: str(raw.notes),

		selected: raw.selected ?? true
	};
}

function normalizeGameList(list) {
	if (!Array.isArray(list)) return [];
	return list.map(normalizeGame);
}

/* === Make available to all parsers and app.js === */
window.normalizeGame = normalizeGame;
window.normalizeGameList = normalizeGameList;