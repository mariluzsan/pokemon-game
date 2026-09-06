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

export interface Round {
  id: number
  gameId: number
  roundNumber: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  startedAt: string
}

export interface RoundChallenge {
  id: number
  roundNumber: number
  imageUrl: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  timeLimitSeconds: number
}

interface CreateGameResponse {
  game: Game
}

interface CreateRoundResponse {
  round: Round
}

interface GetChallengeResponse {
  challenge: RoundChallenge
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

export async function createRound(gameId: number): Promise<Round> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/rounds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('No fue posible crear la ronda.')
  }

  const data = await response.json() as CreateRoundResponse
  return data.round
}

export async function getRoundChallenge(gameId: number, roundId: number): Promise<RoundChallenge> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/rounds/${roundId}/challenge`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('No fue posible obtener el desafio.')
  }

  const data = await response.json() as GetChallengeResponse
  return data.challenge
}


