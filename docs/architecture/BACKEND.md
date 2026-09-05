# Arquitectura Backend

## Stack
Node.js, Express y TypeScript.

## Estructura
```text
backend/
└── src/
    ├── modules/
    │   ├── game/
    │   ├── pokemon/
    │   ├── hints/
    │   ├── scoring/
    │   ├── difficulty/
    │   └── ranking/
    ├── infrastructure/
    │   ├── database/
    │   ├── http/
    │   └── config/
    ├── middlewares/
    ├── routes/
    ├── app.ts
    └── server.ts
└── tests/
```

## Módulos
- **game:** partidas, rondas y estados.
- **pokemon:** integración y normalización de PokéAPI.
- **hints:** solicitud, generación, validación, límites y fallback.
- **scoring:** puntuación centralizada.
- **difficulty:** dificultad adaptativa.
- **ranking:** resultados y ranking.

## IA
```text
HintService -> AIProvider -> LLMProvider / FallbackProvider
```

## API
- `GET /api/health`
- `POST /api/games`
- `GET /api/games/:gameId`
- `POST /api/games/:gameId/rounds/:roundId/guess`
- `POST /api/games/:gameId/rounds/:roundId/hints`
- `POST /api/games/:gameId/finish`
- `GET /api/ranking`

## Error
```json
{"error":{"code":"GAME_NOT_FOUND","message":"La partida no existe."}}
```

Códigos previstos: `GAME_NOT_FOUND`, `ROUND_NOT_FOUND`, `INVALID_GUESS`, `HINT_LIMIT_REACHED`, `AI_UNAVAILABLE`, `POKEAPI_UNAVAILABLE`, `DATABASE_ERROR`, `VALIDATION_ERROR`.
