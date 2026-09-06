function normalizeForComparison(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function isSafeHint(content: string, pokemonName: string): boolean {
  const normalizedPokemonName = normalizeForComparison(pokemonName)
  const normalizedContent = normalizeForComparison(content)

  return normalizedPokemonName === '' || !normalizedContent.includes(normalizedPokemonName)
}

export class UnsafeHintError extends Error {
  constructor() {
    super('La pista generada no puede mostrarse.')
    this.name = 'UnsafeHintError'
  }
}

export class HintSafetyValidator {
  validate(content: string, pokemonName: string): void {
    if (!isSafeHint(content, pokemonName)) {
      throw new UnsafeHintError()
    }
  }
}