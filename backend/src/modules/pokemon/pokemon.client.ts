import { pickCandidatePokemonId, type PokemonDifficulty } from './pokemon-difficulty.js'

export interface PokemonSelector {
  selectRandomPokemon(difficulty: PokemonDifficulty, excludedPokemonIds?: readonly number[]): Promise<number>
}

export interface PokemonData {
  imageUrl: string
}

export interface PokemonHintData {
  name: string
  types: string[]
}

interface PokemonApiResponse {
  id?: unknown
  name?: unknown
  sprites?: {
    other?: {
      'official-artwork'?: {
        front_default?: unknown
      }
    }
  }
  types?: Array<{ type?: { name?: unknown } }>
}

export class PokemonApiError extends Error {
  constructor() {
    super('No fue posible obtener un Pokemon desde PokéAPI.')
    this.name = 'PokemonApiError'
  }
}

type FetchLike = typeof fetch

const REQUEST_TIMEOUT_MS = 5000

export class PokemonApiClient implements PokemonSelector {
  constructor(
    private readonly fetcher: FetchLike = fetch,
    private readonly random = Math.random,
    private readonly baseUrl = 'https://pokeapi.co/api/v2',
  ) {}

  async selectRandomPokemon(difficulty: PokemonDifficulty, excludedPokemonIds: readonly number[] = []): Promise<number> {
    const requestedPokemonId = pickCandidatePokemonId(difficulty, excludedPokemonIds, this.random)

    if (requestedPokemonId === null) {
      throw new PokemonApiError()
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await this.fetcher(
        `${this.baseUrl}/pokemon/${requestedPokemonId}`,
        { signal: controller.signal },
      )

      if (!response.ok) {
        throw new PokemonApiError()
      }

      const data = await response.json() as PokemonApiResponse
      const pokemonId = data.id

      if (typeof pokemonId !== 'number' || !Number.isInteger(pokemonId) || pokemonId <= 0 || typeof data.name !== 'string' || data.name.trim() === '') {
        throw new PokemonApiError()
      }

      return pokemonId
    } catch (error) {
      if (error instanceof PokemonApiError) {
        throw error
      }

      throw new PokemonApiError()
    } finally {
      clearTimeout(timeout)
    }
  }

  async getPokemonImageUrl(pokemonId: number): Promise<PokemonData> {
    if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
      throw new PokemonApiError()
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await this.fetcher(
        `${this.baseUrl}/pokemon/${pokemonId}`,
        { signal: controller.signal },
      )

      if (!response.ok) {
        throw new PokemonApiError()
      }

      const data = await response.json() as PokemonApiResponse
      const imageUrl = data.sprites?.other?.['official-artwork']?.front_default

      if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        throw new PokemonApiError()
      }

      return { imageUrl }
    } catch (error) {
      if (error instanceof PokemonApiError) {
        throw error
      }

      throw new PokemonApiError()
    } finally {
      clearTimeout(timeout)
    }
  }

  async getPokemonName(pokemonId: number): Promise<string> {
    if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
      throw new PokemonApiError()
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await this.fetcher(
        `${this.baseUrl}/pokemon/${pokemonId}`,
        { signal: controller.signal },
      )

      if (!response.ok) {
        throw new PokemonApiError()
      }

      const data = await response.json() as PokemonApiResponse

      if (typeof data.name !== 'string' || data.name.trim() === '') {
        throw new PokemonApiError()
      }

      return data.name
    } catch (error) {
      if (error instanceof PokemonApiError) {
        throw error
      }

      throw new PokemonApiError()
    } finally {
      clearTimeout(timeout)
    }
  }

  async getPokemonHintData(pokemonId: number): Promise<PokemonHintData> {
    if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
      throw new PokemonApiError()
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await this.fetcher(`${this.baseUrl}/pokemon/${pokemonId}`, { signal: controller.signal })
      if (!response.ok) {
        throw new PokemonApiError()
      }

      const data = await response.json() as PokemonApiResponse
      const types = data.types?.map((entry) => entry.type?.name).filter((type): type is string => typeof type === 'string' && type.trim() !== '') ?? []
      if (typeof data.name !== 'string' || data.name.trim() === '' || types.length === 0) {
        throw new PokemonApiError()
      }

      return { name: data.name, types }
    } catch (error) {
      if (error instanceof PokemonApiError) {
        throw error
      }
      throw new PokemonApiError()
    } finally {
      clearTimeout(timeout)
    }
  }
}