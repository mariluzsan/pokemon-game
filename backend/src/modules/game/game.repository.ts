import type { QueryResultRow } from 'pg'
import { pool } from '../../infrastructure/database/database.js'
import type { Game } from './game.types.js'

interface GameRow extends QueryResultRow {
  id: number
  player_name: string
  total_score: number
  current_round: number
  difficulty: Game['difficulty']
  status: Game['status']
  started_at: Date
  finished_at: Date | null
}

function mapGameRow(row: GameRow): Game {
  return {
    id: row.id,
    playerName: row.player_name,
    totalScore: row.total_score,
    currentRound: row.current_round,
    difficulty: row.difficulty,
    status: row.status,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
  }
}

export class GameRepository {
  async create(playerName: string): Promise<Game> {
    const result = await pool.query<GameRow>(
      `INSERT INTO games (player_name)
       VALUES ($1)
       RETURNING id, player_name, total_score, current_round, difficulty, status, started_at, finished_at`,
      [playerName],
    )

    return mapGameRow(result.rows[0])
  }
}

