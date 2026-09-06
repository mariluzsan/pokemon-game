import assert from 'node:assert/strict'
import { PokemonApiError } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, ValidationError } from './game.errors.js'
import { normalizePlayerName } from './game.service.js'
import { ROUND_TIME_LIMIT_SECONDS } from './round.types.js'
import { RoundAlreadyResolvedError } from './round.repository.js'
import { RoundService, calculateScore } from './round.service.js'

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
          hintsUsed: 0,
        }
      },
      findById: async () => null,
      updateGuess: async () => 0,
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
    hintsUsed: 0,
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
        finishedAt: null,
        isCorrect: null,
        hintsUsed: 0,
      }),
      updateGuess: async () => 0,
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
  assert.equal('pokemonId' in challenge, false)
  assert.equal('pokemonName' in challenge, false)
}

async function testRoundExpiresAtConfiguredBoundary() {
  const round = {
    id: 11,
    gameId: 7,
    roundNumber: 1,
    difficulty: 'EASY' as const,
    startedAt: '2026-09-05T12:00:00.000Z',
    pokemonId: 25,
    finishedAt: null,
    isCorrect: null,
    hintsUsed: 0,
  }
  const repository = {
    create: async () => { throw new Error('No debe crear otra ronda') },
    findById: async () => round,
    updateGuess: async () => 0,
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
      updateGuess: async () => 0,
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
      updateGuess: async () => 0,
    },
    { 
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
  )

  await assert.rejects(() => roundService.createRound({ gameId: 7 }), GameNotInProgressError)
}

async function testRejectsRoundAfterTenRounds() {
  const roundService = new RoundService(
    { findById: async () => createGame({ currentRound: 11 }) },
    {
      create: async () => { throw new Error('No debe persistir') },
      findById: async () => null,
      updateGuess: async () => 0,
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
        finishedAt: null,
        isCorrect: null,
        hintsUsed: 0,
      }),
      updateGuess: async () => 0,
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

function createGuessRound(overrides: Partial<{ gameId: number; startedAt: string; pokemonId: number; hintsUsed: number }> = {}) {
  return {
    id: 11,
    gameId: overrides.gameId ?? 7,
    roundNumber: 1,
    difficulty: 'EASY' as const,
    startedAt: overrides.startedAt ?? '2026-09-05T12:00:00.000Z',
    pokemonId: overrides.pokemonId ?? 25,
    finishedAt: null,
    isCorrect: null,
    hintsUsed: overrides.hintsUsed ?? 0,
  }
}

function createGuessService(options: {
  round?: ReturnType<typeof createGuessRound> | null
  pokemonName?: string
  now?: string
  updateGuess?: (roundId: number, finishedAt: Date, timeTaken: number, isCorrect: boolean, gameId: number, score: number) => Promise<number>
} = {}) {
  return new RoundService(
    { findById: async () => createGame() },
    {
      create: async () => { throw new Error('No debe crear otra ronda') },
      findById: async () => options.round === undefined ? createGuessRound() : options.round,
      updateGuess: options.updateGuess ?? (async () => 0),
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
  let persisted: { roundId: number; timeTaken: number; isCorrect: boolean; score: number } | null = null
  const roundService = createGuessService({
    updateGuess: async (roundId, _finishedAt, timeTaken, isCorrect, gameId, score) => {
      persisted = { roundId, timeTaken, isCorrect, score }
      return 1234 // mock totalScore
    },
  })

  const result = await roundService.submitGuess({ gameId: 7, roundId: 11, answer: '  PiKaChU  ' })

  assert.equal(result.isCorrect, true)
  assert.equal(typeof result.score, 'number')
  assert.equal(typeof result.totalScore, 'number')
  assert.deepEqual(persisted, { roundId: 11, timeTaken: 29, isCorrect: true, score: result.score })
}

async function testAcceptsFormattedPokemonNames() {
  const formattedNames = [
    { answer: 'Baxcalibur', pokemonName: 'baxcalibur' },
    { answer: 'Mr. Mime', pokemonName: 'mr-mime' },
    { answer: "Farfetch'd", pokemonName: 'farfetchd' },
    { answer: 'Flabébé', pokemonName: 'flabebe' },
    { answer: 'Nidoran♀', pokemonName: 'nidoran-f' },
    { answer: 'Mime Jr.', pokemonName: 'mime-jr' },
  ]

  for (const { answer, pokemonName } of formattedNames) {
    const result = await createGuessService({
      pokemonName,
      updateGuess: async () => 0,
    }).submitGuess({ gameId: 7, roundId: 11, answer })

    assert.equal(result.isCorrect, true, `${answer} debe coincidir con ${pokemonName}`)
  }
}

async function testReturnsCorrectRoundResultWithoutRevealingPokemon() {
  const roundService = createGuessService({
    now: '2026-09-05T12:00:05.000Z',
    updateGuess: async (_roundId, _finishedAt, _timeTaken, _isCorrect, _gameId, score) => score + 500,
  })

  const result = await roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' })

  assert.deepEqual(result, {
    isCorrect: true,
    score: 1416,
    totalScore: 1916,
  })
  assert.equal('pokemonId' in result, false)
  assert.equal('pokemonName' in result, false)
}

async function testSubmitsIncorrectGuessWithoutRevealingName() {
  const roundService = createGuessService({
    updateGuess: async () => 0, // totalScore remains 0 for incorrect answer
  })

  const result = await roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'charmander' })

  assert.equal(result.isCorrect, false)
  assert.equal(result.score, 0)
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

function testCalculateScoreWithCorrectAnswerEasy() {
  const score = calculateScore(true, 'EASY', 5000)
  // base 1000 + difficulty_bonus 0 + time_bonus floor(500 * (30000 - 5000) / 30000) = floor(500 * 25000 / 30000) = floor(416.67) = 416
  assert.equal(score, 1000 + 0 + 416)
  assert.equal(score, 1416)
}

function testCalculateScoreWithCorrectAnswerMedium() {
  const score = calculateScore(true, 'MEDIUM', 5000)
  // base 1000 + difficulty_bonus 200 + time_bonus 416 = 1616
  assert.equal(score, 1000 + 200 + 416)
  assert.equal(score, 1616)
}

function testCalculateScoreWithCorrectAnswerHard() {
  const score = calculateScore(true, 'HARD', 5000)
  // base 1000 + difficulty_bonus 400 + time_bonus 416 = 1816
  assert.equal(score, 1000 + 400 + 416)
  assert.equal(score, 1816)
}

function testCalculateScoreWithIncorrectAnswer() {
  const score = calculateScore(false, 'EASY', 5000)
  assert.equal(score, 0)
}

function testCalculateScoreWithMaxTimeBonus() {
  // elapsed 0, remaining 30000
  // time_bonus floor(500 * 30000 / 30000) = floor(500) = 500
  const score = calculateScore(true, 'EASY', 0)
  assert.equal(score, 1000 + 0 + 500)
  assert.equal(score, 1500)
}

function testCalculateScoreWithZeroTimeBonus() {
  // elapsed 30000, remaining 0
  // time_bonus floor(500 * 0 / 30000) = floor(0) = 0
  const score = calculateScore(true, 'EASY', 30000)
  assert.equal(score, 1000 + 0 + 0)
  assert.equal(score, 1000)
}

function testCalculateScoreWithFlooringEffect() {
  // elapsed 1000, remaining 29000
  // time_bonus floor(500 * 29000 / 30000) = floor(483.33) = 483
  const score = calculateScore(true, 'EASY', 1000)
  assert.equal(score, 1000 + 0 + 483)
  assert.equal(score, 1483)
}

function testCalculateScoreAppliesHintPenalty() {
  assert.equal(calculateScore(true, 'EASY', 5000, 1), 1316)
  assert.equal(calculateScore(true, 'EASY', 5000, 3), 1116)
  assert.equal(calculateScore(true, 'EASY', 0, 3), 1200)
}

function testCalculateScoreNeverBecomesNegativeWithHints() {
  assert.equal(calculateScore(true, 'EASY', 30000, 3), 700)
  assert.equal(calculateScore(false, 'HARD', 0, 3), 0)
}

async function testSubmitsGuessWithScoreAndTotalScore() {
  let persistedData: { score: number; totalScore: number } | null = null
  const roundService = createGuessService({
    updateGuess: async (roundId, _finishedAt, timeTaken, isCorrect, gameId, score) => {
      // Mock to capture the score calculation
      persistedData = { score, totalScore: 1234 } // totalScore is what would be returned
      return 1234
    },
  })

  const result = await roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' })

  assert.equal(result.isCorrect, true)
  assert.equal(typeof result.score, 'number')
  assert.equal(typeof result.totalScore, 'number')
  assert.equal(result.totalScore, 1234)
}

async function testRejectsSecondGuessForSameRound() {
  // Create a round that is already finished
  const finishedRound = createGuessRound()
  
  const roundService = new RoundService(
    { findById: async () => createGame() },
    {
      create: async () => { throw new Error('No debe crear otra ronda') },
      findById: async () => finishedRound,
      updateGuess: async () => {
        // Simulate that the round is already resolved
        throw new RoundAlreadyResolvedError()
      },
    },
    {
      selectRandomPokemon: async () => 25,
      getPokemonImageUrl: async () => ({ imageUrl: 'https://example.test/pikachu.png' }),
      getPokemonName: async () => 'pikachu',
    },
    () => new Date('2026-09-05T12:00:29.999Z'),
  )

  await assert.rejects(
    () => roundService.submitGuess({ gameId: 7, roundId: 11, answer: 'pikachu' }),
    RoundAlreadyResolvedError,
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
  await testRejectsRoundAfterTenRounds()
  await testRejectsChallengeFromAnotherGame()
  await testSubmitsCorrectGuessAndPersistsOnlyEvaluation()
  await testAcceptsFormattedPokemonNames()
  await testReturnsCorrectRoundResultWithoutRevealingPokemon()
  await testSubmitsIncorrectGuessWithoutRevealingName()
  await testRejectsInvalidGuessInput()
  await testRejectsGuessAtDeadline()
  await testRejectsGuessForMissingRound()
  await testRejectsGuessFromAnotherGame()
  await testRejectsInvalidGuessIdentifiers()
  await testMapsPokemonApiFailureDuringGuess()
  
  // US-06 tests
  testCalculateScoreWithCorrectAnswerEasy()
  testCalculateScoreWithCorrectAnswerMedium()
  testCalculateScoreWithCorrectAnswerHard()
  testCalculateScoreWithIncorrectAnswer()
  testCalculateScoreWithMaxTimeBonus()
  testCalculateScoreWithZeroTimeBonus()
  testCalculateScoreWithFlooringEffect()
  testCalculateScoreAppliesHintPenalty()
  testCalculateScoreNeverBecomesNegativeWithHints()
  await testSubmitsGuessWithScoreAndTotalScore()
  await testRejectsSecondGuessForSameRound()

  console.log('Game service tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

