import { pool } from '../../infrastructure/database/database.js'
import { GameNotInProgressError, RoundExpiredError, ValidationError } from '../game/game.errors.js'
import { RoundAlreadyResolvedError } from '../game/round.repository.js'
import { ROUND_TIME_LIMIT_SECONDS } from '../game/round.types.js'
import { HintLimitReachedError } from './hint.errors.js'
import { HINT_PENALTY_PER_HINT, MAX_HINTS_PER_ROUND, type Hint } from './hint.types.js'
import type { GeneratedHint } from './hint.generator.js'

interface RequestHintRecord {
  id: number
  gameId: number
  createdAt: Date
  generate: (level: number) => Promise<GeneratedHint>
}

export class HintRepository {
  async registerGeneratedHint(record: RequestHintRecord): Promise<Hint> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const roundResult = await client.query<{
        game_id: number
        started_at: Date
        finished_at: Date | null
        hints_used: number
      }>(
        `SELECT game_id, started_at, finished_at, hints_used
         FROM rounds
         WHERE id = $1
         FOR UPDATE`,
        [record.id],
      )
      const round = roundResult.rows[0]

      if (!round || round.game_id !== record.gameId) {
        throw new ValidationError('La ronda no existe o no pertenece a la partida.')
      }

      const gameResult = await client.query<{ status: string }>(
        `SELECT status
         FROM games
         WHERE id = $1
         FOR UPDATE`,
        [record.gameId],
      )
      const game = gameResult.rows[0]

      if (!game || game.status !== 'IN_PROGRESS') {
        throw new GameNotInProgressError()
      }

      if (round.finished_at) {
        throw new RoundAlreadyResolvedError()
      }

      const elapsedMilliseconds = record.createdAt.getTime() - round.started_at.getTime()
      if (elapsedMilliseconds >= ROUND_TIME_LIMIT_SECONDS * 1000) {
        throw new RoundExpiredError()
      }

      if (round.hints_used >= MAX_HINTS_PER_ROUND) {
        throw new HintLimitReachedError()
      }

      const level = round.hints_used + 1
      const generated = await record.generate(level)
      await client.query(
        `INSERT INTO hints (round_id, level, source, penalty, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [record.id, level, generated.source, HINT_PENALTY_PER_HINT, generated.content],
      )
      await client.query(
        `UPDATE rounds
         SET hints_used = $2
         WHERE id = $1`,
        [record.id, level],
      )
      const gameScoreResult = await client.query<{ total_score: number }>(
        `UPDATE games
         SET total_score = GREATEST(0, total_score - $2)
         WHERE id = $1
         RETURNING total_score`,
        [record.gameId, HINT_PENALTY_PER_HINT],
      )

      await client.query('COMMIT')
      return {
        level,
        content: generated.content,
        penalty: HINT_PENALTY_PER_HINT,
        totalScore: gameScoreResult.rows[0].total_score,
        hintsUsed: level,
        hintsRemaining: MAX_HINTS_PER_ROUND - level,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}