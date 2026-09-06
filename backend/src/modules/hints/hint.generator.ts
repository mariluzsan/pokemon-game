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

function isValidHintContent(content: string): boolean {
  return content.trim().length >= MIN_HINT_LENGTH
    && content.trim().length <= MAX_HINT_LENGTH
    && !/[{}[\]]/.test(content)
}

export class FallbackHintGenerator implements HintGenerator {
  async generate(input: HintGenerationInput): Promise<{ content: string; source: 'FALLBACK' }> {
    const types = input.types.length > 0 ? input.types : ['desconocido']
    const primaryType = types[0]
    const hasMultipleTypes = types.length > 1
    const secondaryType = types[1]

    const levelBasedHints = {
      1: () => {
        if (hasMultipleTypes) {
          return `Es de tipo ${primaryType} y ${secondaryType}. Combina características de ambos.`
        }
        return `Pertenece al tipo ${primaryType}. Busca sus características típicas.`
      },
      2: () => {
        if (hasMultipleTypes) {
          return `Su dualidad de tipo ${primaryType}/${secondaryType} define sus habilidades y debilidades.`
        }
        return `Como personaje de tipo ${primaryType}, posee atributos muy específicos de este grupo.`
      },
      3: () => {
        if (hasMultipleTypes) {
          return `Reconócelo por su naturaleza dual de ${primaryType} y ${secondaryType}, única en su clase.`
        }
        return `Es uno de los más representativos del tipo ${primaryType} en toda la región.`
      },
    }

    const hint = levelBasedHints[input.level as keyof typeof levelBasedHints]?.()
      || `Observa: es de tipo ${primaryType}.`

    return { content: hint, source: 'FALLBACK' }
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

/**
 * Valida que el contenido de una pista sea seguro (no revele el nombre del Pokémon).
 * Se utiliza para validar tanto pistas de IA como pistas de fallback.
 */
export interface HintSafetyValidator {
  validate(content: string, pokemonName: string): void
}

export class SafeHintGenerator implements HintGenerator {
  constructor(
    private readonly ai: HintGenerator = new AnthropicHintGenerator(),
    private readonly fallback: HintGenerator = new FallbackHintGenerator(),
    private readonly validator: HintSafetyValidator | null = null,
  ) {}

  async generate(input: HintGenerationInput): Promise<{ content: string; source: 'AI' | 'FALLBACK' }> {
    // Intenta IA
    try {
      const generated = await this.ai.generate(input)
      if (isValidHintContent(generated.content)) {
        // Valida contenido de IA
        if (this.validator) {
          try {
            this.validator.validate(generated.content, input.pokemonName)
            return generated // ✓ IA exitosa y segura
          } catch (safetyError) {
            // IA no es segura, intenta fallback
            console.error('Pista de IA no cumple validación de seguridad, usando fallback')
          }
        } else {
          return generated // Sin validador, confía en IA
        }
      }
    } catch (error) {
      // Solo se registra una categoría operacional, nunca secretos ni prompts.
      if (error instanceof AIUnavailableError) {
        console.error('Proveedor Anthropic no disponible', { reason: error.reason })
      }
    }

    // Usa fallback
    const fallbackGenerated = await this.fallback.generate(input)

    // Valida contenido de fallback
    if (this.validator) {
      this.validator.validate(fallbackGenerated.content, input.pokemonName)
      // Si pasa, retorna fallback. Si falla, lanza UnsafeHintError
    }

    return fallbackGenerated
  }
}