import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, ValidationError } from '../game/game.errors.js'
import { GameRepository } from '../game/game.repository.js'
import { RoundAlreadyResolvedError, RoundRepository } from '../game/round.repository.js'
import { HintRepository } from './hint.repository.js'
import { SafeHintGenerator, type HintGenerator } from './hint.generator.js'
import { PokemonApiClient } from '../pokemon/pokemon.client.js'
import type { Hint, RequestHintInput } from './hint.types.js'

interface GameReader {
  findById(id: number): ReturnType<GameRepository['findById']>
}

interface RoundReader {
  findById(roundId: number): ReturnType<RoundRepository['findById']>
}

interface HintWriter {
  registerRequest(record: { id: number; gameId: number; createdAt: Date; content: string; source: 'AI' | 'FALLBACK' }): Promise<Hint>
}

interface PokemonHintReader {
  getPokemonHintData(pokemonId: number): ReturnType<PokemonApiClient['getPokemonHintData']>
}

export class HintService {
  constructor(
    private readonly gameRepository: GameReader = new GameRepository(),
    private readonly roundRepository: RoundReader = new RoundRepository(),
    private readonly hintRepository: HintWriter = new HintRepository(),
    private readonly now: () => Date = () => new Date(),
    private readonly pokemonReader: PokemonHintReader = new PokemonApiClient(),
    private readonly hintGenerator: HintGenerator = new SafeHintGenerator(),
  ) {}

  async requestHint(input: RequestHintInput): Promise<Hint> {
    if (!Number.isInteger(input.gameId) || input.gameId <= 0 || !Number.isInteger(input.roundId) || input.roundId <= 0) {
      throw new ValidationError('El identificador de la partida o ronda no es valido.')
    }

    const game = await this.gameRepository.findById(input.gameId)
    if (!game) {
      throw new GameNotFoundError()
    }
    if (game.status !== 'IN_PROGRESS') {
      throw new GameNotInProgressError()
    }

    const round = await this.roundRepository.findById(input.roundId)
    if (!round || round.gameId !== input.gameId) {
      throw new ValidationError('La ronda no existe o no pertenece a la partida.')
    }
    if (round.finishedAt) {
      throw new RoundAlreadyResolvedError()
    }

    const requestedAt = this.now()
    const elapsedMilliseconds = requestedAt.getTime() - new Date(round.startedAt).getTime()
    if (elapsedMilliseconds >= 30_000) {
      throw new RoundExpiredError()
    }

    const pokemon = await this.pokemonReader.getPokemonHintData(round.pokemonId)
    const generated = await this.hintGenerator.generate({
      pokemonName: pokemon.name,
      types: pokemon.types,
      level: round.hintsUsed + 1,
      difficulty: round.difficulty,
    })

    return this.hintRepository.registerRequest({
      id: input.roundId,
      gameId: input.gameId,
      createdAt: requestedAt,
      content: generated.content,
      source: generated.source,
    })
  }
}