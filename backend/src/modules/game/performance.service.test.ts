import assert from 'node:assert/strict'
import { GameNotFoundError, ValidationError } from './game.errors.js'
import { PerformanceService } from './performance.service.js'

function createGame() {
  return {
    id: 7,
    playerName: 'Ash',
    totalScore: 1200,
    currentRound: 4,
    difficulty: 'EASY' as const,
    status: 'IN_PROGRESS' as const,
    startedAt: '2026-09-05T12:00:00.000Z',
    finishedAt: null,
  }
}

async function testRejectsInvalidGameId() {
  const service = new PerformanceService(
    { findById: async () => createGame() },
    { getPerformanceSnapshot: async () => ({ correctAnswers: 0, incorrectAnswers: 0, averageResponseTimeSeconds: 0, totalHintsUsed: 0 }) },
  )

  await assert.rejects(() => service.getPerformanceSnapshot(0), ValidationError)
}

async function testRejectsMissingGame() {
  const service = new PerformanceService(
    { findById: async () => null },
    { getPerformanceSnapshot: async () => ({ correctAnswers: 0, incorrectAnswers: 0, averageResponseTimeSeconds: 0, totalHintsUsed: 0 }) },
  )

  await assert.rejects(() => service.getPerformanceSnapshot(7), GameNotFoundError)
}

async function testReturnsZeroSnapshotWithoutCompletedRounds() {
  const service = new PerformanceService(
    { findById: async () => createGame() },
    { getPerformanceSnapshot: async () => ({ correctAnswers: 0, incorrectAnswers: 0, averageResponseTimeSeconds: 0, totalHintsUsed: 0 }) },
  )

  const snapshot = await service.getPerformanceSnapshot(7)

  assert.deepEqual(snapshot, {
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 0,
    totalHintsUsed: 0,
  })
}

async function testReturnsCorrectPerformanceMetrics() {
  let requestedGameId = 0
  const service = new PerformanceService(
    { findById: async () => createGame() },
    {
      getPerformanceSnapshot: async (gameId) => {
        requestedGameId = gameId
        return {
          correctAnswers: 2,
          incorrectAnswers: 1,
          averageResponseTimeSeconds: 15,
          totalHintsUsed: 3,
        }
      },
    },
  )

  const snapshot = await service.getPerformanceSnapshot(7)

  assert.equal(requestedGameId, 7)
  assert.deepEqual(snapshot, {
    correctAnswers: 2,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 15,
    totalHintsUsed: 3,
  })
}

async function testIncludesExpiredRoundsAsIncorrectPerformance() {
  const service = new PerformanceService(
    { findById: async () => createGame() },
    {
      getPerformanceSnapshot: async () => ({
        correctAnswers: 1,
        incorrectAnswers: 1,
        averageResponseTimeSeconds: 20,
        totalHintsUsed: 2,
      }),
    },
  )

  const snapshot = await service.getPerformanceSnapshot(7)

  assert.equal(snapshot.correctAnswers, 1)
  assert.equal(snapshot.incorrectAnswers, 1)
}

async function runTests() {
  await testRejectsInvalidGameId()
  await testRejectsMissingGame()
  await testReturnsZeroSnapshotWithoutCompletedRounds()
  await testReturnsCorrectPerformanceMetrics()
  await testIncludesExpiredRoundsAsIncorrectPerformance()

  console.log('Performance service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})