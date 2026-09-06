import assert from 'node:assert/strict'
import { GameNotFoundError, GameNotInProgressError } from './game.errors.js'
import { normalizePlayerName } from './game.service.js'
import { RoundService } from './round.service.js'

function testNormalizesPlayerName() {
  assert.equal(normalizePlayerName(' Ash '), 'Ash')
}

function testRejectsMissingPlayerName() {
  assert.throws(
    () => normalizePlayerName('   '),
    /El nombre del jugador es obligatorio\./,
  )
}

function testRejectsLongPlayerName() {
  assert.throws(
    () => normalizePlayerName('a'.repeat(101)),
    /El nombre del jugador no puede superar 100 caracteres\./,
  )
}

function createGame(overrides: Partial<{ id: number; currentRound: number; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; status: 'IN_PROGRESS' | 'FINISHED' }> = {}) {
  return {
    id: overrides.id ?? 7,
    playerName: 'Ash',
    totalScore: 0,
    currentRound: overrides.currentRound ?? 1,
    difficulty: overrides.difficulty ?? 'EASY',
    status: overrides.status ?? 'IN_PROGRESS',
    startedAt: '2026-09-05T12:00:00.000Z',
    finishedAt: null,
  }
}

async function testCreatesRoundWithoutExposingPokemon() {
  const roundService = new RoundService(
    { findById: async () => createGame() },
    {
      create: async (gameId, roundNumber, pokemonId, difficulty) => {
        assert.equal(gameId, 7)
        assert.equal(roundNumber, 1)
        assert.equal(pokemonId, 25)
        assert.equal(difficulty, 'EASY')
        return {
          id: 11,
          gameId,
          roundNumber,
          difficulty,
          startedAt: '2026-09-05T12:01:00.000Z',
        }
      },
    },
    { selectRandomPokemon: async () => 25 },
  )

  const round = await roundService.createRound({ gameId: 7 })

  assert.deepEqual(round, {
    id: 11,
    gameId: 7,
    roundNumber: 1,
    difficulty: 'EASY',
    startedAt: '2026-09-05T12:01:00.000Z',
  })
  assert.equal('pokemonId' in round, false)
}

async function testRejectsMissingGame() {
  const roundService = new RoundService(
    { findById: async () => null },
    { create: async () => { throw new Error('No debe persistir') } },
    { selectRandomPokemon: async () => 25 },
  )

  await assert.rejects(() => roundService.createRound({ gameId: 7 }), GameNotFoundError)
}

async function testRejectsFinishedGame() {
  const roundService = new RoundService(
    { findById: async () => createGame({ status: 'FINISHED' }) },
    { create: async () => { throw new Error('No debe persistir') } },
    { selectRandomPokemon: async () => 25 },
  )

  await assert.rejects(() => roundService.createRound({ gameId: 7 }), GameNotInProgressError)
}

async function runTests() {
  testNormalizesPlayerName()
  testRejectsMissingPlayerName()
  testRejectsLongPlayerName()
  await testCreatesRoundWithoutExposingPokemon()
  await testRejectsMissingGame()
  await testRejectsFinishedGame()

  console.log('Game service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

