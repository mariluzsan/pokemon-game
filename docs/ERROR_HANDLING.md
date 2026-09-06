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
| `HINT_LIMIT_REACHED` | Límite de pistas alcanzado |
| `AI_UNAVAILABLE` | IA no disponible |
| `POKEAPI_UNAVAILABLE` | PokéAPI no disponible |
| `DATABASE_ERROR` | Error interno de persistencia |
| `VALIDATION_ERROR` | Entrada inválida |

No se exponen stack traces, SQL, credenciales ni claves. Los controladores traducen errores del dominio a respuestas HTTP coherentes.
