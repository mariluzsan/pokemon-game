# ADR-007 - Anthropic para pistas de US-10

**Estado:** Aceptado

## Contexto

US-10 necesita generar pistas reales mediante IA sin exponer credenciales ni
acoplar el dominio a un proveedor. ADR-004 ya exige una abstracción `AIProvider`.

## Decisión

Se utilizará Anthropic mediante HTTP desde backend con el modelo
`claude-sonnet-4-6`. La integración vive en `AnthropicHintGenerator` y se
consume a través de `HintGenerator`. La credencial se lee únicamente de
`AI_API_KEY`; el modelo y el timeout se configuran con `AI_MODEL` y
`AI_TIMEOUT_MS`.

Las salidas se validan antes de persistirse. Una salida no disponible, vacía o
inválida usa el `FallbackHintGenerator` definido por ADR-005.

## Consecuencias

- No se añade SDK de Anthropic; la dependencia HTTP ya está disponible en Node.js.
- El frontend no conoce el proveedor ni recibe secretos.
- El proveedor puede sustituirse mediante un doble `HintGenerator` en pruebas.
- El fallback exigido explícitamente por los criterios de US-10 queda activo;
  US-14 podrá ampliar sus reglas en una historia posterior.