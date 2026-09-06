import assert from 'node:assert/strict'
import { GameNotFoundError, ValidationError } from './game.errors.js'
import { calculatePerformanceLevel, PerformanceService } from './performance.service.js'

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

function testCalculatesEasyLevelWithoutPlayedRounds() {
  const result = calculatePerformanceLevel({
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 0,
    totalHintsUsed: 0,
  })

  assert.deepEqual(result, {
    level: 'EASY',
    score: 0,
    precision: 0,
    independence: 0,
    roundsPlayed: 0,
  })
}

function testCalculatesEasyLevelBelowMediumThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 0,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 30,
    totalHintsUsed: 0,
  })

  assert.equal(result.level, 'EASY')
  assert.equal(result.score, 15)
  assert.equal(result.precision, 0)
  assert.equal(result.independence, 100)
}

function testCalculatesMediumLevelAtThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 20,
    totalHintsUsed: 0,
  })

  assert.equal(result.level, 'MEDIUM')
  assert.equal(result.score, 45)
}

function testCalculatesHardLevelAtThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 2,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 10,
    totalHintsUsed: 0,
  })

  assert.equal(result.level, 'HARD')
  assert.equal(result.score, 75)
}

function testBoundaryJustBelowMediumThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 20,
    totalHintsUsed: 3,
  })

  assert.equal(result.score, 37.5)
  assert.equal(result.level, 'EASY')
}

function testBoundaryAtMediumThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 20,
    totalHintsUsed: 2,
  })

  assert.equal(result.score, 40)
  assert.equal(result.level, 'MEDIUM')
}

function testBoundaryJustAboveMediumThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 20,
    totalHintsUsed: 1,
  })

  assert.equal(result.score, 42.5)
  assert.equal(result.level, 'MEDIUM')
}

function testBoundaryJustBelowHardThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 12,
    totalHintsUsed: 2,
  })

  assert.equal(result.score, 65)
  assert.equal(result.level, 'MEDIUM')
}

function testBoundaryAtHardThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 12,
    totalHintsUsed: 1,
  })

  assert.equal(result.score, 70)
  assert.equal(result.level, 'HARD')
}

function testBoundaryJustAboveHardThreshold() {
  const result = calculatePerformanceLevel({
    correctAnswers: 2,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 12,
    totalHintsUsed: 1,
  })

  assert.equal(result.score, 72.5)
  assert.equal(result.level, 'HARD')
}

function testHintsReduceIndependenceWithoutGoingNegative() {
  const result = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 0,
    averageResponseTimeSeconds: 8,
    totalHintsUsed: 5,
  })

  assert.equal(result.independence, 0)
  assert.equal(result.score, 60)
  assert.equal(result.level, 'MEDIUM')
}

function testTimeDoesNotAffectApprovedClassificationFormula() {
  const fastResult = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 5,
    totalHintsUsed: 1,
  })

  const slowResult = calculatePerformanceLevel({
    correctAnswers: 1,
    incorrectAnswers: 1,
    averageResponseTimeSeconds: 29,
    totalHintsUsed: 1,
  })

  assert.equal(fastResult.score, slowResult.score)
  assert.equal(fastResult.level, slowResult.level)
}

async function testReturnsPerformanceLevelFromSnapshot() {
  const service = new PerformanceService(
    { findById: async () => createGame() },
    {
      getPerformanceSnapshot: async () => ({
        correctAnswers: 2,
        incorrectAnswers: 0,
        averageResponseTimeSeconds: 14,
        totalHintsUsed: 0,
      }),
    },
  )

  const result = await service.getPerformanceLevel(7)

  assert.equal(result.level, 'HARD')
  assert.equal(result.score, 75)
}

async function testPerformanceLevelUsesOnlyRequestedGameSnapshot() {
  let requestedGameId = 0
  const service = new PerformanceService(
    { findById: async () => createGame() },
    {
      getPerformanceSnapshot: async (gameId) => {
        requestedGameId = gameId
        return {
          correctAnswers: 1,
          incorrectAnswers: 1,
          averageResponseTimeSeconds: 20,
          totalHintsUsed: 0,
        }
      },
    },
  )

  const result = await service.getPerformanceLevel(7)

  assert.equal(requestedGameId, 7)
  assert.equal(result.level, 'MEDIUM')
}

async function testPerformanceLevelDoesNotModifyGameDifficulty() {
  const game = createGame()
  const service = new PerformanceService(
    { findById: async () => game },
    {
      getPerformanceSnapshot: async () => ({
        correctAnswers: 2,
        incorrectAnswers: 0,
        averageResponseTimeSeconds: 10,
        totalHintsUsed: 0,
      }),
    },
  )

  const result = await service.getPerformanceLevel(7)

  assert.equal(result.level, 'HARD')
  assert.equal(game.difficulty, 'EASY')
}

async function runTests() {
  await testRejectsInvalidGameId()
  await testRejectsMissingGame()
  await testReturnsZeroSnapshotWithoutCompletedRounds()
  await testReturnsCorrectPerformanceMetrics()
  await testIncludesExpiredRoundsAsIncorrectPerformance()
  testCalculatesEasyLevelWithoutPlayedRounds()
  testCalculatesEasyLevelBelowMediumThreshold()
  testCalculatesMediumLevelAtThreshold()
  testCalculatesHardLevelAtThreshold()
  testBoundaryJustBelowMediumThreshold()
  testBoundaryAtMediumThreshold()
  testBoundaryJustAboveMediumThreshold()
  testBoundaryJustBelowHardThreshold()
  testBoundaryAtHardThreshold()
  testBoundaryJustAboveHardThreshold()
  testHintsReduceIndependenceWithoutGoingNegative()
  testTimeDoesNotAffectApprovedClassificationFormula()
  await testReturnsPerformanceLevelFromSnapshot()
  await testPerformanceLevelUsesOnlyRequestedGameSnapshot()
  await testPerformanceLevelDoesNotModifyGameDifficulty()

  console.log('Performance service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})