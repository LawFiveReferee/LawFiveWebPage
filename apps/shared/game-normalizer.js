//game-normalizer.js

function normalizeParsedGame(raw, parserKey = "") {
  return {
    id: `${parserKey}-${raw.id || raw.game_number || crypto.randomUUID()}`,
    match_date: raw.match_date || raw.date || "",
    match_time: raw.match_time || raw.time || "",
    home_team: raw.home_team || "",
    away_team: raw.away_team || "",
    location: raw.location || "",
    field: raw.field || "",
    referees: raw.referees || [],
    assigner: raw.assigner || null,
    payer: raw.payer || null,
    notes: raw.notes || "",
    selected: true
  };
}

window.normalizeParsedGame = normalizeParsedGame;

export const gameSchema = {
  id: String,
  game_number: String,
  match_date: String,
  match_time: String,
  league: String,
  competition: String,
  age_division: String,
  length_of_halves: String,
  halftime_length: String,
  can_end_in_tie: Boolean,
  extra_time_length: String,
  location: String,
  field: String,
  home_team: String,
  away_team: String,
  home_coach: { name: String, email: String, phone: String },
  away_coach: { name: String, email: String, phone: String },
  assigner: { name: String, email: String, phone: String },
  payer: { name: String, email: String, phone: String },
  referees: [ { role: String, name: String, email: String, phone: String } ],
  notes: String,
  metadata: Object
};

