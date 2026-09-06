export interface Game {
  id: number
  playerName: string
  totalScore: number
  currentRound: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
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

