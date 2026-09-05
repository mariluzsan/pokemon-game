# Pistas con Inteligencia Artificial

Arquitectura:
```text
HintService
   ↓
AIProvider
   ├── LLMProvider
   └── FallbackProvider
```

## Reglas
- máximo tres pistas;
- progresivas;
- relacionadas con el Pokémon;
- sin revelar su nombre;
- penalización controlada por backend.

## Validación
La salida de IA se considera no confiable. Se valida contenido, longitud/formato y ausencia de spoilers antes de mostrarla.

El proveedor debe tener timeout. Ante error, timeout o salida inválida se utiliza `FallbackProvider`.

Las credenciales permanecen únicamente en backend.

El registro del uso de IA durante el desarrollo pertenece a `ai/AI_USAGE.md` y es distinto de esta funcionalidad del producto.
