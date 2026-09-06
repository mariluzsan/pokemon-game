import assert from 'node:assert/strict'
import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, ValidationError } from '../game/game.errors.js'
import { RoundAlreadyResolvedError } from '../game/round.repository.js'
import { HintLimitReachedError } from './hint.errors.js'
import { HintService } from './hint.service.js'
import type { HintGenerator } from './hint.generator.js'

function createGame(status: 'IN_PROGRESS' | 'FINISHED' = 'IN_PROGRESS') {
  return {
    id: 7,
    playerName: 'Ash',
    totalScore: 0,
    currentRound: 1,
    difficulty: 'EASY' as const,
    status,
    startedAt: '2026-09-06T12:00:00.000Z',
    finishedAt: status === 'FINISHED' ? '2026-09-06T12:00:30.000Z' : null,
  }
}

function createRound(overrides: Partial<{ gameId: number; startedAt: string; finishedAt: Date | null }> = {}) {
  return {
    id: 11,
    gameId: overrides.gameId ?? 7,
    roundNumber: 1,
    difficulty: 'EASY' as const,
    startedAt: overrides.startedAt ?? '2026-09-06T12:00:00.000Z',
    pokemonId: 25,
    finishedAt: overrides.finishedAt ?? null,
    isCorrect: null,
    hintsUsed: 0,
  }
}

function createService(options: {
  game?: ReturnType<typeof createGame> | null
  round?: ReturnType<typeof createRound> | null
  now?: string
  registerRequest?: (record: { id: number; gameId: number; createdAt: Date; content: string; source: 'AI' | 'FALLBACK' }) => Promise<{ level: number; content: string }>
  hintGenerator?: HintGenerator
} = {}) {
  return new HintService(
    { findById: async () => options.game === undefined ? createGame() : options.game },
    { findById: async () => options.round === undefined ? createRound() : options.round },
    { registerRequest: options.registerRequest ?? (async (record) => ({ level: 1, content: record.content })) },
    () => new Date(options.now ?? '2026-09-06T12:00:29.999Z'),
    { getPokemonHintData: async () => ({ name: 'pikachu', types: ['electric'] }) },
    options.hintGenerator ?? { generate: async () => ({ content: 'Pista generada para identificarlo.', source: 'AI' }) },
  )
}

async function testRequestsPendingHintWithoutSensitiveData() {
  let request: { id: number; gameId: number; createdAt: Date; content: string; source: 'AI' | 'FALLBACK' } | null = null
  const hint = await createService({
    registerRequest: async (record) => {
      request = record
      return { level: 1, content: record.content }
    },
  }).requestHint({ gameId: 7, roundId: 11 })

  assert.deepEqual(hint, { level: 1, content: 'Pista generada para identificarlo.' })
  assert.deepEqual(request, {
    id: 11,
    gameId: 7,
    createdAt: new Date('2026-09-06T12:00:29.999Z'),
    content: 'Pista generada para identificarlo.',
    source: 'AI',
  })
  assert.equal('pokemonId' in hint, false)
  assert.equal('pokemonName' in hint, false)
}

async function testDoesNotModifyScores() {
  const game = createGame()
  const round = createRound()
  await createService({ game, round }).requestHint({ gameId: 7, roundId: 11 })
  assert.equal(game.totalScore, 0)
  assert.equal(round.hintsUsed, 0)
}

async function testSendsOnlyPokemonHintDataToGenerator() {
  let received: unknown = null
  await createService({
    hintGenerator: {
      generate: async (input) => {
        received = input
        return { content: 'Pista generada para identificarlo.', source: 'AI' }
      },
    },
  }).requestHint({ gameId: 7, roundId: 11 })

  assert.deepEqual(received, { pokemonName: 'pikachu', types: ['electric'], level: 1, difficulty: 'EASY' })
  assert.equal(JSON.stringify(received).includes('Ash'), false)
  assert.equal(JSON.stringify(received).includes('gameId'), false)
}

async function testRejectsInvalidIdentifiers() {
  await assert.rejects(() => createService().requestHint({ gameId: 0, roundId: 11 }), ValidationError)
  await assert.rejects(() => createService().requestHint({ gameId: 7, roundId: -1 }), ValidationError)
}

async function testRejectsMissingGame() {
  await assert.rejects(() => createService({ game: null }).requestHint({ gameId: 7, roundId: 11 }), GameNotFoundError)
}

async function testRejectsMissingOrForeignRound() {
  await assert.rejects(() => createService({ round: null }).requestHint({ gameId: 7, roundId: 11 }), ValidationError)
  await assert.rejects(() => createService({ round: createRound({ gameId: 8 }) }).requestHint({ gameId: 7, roundId: 11 }), ValidationError)
}

async function testRejectsFinishedGame() {
  await assert.rejects(() => createService({ game: createGame('FINISHED') }).requestHint({ gameId: 7, roundId: 11 }), GameNotInProgressError)
}

async function testRejectsResolvedAndExpiredRounds() {
  await assert.rejects(
    () => createService({ round: createRound({ finishedAt: new Date('2026-09-06T12:00:10.000Z') }) }).requestHint({ gameId: 7, roundId: 11 }),
    RoundAlreadyResolvedError,
  )
  await assert.rejects(
    () => createService({ now: '2026-09-06T12:00:30.000Z' }).requestHint({ gameId: 7, roundId: 11 }),
    RoundExpiredError,
  )
}

async function testPreservesLimitErrorFromAtomicPersistence() {
  await assert.rejects(
    () => createService({ registerRequest: async () => { throw new HintLimitReachedError() } }).requestHint({ gameId: 7, roundId: 11 }),
    HintLimitReachedError,
  )
}

async function runTests() {
  await testRequestsPendingHintWithoutSensitiveData()
  await testDoesNotModifyScores()
  await testSendsOnlyPokemonHintDataToGenerator()
  await testRejectsInvalidIdentifiers()
  await testRejectsMissingGame()
  await testRejectsMissingOrForeignRound()
  await testRejectsFinishedGame()
  await testRejectsResolvedAndExpiredRounds()
  await testPreservesLimitErrorFromAtomicPersistence()
  console.log('Hint service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})