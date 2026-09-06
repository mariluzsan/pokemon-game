import { PokemonApiClient } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, ValidationError } from './game.errors.js'
import { GameRepository } from './game.repository.js'
import { RoundRepository } from './round.repository.js'
import type { CreateRoundInput, Round } from './round.types.js'

interface GameReader {
  findById(id: number): ReturnType<GameRepository['findById']>
}

interface RoundWriter {
  create(gameId: number, roundNumber: number, pokemonId: number, difficulty: Round['difficulty']): Promise<Round>
}

interface PokemonPicker {
  selectRandomPokemon(): Promise<number>
}

export class RoundService {
  constructor(
    private readonly gameRepository: GameReader = new GameRepository(),
    private readonly roundRepository: RoundWriter = new RoundRepository(),
    private readonly pokemonPicker: PokemonPicker = new PokemonApiClient(),
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
}