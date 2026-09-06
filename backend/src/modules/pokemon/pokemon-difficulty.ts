// Regla aprobada por el Tech Lead para US-18 (docs/DIFFICULTY_RULES.md):
// clasificacion objetiva de Pokemon por rango de pokemonId segun generacion.
export type PokemonDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface PokemonIdRange {
  min: number
  max: number
}

export const POKEMON_DIFFICULTY_RANGES: Record<PokemonDifficulty, PokemonIdRange> = {
  EASY: { min: 1, max: 151 },
  MEDIUM: { min: 152, max: 493 },
  HARD: { min: 494, max: 1025 },
}

export function getPokemonDifficultyRange(difficulty: PokemonDifficulty): PokemonIdRange {
  return POKEMON_DIFFICULTY_RANGES[difficulty]
}

export function isPokemonInDifficultyRange(pokemonId: number, difficulty: PokemonDifficulty): boolean {
  const range = getPokemonDifficultyRange(difficulty)
  return pokemonId >= range.min && pokemonId <= range.max
}

const MAX_CANDIDATE_ATTEMPTS = 20

/**
 * Elige un pokemonId candidato dentro del rango de la dificultad, evitando los
 * ids ya excluidos (Pokemon usados en la partida). Devuelve null cuando no
 * existe un candidato valido, ya sea porque el rango esta completamente
 * excluido o porque se agotaron los intentos aleatorios.
 */
export function pickCandidatePokemonId(
  difficulty: PokemonDifficulty,
  excludedPokemonIds: readonly number[],
  random: () => number,
  maxAttempts: number = MAX_CANDIDATE_ATTEMPTS,
): number | null {
  const range = getPokemonDifficultyRange(difficulty)
  const excluded = new Set(excludedPokemonIds)
  const rangeSize = range.max - range.min + 1

  if (excluded.size >= rangeSize) {
    return null
  }

  let candidateId = range.min + Math.floor(random() * rangeSize)
  let attempts = 0

  while (excluded.has(candidateId) && attempts < maxAttempts) {
    candidateId = range.min + Math.floor(random() * rangeSize)
    attempts += 1
  }

  return excluded.has(candidateId) ? null : candidateId
}
