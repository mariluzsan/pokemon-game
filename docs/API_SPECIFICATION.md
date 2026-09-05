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
