export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface Game {
  id: number
  playerName: string
  totalScore: number
  currentRound: number
  difficulty: Difficulty
  status: 'IN_PROGRESS' | 'FINISHED'
  startedAt: string
  finishedAt: string | null
}

export interface CreateGameInput {
  playerName: string
}

export interface PerformanceSnapshot {
  correctAnswers: number
  incorrectAnswers: number
  averageResponseTimeSeconds: number
  totalHintsUsed: number
}

export type PerformanceLevel = 'EASY' | 'MEDIUM' | 'HARD'

export interface PerformanceLevelResult {
  level: PerformanceLevel
  score: number
  precision: number
  independence: number
  roundsPlayed: number
}

