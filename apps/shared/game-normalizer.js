//game-normalizer.js

function normalizeParsedGame(raw, parserKey = "") {
  return {
    id: `${parserKey || "unknown"}-${raw.game_number || raw.id || Date.now()}`,
    game_number: raw.game_number || "",
    match_date: raw.match_date || "",
    match_time: raw.match_time || "",

    league: raw.league || "",
    competition: raw.competition || "",
    age_division: raw.age_division || "",

    length_of_halves: raw.length_of_halves || "",
    halftime_length: raw.halftime_length || "",
    can_end_in_tie: raw.can_end_in_tie ?? true,
    extra_time_length: raw.extra_time_length || "",

    location: raw.location || "",
    field: raw.field || "",

    home_team: raw.home_team || "",
    away_team: raw.away_team || "",

    home_coach: {
      name: raw.home_coach || "",
      email: raw.home_coach_email || "",
      phone: raw.home_coach_phone || ""
    },
    away_coach: {
      name: raw.away_coach || "",
      email: raw.away_coach_email || "",
      phone: raw.away_coach_phone || ""
    },

    assigner: {
      name: raw.assigner_name || "",
      email: raw.assigner_email || "",
      phone: raw.assigner_phone || ""
    },
    payer: {
      name: raw.payer_name || "",
      email: raw.payer_email || "",
      phone: raw.payer_phone || ""
    },

    referees: raw.referees || [],
    notes: raw.notes || "",
    metadata: raw.metadata || {}
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

