# Registro de Uso de IA

## Propósito
Documentar cómo se utiliza IA durante el desarrollo y cómo se verifican sus resultados.

## Registrar
- Fecha.
- Objetivo.
- Herramienta/modelo.
- Prompt o resumen.
- Resultado propuesto.
- Decisión: aceptado, modificado o rechazado.
- Verificación.
- Archivos afectados.
- Commit relacionado.

La salida de IA es una propuesta técnica, no una autoridad.

## IA del producto
La generación de pistas se trata como una integración no confiable: timeout, errores, validación de formato, validación de spoilers, límite de pistas y fallback.

## Registros

### 2026-09-06 - Solicitud de pistas US-09
- Objetivo: implementar únicamente US-09 para registrar solicitudes progresivas de pista durante una ronda vigente, sin implementar generación funcional de IA.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios, arquitectura, ADRs, esquema, US-01 a US-08, seguridad y pruebas; preservar el límite entre solicitud (US-09) y generación de contenido con IA (US-10).
- Resultado propuesto: crear el módulo `hints`, registrar transaccionalmente el nivel y `hints_used`, exponer `POST /api/games/:gameId/rounds/:roundId/hints` y devolver `{ level, content: null }` sin identidad del Pokémon.
- Decision: aceptado por el Tech Lead. US-09 aplica temporalmente el límite de tres por ser criterio explícito. `content: null` representa una solicitud registrada; US-10 implementará el proveedor de IA y completará el contenido sin romper el contrato.
- Verificacion: pruebas unitarias del servicio de pistas, suite backend, build/lint frontend, revisión de payloads, `git diff --check` y prueba manual en `MANUAL_TEST_PLAN_US09.md`.
- Archivos afectados: `backend/src/modules/hints/*`, `backend/src/modules/game/game.controller.ts`, `backend/src/modules/game/game.routes.ts`, `frontend/src/services/api.ts`, `frontend/src/pages/Game/Game.tsx`, `frontend/src/pages/Game/Game.css`, `docs/API_SPECIFICATION.md`, `MANUAL_TEST_PLAN_US09.md`.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Finalizacion de partida US-08
- Objetivo: implementar unicamente US-08, completando diez rondas y finalizando la partida desde backend.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios exactos, reglas de diez rondas, persistencia existente, concurrencia, expiracion y flujo React; no implementar pistas, IA ni funcionalidades posteriores.
- Resultado propuesto: reutilizar `games.current_round`, `games.status`, `games.finished_at` y `games.total_score`; bloquear la partida al crear/completar rondas; persistir expiraciones con score cero; agregar accion de continuar y estado final.
- Decision: aceptado. No se crea migracion porque el esquema ya contiene los campos necesarios. La expiracion se registra mediante un endpoint idempotente y las rondas posteriores solo se crean bajo transaccion y secuencia validada.
- Verificacion: pruebas backend deterministas, build backend/frontend, lint frontend ejecutado con solo los dos errores preexistentes documentados, `git diff --check` y prueba manual documentada en `MANUAL_TEST_PLAN_US08.md`.
- Archivos afectados: `backend/src/modules/game/*`, `frontend/src/services/api.ts`, `frontend/src/pages/Game/Game.tsx`, `docs/API_SPECIFICATION.md`, `docs/ERROR_HANDLING.md`, `docs/architecture/BACKEND.md`, `MANUAL_TEST_PLAN_US08.md`.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Resultado de ronda US-07
- Objetivo: implementar unicamente US-07, mostrando el resultado de cada ronda dentro del flujo existente sin avanzar a US-08.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios exactos, arquitectura, contratos, esquema y las implementaciones US-01 a US-06; integrar el resultado correcto, incorrecto o expirado; preservar la proteccion de la identidad del Pokemon y no crear funcionalidades de finalizacion.
- Resultado propuesto: reutilizar el contrato existente de `POST /api/games/:gameId/rounds/:roundId/guess`, que ya devuelve `isCorrect`, `score` y `totalScore`; modelar en frontend el estado `ROUND_RESULT`, ocultar el formulario y detener el temporizador al resolverse o expirar la ronda; reforzar las pruebas de payload y ausencia de identidad.
- Decision: aceptado. No se agrego endpoint ni migracion, porque los criterios no exigen revelar el Pokemon, el tiempo empleado ni consultar posteriormente el resultado. La expiracion mantiene el `409 ROUND_EXPIRED` de US-05 y la UI presenta el resultado expirado sin puntuacion.
- Decision descartada: revelar nombre o identificador del Pokemon, persistir un estado adicional de expiracion, crear una pantalla final, finalizar la partida o habilitar siguiente ronda. No estan exigidos por US-07 o pertenecen a US-08.
- Verificacion: `npm run build` en frontend; `npm test` en backend (migracion, servicio de juego y cliente PokéAPI); comprobacion de que los payloads de challenge y resultado no incluyen `pokemonId` ni `pokemonName`.
- Archivos afectados: `frontend/src/pages/Game/Game.tsx`, `frontend/src/components/Timer/Timer.tsx`, `backend/src/modules/game/game.service.test.ts`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Correccion de normalizacion de respuestas
- Objetivo: corregir respuestas válidas marcadas como incorrectas cuando el nombre de presentación difiere del slug técnico de PokéAPI.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: investigar por qué algunos Pokémon se evalúan como incorrectos pese a utilizar el nombre correcto.
- Resultado propuesto: normalizar diferencias ortográficas de presentación antes de comparar, incluyendo puntuación, tildes y símbolos de género; cubrir nombres compuestos representativos mediante pruebas.
- Decision: aceptado. La corrección no acepta alias, traducciones ni coincidencias parciales y conserva la evaluación y puntuación exclusivamente en backend.
- Verificacion: `npm test` en backend.
- Archivos afectados: `backend/src/modules/game/round.service.ts`, `backend/src/modules/game/game.service.test.ts`, `docs/API_SPECIFICATION.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Seleccion de Pokemon para una ronda US-02
- Objetivo: implementar unicamente US-02, creando una ronda para una partida existente mediante un Pokemon real de PokéAPI.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar la documentacion vigente, US-01, el esquema PostgreSQL y la arquitectura; implementar US-02 sin avanzar a US-03 ni a pistas, scoring, dificultad adaptativa o ranking.
- Resultado propuesto: agregar cliente backend para PokéAPI, servicio y repositorio de rondas, `POST /api/games/:gameId/rounds`, validaciones y pruebas unitarias sin exponer `pokemon_id`.
- Decision: aceptado con una integracion externa encapsulada, validacion de `id` y `name`, manejo seguro de errores y persistencia parametrizada. Se descarto exponer datos del Pokemon o modificar el esquema porque US-03 es quien visualiza el personaje y el esquema actual ya soporta la ronda.
- Verificacion: pruebas automatizadas de esquema, servicio de partida/ronda y cliente PokéAPI; compilacion de backend y frontend; revision de contrato HTTP y estado de Git.
- Archivos afectados: `backend/src/modules/game/*`, `backend/src/modules/pokemon/*`, `backend/package.json`, `docs/API_SPECIFICATION.md`, `docs/ERROR_HANDLING.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Inicio funcional de partida US-01
- Objetivo: implementar el primer incremento funcional de Sprint 1 para crear una partida desde frontend y backend.
- Herramienta/modelo: Codex.
- Prompt o resumen: iniciar formalmente Sprint 1, revisar documentacion obligatoria, confirmar US-01, criterios de aceptacion, API, arquitectura, ADRs y modelo `games`, implementar solo US-01 y detenerse antes de US-02.
- Resultado propuesto: agregar `POST /api/games` con validacion de `playerName`, persistencia parametrizada en PostgreSQL, respuesta con estado inicial de partida y formulario minimo en Home para iniciar la partida.
- Decision: aplicado como alcance minimo de US-01; no se crean rondas ni se selecciona Pokemon porque corresponde a US-02.
- Verificacion: `npm test` en backend; `npm run build` en frontend ejecutado fuera del sandbox tras fallo `spawn EPERM` en sandbox.
- Archivos afectados: `backend/src/modules/game/*`, `backend/src/app.ts`, `backend/package.json`, `frontend/src/services/api.ts`, `frontend/src/components/GameButton/GameButton.tsx`, `frontend/src/pages/Home/Home.tsx`, `frontend/src/pages/Home/Home.css`, `docs/API_SPECIFICATION.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Revision documental de Sprint 0
- Objetivo: analizar el estado real del repositorio y actualizar la documentacion desfasada de Sprint 0.
- Herramienta/modelo: Codex.
- Prompt o resumen: revisar documentacion, frontend, backend, migracion inicial y estado de US-01 a US-08 sin modificar codigo.
- Resultado propuesto: marcar como completados los elementos de Sprint 0 ya presentes en el codigo y mantener pendientes primer test, revision de seguridad y commit de cierre.
- Decision: aceptado por el Tech Lead mediante la alternativa 2 de alineacion documental.
- Verificacion: lectura de `AGENTS.md`, `README.md`, documentos Scrum/backlog/criterios, `.env.example`, `frontend/package.json`, `backend/package.json`, estructura de `frontend/src`, estructura de `backend/src` y migracion `001_initial_schema.sql`.
- Archivos afectados: `docs/SPRINT_0.md`, `README.md`, `docs/API_SPECIFICATION.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Primer test automatizado de Sprint 0
- Objetivo: crear una primera verificacion automatizada sin depender de servicios externos reales.
- Herramienta/modelo: Codex.
- Prompt o resumen: continuar con la creacion del primer test del proyecto.
- Resultado propuesto: agregar un script `npm test` en backend y validar la migracion inicial de PostgreSQL.
- Decision: aceptado como incremento minimo para completar el item "Primer test" de Sprint 0.
- Verificacion: `npm test` en `backend` ejecuta `npm run build` y luego el test compilado.
- Archivos afectados: `backend/package.json`, `backend/src/infrastructure/database/migrations/001_initial_schema.test.ts`, `docs/SPRINT_0.md`, `README.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Revision de seguridad de Sprint 0
- Objetivo: revisar riesgos basicos de seguridad antes de cerrar Sprint 0.
- Herramienta/modelo: Codex.
- Prompt o resumen: realizar revision de seguridad del estado actual del proyecto.
- Resultado propuesto: verificar secretos versionados, `.gitignore`, `.env.example`, CORS, logging de errores, dependencias y migracion inicial.
- Decision: aplicar ajustes minimos para CORS explicito y logging seguro del health check.
- Verificacion: `git ls-files`, `npm audit --audit-level=moderate` en backend y frontend, revision de `app.ts`, `database.ts`, `.env.example` y migracion inicial.
- Archivos afectados: `.env.example`, `backend/src/app.ts`, `docs/SECURITY.md`, `docs/SPRINT_0.md`, `README.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Visualizar personaje oculto US-03
- Objetivo: implementar unicamente US-03, permitiendo al jugador visualizar la imagen del Pokémon oculto sin revelar su identidad.
- Herramienta/modelo: GitHub Copilot (Claude Haiku 4.5).
- Prompt o resumen: revisar criterios de aceptación, arquitectura, US-01 y US-02; extender PokemonApiClient para obtener imagen; crear endpoint GET para challenge; implementar componentes frontend; no crear nuevo router, reutilizar flujo existente.
- Resultado propuesto: 
  1. Backend: extender PokemonApiClient con getPokemonImageUrl(), agregar RoundRepository.findById(), agregar RoundService.getRoundChallenge(), nuevo endpoint GET /api/games/:gameId/rounds/:roundId/challenge.
  2. Frontend: crear componente PokemonChallenge, página Game, actualizar Home y App para navegación, agregar funciones createRound() y getRoundChallenge() en api.ts.
  3. Documentación: actualizar API_SPECIFICATION.md con nuevo endpoint.
- Decision: aceptado. Arquitectura se mantiene: backend encapsula PokéAPI, frontend no expone pokemon_id, seguridad preservada. Se reutilizó arquitectura existente sin modificaciones innecesarias.
- Verificacion: 
  - `npm test` en backend: 9 tests pasan (incluidos nuevos tests de getPokemonImageUrl).
  - `npm run build` en frontend: compila sin errores.
  - Prueba manual: POST /api/games → POST /api/games/:gameId/rounds → GET /api/games/:gameId/rounds/:roundId/challenge.
  - Respuesta challenge NO expone pokemon_id, solo: id, roundNumber, imageUrl, difficulty.
  - Imagen obtenida de PokéAPI es válida y renderizable.
  - Estados: loading, error, success manejados correctamente en UI.
- Archivos afectados: 
  - Backend: `backend/src/modules/pokemon/pokemon.client.ts`, `backend/src/modules/pokemon/pokemon.client.test.ts`, `backend/src/modules/game/round.types.ts`, `backend/src/modules/game/round.repository.ts`, `backend/src/modules/game/round.service.ts`, `backend/src/modules/game/game.controller.ts`, `backend/src/modules/game/game.routes.ts`, `backend/src/modules/game/game.service.test.ts`.
  - Frontend: `frontend/src/services/api.ts`, `frontend/src/pages/Home/Home.tsx`, `frontend/src/pages/Game/Game.tsx`, `frontend/src/pages/Game/Game.css`, `frontend/src/components/PokemonChallenge/PokemonChallenge.tsx`, `frontend/src/components/PokemonChallenge/PokemonChallenge.css`, `frontend/src/App.tsx`.
  - Docs: `docs/API_SPECIFICATION.md`.
- Commit relacionado: pendiente. (No se hace commit per requerimiento del usuario).
- Notas: US-03 implementada sin avanzar a US-04 (timer), US-05 (guess), US-06 (scoring), US-07 (result), US-08 (finish), US-09+ (hints/IA/ranking/difficulty). Arquitectura mantiene pokemon_id secreto en backend, frontend solo recibe imageUrl.

### 2026-09-05 - Temporizador de ronda US-04
- Objetivo: implementar unicamente US-04 con una duracion de 30 segundos, manteniendo fuera de alcance el endpoint y la evaluacion de respuestas de US-05.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: continuar sobre US-01, US-02 y US-03; usar los criterios de aceptacion actualizados; integrar un temporizador visual y una interfaz backend minima de expiracion sin implementar US-05 a US-08.
- Resultado propuesto: incluir `timeLimitSeconds` en el desafio, calcular el contador desde `startedAt`, y exponer una comprobacion de expiracion inyectable en `RoundService`.
- Decision: aceptado. Se fija la duracion en 30 segundos, se mantiene el backend como autoridad temporal y no se crea endpoint de respuestas, comparacion, puntuacion ni resultado.
- Decision descartada: implementar el flujo de respuestas requerido por algunos criterios de expiracion, porque pertenece a US-05 y fue excluido explicitamente.
- Verificacion: pruebas deterministas del limite temporal en backend, compilacion del frontend, revision de errores del editor, suite backend y prueba manual del contador en navegador. El lint completo queda bloqueado por dos errores preexistentes en `App.tsx` y `Home.tsx`.
- Archivos afectados: `backend/src/modules/game/round.types.ts`, `backend/src/modules/game/round.service.ts`, `backend/src/modules/game/game.service.test.ts`, `frontend/src/services/api.ts`, `frontend/src/pages/Game/Game.tsx`, `frontend/src/components/Timer/Timer.tsx`, `frontend/src/components/Timer/Timer.css`, `docs/API_SPECIFICATION.md`.
- Commit relacionado: pendiente.

### 2026-09-06 - Enviar respuesta US-05
- Objetivo: implementar unicamente US-05 para enviar una respuesta, evaluarla en backend y devolver si es correcta, sin avanzar a scoring, resultado de ronda o finalizacion de partida.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios de aceptacion exactos, arquitectura, ADRs, implementaciones US-01 a US-04, esquema PostgreSQL y pruebas; reutilizar la ronda y la autoridad temporal del backend.
- Resultado propuesto: agregar `POST /api/games/:gameId/rounds/:roundId/guess`, extender PokemonApiClient para obtener el nombre internamente, persistir `finished_at`, `time_taken` e `is_correct`, y conectar un formulario en `Game.tsx`.
- Decision: aceptado. Se usa `answer` como request, se normaliza solo con trim y minusculas para comparar el nombre exacto, se devuelve unicamente `isCorrect`, y el backend rechaza respuestas al cumplir o superar 30 segundos.
- Decision descartada: aceptar alias, traducciones, nombres parciales o revelar el nombre correcto; no estan definidos por los criterios y ampliarian el alcance de US-05. Tambien se descarto modificar `score`, `total_score`, `current_round` o el estado de finalizacion.
- Verificacion: `npm test` en backend; `npm run build` en backend y frontend; pruebas deterministas con reloj inyectado para 29.999 y 30 segundos; revision de payload sin `pokemon_id`.
- Archivos afectados: `backend/src/modules/game/*`, `backend/src/modules/pokemon/pokemon.client.ts`, `frontend/src/services/api.ts`, `frontend/src/components/Timer/Timer.tsx`, `frontend/src/pages/Game/Game.tsx`, `frontend/src/pages/Game/Game.css`, `docs/API_SPECIFICATION.md`, `docs/ERROR_HANDLING.md`.
- Commit relacionado: pendiente.
