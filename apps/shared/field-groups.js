// shared/field-groups.js

export const COMPETITION_FIELDS = [
  "league",
  "competition",
  "season",
  "age_division",
  "gender"
];

export const MATCH_CONTEXT_FIELDS = [
  "teamSize",
  "halfLength",
  "kickoff",
  "touchlines"
];

export const GAME_CORE_FIELDS = [
  "game_number",
  "match_date",
  "match_time",
  "location",
  "field"
];

export const LINEUP_SPECIFIC_FIELDS = [
  "notes",
  "status"
];

export const MATCH_STATUS_FIELDS = [
  "match_status",
  "actual_start_time",
  "actual_length_of_halves"
];

export const TEAM_COMMON_FIELDS = [
  "team",
  "coach.name",
  "coach.email",
  "coach.phone",
  "asst_coach",
  "colors"
];

export const generalFields = [
  "game_number", "match_date", "match_time", "location", "field",
  "league", "competition", "season", "age_division",
  "round", "gender", "teamSize", "halfLength", "kickoff", "touchlines",
  "status", "notes"
];

export const teamFields = {
  home: [
    "home_team", "home_team_id", "home_colors",
    "home_coach.name", "home_coach.email", "home_coach.phone",
    "home_asst_coach"
  ],
  away: [
    "away_team", "away_team_id", "away_colors",
    "away_coach.name", "away_coach.email", "away_coach.phone",
    "away_asst_coach"
  ]
};

export const refereeFields = [
  "referees[].role", "referees[].name", "referees[].email", "referees[].phone"
];

export const officialFields = [
  "assigner.name", "assigner.email", "assigner.phone",
  "payer.name", "payer.email", "payer.phone"
];

export const selectedTeamFields = [
  "teamName", "teamColors",
  "teamCoach.name", "teamCoach.email", "teamCoach.phone",
  "teamAsstCoach", "lineupOverrides[].number", "lineupOverrides[].name"
];

export const matchResultFields = [
  "match_status", "actual_start_time", "actual_length_of_halves",
  "home_first_half_goals", "home_second_half_goals",
  "home_first_et_goals", "home_second_et_goals",
  "home_penalty_shootout_goals",
  "away_first_half_goals", "away_second_half_goals",
  "away_first_et_goals", "away_second_et_goals",
  "away_penalty_shootout_goals",
  "final_score.home_score", "final_score.away_score",
  "final_score.winning_team_or_tie",
  "home_points", "away_points"
];
