import assert from 'node:assert/strict'
import { PokemonApiClient, PokemonApiError } from './pokemon.client.js'

function response(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

async function testReturnsValidatedPokemonId() {
  const client = new PokemonApiClient(
    async () => response({ id: 25, name: 'pikachu' }),
    () => 0,
    'https://example.test',
  )

  assert.equal(await client.selectRandomPokemon(), 25)
}

async function testRejectsInvalidPokemonData() {
  const client = new PokemonApiClient(
    async () => response({ id: '25', name: 'pikachu' }),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.selectRandomPokemon(), PokemonApiError)
}

async function testMapsApiFailure() {
  const client = new PokemonApiClient(
    async () => response({}, false),
    () => 0,
    'https://example.test',
  )

  await assert.rejects(() => client.selectRandomPokemon(), PokemonApiError)
}

async function runTests() {
  await testReturnsValidatedPokemonId()
  await testRejectsInvalidPokemonData()
  await testMapsApiFailure()
  console.log('Pokemon client tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})