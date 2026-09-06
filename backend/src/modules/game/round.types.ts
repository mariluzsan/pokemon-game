import type { Game } from './game.types.js'

export const ROUND_TIME_LIMIT_SECONDS = 30

export interface Round {
  id: number
  gameId: number
  roundNumber: number
  difficulty: Game['difficulty']
  startedAt: string
}

export interface RoundChallenge {
  id: number
  roundNumber: number
  imageUrl: string
  difficulty: Game['difficulty']
  timeLimitSeconds: number
}

export interface CreateRoundInput {
  gameId: number
}