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

function createRound(overrides: Partial<{ gameId: number; startedAt: string; finishedAt: Date | null; hintsUsed: number }> = {}) {
  return {
    id: 11,
    gameId: overrides.gameId ?? 7,
    roundNumber: 1,
    difficulty: 'EASY' as const,
    startedAt: overrides.startedAt ?? '2026-09-06T12:00:00.000Z',
    pokemonId: 25,
    finishedAt: overrides.finishedAt ?? null,
    isCorrect: null,
    hintsUsed: overrides.hintsUsed ?? 0,
  }
}

function createService(options: {
  game?: ReturnType<typeof createGame> | null
  round?: ReturnType<typeof createRound> | null
  now?: string
  registerGeneratedHint?: (record: { id: number; gameId: number; createdAt: Date; generate: (level: number) => Promise<{ content: string; source: 'AI' | 'FALLBACK' }> }) => Promise<{ level: number; content: string; hintsUsed: number; hintsRemaining: number }>
  hintGenerator?: HintGenerator
} = {}) {
  return new HintService(
    { findById: async () => options.game === undefined ? createGame() : options.game },
    { findById: async () => options.round === undefined ? createRound() : options.round },
    { registerGeneratedHint: options.registerGeneratedHint ?? (async (record) => {
      const generated = await record.generate(1)
      return { level: 1, content: generated.content, hintsUsed: 1, hintsRemaining: 2 }
    }) },
    () => new Date(options.now ?? '2026-09-06T12:00:29.999Z'),
    { getPokemonHintData: async () => ({ name: 'pikachu', types: ['electric'] }) },
    options.hintGenerator ?? { generate: async () => ({ content: 'Pista generada para identificarlo.', source: 'AI' }) },
  )
}

async function testRequestsPendingHintWithoutSensitiveData() {
  let request: { id: number; gameId: number; createdAt: Date } | null = null
  const hint = await createService({
    registerGeneratedHint: async (record) => {
      request = { id: record.id, gameId: record.gameId, createdAt: record.createdAt }
      const generated = await record.generate(1)
      return { level: 1, content: generated.content, hintsUsed: 1, hintsRemaining: 2 }
    },
  }).requestHint({ gameId: 7, roundId: 11 })

  assert.deepEqual(hint, { level: 1, content: 'Pista generada para identificarlo.', hintsUsed: 1, hintsRemaining: 2 })
  assert.deepEqual(request, {
    id: 11,
    gameId: 7,
    createdAt: new Date('2026-09-06T12:00:29.999Z'),
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
    () => createService({ registerGeneratedHint: async () => { throw new HintLimitReachedError() } }).requestHint({ gameId: 7, roundId: 11 }),
    HintLimitReachedError,
  )
}

async function testAssignsTheNextLevelAndAuthoritativeCounters() {
  for (const hintsUsed of [0, 1, 2]) {
    let generatorLevel: number | null = null
    const hint = await createService({
      round: createRound({ hintsUsed }),
      hintGenerator: {
        generate: async (input) => {
          generatorLevel = input.level
          return { content: `Pista progresiva numero ${input.level}.`, source: 'AI' }
        },
      },
      registerGeneratedHint: async (record) => {
        const level = hintsUsed + 1
        const generated = await record.generate(level)
        return { level, content: generated.content, hintsUsed: level, hintsRemaining: 3 - level }
      },
    }).requestHint({ gameId: 7, roundId: 11 })

    assert.equal(generatorLevel, hintsUsed + 1)
    assert.deepEqual(hint, {
      level: hintsUsed + 1,
      content: `Pista progresiva numero ${hintsUsed + 1}.`,
      hintsUsed: hintsUsed + 1,
      hintsRemaining: 2 - hintsUsed,
    })
  }
}

async function testRejectsAtLimitWithoutInvokingGenerator() {
  let generatorCalls = 0
  await assert.rejects(
    () => createService({
      round: createRound({ hintsUsed: 3 }),
      hintGenerator: {
        generate: async () => {
          generatorCalls += 1
          return { content: 'Esta pista no debe generarse.', source: 'AI' }
        },
      },
    }).requestHint({ gameId: 7, roundId: 11 }),
    HintLimitReachedError,
  )
  assert.equal(generatorCalls, 0)
}

async function testFailedGenerationDoesNotConsumeHint() {
  let hintsUsed = 0
  await assert.rejects(
    () => createService({
      hintGenerator: { generate: async () => { throw new Error('Fallo tecnico simulado.') } },
      registerGeneratedHint: async (record) => {
        const generated = await record.generate(hintsUsed + 1)
        hintsUsed += 1
        return { level: hintsUsed, content: generated.content, hintsUsed, hintsRemaining: 3 - hintsUsed }
      },
    }).requestHint({ gameId: 7, roundId: 11 }),
    /Fallo tecnico simulado/,
  )
  assert.equal(hintsUsed, 0)
}

async function testConcurrentRequestsWithOneHintLeftGenerateOnlyOneHint() {
  let hintsUsed = 2
  let generatorCalls = 0
  let releaseLock: (() => void) | undefined
  let lock = Promise.resolve()
  const registerGeneratedHint = async (record: { generate: (level: number) => Promise<{ content: string; source: 'AI' | 'FALLBACK' }> }) => {
    const previousLock = lock
    lock = new Promise<void>((resolve) => { releaseLock = resolve })
    await previousLock
    try {
      if (hintsUsed >= 3) {
        throw new HintLimitReachedError()
      }
      const level = hintsUsed + 1
      const generated = await record.generate(level)
      hintsUsed = level
      return { level, content: generated.content, hintsUsed, hintsRemaining: 3 - hintsUsed }
    } finally {
      releaseLock?.()
    }
  }
  const hintGenerator: HintGenerator = {
    generate: async (input) => {
      generatorCalls += 1
      return { content: `Pista concurrente nivel ${input.level}.`, source: 'AI' }
    },
  }
  const options = { round: createRound({ hintsUsed: 2 }), registerGeneratedHint, hintGenerator }
  const results = await Promise.allSettled([
    createService(options).requestHint({ gameId: 7, roundId: 11 }),
    createService(options).requestHint({ gameId: 7, roundId: 11 }),
  ])

  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1)
  assert.equal(hintsUsed, 3)
  assert.equal(generatorCalls, 1)
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
  await testAssignsTheNextLevelAndAuthoritativeCounters()
  await testRejectsAtLimitWithoutInvokingGenerator()
  await testFailedGenerationDoesNotConsumeHint()
  await testConcurrentRequestsWithOneHintLeftGenerateOnlyOneHint()
  console.log('Hint service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})