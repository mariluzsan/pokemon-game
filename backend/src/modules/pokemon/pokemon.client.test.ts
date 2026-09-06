import assert from 'node:assert/strict'
import { PokemonApiClient, PokemonApiError } from './pokemon.client.js'
import { getPokemonDifficultyRange } from './pokemon-difficulty.js'

function response(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

async function testReturnsValidatedPokemonId() {
  const client = new PokemonApiClient(
    async () => response({ id: 25, name: 'pikachu' }),
    () => 0,
    'https://example.test',
  )

  assert.equal(await client.selectRandomPokemon('EASY'), 25)
}

async function testRejectsInvalidPokemonData() {
  const client = new PokemonApiClient(
    async () => response({ id: '25', name: 'pikachu' }),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.selectRandomPokemon('EASY'), PokemonApiError)
}

async function testMapsApiFailure() {
  const client = new PokemonApiClient(
    async () => response({}, false),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.selectRandomPokemon('EASY'), PokemonApiError)
}

async function testRequestsPokemonIdInsideDifficultyRange() {
  const requestedUrls: string[] = []
  const client = new PokemonApiClient(
    async (input) => {
      requestedUrls.push(String(input))
      return response({ id: 500, name: 'candidate' })
    },
    () => 0.5,
    'https://example.test',
  )

  const pokemonId = await client.selectRandomPokemon('HARD')

  const range = getPokemonDifficultyRange('HARD')
  const expectedRequestedId = range.min + Math.floor(0.5 * (range.max - range.min + 1))
  assert.equal(requestedUrls[0], `https://example.test/pokemon/${expectedRequestedId}`)
  assert.equal(pokemonId, 500)
}

async function testSkipsExcludedPokemonBeforeCallingPokeApi() {
  const requestedUrls: string[] = []
  let call = 0
  const sequence = [0, 0.5]

  const client = new PokemonApiClient(
    async (input) => {
      requestedUrls.push(String(input))
      return response({ id: 200, name: 'candidate' })
    },
    () => sequence[call++] ?? 0.9,
    'https://example.test',
  )

  await client.selectRandomPokemon('MEDIUM', [152])

  assert.equal(requestedUrls.length, 1)
  assert.notEqual(requestedUrls[0], 'https://example.test/pokemon/152')
}

async function testRejectsWithoutCallingPokeApiWhenRangeIsFullyExcluded() {
  let fetchCalled = false
  const range = getPokemonDifficultyRange('EASY')
  const allIds = Array.from({ length: range.max - range.min + 1 }, (_unused, index) => range.min + index)

  const client = new PokemonApiClient(
    async () => {
      fetchCalled = true
      return response({ id: 1, name: 'x' })
    },
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.selectRandomPokemon('EASY', allIds), PokemonApiError)
  assert.equal(fetchCalled, false)
}

async function testReturnsValidatedImageUrl() {
  const client = new PokemonApiClient(
    async () => response({
      id: 25,
      name: 'pikachu',
      sprites: {
        other: {
          'official-artwork': {
            front_default: 'https://example.test/pikachu.png',
          },
        },
      },
    }),
    () => 0,
    'https://example.test',
  )

  const result = await client.getPokemonImageUrl(25)
  assert.equal(result.imageUrl, 'https://example.test/pikachu.png')
}

async function testRejectsInvalidImageUrl() {
  const client = new PokemonApiClient(
    async () => response({
      id: 25,
      name: 'pikachu',
      sprites: {
        other: {
          'official-artwork': {
            front_default: '',
          },
        },
      },
    }),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.getPokemonImageUrl(25), PokemonApiError)
}

async function testRejectsInvalidPokemonIdForImage() {
  const client = new PokemonApiClient(
    async () => response({}),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.getPokemonImageUrl(-1), PokemonApiError)
  await assert.rejects(() => client.getPokemonImageUrl(0), PokemonApiError)
}

async function testReturnsValidatedPokemonName() {
  const client = new PokemonApiClient(
    async () => response({ id: 25, name: 'pikachu' }),
    () => 0,
    'https://example.test',
  )

  assert.equal(await client.getPokemonName(25), 'pikachu')
}

async function testRejectsInvalidPokemonName() {
  const client = new PokemonApiClient(
    async () => response({ id: 25, name: '' }),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.getPokemonName(25), PokemonApiError)
}

async function runTests() {
  await testReturnsValidatedPokemonId()
  await testRejectsInvalidPokemonData()
  await testMapsApiFailure()
  await testRequestsPokemonIdInsideDifficultyRange()
  await testSkipsExcludedPokemonBeforeCallingPokeApi()
  await testRejectsWithoutCallingPokeApiWhenRangeIsFullyExcluded()
  await testReturnsValidatedImageUrl()
  await testRejectsInvalidImageUrl()
  await testRejectsInvalidPokemonIdForImage()
  await testReturnsValidatedPokemonName()
  await testRejectsInvalidPokemonName()
  console.log('Pokemon client tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})