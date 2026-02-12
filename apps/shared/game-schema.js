// apps/shared/game-schema.js

// Fields that MAY come from referee schedules
// Mapping UI is STRICTLY limited to this list

export const PARSED_GAME_SCHEMA = [
  // --- Core match info ---
  { key: "match_date", label: "Match Date", required: true },
  { key: "match_time", label: "Match Time", required: true },

  { key: "home_team", label: "Home Team", required: true },
  { key: "away_team", label: "Away Team", required: true },

  { key: "age_division", label: "Age / Division" },
  { key: "league", label: "League" },
  { key: "competition", label: "Competition" },

  { key: "location", label: "Location" },
  { key: "field", label: "Field" },

  // --- Officials ---
  { key: "referee_1_name", label: "Referee – Center" },
  { key: "referee_1_email", label: "Referee – Center Email" },
  { key: "referee_1_phone", label: "Referee – Center Phone" },

  { key: "referee_2_name", label: "Referee – AR1" },
  { key: "referee_2_email", label: "Referee – AR1 Email" },
  { key: "referee_2_phone", label: "Referee – AR1 Phone" },

  { key: "referee_3_name", label: "Referee – AR2" },
  { key: "referee_3_email", label: "Referee – AR2 Email" },
  { key: "referee_3_phone", label: "Referee – AR2 Phone" },

  // --- Assignment ---
  { key: "assigner_name", label: "Assigner Name" },
  { key: "assigner_email", label: "Assigner Email" },
  { key: "assigner_phone", label: "Assigner Phone" },

  { key: "payer_name", label: "Payer Name" },
  { key: "payer_email", label: "Payer Email" },
  { key: "payer_phone", label: "Payer Phone" },

  // --- Misc ---
  { key: "notes", label: "Notes" }
];

export const GAME_SCHEMA = {
  id: "",
  game_number: "",

  match_date: "",
  match_time: "",
  age_division: "",
  league: "",
  competition: "",
  location: "",
  field: "",

  home_team: "",
  away_team: "",

  referees: [
    { role: "Referee", name: "", email: "", phone: "" },
    { role: "AR1", name: "", email: "", phone: "" },
    { role: "AR2", name: "", email: "", phone: "" }
  ],

  assigner: { name: "", email: "", phone: "" },
  payer: { name: "", email: "", phone: "" },

  // Lineup-only (user supplied)
  lineupOverrides: {},

  notes: "",
  selected: true
};
