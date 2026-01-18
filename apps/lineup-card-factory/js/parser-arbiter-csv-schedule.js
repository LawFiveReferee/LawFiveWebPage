/* ============================================================
   Arbiter CSV Schedule Parser
   Key: "arbiter-csv-schedule"
   Format: Multi-row ArbiterSports CSV schedule report
============================================================ */

function splitCsvLine(line) {
	const out = [];
	let cur = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// escaped quote
				cur += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === "," && !inQuotes) {
			out.push(cur);
			cur = "";
		} else {
			cur += ch;
		}
	}
	out.push(cur);
	return out.map(s => s.trim());
}

function extractHeaderAssignerAndUser(lines) {
	let assignerName = "";
	let assignerPhone = "";
	let assignerEmail = "";

	let userName = "";
	let userPhone = "";

	// Look only in the top portion (before the first Game header)
	const headerLimit = lines.findIndex(l =>
		l.startsWith("Game,Date & Time")
	);
	const endIdx = headerLimit === -1 ? Math.min(lines.length, 40) : headerLimit;

	const headerSlice = lines.slice(0, endIdx);

	// Assigner name = first non-empty line (e.g., "Tony Vasquez")
	for (const l of headerSlice) {
		if (l.trim()) {
			assignerName = l.trim();
			break;
		}
	}

	// Assigner email = last email-like token in header slice
	const headerText = headerSlice.join(" ");
	const emailMatches = headerText.match(
		/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
	);
	if (emailMatches && emailMatches.length) {
		assignerEmail = emailMatches[emailMatches.length - 1].trim();
	}

	// Assigner phone = first phone-like number in header slice
	const phoneMatch = headerText.match(/(\d{3}[-\s]\d{3}[-\s]\d{4})/);
	if (phoneMatch) {
		assignerPhone = phoneMatch[1];
	}

	// User line: something like "Ed Stockly,C: 818-929-9335"
	for (const l of headerSlice) {
		const m = l.match(/^([^,]+),\s*(.*)$/);
		if (m && /(C:|H:)/.test(m[2])) {
			userName = m[1].trim();
			const tail = m[2];

			const cMatch = tail.match(/C:\s*([\d-]+)/);
			const hMatch = tail.match(/H:\s*([\d-]+)/);

			if (cMatch) userPhone = cMatch[1];
			else if (hMatch) userPhone = hMatch[1];

			break;
		}
	}

	return {
		assigner: {
			name: assignerName,
			phone: assignerPhone,
			email: assignerEmail
		},
		userRef: {
			name: userName,
			phone: userPhone
		}
	};
}

function extractOfficialPhone(fields) {
	// fields: [role, name, distance, ..., maybe "C: 123-456-7890", "H: ..."]
	const tail = fields.slice(2).join(" ");
	const cMatch = tail.match(/C:\s*([\d-]+)/);
	if (cMatch) return cMatch[1];

	const hMatch = tail.match(/H:\s*([\d-]+)/);
	if (hMatch) return hMatch[1];

	return "";
}

function formatOfficial(fields, userRef) {
	if (!fields || fields.length < 2) return "";
	const name = (fields[1] || "").trim();
	if (!name) return "";

	let phone = extractOfficialPhone(fields);

	// If this is the user, prefer the phone from the header
	if (userRef && userRef.name && userRef.phone && name === userRef.name) {
		phone = userRef.phone;
	}

	return phone ? `${name} — ${phone}` : name;
}

function parseArbiterCsvSchedule(raw) {
	if (!raw || !raw.trim()) return [];

	// Normalize line endings
	const lines = raw
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.split("\n")
		.map(l => l.trim())
		.filter(l => l.length > 0);

	if (!lines.length) return [];

	const {
		assigner,
		userRef
	} = extractHeaderAssignerAndUser(lines);
	const games = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		// Start of a "Game,Date & Time,..." section
		if (line.startsWith("Game,Date & Time")) {
			i++;
			while (i < lines.length) {
				const row = lines[i];

				if (!row) {
					i++;
					continue;
				}

				// New section header or footer / total — stop this section
				if (row.startsWith("Game,Date & Time")) break;
				if (/^"?.*Created by ArbiterSports\.com/.test(row)) {
					i++;
					continue;
				}
				if (row.startsWith("Total:")) break;

				const cols = splitCsvLine(row);

				// If first col is not a (possibly negative) integer, this isn't a game row
				if (!cols.length || !/^-?\d+$/.test(cols[0])) {
					i++;
					continue;
				}

				// ----- Game core row -----
				const rawGameNumber = cols[0];
				const game_number = rawGameNumber.replace(/^-/, ""); // strip leading '-'

				const dateTimeStr = cols[1] || "";
				const sportLevel = cols[2] || "";
				const site = cols[3] || "";
				const home = cols[4] || "";
				const away = cols[5] || "";

				let match_date = "";
				let match_time = "";

				const dtMatch = dateTimeStr.match(
					/(\d{1,2}\/\d{1,2}\/\d{4})\s*\([^)]*\)\s*(.+)$/
				);
				if (dtMatch) {
					match_date = dtMatch[1].trim();
					match_time = dtMatch[2].trim();
				}

				// Location / field split
				let location = "";
				let field = "";
				if (site) {
					const s = site.replace(/^"|"$/g, "");
					const parts = s.split(",");
					location = (parts[0] || "").trim();
					if (parts.length > 1) {
						field = parts
							.slice(1)
							.join(",")
							.trim();
					}
				}

				// ----- Officials + notes / cancellations -----
				const officials = [];
				const notes = [];
				let canceled = false;

				let j = i + 1;
				while (j < lines.length) {
					const l = lines[j];

					if (!l) {
						j++;
						continue;
					}

					if (l.startsWith("Game,Date & Time")) break;
					if (/^"?.*Created by ArbiterSports\.com/.test(l)) {
						j++;
						continue;
					}
					if (l.startsWith("Total:")) break;

					if (l.startsWith("*** This game has been CANCELED")) {
						canceled = true;
						j++;
						break;
					}

					if (l.startsWith("[")) {
						// score / comment line, keep as note
						notes.push(l);
						j++;
						continue;
					}

					const maybeGameCols = splitCsvLine(l);
					if (
						maybeGameCols.length &&
						/^-?\d+$/.test(maybeGameCols[0])
					) {
						// Start of next game
						break;
					}

					// Officials lines: SR-Referee, JR-Referee, Referee, AR 1, AR 2
					const role = (maybeGameCols[0] || "").trim();
					if (
						role === "SR-Referee" ||
						role === "JR-Referee" ||
						role === "Referee" ||
						role === "AR 1" ||
						role === "AR 2"
					) {
						officials.push(maybeGameCols);
					}

					j++;
				}

				// Advance outer index to last line processed for this game
				i = j;

				// Skip canceled games entirely (per user instruction A)
				if (canceled) {
					continue;
				}

				// ----- Map officials to referee1 / referee2 / referee3 -----
				let referee1 = "";
				let referee2 = "";
				let referee3 = "";

				const roles = officials.map(r => (r[0] || "").trim());
				const hasReferee = roles.includes("Referee");
				const hasSr = roles.includes("SR-Referee");
				const hasJr = roles.includes("JR-Referee");
				const hasAr1 = roles.includes("AR 1");
				const hasAr2 = roles.includes("AR 2");

				function findByRole(roleName) {
					return officials.find(r => (r[0] || "").trim() === roleName) || null;
				}

				if (hasReferee && (hasAr1 || hasAr2)) {
					// Classic 3-ref crew: Referee, AR 1, AR 2
					const refRow = findByRole("Referee");
					const ar1Row = findByRole("AR 1");
					const ar2Row = findByRole("AR 2");

					if (refRow) referee1 = formatOfficial(refRow, userRef);
					if (ar1Row) referee2 = formatOfficial(ar1Row, userRef);
					if (ar2Row) referee3 = formatOfficial(ar2Row, userRef);
				} else if (hasSr && hasJr && !hasReferee && !hasAr1 && !hasAr2) {
					// 2-ref crew: SR-Referee (center) + JR-Referee
					const srRow = findByRole("SR-Referee");
					const jrRow = findByRole("JR-Referee");

					if (srRow) referee1 = formatOfficial(srRow, userRef);
					// Leave referee2 empty, put JR in referee3 (works with your label logic)
					if (jrRow) referee3 = formatOfficial(jrRow, userRef);
				} else {
					// Fallback: fill in order of appearance
					for (const rowOff of officials) {
						const formatted = formatOfficial(rowOff, userRef);
						if (!formatted) continue;
						if (!referee1) {
							referee1 = formatted;
						} else if (!referee2) {
							referee2 = formatted;
						} else if (!referee3) {
							referee3 = formatted;
						}
					}
				}

				// ----- Build game object -----
				const game = {
					game_number,
					age_division: sportLevel || "",
					home_team: home || "",
					away_team: away || "",
					match_date,
					match_time,
					location,
					field,
					home_colors: "",
					away_colors: "",
					referee1,
					referee2,
					referee3,
					assigner: {
						name: assigner.name || "",
						phone: assigner.phone || "",
						email: assigner.email || ""
					},
					payer: {
						name: "",
						phone: "",
						email: ""
					},
					notes: notes.join(" | "),
					selected: true
				};

				// Add a unique id for this parser
				if (typeof crypto !== "undefined" && crypto.randomUUID) {
					game.id = crypto.randomUUID();
				} else {
					game.id =
						"acsv-" +
						Math.random().toString(36).slice(2) +
						Date.now().toString(36);
				}

				games.push(game);
			}
		} else {
			i++;
		}
	}

	return games;
}

// Export + bind to window for the unified parser registry
export {
	parseArbiterCsvSchedule
};
window.parseArbiterCsvSchedule = parseArbiterCsvSchedule;