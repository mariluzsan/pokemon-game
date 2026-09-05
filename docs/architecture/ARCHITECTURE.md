# Arquitectura General

## Decisión
El sistema será un **Modular Monolith**.

```text
React + Vite + TypeScript
          |
          | REST / JSON
          v
Node.js + Express + TypeScript
          |
    +-----+----------+
    |     |          |
    v     v          v
PostgreSQL  PokéAPI   LLM / AI
```

## Responsabilidades
**Frontend:** presentación, estado de UI, temporizador visual, interacción y consumo de API.

**Backend:** reglas del juego, validación, scoring, dificultad, partidas/rondas, PokéAPI, IA, persistencia y ranking.

**PostgreSQL:** persistencia.

**PokéAPI:** información Pokémon externa.

**LLM/AI:** generación de pistas, siempre validada por backend.

## Principios
- Separación de responsabilidades.
- Backend como autoridad de negocio.
- Validación en los límites.
- Fallos externos aislados.
- Seguridad desde el diseño.
- Testabilidad.

## Flujo
```text
Usuario -> React -> REST API -> Controller -> Service -> Repository / External Client -> DB / PokéAPI / AI
```
