CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(100) NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  current_round INTEGER NOT NULL DEFAULT 1,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'EASY',
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL
);

CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  pokemon_id INTEGER NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  time_taken INTEGER NULL,
  is_correct BOOLEAN NULL,
  hints_used INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT fk_round_game
    FOREIGN KEY (game_id)
    REFERENCES games(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_game_round
    UNIQUE (game_id, round_number),

  CONSTRAINT chk_hints_used
    CHECK (hints_used BETWEEN 0 AND 3)
);

CREATE TABLE hints (
  id SERIAL PRIMARY KEY,
  round_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  source VARCHAR(20) NOT NULL,
  penalty INTEGER NOT NULL DEFAULT 0,
  content TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_hint_round
    FOREIGN KEY (round_id)
    REFERENCES rounds(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_hint_level
    CHECK (level BETWEEN 1 AND 3),

  CONSTRAINT uq_round_hint_level
    UNIQUE (round_id, level)
);