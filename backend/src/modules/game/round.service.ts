import { PokemonApiError } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, RoundNotExpiredError, RoundNotCompletedError, ValidationError } from './game.errors.js'
import { GameRepository } from './game.repository.js'
import { RoundAlreadyResolvedError, RoundRepository } from './round.repository.js'
import { MAX_ROUNDS, ROUND_TIME_LIMIT_SECONDS, type CreateRoundInput, type GuessResult, type Round, type RoundChallenge, type RoundCompletion, type SubmitGuessInput } from './round.types.js'
import { PokemonApiClient } from '../pokemon/pokemon.client.js'
import { HINT_PENALTY_PER_HINT } from '../hints/hint.types.js'

interface GameReader {
  findById(id: number): ReturnType<GameRepository['findById']>
}

interface RoundWriter {
  create(gameId: number, roundNumber: number, pokemonId: number, difficulty: Round['difficulty']): Promise<Round>
  findById(roundId: number): ReturnType<RoundRepository['findById']>
  updateGuess(roundId: number, finishedAt: Date, timeTaken: number, isCorrect: boolean, gameId: number, calculateScore: () => number): Promise<RoundCompletion | number>
  expireRound?(roundId: number, gameId: number, finishedAt: Date): Promise<RoundCompletion>
  findUsedPokemonIds?(gameId: number): Promise<number[]>
}

interface PokemonPicker {
  selectRandomPokemon(difficulty: Round['difficulty'], excludedPokemonIds: readonly number[]): Promise<number>
  getPokemonImageUrl(pokemonId: number): ReturnType<PokemonApiClient['getPokemonImageUrl']>
  getPokemonName(pokemonId: number): ReturnType<PokemonApiClient['getPokemonName']>
}

const DIFFICULTY_BONUS: Record<string, number> = {
  EASY: 0,
  MEDIUM: 200,
  HARD: 400,
}

const TIME_BONUS_COEFFICIENT = 500
const TIME_BONUS_DIVISOR = 30_000

export function calculateScore(
  isCorrect: boolean,
  difficulty: string,
  elapsedMilliseconds: number,
): number {
  if (!isCorrect) {
    return 0
  }

  const baseScore = 1000
  const difficultyBonus = DIFFICULTY_BONUS[difficulty] ?? 0
  const remainingMs = Math.max(0, TIME_BONUS_DIVISOR - elapsedMilliseconds)
  const timeBonus = Math.floor((TIME_BONUS_COEFFICIENT * remainingMs) / TIME_BONUS_DIVISOR)
  return baseScore + difficultyBonus + timeBonus
}

export class RoundService {
  constructor(
    private readonly gameRepository: GameReader = new GameRepository(),
    private readonly roundRepository: RoundWriter = new RoundRepository(),
    private readonly pokemonPicker: PokemonPicker = new PokemonApiClient(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createRound(input: CreateRoundInput): Promise<Round> {
    if (!Number.isInteger(input.gameId) || input.gameId <= 0) {
      throw new ValidationError('El identificador de la partida no es valido.')
    }

    const game = await this.gameRepository.findById(input.gameId)

    if (!game) {
      throw new GameNotFoundError()
    }

    if (game.status !== 'IN_PROGRESS') {
      throw new GameNotInProgressError()
    }

    if (game.currentRound > MAX_ROUNDS) {
      throw new GameNotInProgressError()
    }

    const excludedPokemonIds = this.roundRepository.findUsedPokemonIds
      ? await this.roundRepository.findUsedPokemonIds(game.id)
      : []
    const pokemonId = await this.pokemonPicker.selectRandomPokemon(game.difficulty, excludedPokemonIds)

    return this.roundRepository.create(
      game.id,
      game.currentRound,
      pokemonId,
      game.difficulty,
    )
  }

  async getRoundChallenge(gameId: number, roundId: number): Promise<RoundChallenge> {
    if (!Number.isInteger(gameId) || gameId <= 0) {
      throw new ValidationError('El identificador de la partida no es valido.')
    }

    if (!Number.isInteger(roundId) || roundId <= 0) {
      throw new ValidationError('El identificador de la ronda no es valido.')
    }

    const round = await this.roundRepository.findById(roundId)

    if (!round) {
      throw new ValidationError('La ronda no existe.')
    }

    if (round.gameId !== gameId) {
      throw new ValidationError('La ronda no pertenece a la partida.')
    }

    const { imageUrl } = await this.pokemonPicker.getPokemonImageUrl(round.pokemonId)

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      imageUrl,
      difficulty: round.difficulty,
      timeLimitSeconds: ROUND_TIME_LIMIT_SECONDS,
    }
  }

  async isRoundExpired(roundId: number): Promise<boolean> {
    const round = await this.roundRepository.findById(roundId)

    if (!round) {
      throw new ValidationError('La ronda no existe.')
    }

    const elapsedMilliseconds = this.now().getTime() - new Date(round.startedAt).getTime()
    return elapsedMilliseconds >= ROUND_TIME_LIMIT_SECONDS * 1000
  }

  async submitGuess(input: SubmitGuessInput): Promise<GuessResult> {
    if (!Number.isInteger(input.gameId) || input.gameId <= 0) {
      throw new ValidationError('El identificador de la partida no es valido.')
    }

    if (!Number.isInteger(input.roundId) || input.roundId <= 0) {
      throw new ValidationError('El identificador de la ronda no es valido.')
    }

    if (typeof input.answer !== 'string' || input.answer.trim() === '') {
      throw new ValidationError('La respuesta es obligatoria.')
    }

    const game = await this.gameRepository.findById(input.gameId)

    if (!game) {
      throw new GameNotFoundError()
    }

    if (game.status !== 'IN_PROGRESS') {
      throw new GameNotInProgressError()
    }

    const round = await this.roundRepository.findById(input.roundId)

    if (!round) {
      throw new ValidationError('La ronda no existe.')
    }

    if (round.gameId !== input.gameId) {
      throw new ValidationError('La ronda no pertenece a la partida.')
    }

    const finishedAt = this.now()
    const elapsedMilliseconds = finishedAt.getTime() - new Date(round.startedAt).getTime()

    if (elapsedMilliseconds >= ROUND_TIME_LIMIT_SECONDS * 1000) {
      throw new RoundExpiredError()
    }

    const pokemonName = await this.pokemonPicker.getPokemonName(round.pokemonId)
    const isCorrect = normalizeGuess(input.answer) === normalizeGuess(pokemonName)
    const timeTaken = Math.max(0, Math.floor(elapsedMilliseconds / 1000))
    let score = 0

    let completion: RoundCompletion | number
    try {
      completion = await this.roundRepository.updateGuess(
        input.roundId,
        finishedAt,
        timeTaken,
        isCorrect,
        input.gameId,
        () => {
          score = calculateScore(isCorrect, round.difficulty, elapsedMilliseconds)
          return score
        },
      )
    } catch (error) {
      if (error instanceof RoundAlreadyResolvedError) {
        throw error
      }
      throw error
    }

    const roundCompletion = typeof completion === 'number'
      ? { hintPenalty: 0, totalScore: completion, status: 'IN_PROGRESS' as const, finishedAt: null }
      : completion

    return {
      isCorrect,
      score,
      hintPenalty: roundCompletion.hintPenalty,
      totalScore: roundCompletion.totalScore,
      status: roundCompletion.status,
      finishedAt: roundCompletion.finishedAt,
    }
  }

  async expireRound(gameId: number, roundId: number): Promise<RoundCompletion> {
    if (!Number.isInteger(gameId) || gameId <= 0 || !Number.isInteger(roundId) || roundId <= 0) {
      throw new ValidationError('El identificador de la partida o ronda no es valido.')
    }

    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new GameNotFoundError()
    }

    if (game.status !== 'IN_PROGRESS') {
      return {
        hintPenalty: 0,
        totalScore: game.totalScore,
        status: game.status,
        finishedAt: game.finishedAt,
      }
    }

    const round = await this.roundRepository.findById(roundId)
    if (!round || round.gameId !== gameId) {
      throw new ValidationError('La ronda no existe o no pertenece a la partida.')
    }

    if (round.finishedAt) {
      return {
        hintPenalty: 0,
        totalScore: game.totalScore,
        status: game.status,
        finishedAt: game.finishedAt,
      }
    }

    const finishedAt = this.now()
    const elapsedMilliseconds = finishedAt.getTime() - new Date(round.startedAt).getTime()
    if (elapsedMilliseconds < ROUND_TIME_LIMIT_SECONDS * 1000) {
      throw new RoundNotExpiredError()
    }

    if (!this.roundRepository.expireRound) {
      throw new Error('La persistencia de expiracion no esta disponible.')
    }

    return this.roundRepository.expireRound(roundId, gameId, finishedAt)
  }
}

function normalizeGuess(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('en-US')
    .replaceAll('♀', '-f')
    .replaceAll('♂', '-m')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}