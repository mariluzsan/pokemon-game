import type { QueryResultRow } from 'pg'
import { pool } from '../../infrastructure/database/database.js'
import type { RankingEntry } from './ranking.types.js'

interface RankingRow extends QueryResultRow {
  player_name: string
  total_score: number
}

function mapRankingRow(row: RankingRow): RankingEntry {
  return {
    playerName: row.player_name,
    score: row.total_score,
  }
}

export class RankingRepository {
  async listRanking(): Promise<RankingEntry[]> {
    const result = await pool.query<RankingRow>(
      `SELECT player_name, total_score
       FROM games
       WHERE status = 'FINISHED' AND finished_at IS NOT NULL
       ORDER BY total_score DESC`,
      [],
    )

    return result.rows.map(mapRankingRow)
  }
}