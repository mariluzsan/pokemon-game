export interface HintGenerationInput {
  pokemonName: string
  types: string[]
  level: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface HintGenerator {
  generate(input: HintGenerationInput): Promise<GeneratedHint>
}

export interface GeneratedHint {
  content: string
  source: 'AI' | 'FALLBACK'
}

export class AIUnavailableError extends Error {
  constructor(public readonly reason = 'unknown') {
    super('El proveedor de IA no esta disponible.')
    this.name = 'AIUnavailableError'
  }
}

const MAX_HINT_LENGTH = 240
const MIN_HINT_LENGTH = 10

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function isSafeHint(content: string, pokemonName: string): boolean {
  const normalizedContent = normalize(content)
  const normalizedName = normalize(pokemonName)

  return content.trim().length >= MIN_HINT_LENGTH
    && content.trim().length <= MAX_HINT_LENGTH
    && !normalizedContent.includes(normalizedName)
    && !/[{}[\]]/.test(content)
}

export class FallbackHintGenerator implements HintGenerator {
  async generate(input: HintGenerationInput): Promise<{ content: string; source: 'FALLBACK' }> {
    const type = input.types[0] || 'misterioso'
    const content = input.level === 1
      ? `Observa su apariencia: pertenece a una familia relacionada con el tipo ${type}.`
      : input.level === 2
        ? `Su naturaleza se reconoce por sus rasgos de tipo ${type} y su forma de combatir.`
        : `Busca un personaje de tipo ${type} con una silueta y habilidades muy características.`

    return { content, source: 'FALLBACK' }
  }
}

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: unknown }>
}

export class AnthropicHintGenerator implements HintGenerator {
  constructor(
    private readonly apiKey = process.env.AI_API_KEY,
    private readonly model = process.env.AI_MODEL || 'claude-sonnet-4-6',
    private readonly timeoutMs = Number(process.env.AI_TIMEOUT_MS || 8000),
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async generate(input: HintGenerationInput): Promise<{ content: string; source: 'AI' }> {
    if (!this.apiKey) {
      throw new AIUnavailableError('missing_configuration')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await this.fetcher('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: 0.4,
          max_tokens: 80,
          system: 'Genera pistas breves para un juego de adivinanza de Pokemon. Responde solo con la pista en espanol.',
          messages: [{
            role: 'user',
            content: `Genera UNA pista de nivel ${input.level} y dificultad ${input.difficulty}. Debe ser util para identificar al Pokemon objetivo, pero NO debes decir su nombre ni revelarlo trivialmente. Usa solo estos datos del objetivo: nombre interno, tipos: ${input.types.join(', ')}. Devuelve unicamente el texto de la pista, entre ${MIN_HINT_LENGTH} y ${MAX_HINT_LENGTH} caracteres. Nombre interno: ${input.pokemonName}.`,
          }],
        }),
      })

      if (!response.ok) {
        throw new AIUnavailableError(`http_${response.status}`)
      }

      const data = await response.json() as AnthropicResponse
      const content = data.content?.find((block) => block.type === 'text')?.text
      if (typeof content !== 'string' || content.trim() === '') {
        throw new AIUnavailableError('invalid_response')
      }

      return { content: content.trim(), source: 'AI' }
    } catch (error) {
      if (error instanceof AIUnavailableError) {
        throw error
      }
      throw new AIUnavailableError(error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error')
    } finally {
      clearTimeout(timeout)
    }
  }
}

export class SafeHintGenerator implements HintGenerator {
  constructor(
    private readonly ai: HintGenerator = new AnthropicHintGenerator(),
    private readonly fallback: HintGenerator = new FallbackHintGenerator(),
  ) {}

  async generate(input: HintGenerationInput): Promise<{ content: string; source: 'AI' | 'FALLBACK' }> {
    try {
      const generated = await this.ai.generate(input)
      if (isSafeHint(generated.content, input.pokemonName)) {
        return generated
      }
    } catch (error) {
      // Solo se registra una categoria operacional, nunca secretos ni prompts.
      if (error instanceof AIUnavailableError) {
        console.error('Proveedor Anthropic no disponible', { reason: error.reason })
      }
    }

    return this.fallback.generate(input)
  }
}