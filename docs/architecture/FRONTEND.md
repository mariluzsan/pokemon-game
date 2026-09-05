# Arquitectura Frontend

## Stack
React, TypeScript y Vite.

## Estructura
```text
frontend/
└── src/
    ├── app/
    ├── components/
    │   ├── PokemonImage/
    │   ├── Timer/
    │   ├── HintCard/
    │   ├── ScoreDisplay/
    │   └── RankingTable/
    ├── features/
    │   ├── game/
    │   ├── hints/
    │   └── ranking/
    ├── pages/
    │   ├── Home/
    │   ├── Game/
    │   └── Ranking/
    ├── services/
    │   └── api.ts
    ├── hooks/
    ├── types/
    └── utils/
```

El frontend presenta y coordina la experiencia. Las reglas críticas de juego, puntuación y dificultad pertenecen al backend.
