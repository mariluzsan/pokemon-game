import { GameNotFoundError, ValidationError } from './game.errors.js'
import { GameRepository } from './game.repository.js'
import { RoundRepository } from './round.repository.js'
import type { PerformanceLevelResult, PerformanceSnapshot } from './game.types.js'

const MAX_HINTS_PER_ROUND = 3
const PRECISION_WEIGHT = 0.6
const INDEPENDENCE_WEIGHT = 0.15
const MEDIUM_MIN_SCORE = 40
const HARD_MIN_SCORE = 70

export function calculatePerformanceLevel(snapshot: PerformanceSnapshot): PerformanceLevelResult {
  const roundsPlayed = snapshot.correctAnswers + snapshot.incorrectAnswers
  const precision = roundsPlayed === 0
    ? 0
    : (snapshot.correctAnswers / roundsPlayed) * 100

  const independence = roundsPlayed === 0
    ? 0
    : Math.max(0, 1 - (snapshot.totalHintsUsed / (roundsPlayed * MAX_HINTS_PER_ROUND))) * 100

  const score = Number((precision * PRECISION_WEIGHT + independence * INDEPENDENCE_WEIGHT).toFixed(4))

  if (score >= HARD_MIN_SCORE) {
    return {
      level: 'HARD',
      score,
      precision,
      independence,
      roundsPlayed,
    }
  }

  if (score >= MEDIUM_MIN_SCORE) {
    return {
      level: 'MEDIUM',
      score,
      precision,
      independence,
      roundsPlayed,
    }
  }

  return {
    level: 'EASY',
    score,
    precision,
    independence,
    roundsPlayed,
  }
}

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

  async getPerformanceLevel(gameId: number): Promise<PerformanceLevelResult> {
    const snapshot = await this.getPerformanceSnapshot(gameId)
    return calculatePerformanceLevel(snapshot)
  }
}