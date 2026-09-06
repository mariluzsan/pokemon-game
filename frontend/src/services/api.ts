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

interface CreateGameResponse {
  game: Game
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

export async function createGame(playerName: string): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ playerName }),
  })

  if (!response.ok) {
    throw new Error('No fue posible iniciar la partida.')
  }

  const data = await response.json() as CreateGameResponse
  return data.game
}

