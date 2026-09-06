import assert from 'node:assert/strict'
import { RankingService, type RankingReader } from './ranking.service.js'

async function testReturnsFinishedResultsIncludingZeroScores() {
  let callCount = 0
  const repository: RankingReader = {
    listRanking: async () => {
      callCount += 1

      return [
        { playerName: 'Ash', score: 1200 },
        { playerName: 'Brock', score: 0 },
      ]
    },
  }

  const service = new RankingService(repository)

  const ranking = await service.getRanking()

  assert.equal(callCount, 1)
  assert.deepEqual(ranking, [
    { playerName: 'Ash', score: 1200 },
    { playerName: 'Brock', score: 0 },
  ])
}

async function testReturnsEmptyCollectionWhenNoFinishedResultsExist() {
  const service = new RankingService({
    listRanking: async () => [],
  })

  const ranking = await service.getRanking()

  assert.deepEqual(ranking, [])
}

async function runTests() {
  await testReturnsFinishedResultsIncludingZeroScores()
  await testReturnsEmptyCollectionWhenNoFinishedResultsExist()

  console.log('Ranking service tests passed')
}

void runTests()