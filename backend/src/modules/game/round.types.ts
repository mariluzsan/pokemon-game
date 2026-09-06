import type { Game } from './game.types.js'

export interface Round {
  id: number
  gameId: number
  roundNumber: number
  difficulty: Game['difficulty']
  startedAt: string
}

export interface CreateRoundInput {
  gameId: number
}