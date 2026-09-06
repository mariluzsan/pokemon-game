export const MAX_HINTS_PER_ROUND = 3
export const HINT_PENALTY_PER_HINT = 100

export interface Hint {
  level: number
  content: string
  penalty: number
  totalScore: number
  hintsUsed: number
  hintsRemaining: number
}

export interface RequestHintInput {
  gameId: number
  roundId: number
}