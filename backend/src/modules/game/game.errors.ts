export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class GameNotFoundError extends Error {
  constructor() {
    super('La partida no existe.')
    this.name = 'GameNotFoundError'
  }
}

export class GameNotInProgressError extends Error {
  constructor() {
    super('La partida no esta disponible para crear una ronda.')
    this.name = 'GameNotInProgressError'
  }
}

