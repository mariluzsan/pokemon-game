# ¿Quién es ese personaje?

Aplicación web de juego de adivinanza inspirada en Pokémon. El jugador debe identificar el Pokémon de cada ronda utilizando la información visual disponible y, cuando lo necesite, puede solicitar pistas progresivas generadas mediante inteligencia artificial.

Este proyecto se desarrolla como una prueba técnica y busca demostrar no solo el funcionamiento del producto, sino también un proceso de ingeniería trazable: requerimientos, arquitectura, desarrollo, pruebas, seguridad, documentación, Git/GitHub y uso responsable de IA.

## Objetivos

- Construir una experiencia de juego web clara y mantenible.
- Consumir información de Pokémon a través de PokéAPI.
- Incorporar pistas progresivas generadas con IA.
- Implementar un mecanismo de fallback cuando la IA no esté disponible.
- Calcular puntuación en función del desempeño del jugador.
- Adaptar la dificultad según el desempeño.
- Persistir partidas, rondas y resultados.
- Presentar un ranking.
- Mantener las reglas críticas y los secretos fuera del frontend.
- Documentar las decisiones técnicas y el uso de IA durante el desarrollo.

## Funcionalidades principales

El alcance funcional contempla:

1. creación de una partida;
2. selección de Pokémon;
3. presentación de rondas;
4. temporizador;
5. registro y validación de respuestas;
6. cálculo de puntuación;
7. solicitud de hasta tres pistas progresivas;
8. generación de pistas con IA;
9. validación de pistas para evitar spoilers;
10. fallback ante indisponibilidad de IA;
11. registro del desempeño;
12. dificultad adaptativa;
13. persistencia del resultado;
14. ranking de jugadores.

El detalle se encuentra en `docs/REQUIREMENTS.md`, `docs/USER_STORIES.md` y `docs/ACCEPTANCE_CRITERIA.md`.

## Stack tecnológico

### Frontend

- React
- Vite
- TypeScript

### Backend

- Node.js
- Express
- TypeScript

### Persistencia

- PostgreSQL

### Integraciones

- PokéAPI para datos de Pokémon.
- Proveedor LLM/IA detrás de una abstracción `AIProvider` para generar pistas.

### Herramientas

- Git
- GitHub
- GitHub Projects
- Postman
- Vitest/Jest según el contexto de las pruebas

## Arquitectura

Se utiliza un **monolito modular** con frontend y backend separados dentro del mismo repositorio.

```text
React + Vite + TypeScript
          |
       REST/JSON
          |
Node.js + Express + TypeScript
          |
   +------+------+ 
   |      |      |
PostgreSQL PokéAPI LLM/IA
```

Principios principales:

- React se ocupa de presentación, interacción y estado de interfaz.
- Express expone la API REST y coordina los casos de uso.
- El backend es la fuente de verdad de puntuación, pistas, dificultad, resultados y ranking.
- PostgreSQL mantiene la información persistente.
- PokéAPI y el proveedor de IA se consumen desde backend.
- Los servicios externos se encapsulan detrás de clientes/proveedores.
- Las respuestas de IA se validan antes de enviarse al jugador.

Más información: `docs/architecture/ARCHITECTURE.md`.

## Estructura del repositorio

```text
pokemon-game/
├── frontend/
├── backend/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── ai/
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

La estructura interna objetivo del frontend es:

```text
frontend/src/
├── app/
├── components/
├── features/
│   ├── game/
│   ├── hints/
│   └── ranking/
├── pages/
├── services/
├── hooks/
├── types/
└── utils/
```

La estructura interna objetivo del backend es:

```text
backend/src/
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
```

> La estructura del backend representa la arquitectura acordada. Algunas carpetas se crearán progresivamente durante la implementación.

## Modelo de datos

El modelo conceptual principal es:

```text
GAME 1 ----- N ROUND 1 ----- N HINT
```

Entidades previstas:

- `games`: partida y resultado global;
- `rounds`: desempeño de cada ronda;
- `hints`: pistas solicitadas durante una ronda.

Ver `docs/architecture/DATABASE.md`.

## API prevista

Endpoints principales:

```text
POST /api/games
GET  /api/games/:gameId
POST /api/games/:gameId/rounds/:roundId/guess
POST /api/games/:gameId/rounds/:roundId/hints
POST /api/games/:gameId/finish
GET  /api/ranking
GET  /api/health
```

Contrato de error:

```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "La partida no existe."
  }
}
```

Ver `docs/API_SPECIFICATION.md` y `docs/ERROR_HANDLING.md`.

## Requisitos previos

Para el entorno local se requieren:

- Node.js
- npm
- Git
- PostgreSQL
- Visual Studio Code, recomendado
- Postman, recomendado

## Instalación y ejecución

### Frontend

El frontend ya utiliza Vite.

Desde la raíz del repositorio:

```powershell
cd frontend
npm install
npm run dev
```

Durante desarrollo, Vite mostrará en consola la URL local disponible.

### Backend

La inicialización y los comandos definitivos del backend se documentarán aquí cuando se complete su configuración. No se incluyen comandos ficticios antes de que existan en `backend/package.json`.

### PostgreSQL

PostgreSQL debe estar instalado y ejecutándose localmente. La creación de la base de datos, esquema y variables de conexión se documentará cuando se implemente la capa de persistencia.

## Variables de entorno

Los secretos y configuraciones locales deben mantenerse en archivos `.env`, que no se versionan.

El repositorio contiene `.env.example` como plantilla segura.

Reglas:

- no guardar contraseñas reales en Git;
- no guardar claves de IA en frontend;
- no incluir secretos en `README.md`, commits o capturas;
- mantener las credenciales de servicios externos exclusivamente en backend.

## Inteligencia artificial en el producto

Las pistas generadas por IA utilizan una abstracción para evitar acoplar el dominio a un proveedor específico:

```text
HintService
    |
AIProvider
   / \
LLMProvider  FallbackProvider
```

La salida del modelo se considera entrada no confiable y debe validarse antes de mostrarse.

Reglas principales:

- máximo tres pistas por ronda;
- pistas progresivas;
- no revelar el nombre del Pokémon;
- penalización por uso;
- timeout;
- validación de salida;
- fallback ante error o indisponibilidad.

Ver `docs/AI_HINTS.md`.

## Pruebas

La estrategia contempla:

### Unitarias

- cálculo de puntuación;
- dificultad;
- validación de pistas;
- límites y penalizaciones.

### Integración

- servicios con persistencia;
- servicio de pistas con proveedor de IA simulado;
- servicio Pokémon con API simulada.

### API

- endpoints REST;
- contratos JSON;
- códigos HTTP;
- validaciones;
- manejo de errores;
- pruebas mediante Postman y/o automatización.

Ver `docs/TEST_STRATEGY.md`.

## Seguridad

Principios mínimos:

- secretos fuera de Git;
- validación de entradas;
- consultas SQL parametrizadas;
- CORS controlado;
- manejo seguro de errores;
- rate limiting razonable;
- validación de respuestas de IA;
- claves externas únicamente en backend.

Ver `docs/SECURITY.md`.

## Metodología de desarrollo

El proyecto se organiza mediante Scrum en iteraciones:

- Sprint 0 — Fundación técnica.
- Sprint 1 — Juego base / MVP.
- Sprint 2 — Pistas e IA.
- Sprint 3 — Dificultad adaptativa.
- Sprint 4 — Ranking.
- Sprint 5 — Hardening, QA, seguridad y documentación.

GitHub Projects se utiliza como tablero de seguimiento.

Ver `docs/SCRUM_PLAN.md` y `docs/PRODUCT_BACKLOG.md`.

## Uso de IA durante el desarrollo

La IA forma parte del proceso de ingeniería, pero no sustituye la revisión técnica.

Flujo acordado:

```text
Requirement
    ↓
User Story
    ↓
Acceptance Criteria
    ↓
Architecture
    ↓
AI proposes
    ↓
Human + AI review
    ↓
Implementation
    ↓
Tests
    ↓
Security
    ↓
Documentation
    ↓
Git commit
    ↓
Done
```

El uso relevante de IA debe registrarse en `docs/ai/AI_USAGE.md`.

Las reglas de colaboración con agentes se encuentran en `AGENTS.md`.

## Documentación

Documentos principales:

```text
docs/
├── REQUIREMENTS.md
├── USER_STORIES.md
├── ACCEPTANCE_CRITERIA.md
├── PRODUCT_BACKLOG.md
├── SCRUM_PLAN.md
├── SPRINT_0.md
├── DEFINITION_OF_DONE.md
├── GAME_RULES.md
├── SCORING_RULES.md
├── DIFFICULTY_RULES.md
├── API_SPECIFICATION.md
├── ERROR_HANDLING.md
├── TEST_STRATEGY.md
├── SECURITY.md
├── AI_STRATEGY.md
├── AI_HINTS.md
├── GIT_STRATEGY.md
├── architecture/
├── decisions/
└── ai/
```

## Decisiones arquitectónicas

Las decisiones relevantes se documentan mediante ADR:

- ADR-001 — Monolito modular.
- ADR-002 — PostgreSQL.
- ADR-003 — PokéAPI consumida desde backend.
- ADR-004 — Abstracción `AIProvider`.
- ADR-005 — Fallback de pistas.
- ADR-006 — Puntuación calculada en backend.

## Estado actual

El proyecto se encuentra en construcción incremental.

Completado:

- requerimientos;
- arquitectura conceptual;
- arquitectura detallada;
- Product Backlog;
- estrategia de agentes;
- plan Scrum;
- planeación de Sprint 0;
- inicialización de Git;
- inicialización del frontend React + Vite + TypeScript;
- primeros componentes de la pantalla Home;
- documentación base.

Pendiente/progresivo:

- inicialización del backend;
- conexión PostgreSQL;
- endpoint de health;
- lógica completa del juego;
- pistas con IA;
- dificultad adaptativa;
- ranking;
- suite completa de pruebas;
- hardening final.

El estado de esta sección debe actualizarse a medida que avance el proyecto.
