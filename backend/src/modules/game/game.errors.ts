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

export class RoundNotCompletedError extends Error {
  constructor() {
    super('La ronda actual debe completarse antes de continuar.')
    this.name = 'RoundNotCompletedError'
  }
}

export class RoundExpiredError extends Error {
  constructor() {
    super('El tiempo de la ronda ha expirado.')
    this.name = 'RoundExpiredError'
  }
}

export class RoundNotExpiredError extends Error {
  constructor() {
    super('La ronda aun no ha expirado.')
    this.name = 'RoundNotExpiredError'
  }
}

export class RoundAlreadyResolvedError extends Error {
  constructor() {
    super('La ronda ya ha sido resuelta.')
    this.name = 'RoundAlreadyResolvedError'
  }
}

