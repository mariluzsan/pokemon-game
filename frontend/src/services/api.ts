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

export interface GuessResult {
  isCorrect: boolean
  score: number
  totalScore: number
  status: 'IN_PROGRESS' | 'FINISHED'
  finishedAt: string | null
}

export interface RoundCompletion {
  totalScore: number
  status: 'IN_PROGRESS' | 'FINISHED'
  finishedAt: string | null
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

interface SubmitGuessResponse {
  guess: GuessResult
}

interface ExpireRoundResponse {
  completion: RoundCompletion
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

async function ensureSuccessfulResponse(response: Response, fallbackMessage: string): Promise<void> {
  if (response.ok) {
    return
  }

  let code: string | null = null
  try {
    const data = await response.json() as { error?: { code?: unknown } }
    if (typeof data.error?.code === 'string') {
      code = data.error.code
    }
  } catch {
    // Preserve the safe fallback when the server response is not JSON.
  }

  throw new Error(code ? `${fallbackMessage} (${code})` : fallbackMessage)
}

export async function createGame(playerName: string): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ playerName }),
  })

  await ensureSuccessfulResponse(response, 'No fue posible iniciar la partida.')

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

  await ensureSuccessfulResponse(response, 'No fue posible crear la ronda.')

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

  await ensureSuccessfulResponse(response, 'No fue posible obtener el desafio.')

  const data = await response.json() as GetChallengeResponse
  return data.challenge
}

export async function submitGuess(gameId: number, roundId: number, answer: string): Promise<GuessResult> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/rounds/${roundId}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer }),
  })

  await ensureSuccessfulResponse(response, 'No fue posible enviar la respuesta.')

  const data = await response.json() as SubmitGuessResponse
  return data.guess
}

export async function expireRound(gameId: number, roundId: number): Promise<RoundCompletion> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/rounds/${roundId}/expire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  await ensureSuccessfulResponse(response, 'No fue posible registrar la expiración de la ronda.')

  const data = await response.json() as ExpireRoundResponse
  return data.completion
}


