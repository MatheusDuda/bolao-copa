-- users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  score INTEGER NOT NULL DEFAULT 0,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- matches
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  football_data_id TEXT,
  phase TEXT NOT NULL DEFAULT 'Fase de Grupos',
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  score_a INTEGER,
  score_b INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled'
);

-- predictions
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, match_id)
);

-- pre_tournament_picks
CREATE TABLE pre_tournament_picks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  champion TEXT,
  top_scorer TEXT,
  best_attack TEXT,
  best_defense TEXT,
  neymar_scores BOOLEAN,
  brazil_performance TEXT,
  points INTEGER NOT NULL DEFAULT 0
);

-- extra_results (single row, id=1)
CREATE TABLE extra_results (
  id INTEGER PRIMARY KEY DEFAULT 1,
  champion TEXT,
  top_scorer TEXT,
  best_attack TEXT,
  best_defense TEXT,
  neymar_scored BOOLEAN,
  brazil_performance TEXT
);

-- settings (single row, id=1)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hours_before_lock INTEGER NOT NULL DEFAULT 0,
  football_data_api_key TEXT NOT NULL DEFAULT '',
  copa_start_date DATE NOT NULL DEFAULT '2026-06-12'
);

-- seed: admin user + singleton rows
INSERT INTO users (id, username, password, display_name, role, score, score_breakdown)
VALUES (
  'admin-001', 'admin', 'admin123', 'Admin', 'admin', 0,
  '{"match_points":0,"champion":0,"top_scorer":0,"best_attack":0,"best_defense":0,"neymar":0,"brazil":0}'
);

INSERT INTO extra_results (id) VALUES (1);
INSERT INTO settings (id) VALUES (1);
