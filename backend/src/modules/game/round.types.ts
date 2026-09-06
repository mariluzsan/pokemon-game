import type { Game } from './game.types.js'

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
}

export interface CreateRoundInput {
  gameId: number
}