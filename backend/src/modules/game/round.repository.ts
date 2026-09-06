import type { QueryResultRow } from 'pg'
import { pool } from '../../infrastructure/database/database.js'
import type { Game } from './game.types.js'
import { MAX_ROUNDS } from './round.types.js'
import type { Round } from './round.types.js'

interface RoundRow extends QueryResultRow {
  id: number
  game_id: number
  round_number: number
  pokemon_id?: number
  difficulty: Game['difficulty']
  started_at: Date
  finished_at?: Date | null
  hints_used: number
}

function mapRoundRow(row: RoundRow): Round {
  return {
    id: row.id,
    gameId: row.game_id,
    roundNumber: row.round_number,
    difficulty: row.difficulty,
    startedAt: row.started_at.toISOString(),
    hintsUsed: row.hints_used,
  }
}

export class RoundAlreadyResolvedError extends Error {
  constructor() {
    super('La ronda ya ha sido resuelta.')
    this.name = 'RoundAlreadyResolvedError'
  }
}

export class RoundRepository {
  async create(gameId: number, roundNumber: number, pokemonId: number, difficulty: Game['difficulty']): Promise<Round> {
    const result = await pool.query<RoundRow>(
      `INSERT INTO rounds (game_id, round_number, pokemon_id, difficulty)
       VALUES ($1, $2, $3, $4)
       RETURNING id, game_id, round_number, difficulty, started_at, hints_used`,
      [gameId, roundNumber, pokemonId, difficulty],
    )

    return mapRoundRow(result.rows[0])
  }

  async findById(roundId: number): Promise<(Round & { pokemonId: number; finishedAt: Date | null; isCorrect: boolean | null }) | null> {
    const result = await pool.query<RoundRow>(
      `SELECT id, game_id, round_number, pokemon_id, difficulty, started_at, finished_at, is_correct, hints_used
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
      finishedAt: row.finished_at || null,
      isCorrect: (row as any).is_correct ?? null,
    }
  }

  async updateGuess(roundId: number, finishedAt: Date, timeTaken: number, isCorrect: boolean, gameId: number, score: number): Promise<number> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Verificar si la ronda ya fue resuelta
      const roundCheckResult = await client.query(
        `SELECT finished_at FROM rounds WHERE id = $1 FOR UPDATE`,
        [roundId],
      )

      if (roundCheckResult.rows.length === 0) {
        await client.query('ROLLBACK')
        throw new Error('La ronda no existe.')
      }

      const round = roundCheckResult.rows[0]
      if (round.finished_at !== null) {
        await client.query('ROLLBACK')
        throw new RoundAlreadyResolvedError()
      }

      // Actualizar la ronda con score
      await client.query(
        `UPDATE rounds
         SET finished_at = $2, time_taken = $3, is_correct = $4, score = $5
         WHERE id = $1`,
        [roundId, finishedAt, timeTaken, isCorrect, score],
      )

      // Actualizar total_score de la partida
      const updateGameResult = await client.query(
        `UPDATE games
         SET total_score = total_score + $2,
             current_round = current_round + 1,
             status = CASE WHEN current_round >= $3 THEN 'FINISHED' ELSE status END,
             finished_at = CASE WHEN current_round >= $3 THEN $4 ELSE finished_at END
         WHERE id = $1
         RETURNING total_score`,
        [gameId, score, MAX_ROUNDS, finishedAt],
      )

      const newTotalScore = updateGameResult.rows[0].total_score

      await client.query('COMMIT')

      return newTotalScore
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}