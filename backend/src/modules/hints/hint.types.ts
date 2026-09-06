export const MAX_HINTS_PER_ROUND = 3

export interface Hint {
  level: number
  content: null
}

export interface RequestHintInput {
  gameId: number
  roundId: number
}