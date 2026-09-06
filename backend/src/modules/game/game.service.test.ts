import assert from 'node:assert/strict'
import { PokemonApiError } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, ValidationError } from './game.errors.js'
import { normalizePlayerName } from './game.service.js'
import { ROUND_TIME_LIMIT_SECONDS } from './round.types.js'
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
      findById: async () => null,
      updateGuess: async () => undefined,
    },
    { 
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
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

async function testChallengeIncludesConfiguredTimeLimit() {
  const roundService = new RoundService(
    { findById: async () => createGame() },
    {
      create: async () => { throw new Error('No debe crear otra ronda') },
      findById: async () => ({
        id: 11,
        gameId: 7,
        roundNumber: 1,
        difficulty: 'EASY',
        startedAt: '2026-09-05T12:00:00.000Z',
        pokemonId: 25,
      }),
      updateGuess: async () => undefined,
    },
    {
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
  )

  const challenge = await roundService.getRoundChallenge(7, 11)

  assert.equal(challenge.timeLimitSeconds, ROUND_TIME_LIMIT_SECONDS)
  assert.equal(challenge.timeLimitSeconds, 30)
}

async function testRoundExpiresAtConfiguredBoundary() {
  const round = {
    id: 11,
    gameId: 7,
    roundNumber: 1,
    difficulty: 'EASY' as const,
    startedAt: '2026-09-05T12:00:00.000Z',
    pokemonId: 25,
  }
  const repository = {
    create: async () => { throw new Error('No debe crear otra ronda') },
    findById: async () => round,
    updateGuess: async () => undefined,
  }
  const pokemonPicker = {
    selectRandomPokemon: async () => 25,
    getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
    getPokemonName: async () => 'pikachu',
  }

  const beforeDeadline = new RoundService(
    { findById: async () => createGame() },
    repository,
    pokemonPicker,
    () => new Date('2026-09-05T12:00:29.999Z'),
  )
  const atDeadline = new RoundService(
    { findById: async () => createGame() },
    repository,
    pokemonPicker,
    () => new Date('2026-09-05T12:00:30.000Z'),
  )

  assert.equal(await beforeDeadline.isRoundExpired(11), false)
  assert.equal(await atDeadline.isRoundExpired(11), true)
}

async function testRejectsMissingGame() {
  const roundService = new RoundService(
    { findById: async () => null },
    { 
      create: async () => { throw new Error('No debe persistir') }, 
      findById: async () => null,
      updateGuess: async () => undefined,
    },
    { 
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
  )

  await assert.rejects(() => roundService.createRound({ gameId: 7 }), GameNotFoundError)
}

async function testRejectsFinishedGame() {
  const roundService = new RoundService(
    { findById: async () => createGame({ status: 'FINISHED' }) },
    { 
      create: async () => { throw new Error('No debe persistir') }, 
      findById: async () => null,
      updateGuess: async () => undefined,
    },
    { 
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
  )

  await assert.rejects(() => roundService.createRound({ gameId: 7 }), GameNotInProgressError)
}

async function testRejectsChallengeFromAnotherGame() {
  const roundService = new RoundService(
    { findById: async () => createGame() },
    {
      create: async () => { throw new Error('No debe persistir') },
      findById: async () => ({
        id: 11,
        gameId: 7,
        roundNumber: 1,
        difficulty: 'EASY',
        startedAt: '2026-09-05T12:01:00.000Z',
        pokemonId: 25,
      }),
      updateGuess: async () => undefined,
    },
    {
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
  )

  await assert.rejects(
    () => roundService.getRoundChallenge(999, 11),
    /La ronda no pertenece a la partida\./,
  )
}

function createGuessRound(overrides: Partial<{ gameId: number; startedAt: string; pokemonId: number }> = {}) {
  return {
    id: 11,
    gameId: overrides.gameId ?? 7,
    roundNumber: 1,
    difficulty: 'EASY' as const,
    startedAt: overrides.startedAt ?? '2026-09-05T12:00:00.000Z',
    pokemonId: overrides.pokemonId ?? 25,
  }
}

function createGuessService(options: {
  round?: ReturnType<typeof createGuessRound> | null
  pokemonName?: string
  now?: string
  updateGuess?: (roundId: number, finishedAt: Date, timeTaken: number, isCorrect: boolean) => Promise<void>
} = {}) {
  return new RoundService(
    { findById: async () => createGame() },
    {
      create: async () => { throw new Error('No debe crear otra ronda') },
      findById: async () => options.round === undefined ? createGuessRound() : options.round,
      updateGuess: options.updateGuess ?? (async () => undefined),
    },
    {
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => options.pokemonName ?? 'pikachu',
    },
    () => new Date(options.now ?? '2026-09-05T12:00:29.999Z'),
  )
}

async function testSubmitsCorrectGuessAndPersistsOnlyEvaluation() {
  let persisted: { roundId: number; timeTaken: number; isCorrect: boolean } | null = null
  const roundService = createGuessService({
    updateGuess: async (roundId, _finishedAt, timeTaken, isCorrect) => {
      persisted = { roundId, timeTaken, isCorrect }
    },
  })

  const result = await roundService.submitGuess({ gameId: 7, roundId: 11, answer: '  PiKaChU  ' })

  assert.deepEqual(result, { isCorrect: true })
  assert.deepEqual(persisted, { roundId: 11, timeTaken: 29, isCorrect: true })
}

async function testSubmitsIncorrectGuessWithoutRevealingName() {
  const roundService = createGuessService()

  const result = await roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'charmander' })

  assert.deepEqual(result, { isCorrect: false })
  assert.equal('pokemonId' in result, false)
  assert.equal('pokemonName' in result, false)
}

async function testRejectsInvalidGuessInput() {
  const roundService = createGuessService()

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: 11, answer: '   ' }),
    ValidationError,
  )
}

async function testRejectsGuessAtDeadline() {
  const roundService = createGuessService({ now: '2026-09-05T12:00:30.000Z' })

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' }),
    RoundExpiredError,
  )
}

async function testRejectsGuessForMissingRound() {
  const roundService = createGuessService({ round: null })

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' }),
    /La ronda no existe\./,
  )
}

async function testRejectsGuessFromAnotherGame() {
  const roundService = createGuessService({ round: createGuessRound({ gameId: 8 }) })

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' }),
    /La ronda no pertenece a la partida\./,
  )
}

async function testRejectsInvalidGuessIdentifiers() {
  const roundService = createGuessService()

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 0, roundId: 11, answer: 'pikachu' }),
    ValidationError,
  )
  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: -1, answer: 'pikachu' }),
    ValidationError,
  )
}

async function testMapsPokemonApiFailureDuringGuess() {
  const roundService = new RoundService(
    { findById: async () => createGame() },
    {
      create: async () => { throw new Error('No debe crear otra ronda') },
      findById: async () => createGuessRound(),
      updateGuess: async () => { throw new Error('No debe persistir') },
    },
    {
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => { throw new PokemonApiError() },
    },
    () => new Date('2026-09-05T12:00:29.999Z'),
  )

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' }),
    PokemonApiError,
  )
}

async function runTests() {
  testNormalizesPlayerName()
  testRejectsMissingPlayerName()
  testRejectsLongPlayerName()
  await testCreatesRoundWithoutExposingPokemon()
  await testChallengeIncludesConfiguredTimeLimit()
  await testRoundExpiresAtConfiguredBoundary()
  await testRejectsMissingGame()
  await testRejectsFinishedGame()
  await testRejectsChallengeFromAnotherGame()
  await testSubmitsCorrectGuessAndPersistsOnlyEvaluation()
  await testSubmitsIncorrectGuessWithoutRevealingName()
  await testRejectsInvalidGuessInput()
  await testRejectsGuessAtDeadline()
  await testRejectsGuessForMissingRound()
  await testRejectsGuessFromAnotherGame()
  await testRejectsInvalidGuessIdentifiers()
  await testMapsPokemonApiFailureDuringGuess()

  console.log('Game service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

