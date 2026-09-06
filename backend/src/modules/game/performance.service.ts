import { GameNotFoundError, ValidationError } from './game.errors.js'
import { GameRepository } from './game.repository.js'
import { RoundRepository } from './round.repository.js'
import type { PerformanceSnapshot } from './game.types.js'

interface GameReader {
  findById(id: number): ReturnType<GameRepository['findById']>
}

interface PerformanceReader {
  getPerformanceSnapshot(gameId: number): ReturnType<RoundRepository['getPerformanceSnapshot']>
}

export class PerformanceService {
  constructor(
    private readonly gameRepository: GameReader = new GameRepository(),
    private readonly roundRepository: PerformanceReader = new RoundRepository(),
  ) {}

  async getPerformanceSnapshot(gameId: number): Promise<PerformanceSnapshot> {
    if (!Number.isInteger(gameId) || gameId <= 0) {
      throw new ValidationError('El identificador de la partida no es valido.')
    }

    const game = await this.gameRepository.findById(gameId)

    if (!game) {
      throw new GameNotFoundError()
    }

    return this.roundRepository.getPerformanceSnapshot(gameId)
  }
}