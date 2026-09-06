import assert from 'node:assert/strict'
import { AnthropicHintGenerator, SafeHintGenerator, FallbackHintGenerator } from './hint.generator.js'
import { HintSafetyValidator } from './hint-safety.validator.js'

function response(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

async function testAnthropicRequestAndResponse() {
  const capturedBodies: Array<{ model?: string; system?: string; messages?: Array<{ role: string; content: string }> }> = []
  const generator = new AnthropicHintGenerator('test-key', 'claude-sonnet-4-6', 1000, async (_url, init) => {
    capturedBodies.push(JSON.parse(String(init?.body)) as { model?: string; system?: string; messages?: Array<{ role: string; content: string }> })
    return response({ content: [{ type: 'text', text: 'Su tipo ofrece una pista sobre sus habilidades.' }] })
  })

  const result = await generator.generate({ pokemonName: 'pikachu', types: ['electric'], level: 1, difficulty: 'EASY' })
  assert.deepEqual(result, { content: 'Su tipo ofrece una pista sobre sus habilidades.', source: 'AI' })
  assert.equal(capturedBodies[0].model, 'claude-sonnet-4-6')
  assert.match(capturedBodies[0].system ?? '', /pistas breves/)
  assert.match(capturedBodies[0].messages?.[0].content ?? '', /NO debes decir su nombre/)
}

async function testInvalidAIFormatUsesFallback() {
  const generator = new SafeHintGenerator(
    { generate: async () => ({ content: 'Corta.', source: 'AI' }) },
    { generate: async () => ({ content: 'Pista alternativa basada en sus rasgos.', source: 'FALLBACK' }) },
  )

  const result = await generator.generate({ pokemonName: 'pikachu', types: ['electric'], level: 1, difficulty: 'EASY' })
  assert.deepEqual(result, { content: 'Pista alternativa basada en sus rasgos.', source: 'FALLBACK' })
}

async function testMissingConfigurationUsesFallbackPath() {
  const generator = new SafeHintGenerator(
    new AnthropicHintGenerator(undefined, 'claude-sonnet-4-6', 1000),
    { generate: async () => ({ content: 'Pista segura sin proveedor externo.', source: 'FALLBACK' }) },
  )

  const result = await generator.generate({ pokemonName: 'pikachu', types: ['electric'], level: 1, difficulty: 'EASY' })
  assert.equal(result.source, 'FALLBACK')
}

async function testUnsafeAIContentUsesFallback() {
  // US-14: Si IA devuelve contenido inseguro (contiene nombre del Pokémon),
  // SafeHintGenerator debe intentar fallback
  const generator = new SafeHintGenerator(
    { generate: async () => ({ content: 'El Pokémon es Pikachu.', source: 'AI' }) },
    { generate: async () => ({ content: 'Es de tipo electric. Busca sus características típicas.', source: 'FALLBACK' }) },
    new HintSafetyValidator(),
  )

  const result = await generator.generate({ pokemonName: 'pikachu', types: ['electric'], level: 1, difficulty: 'EASY' })
  assert.equal(result.source, 'FALLBACK')
  assert.match(result.content, /electric/)
  assert.equal(result.content.toLowerCase().includes('pikachu'), false)
}

async function testFallbackIsProgressive() {
  // US-14: Fallback debe ser progresivo por level
  const fallback = new FallbackHintGenerator()

  const hint1 = await fallback.generate({ pokemonName: 'pikachu', types: ['electric'], level: 1, difficulty: 'EASY' })
  const hint2 = await fallback.generate({ pokemonName: 'pikachu', types: ['electric'], level: 2, difficulty: 'EASY' })
  const hint3 = await fallback.generate({ pokemonName: 'pikachu', types: ['electric'], level: 3, difficulty: 'EASY' })

  // Todos deben ser diferentes
  assert.notEqual(hint1.content, hint2.content)
  assert.notEqual(hint2.content, hint3.content)
  assert.notEqual(hint1.content, hint3.content)

  // Ninguno debe revelar el nombre
  assert.equal(hint1.content.toLowerCase().includes('pikachu'), false)
  assert.equal(hint2.content.toLowerCase().includes('pikachu'), false)
  assert.equal(hint3.content.toLowerCase().includes('pikachu'), false)
}

async function testFallbackWithDualTypes() {
  // US-14: Fallback debe manejar Pokémon con dos tipos
  const fallback = new FallbackHintGenerator()
  const hint = await fallback.generate({ pokemonName: 'charmander', types: ['fire', 'flying'], level: 1, difficulty: 'EASY' })

  assert.equal(hint.source, 'FALLBACK')
  assert.match(hint.content, /fire/)
  assert.match(hint.content, /flying/)
  assert.equal(hint.content.toLowerCase().includes('charmander'), false)
}

async function runTests() {
  await testAnthropicRequestAndResponse()
  await testInvalidAIFormatUsesFallback()
  await testMissingConfigurationUsesFallbackPath()
  await testUnsafeAIContentUsesFallback()
  await testFallbackIsProgressive()
  await testFallbackWithDualTypes()
  console.log('Hint generator tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})