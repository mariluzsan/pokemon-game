import type { QueryResultRow } from 'pg'
import { pool } from '../../infrastructure/database/database.js'
import type { Game } from './game.types.js'
import type { Round } from './round.types.js'

interface RoundRow extends QueryResultRow {
  id: number
  game_id: number
  round_number: number
  pokemon_id?: number
  difficulty: Game['difficulty']
  started_at: Date
}

function mapRoundRow(row: RoundRow): Round {
  return {
    id: row.id,
    gameId: row.game_id,
    roundNumber: row.round_number,
    difficulty: row.difficulty,
    startedAt: row.started_at.toISOString(),
  }
}

export class RoundRepository {
  async create(gameId: number, roundNumber: number, pokemonId: number, difficulty: Game['difficulty']): Promise<Round> {
    const result = await pool.query<RoundRow>(
      `INSERT INTO rounds (game_id, round_number, pokemon_id, difficulty)
       VALUES ($1, $2, $3, $4)
       RETURNING id, game_id, round_number, difficulty, started_at`,
      [gameId, roundNumber, pokemonId, difficulty],
    )

    return mapRoundRow(result.rows[0])
  }

  async findById(roundId: number): Promise<(Round & { pokemonId: number }) | null> {
    const result = await pool.query<RoundRow>(
      `SELECT id, game_id, round_number, pokemon_id, difficulty, started_at
       FROM rounds
       WHERE id = $1`,
      [roundId],
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      ...mapRoundRow(row),
      pokemonId: row.pokemon_id || 0,
    }
  }
}