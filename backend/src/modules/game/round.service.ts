import { PokemonApiError } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, ValidationError } from './game.errors.js'
import { GameRepository } from './game.repository.js'
import { RoundRepository } from './round.repository.js'
import { ROUND_TIME_LIMIT_SECONDS, type CreateRoundInput, type Round, type RoundChallenge } from './round.types.js'
import { PokemonApiClient } from '../pokemon/pokemon.client.js'

interface GameReader {
  findById(id: number): ReturnType<GameRepository['findById']>
}

interface RoundWriter {
  create(gameId: number, roundNumber: number, pokemonId: number, difficulty: Round['difficulty']): Promise<Round>
  findById(roundId: number): ReturnType<RoundRepository['findById']>
}

interface PokemonPicker {
  selectRandomPokemon(): Promise<number>
  getPokemonImageUrl(pokemonId: number): ReturnType<PokemonApiClient['getPokemonImageUrl']>
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

    const pokemonId = await this.pokemonPicker.selectRandomPokemon()

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
}