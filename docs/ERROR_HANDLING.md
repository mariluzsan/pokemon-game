# Manejo de Errores

Formato:
```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "La partida no existe."
  }
}
```

| Código | Significado |
|---|---|
| `GAME_NOT_FOUND` | Partida inexistente |
| `GAME_NOT_IN_PROGRESS` | La partida no permite crear una ronda |
| `ROUND_NOT_FOUND` | Ronda inexistente |
| `INVALID_GUESS` | Intento inválido |
| `ROUND_EXPIRED` | La ronda ya superó el tiempo límite |
| `ROUND_NOT_EXPIRED` | La ronda todavía no alcanza el tiempo límite |
| `ROUND_NOT_COMPLETED` | La ronda actual debe resolverse antes de crear la siguiente |
| **`ROUND_ALREADY_RESOLVED`** | **La ronda ya fue resuelta y no acepta otro intento** |
| `HINT_LIMIT_REACHED` | Límite de pistas alcanzado |
| `UNSAFE_HINT` | La pista generada no cumple la validación de seguridad |
| `AI_UNAVAILABLE` | IA no disponible |
| `POKEAPI_UNAVAILABLE` | PokéAPI no disponible |
| `DATABASE_ERROR` | Error interno de persistencia |
| `VALIDATION_ERROR` | Entrada inválida |

No se exponen stack traces, SQL, credenciales ni claves. Los controladores traducen errores del dominio a respuestas HTTP coherentes.

En US-10, un timeout, error HTTP, credencial ausente, respuesta vacía o
salida inválida del proveedor activa el `FallbackHintGenerator`; no se expone
el detalle interno ni se interrumpe la partida. Los fallos al obtener datos
mínimos desde PokéAPI se responden como `POKEAPI_UNAVAILABLE`.

En US-13, si una pista generada contiene el nombre normalizado del Pokémon
objetivo, se responde `422 UNSAFE_HINT` con un mensaje genérico. El contenido,
el nombre objetivo, el prompt y los detalles del proveedor no se incluyen en
la respuesta ni en logs. La transacción se revierte antes de persistir la pista
o aplicar su penalización.
