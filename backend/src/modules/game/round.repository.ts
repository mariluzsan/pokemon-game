import type { PoolClient, QueryResultRow } from 'pg'
import { pool } from '../../infrastructure/database/database.js'
import type { Game } from './game.types.js'
import type { PerformanceSnapshot } from './game.types.js'
import { MAX_ROUNDS } from './round.types.js'
import type { Round, RoundCompletion } from './round.types.js'
import { RoundNotCompletedError } from './game.errors.js'
import { mapPerformanceLevelToDifficulty } from './difficulty.service.js'
import { calculatePerformanceLevel } from './performance.service.js'

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

interface PerformanceSnapshotRow extends QueryResultRow {
  correct_answers: number
  incorrect_answers: number
  average_response_time_seconds: number
  total_hints_used: number
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
  private async adaptGameDifficulty(client: PoolClient, gameId: number) {
    const gameResult = await client.query<{ difficulty: Game['difficulty'] }>(
      `SELECT difficulty
       FROM games
       WHERE id = $1
       FOR UPDATE`,
      [gameId],
    )

    const snapshotResult = await client.query<PerformanceSnapshotRow>(
      `SELECT
         COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND is_correct IS TRUE)::INTEGER AS correct_answers,
         COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND is_correct IS FALSE)::INTEGER AS incorrect_answers,
         COALESCE(AVG(time_taken) FILTER (WHERE finished_at IS NOT NULL), 0)::FLOAT8 AS average_response_time_seconds,
         COALESCE(SUM(hints_used) FILTER (WHERE finished_at IS NOT NULL), 0)::INTEGER AS total_hints_used
       FROM rounds
       WHERE game_id = $1`,
      [gameId],
    )

    const snapshotRow = snapshotResult.rows[0]
    const performanceLevel = calculatePerformanceLevel({
      correctAnswers: snapshotRow.correct_answers,
      incorrectAnswers: snapshotRow.incorrect_answers,
      averageResponseTimeSeconds: snapshotRow.average_response_time_seconds,
      totalHintsUsed: snapshotRow.total_hints_used,
    }).level
    const difficulty = mapPerformanceLevelToDifficulty(gameResult.rows[0].difficulty, performanceLevel)

    await client.query(
      `UPDATE games SET difficulty = $2 WHERE id = $1`,
      [gameId, difficulty],
    )
  }

  async create(gameId: number, roundNumber: number, pokemonId: number, difficulty: Game['difficulty']): Promise<Round> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const activeRoundResult = await client.query(
        `SELECT 1
         FROM rounds
         WHERE game_id = $1 AND round_number = $2 AND finished_at IS NULL
         FOR UPDATE`,
        [gameId, roundNumber],
      )

      if (activeRoundResult.rowCount) {
        throw new RoundNotCompletedError()
      }

      const gameResult = await client.query(
        `SELECT current_round, status
         FROM games
         WHERE id = $1
         FOR UPDATE`,
        [gameId],
      )

      const game = gameResult.rows[0]
      if (!game || game.status !== 'IN_PROGRESS' || game.current_round !== roundNumber) {
        throw new RoundNotCompletedError()
      }

      const result = await client.query<RoundRow>(
        `INSERT INTO rounds (game_id, round_number, pokemon_id, difficulty)
         VALUES ($1, $2, $3, $4)
         RETURNING id, game_id, round_number, difficulty, started_at, hints_used`,
        [gameId, roundNumber, pokemonId, difficulty],
      )

      await client.query('COMMIT')
      return mapRoundRow(result.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
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

  async findUsedPokemonIds(gameId: number): Promise<number[]> {
    const result = await pool.query<{ pokemon_id: number }>(
      `SELECT pokemon_id
       FROM rounds
       WHERE game_id = $1`,
      [gameId],
    )

    return result.rows.map((row) => row.pokemon_id)
  }

  async getPerformanceSnapshot(gameId: number): Promise<PerformanceSnapshot> {
    const result = await pool.query<PerformanceSnapshotRow>(
      `SELECT
         COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND is_correct IS TRUE)::INTEGER AS correct_answers,
         COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND is_correct IS FALSE)::INTEGER AS incorrect_answers,
         COALESCE(AVG(time_taken) FILTER (WHERE finished_at IS NOT NULL), 0)::FLOAT8 AS average_response_time_seconds,
         COALESCE(SUM(hints_used) FILTER (WHERE finished_at IS NOT NULL), 0)::INTEGER AS total_hints_used
       FROM rounds
       WHERE game_id = $1`,
      [gameId],
    )

    const row = result.rows[0]

    return {
      correctAnswers: row.correct_answers,
      incorrectAnswers: row.incorrect_answers,
      averageResponseTimeSeconds: row.average_response_time_seconds,
      totalHintsUsed: row.total_hints_used,
    }
  }

  async updateGuess(
    roundId: number,
    finishedAt: Date,
    timeTaken: number,
    isCorrect: boolean,
    gameId: number,
    calculateScore: () => number,
  ): Promise<RoundCompletion> {
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

      const hintPenaltyResult = await client.query<{ hint_penalty: number }>(
        `SELECT COALESCE(SUM(penalty), 0)::INTEGER AS hint_penalty
         FROM hints
         WHERE round_id = $1`,
        [roundId],
      )
      const score = calculateScore()

      // Actualizar la ronda con score
      await client.query(
        `UPDATE rounds
         SET finished_at = $2, time_taken = $3, is_correct = $4, score = $5
         WHERE id = $1`,
        [roundId, finishedAt, timeTaken, isCorrect, score],
      )

      await this.adaptGameDifficulty(client, gameId)

      // Actualizar total_score de la partida
      const updateGameResult = await client.query(
        `UPDATE games
         SET total_score = total_score + $2,
             current_round = current_round + 1,
             status = CASE WHEN current_round >= $3 THEN 'FINISHED' ELSE status END,
             finished_at = CASE WHEN current_round >= $3 THEN $4 ELSE finished_at END
         WHERE id = $1
         RETURNING total_score, status, finished_at`,
        [gameId, score, MAX_ROUNDS, finishedAt],
      )

      const newTotalScore = updateGameResult.rows[0].total_score

      await client.query('COMMIT')

      return {
        hintPenalty: hintPenaltyResult.rows[0].hint_penalty,
        totalScore: newTotalScore,
        status: updateGameResult.rows[0].status,
        finishedAt: updateGameResult.rows[0].finished_at?.toISOString() ?? null,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async expireRound(roundId: number, gameId: number, finishedAt: Date): Promise<RoundCompletion> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const roundResult = await client.query(
        `SELECT finished_at
         FROM rounds
         WHERE id = $1 AND game_id = $2
         FOR UPDATE`,
        [roundId, gameId],
      )

      const round = roundResult.rows[0]
      if (!round) {
        throw new Error('La ronda no existe.')
      }

      if (round.finished_at !== null) {
        const gameResult = await client.query(
          `SELECT total_score, status, finished_at FROM games WHERE id = $1`,
          [gameId],
        )
        const hintPenaltyResult = await client.query<{ hint_penalty: number }>(
          `SELECT COALESCE(SUM(penalty), 0)::INTEGER AS hint_penalty
           FROM hints
           WHERE round_id = $1`,
          [roundId],
        )
        await client.query('COMMIT')
        return {
          hintPenalty: hintPenaltyResult.rows[0].hint_penalty,
          totalScore: gameResult.rows[0].total_score,
          status: gameResult.rows[0].status,
          finishedAt: gameResult.rows[0].finished_at?.toISOString() ?? null,
        }
      }

      await client.query(
        `UPDATE rounds
         SET finished_at = $3, time_taken = $4, is_correct = FALSE, score = 0
         WHERE id = $1 AND game_id = $2`,
        [roundId, gameId, finishedAt, 30],
      )

      await this.adaptGameDifficulty(client, gameId)

      const gameResult = await client.query(
        `UPDATE games
         SET current_round = current_round + 1,
             status = CASE WHEN current_round >= $2 THEN 'FINISHED' ELSE status END,
             finished_at = CASE WHEN current_round >= $2 THEN $3 ELSE finished_at END
         WHERE id = $1
         RETURNING total_score, status, finished_at`,
        [gameId, MAX_ROUNDS, finishedAt],
      )

      const hintPenaltyResult = await client.query<{ hint_penalty: number }>(
        `SELECT COALESCE(SUM(penalty), 0)::INTEGER AS hint_penalty
         FROM hints
         WHERE round_id = $1`,
        [roundId],
      )

      await client.query('COMMIT')
      return {
        hintPenalty: hintPenaltyResult.rows[0].hint_penalty,
        totalScore: gameResult.rows[0].total_score,
        status: gameResult.rows[0].status,
        finishedAt: gameResult.rows[0].finished_at?.toISOString() ?? null,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}