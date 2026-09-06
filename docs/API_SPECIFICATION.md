# Especificación de API

Base: `/api`

| Método | Endpoint | Propósito |
|---|---|---|
| GET | `/api/health` | Estado del backend |
| POST | `/api/games` | Crear partida |
| GET | `/api/games/:gameId` | Consultar partida |
| POST | `/api/games/:gameId/rounds` | Crear una ronda y seleccionar su Pokémon |
| GET | `/api/games/:gameId/rounds/:roundId/challenge` | Obtener datos visuales del desafío de una ronda |
| POST | `/api/games/:gameId/rounds/:roundId/guess` | Registrar intento |
| POST | `/api/games/:gameId/rounds/:roundId/expire` | Registrar expiración de ronda |
| POST | `/api/games/:gameId/rounds/:roundId/hints` | Solicitar pista |
| POST | `/api/games/:gameId/finish` | Finalizar partida |
| GET | `/api/ranking` | Consultar ranking |

## Estado actual

El endpoint `GET /api/health` ya esta implementado como parte de Sprint 0. Valida que el backend responda y que pueda conectarse a PostgreSQL.

Respuesta exitosa actual:

```json
{
  "status": "ok",
  "message": "API funcionando correctamente",
  "database": {
    "status": "connected",
    "currentTime": "timestamp"
  }
}
```

El endpoint `POST /api/games` esta implementado como primer incremento funcional de Sprint 1.

### POST `/api/games`

Crear una partida nueva con datos validos.

Request:

```json
{
  "playerName": "Ash"
}
```

Respuesta exitosa `201 Created`:

```json
{
  "game": {
    "id": 1,
    "playerName": "Ash",
    "totalScore": 0,
    "currentRound": 1,
    "difficulty": "EASY",
    "status": "IN_PROGRESS",
    "startedAt": "2026-09-05T12:00:00.000Z",
    "finishedAt": null
  }
}
```

Errores previstos:

- `400 VALIDATION_ERROR` cuando `playerName` no existe, esta vacio o supera 100 caracteres.
- `500 DATABASE_ERROR` cuando no fue posible persistir la partida.

Los demas endpoints funcionales de Sprint 1 aun estan pendientes de implementacion.

### POST `/api/games/:gameId/rounds`

Crea la siguiente ronda de una partida en progreso. La selección y persistencia
del Pokémon ocurren en el backend; `pokemon_id` no se devuelve al cliente.

Respuesta exitosa `201 Created`:

```json
{
  "round": {
    "id": 1,
    "gameId": 1,
    "roundNumber": 1,
    "difficulty": "EASY",
    "startedAt": "2026-09-05T12:00:00.000Z"
  }
}
```

Errores previstos:

- `400 VALIDATION_ERROR` cuando `gameId` no es un entero positivo.
- `404 GAME_NOT_FOUND` cuando la partida no existe.
- `409 GAME_NOT_IN_PROGRESS` cuando la partida no esta disponible para crear una ronda.
- `409 ROUND_NOT_COMPLETED` cuando la ronda actual sigue activa.
- `503 POKEAPI_UNAVAILABLE` cuando PokéAPI falla o devuelve datos invalidos.
- `500 DATABASE_ERROR` cuando no fue posible persistir la ronda.

### GET `/api/games/:gameId/rounds/:roundId/challenge`

Obtiene los datos visuales del desafío de una ronda específica (US-03).
El backend obtiene la imagen del Pokémon desde PokéAPI sin exponer
la identidad (pokemon_id ni nombre) al cliente.

Respuesta exitosa `200 OK`:

```json
{
  "challenge": {
    "id": 1,
    "roundNumber": 1,
    "imageUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    "difficulty": "EASY",
    "timeLimitSeconds": 30
  }
}
```

`timeLimitSeconds` indica la duración configurada de la ronda. El contador
visual del frontend usa `startedAt` como inicio; la autoridad para determinar
si una ronda expiró permanece en backend. La evaluación de respuestas se
describe en el endpoint `POST .../guess` de US-05.

Errores previstos:

- `400 VALIDATION_ERROR` cuando `gameId` o `roundId` no es un entero positivo, la ronda no existe o no pertenece a la partida indicada.
- `503 POKEAPI_UNAVAILABLE` cuando PokéAPI falla o devuelve datos invalidos.
- `500 DATABASE_ERROR` cuando no fue posible obtener los datos de la ronda.

### POST `/api/games/:gameId/rounds/:roundId/guess` — cambios US-06

Registra y evalúa una respuesta para una ronda vigente. La comparación se
realiza en backend usando el nombre obtenido desde PokéAPI; el Pokémon correcto
no se devuelve al cliente.

Request:

```json
{
  "answer": "pikachu"
}
```

Respuesta correcta o incorrecta `200 OK`:

```json
{
  "guess": {
    "isCorrect": true,
    "score": 1516,
    "hintPenalty": 0,
    "totalScore": 1516,
    "status": "IN_PROGRESS",
    "finishedAt": null
  }
}
```

**`isCorrect` (indica si la respuesta es correcta) puede ser `false` cuando la respuesta no coincide; en ese caso
`score` es exactamente `0`. `score` es la puntuación final acreditada por la ronda ya considerando las pistas persistidas para esa ronda. `hintPenalty` es la suma de las penalizaciones persistidas para sus pistas, que ya fueron descontadas del acumulado al solicitarlas y la calcula exclusivamente el backend. `totalScore` es el total acumulado de la partida después de la operación. `status`
 y `finishedAt` reflejan el estado persistido de la partida.**
La comparación normaliza mayúsculas/minúsculas, espacios, guiones, puntuación,
tildes y los símbolos de género para aceptar el nombre de presentación del
Pokémon sin aceptar alias, traducciones ni nombres parciales.
El endpoint no revela el nombre correcto. La ronda queda resuelta después del
primer envío aceptado; el backend incrementa `current_round` y finaliza la
partida al resolver la décima ronda. El resultado final persistido de la partida
queda representado por `games.player_name`, `games.total_score`, `games.status = 'FINISHED'`,
`games.difficulty`, `games.started_at` y `games.finished_at`; `rounds.score` conserva el
score final de cada ronda ya penalizado para que una partida finalizada pueda verificarse
como `games.total_score = SUM(rounds.score)`.

Errores previstos:

- `400 VALIDATION_ERROR` cuando `gameId`, `roundId` o `answer` son invalidos.
- `404 GAME_NOT_FOUND` cuando la partida no existe.
- `400 VALIDATION_ERROR` cuando la ronda no existe o no pertenece a la partida.
- `409 GAME_NOT_IN_PROGRESS` cuando la partida no esta en estado `IN_PROGRESS`.
- `409 ROUND_EXPIRED` cuando la respuesta llega al cumplir o superar los 30 segundos.
- **`409 ROUND_ALREADY_RESOLVED` cuando la ronda ya tiene una respuesta aceptada; el segundo envío no modifica ningún dato.**
- `503 POKEAPI_UNAVAILABLE` cuando no es posible obtener el nombre para evaluar.
- **`500 DATABASE_ERROR` cuando no fue posible persistir la evaluación y la ronda y el total de la partida se mantienen sin cambios.**

### POST `/api/games/:gameId/rounds/:roundId/expire`

Registra una ronda que alcanzó el límite de tiempo. La operación es idempotente
si la ronda ya fue resuelta en una solicitud concurrente. La expiración obtiene
`score: 0`, informa la penalización de pistas registrada sin reducir el total acumulado, incrementa `current_round` y, si era la décima ronda, finaliza la partida.

Respuesta exitosa `200 OK`:

```json
{
  "completion": {
    "hintPenalty": 300,
    "totalScore": 0,
    "status": "IN_PROGRESS",
    "finishedAt": null
  }
}
```

Errores previstos:

- `400 VALIDATION_ERROR` cuando `gameId` o `roundId` no es un entero positivo, o la ronda no pertenece a la partida.
- `404 GAME_NOT_FOUND` cuando la partida no existe.
- `409 ROUND_NOT_EXPIRED` cuando todavía no se alcanza el límite de 30 segundos.
- `500 DATABASE_ERROR` cuando no fue posible persistir la expiración.

### POST `/api/games/:gameId/rounds/:roundId/hints`

Genera y registra la siguiente pista progresiva de una ronda vigente mediante
el proveedor de IA configurado en backend, o mediante un fallback determinista
si la IA no está disponible o devuelve contenido inseguro (US-14). No requiere
body y no admite que el cliente determine el Pokémon, el contenido,
la penalización, la dificultad ni el nivel de la pista.

Respuesta exitosa `201 Created`:

```json
{
  "hint": {
    "level": 1,
    "content": "Observa los rasgos asociados con su tipo y su silueta característica.",
    "penalty": 100,
    "totalScore": 900,
    "hintsUsed": 1,
    "hintsRemaining": 2
  }
}
```

La respuesta no incluye `pokemonId`, `pokemon_id`, el nombre ni la respuesta
correcta. `content`, `penalty`, `totalScore`, `hintsUsed` y `hintsRemaining`
son calculados por el backend después de la persistencia. `penalty` es el costo
de la pista solicitada y `totalScore` ya refleja su descuento, limitado a cero.
El origen de la pista (`AI` o `FALLBACK`) se conserva solo en la base de datos
mediante `source`. El cliente no puede distinguir entre una pista de IA exitosa
y una pista de fallback; ambas se devuelven con éxito `201`.

Flujo interno (US-10, US-14):
1. Intenta generar pista mediante proveedor de IA.
2. Si falla (timeout, error HTTP, credencial ausente, respuesta vacía o inválida)
   → intenta fallback.
3. Si IA genera contenido válido pero contiene el nombre del Pokémon (validación
   de seguridad de US-13) → rechaza IA e intenta fallback.
4. Valida fallback con la misma regla de seguridad.
5. Persiste la pista exitosa (IA o fallback) e incrementa counters.
6. Si ambas fallan o ambas son inseguras (excepcional) → error.

Errores previstos:

- `400 VALIDATION_ERROR` cuando `gameId` o `roundId` no son enteros positivos, la ronda no existe o no pertenece a la partida.
- `404 GAME_NOT_FOUND` cuando la partida no existe.
- `409 GAME_NOT_IN_PROGRESS` cuando la partida está finalizada.
- `409 ROUND_ALREADY_RESOLVED` cuando la ronda ya fue resuelta.
- `409 ROUND_EXPIRED` cuando la ronda alcanzó el límite de tiempo.
- `409 HINT_LIMIT_REACHED` cuando ya se solicitaron tres pistas en la ronda.
- `422 UNSAFE_HINT` cuando incluso el fallback no puede generar una pista segura (caso excepcional); no se persiste, no incrementa el uso ni aplica penalización.
- `503 POKEAPI_UNAVAILABLE` cuando no fue posible obtener los datos mínimos del Pokémon.
- `500 DATABASE_ERROR` cuando no fue posible registrar la solicitud.

### GET `/api/ranking`

Consulta la colección actual de resultados válidos persistidos para ranking.
La fuente de verdad es la tabla `games`; solo participan partidas finalizadas
que conservan su marca de finalización.

Respuesta exitosa `200 OK`:

```json
{
  "ranking": [
    {
      "playerName": "Ash",
      "score": 1200
    },
    {
      "playerName": "Brock",
      "score": 0
    }
  ]
}
```

La respuesta devuelve únicamente `playerName` y `score`. No expone
`pokemon_id`, respuestas, pistas, contenido de IA, dificultad, timestamps ni
otros campos internos. Si no existen resultados válidos, responde `200 OK` con
`{"ranking": []}`. La colección se obtiene desde backend y usa `games.total_score`
como puntuación final persistida; no recalcula scoring durante la consulta.

Orden observable de US-21:

- La consulta devuelve primero los `score` más altos (`games.total_score DESC`).
- En caso de empate, todos los puntajes empatados se mantienen en el ranking; no existe una regla funcional de desempate adicional.
- Para que dos consultas consecutivas sobre el mismo dataset devuelvan el mismo orden observable, el backend aplica un criterio técnico final `id ASC` solo como estabilizador interno. Ese criterio no cambia la regla funcional del ranking ni se expone en la respuesta.

Errores previstos:

- `500 DATABASE_ERROR` cuando no fue posible consultar el ranking.

## Error estándar
```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "La partida no existe."
  }
}
```

La API utiliza JSON, valida entradas y mantiene en backend las reglas de negocio.
