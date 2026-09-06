# Especificación de API

Base: `/api`

| Método | Endpoint | Propósito |
|---|---|---|
| GET | `/api/health` | Estado del backend |
| POST | `/api/games` | Crear partida |
| GET | `/api/games/:gameId` | Consultar partida |
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
