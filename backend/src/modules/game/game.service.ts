import { ValidationError } from './game.errors.js'
import { GameRepository } from './game.repository.js'
import type { CreateGameInput, Game } from './game.types.js'

const MAX_PLAYER_NAME_LENGTH = 100

export class GameService {
  constructor(private readonly gameRepository = new GameRepository()) {}

  async createGame(input: CreateGameInput): Promise<Game> {
    const playerName = normalizePlayerName(input.playerName)

    return this.gameRepository.create(playerName)
  }
}

export function normalizePlayerName(playerName: unknown): string {
  if (typeof playerName !== 'string') {
    throw new ValidationError('El nombre del jugador es obligatorio.')
  }

  const trimmedPlayerName = playerName.trim()

  if (trimmedPlayerName.length === 0) {
    throw new ValidationError('El nombre del jugador es obligatorio.')
  }

  if (trimmedPlayerName.length > MAX_PLAYER_NAME_LENGTH) {
    throw new ValidationError('El nombre del jugador no puede superar 100 caracteres.')
  }

  return trimmedPlayerName
}

