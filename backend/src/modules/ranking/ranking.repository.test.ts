import assert from 'node:assert/strict'
import { pool } from '../../infrastructure/database/database.js'
import { RankingRepository } from './ranking.repository.js'

async function testListsFinishedGamesUsingGamesAsSingleSourceOfTruth() {
  const originalQuery = pool.query.bind(pool)
  const calls: Array<{ text: string; values: unknown[] | undefined }> = []

  ;(pool as unknown as {
    query: <T>(text: string, values?: unknown[]) => Promise<{ rows: T[] }>
  }).query = async <T>(text: string, values?: unknown[]) => {
    calls.push({ text, values })

    return {
      rows: [
        { player_name: 'Ash', total_score: 1200 },
        { player_name: 'Brock', total_score: 0 },
      ] as T[],
    }
  }

  try {
    const repository = new RankingRepository()

    const ranking = await repository.listRanking()

    assert.deepEqual(ranking, [
      { playerName: 'Ash', score: 1200 },
      { playerName: 'Brock', score: 0 },
    ])
    assert.equal(calls.length, 1)
    assert.match(calls[0].text, /SELECT\s+player_name, total_score\s+FROM games/i)
    assert.doesNotMatch(calls[0].text, /SELECT\s+\*/i)
    assert.match(calls[0].text, /status = 'FINISHED'/i)
    assert.match(calls[0].text, /finished_at IS NOT NULL/i)
    assert.match(calls[0].text, /ORDER BY total_score DESC/i)
    assert.deepEqual(calls[0].values, [])
  } finally {
    ;(pool as unknown as { query: typeof pool.query }).query = originalQuery
  }
}

async function runTests() {
  await testListsFinishedGamesUsingGamesAsSingleSourceOfTruth()

  console.log('Ranking repository tests passed')
}

void runTests()