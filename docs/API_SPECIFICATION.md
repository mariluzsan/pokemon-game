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
    "difficulty": "EASY"
  }
}
```

Errores previstos:

- `400 VALIDATION_ERROR` cuando `gameId` o `roundId` no es un entero positivo, la ronda no existe o no pertenece a la partida indicada.
- `503 POKEAPI_UNAVAILABLE` cuando PokéAPI falla o devuelve datos invalidos.
- `500 DATABASE_ERROR` cuando no fue posible obtener los datos de la ronda.

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
