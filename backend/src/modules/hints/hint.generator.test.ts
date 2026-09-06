import assert from 'node:assert/strict'
import { AnthropicHintGenerator, SafeHintGenerator } from './hint.generator.js'

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

async function runTests() {
  await testAnthropicRequestAndResponse()
  await testInvalidAIFormatUsesFallback()
  await testMissingConfigurationUsesFallbackPath()
  console.log('Hint generator tests passed')
}

runTests().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})