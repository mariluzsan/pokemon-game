export class HintLimitReachedError extends Error {
  constructor() {
    super('Se alcanzo el limite de pistas para esta ronda.')
    this.name = 'HintLimitReachedError'
  }
}