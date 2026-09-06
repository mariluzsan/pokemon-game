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

### US-10 - Generación de pistas mediante IA

- Fecha: 2026-09-06.
- Propósito: generar una pista breve, progresiva y útil para identificar el
  Pokémon sin devolver explícitamente la respuesta.
- Proveedor/modelo: Anthropic mediante HTTP backend, modelo `claude-sonnet-4-6`,
  decisión registrada en `docs/decisions/ADR-007-anthropic-hints.md`.
- Entrada enviada: nombre objetivo, tipos del Pokémon, nivel progresivo y
  dificultad. Estos datos permanecen en backend; no se envían `playerName`,
  `gameId`, puntuación ni historial del jugador.
- Salida esperada: texto en español de 10 a 240 caracteres, sin el nombre del
  Pokémon, sin formato estructurado innecesario y relacionado con sus tipos.
- Prompt/restricciones: el backend construye el prompt; solicita una sola
  pista en español, prohíbe decir el nombre o revelarlo trivialmente y pide
  únicamente el texto necesario. El frontend no puede suministrar prompts.
- Manejo de errores: timeout, error HTTP, credencial ausente, respuesta vacía
  o salida inválida activan `FallbackHintGenerator`; el error no interrumpe la
  partida ni filtra detalles del proveedor.
- Seguridad: `AI_API_KEY` existe solo en backend; no se registra el prompt ni
  la credencial; la respuesta HTTP contiene únicamente `level` y `content`.
- Persistencia: `hints.source` distingue `AI` de `FALLBACK` y `hints.content`
  almacena la pista validada. No se modifica `score` ni `total_score`.
- Pruebas: `AnthropicHintGenerator` recibe un `fetch` simulado y `HintService`
  recibe un `HintGenerator` inyectado. La suite no requiere internet ni una
  clave real.

### US-14 - Fallback seguro cuando falla la IA

- Fecha: 2026-09-06.
- Propósito: garantizar que un fallo de IA (timeout, error HTTP, respuesta
  inválida, o pista que revela el nombre) no rompa la partida, ofereciendo una
  pista alternativa determinista y segura.
- Mecanismo: `SafeHintGenerator` encapsula el flujo:
  1. Intenta generar pista con `AnthropicHintGenerator`.
  2. Si falla (error, timeout, credencial ausente, respuesta vacía/inválida) →
     intenta `FallbackHintGenerator`.
  3. Si IA devuelve contenido válido pero inseguro (contiene nombre normalizado
     del Pokémon) → rechaza IA e intenta `FallbackHintGenerator`.
  4. Valida `FallbackHintGenerator` también con la misma regla de seguridad.
  5. Si fallback es válido y seguro → persiste y devuelve.
  6. Si fallback también es inseguro (excepcional) → lanza `UnsafeHintError`.
- Datos de fallback: tipo(s) del Pokémon obtenidos de PokéAPI.
- Estrategia: fallback es progresivo (level 1-3), menciona tipo(s) pero NO el
  nombre, y varía entre tipo único y dual. Determinista: mismo Pokémon + mismo
  level → mismo fallback.
- Persistencia: `hints.source` registra `FALLBACK` para distinguir de `AI`.
  El contador `hints_used`, `level` y `penalty` se aplican idénticamente
  independientemente del source. Una solicitud válida consume exactamente una pista.
- Seguridad: credenciales del proveedor siguen siendo internas; el fallback
  no usa secretos; el nombre correcto no se devuelve en error ni en éxito;
  contenido de IA fallido o inseguro no se persiste ni se expone.
- Pruebas:
  - `SafeHintGenerator` con mock de IA error → devuelve fallback.
  - `SafeHintGenerator` con mock de IA insegura → devuelve fallback.
  - `FallbackHintGenerator` es progresivo (level 1, 2, 3 → contenidos distintos).
  - Fallback con dual-type es válido y progresivo.
  - Validación de seguridad se aplica a fallback; si fallara, lanza excepción.
- Integración: `HintService` inyecta `SafeHintGenerator` con `validator` en
  producción. Los tests pueden inyectar generadores mock. Sin cambios en
  endpoint, controller o contrato de respuesta.
- Límites: fallback NO saltea `MAX_HINTS_PER_ROUND`; si se alcanza límite antes
  de solicitar, se rechaza sin intentar IA ni fallback.

#### Uso de IA como agente de desarrollo

- Herramienta/modelo: GitHub Copilot.
- Objetivo: integrar US-10 sobre el flujo de solicitudes de US-09 respetando
  los documentos, ADRs, seguridad, pruebas y límites con historias futuras.
- Decisiones aceptadas: Anthropic mediante HTTP sin SDK adicional,
  abstracción `HintGenerator`, validación mínima exigida por US-10 y fallback
  requerido explícitamente por sus criterios.
- Decisiones descartadas: llamadas desde frontend, secretos `VITE_*`, un
  endpoint paralelo, cambios de scoring y una estrategia más amplia de
  sanitización/reintentos propia de US-13.
- Verificación: suite backend completa, build frontend, lint frontend,
  revisión de payloads y `git diff --check`.

## Registros

### 2026-09-06 - Seleccion de Pokemon por dificultad US-18

- Objetivo: implementar exclusivamente US-18 para que la creación de una
  ronda seleccione un Pokémon acorde con `games.difficulty` (la dificultad
  vigente determinada por US-17), sin recalcular desempeño, nivel ni
  dificultad, y sin adelantar Sprint 4.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar ACCEPTANCE_CRITERIA.md, USER_STORIES.md,
  PRODUCT_BACKLOG.md, SCRUM_PLAN.md, API_SPECIFICATION.md,
  ERROR_HANDLING.md, arquitectura, ADRs, el pipeline US-15/16/17, el esquema
  PostgreSQL y `PokemonApiClient`. Ninguna fuente definía objetivamente cómo
  distinguir un Pokémon EASY/MEDIUM/HARD, por lo que se detuvo la
  implementación y se reportaron alternativas técnicamente viables basadas en
  campos reales de PokéAPI (rango por generación, suma de stats, especie
  legendaria/mítica, `capture_rate`) antes de escribir código.
- Decisión aceptada por el Tech Lead: clasificar por rango de `pokemonId`
  (generación) — `EASY` 1-151, `MEDIUM` 152-493, `HARD` 494-1025 —, excluir
  Pokémon ya usados en la partida mediante `rounds.pokemon_id`, y reintentar
  la selección aleatoria un número limitado de veces antes de un error
  controlado.
- Implementación: `pokemon-difficulty.ts` expone la tabla de rangos y las
  funciones puras `isPokemonInDifficultyRange` y `pickCandidatePokemonId`
  (aleatoriedad inyectada, sin `Math.random()` disperso). `PokemonApiClient.
  selectRandomPokemon(difficulty, excludedPokemonIds)` reutiliza el mismo
  cliente HTTP de US-02 sin crear un segundo flujo: primero elige un
  candidato local (sin llamar a PokéAPI) y luego valida ese único candidato
  contra PokéAPI, preservando el comportamiento de error existente ante fallos
  reales de PokéAPI (sin reintentos de red). `RoundService.createRound`
  obtiene `game.difficulty` y los `pokemon_id` ya usados
  (`RoundRepository.findUsedPokemonIds`, método opcional para no romper
  mocks existentes) antes de seleccionar y persistir la ronda; si no hay
  candidato válido, no se crea la ronda y se propaga `PokemonApiError` (ya
  mapeado a `503 POKEAPI_UNAVAILABLE`).
- Decisiones descartadas: nuevo endpoint, nueva migración (no se requiere
  columna adicional), nuevo código de error (`POKEAPI_UNAVAILABLE` ya cubre
  el caso de "sin candidatos"), fallback cruzado entre dificultades sin
  candidatos, recalcular performance/nivel/dificultad, y cualquier cambio a
  US-15, US-16 o US-17.
- Verificación: suite backend completa (incluye pruebas de fronteras exactas
  151/152 y 493/494, ausencia de solapamiento para los 1025 ids, selección
  determinista con aleatoriedad inyectada, exclusión de repetidos, rango
  agotado, y el pipeline Round N -> adaptación -> Round N+1 con nueva
  dificultad), build frontend, lint frontend (los mismos dos errores
  preexistentes documentados), `git diff --check` y revisión de errores del
  editor.
- Archivos afectados: `backend/src/modules/pokemon/pokemon-difficulty.ts`,
  `backend/src/modules/pokemon/pokemon-difficulty.test.ts`,
  `backend/src/modules/pokemon/pokemon.client.ts`,
  `backend/src/modules/pokemon/pokemon.client.test.ts`,
  `backend/src/modules/game/round.service.ts`,
  `backend/src/modules/game/round.repository.ts`,
  `backend/src/modules/game/game.service.test.ts`, `backend/package.json`,
  `docs/DIFFICULTY_RULES.md`, `docs/ERROR_HANDLING.md`,
  `MANUAL_TEST_PLAN_US18.md` y este registro.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del
  usuario.

### 2026-09-06 - Adaptacion de dificultad US-17

- Objetivo: adaptar la dificultad vigente de cada partida usando el nivel ya
  calculado por US-16, sin modificar la selección de Pokémon de US-18.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar los criterios de US-17, el flujo transaccional de
  resolución y expiración, la persistencia de US-15 y el clasificador de
  US-16; mantener las rondas históricas y evitar IA, PokéAPI y frontend.
- Decisión aceptada por el Tech Lead: tras cada ronda completada, inclusive una
  expirada, mover `games.difficulty` un único nivel hacia el
  `PerformanceLevel` de US-16. No hay mínimo de rondas ni saltos directos entre
  `EASY` y `HARD`.
- Implementación: `mapPerformanceLevelToDifficulty` es una función pura. Las
  transacciones que resuelven o expiran una ronda obtienen el snapshot de la
  partida, reutilizan `calculatePerformanceLevel` de US-16 y actualizan
  `games.difficulty` antes de confirmar. `rounds.difficulty` no se actualiza.
- Decisiones descartadas: mapping directo entre nivel y dificultad, recalcular
  scoring o pistas, endpoint nuevo, control de frontend, migración y cambios a
  la selección de Pokémon.
- Verificación: compilación y suite backend con pruebas de las nueve
  combinaciones del mapping. Las pruebas no usan IA ni PokéAPI reales.
- Archivos afectados: `backend/src/modules/game/difficulty.service.ts`,
  `backend/src/modules/game/difficulty.service.test.ts`,
  `backend/src/modules/game/round.repository.ts`,
  `backend/src/modules/game/game.types.ts`, `backend/package.json`,
  `docs/DIFFICULTY_RULES.md`, `MANUAL_TEST_PLAN_US17.md` y este registro.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del
  usuario.

### 2026-09-06 - Registro de desempeño US-15

- Objetivo: implementar exclusivamente US-15 para consolidar una fuente autoritativa de desempeño basada en datos ya persistidos por partida y ronda.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios/documentación de Sprint 3, esquema PostgreSQL, flujo de rondas, expiración, scoring y pistas; evitar migraciones y no adelantar US-16, US-17 ni US-18.
- Resultado propuesto: crear `PerformanceService` interno y una consulta agregada en `RoundRepository` que obtenga solo para una partida existente las señales respaldadas por la documentación: `correctAnswers`, `incorrectAnswers`, `averageResponseTimeSeconds` y `totalHintsUsed`, excluyendo rondas activas mediante `finished_at IS NOT NULL`.
- Decisión: aceptada. No se crea endpoint público ni migración porque `rounds` ya almacena `is_correct`, `time_taken`, `hints_used`, `finished_at` y `score`, y `games` ya conserva el contexto global de la partida.
- Decisiones descartadas: tabla `performance`, columnas acumuladas redundantes, métricas enviadas por frontend, clasificación de nivel, cambios de dificultad, cambios de selección de Pokémon y recálculo de score.
- Verificación: pruebas unitarias del nuevo servicio, suite backend completa, build frontend, lint frontend, `git diff --check`, revisión de errores del editor y SQL manual equivalente documentado.
- Archivos afectados: `backend/src/modules/game/performance.service.ts`, `backend/src/modules/game/performance.service.test.ts`, `backend/src/modules/game/round.repository.ts`, `backend/src/modules/game/game.types.ts`, `backend/package.json`, `MANUAL_TEST_PLAN_US15.md` y este registro.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Calculo de nivel de desempeño US-16

- Objetivo: implementar exclusivamente US-16 para clasificar el desempeño de una partida a partir del snapshot ya consolidado por US-15, sin modificar dificultad ni selección de Pokémon.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios y documentación de Sprint 3, reutilizar `PerformanceSnapshot`, evitar migraciones, no crear endpoint si no está documentado y no adelantar US-17 ni US-18.
- Resultado propuesto: extender `PerformanceService` con una función pura `calculatePerformanceLevel(snapshot)` y un método `getPerformanceLevel(gameId)` que reutiliza `getPerformanceSnapshot(gameId)`.
- Regla aplicada: `roundsPlayed = correctAnswers + incorrectAnswers`; `precision = roundsPlayed === 0 ? 0 : correctAnswers / roundsPlayed * 100`; `independence = roundsPlayed === 0 ? 0 : max(0, 1 - totalHintsUsed / (roundsPlayed * 3)) * 100`; `score = precision * 0.60 + independence * 0.15`; clasificación `EASY < 40`, `MEDIUM >= 40 && < 70`, `HARD >= 70`.
- Decisión: aceptada. Se utilizan únicamente `correctAnswers`, `incorrectAnswers` y `totalHintsUsed` ya provistos por US-15. `averageResponseTimeSeconds` permanece en el snapshot porque pertenece a US-15, pero no participa en la clasificación aprobada.
- Decisiones descartadas: recalcular métricas desde tablas fuera de `PerformanceSnapshot`, persistir `performance_level`, reutilizar `games.difficulty`, crear endpoint público, modificar `rounds.difficulty`, adaptar dificultad automáticamente o filtrar Pokémon por desempeño.
- Verificación: suite backend completa, build frontend, lint frontend con errores preexistentes no relacionados, `git diff --check`, revisión de errores del editor y `git status`.
- Archivos afectados: `backend/src/modules/game/performance.service.ts`, `backend/src/modules/game/performance.service.test.ts`, `backend/src/modules/game/game.types.ts`, `MANUAL_TEST_PLAN_US16.md` y este registro.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Validación de spoilers US-13

- Objetivo: impedir desde backend que una pista entregue explícitamente el nombre del Pokémon objetivo.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar el flujo de generación, persistencia transaccional, límite y penalización; separar la validación de spoilers del proveedor de IA y rechazar una salida insegura sin adelantar un nuevo fallback.
- Resultado propuesto: `HintService` recibe el texto generado y lo entrega a `HintSafetyValidator` antes de que `HintRepository` inserte la pista. La validación compara el nombre con el contenido tras eliminar tildes, convertir a minúsculas y aplicar `trim`.
- Decisión: aceptada por el Tech Lead. Una coincidencia del nombre produce `422 UNSAFE_HINT`, sin contenido sensible en la respuesta. No se reintenta ni se transforma esa salida en una pista alternativa.
- Persistencia: al lanzar el error dentro de `registerGeneratedHint`, la transacción revierte; no hay fila en `hints`, no cambia `rounds.hints_used`, ni se aplica `hints.penalty` o el descuento de `games.total_score`.
- Defensa en profundidad: el prompt continúa prohibiendo revelar el nombre y la validación determinista posterior mantiene la garantía de la aplicación frente a una respuesta que ignore el prompt.
- Verificación: pruebas unitarias de coincidencias exactas, mayúsculas, minúsculas, frases, tildes y no coincidencias; prueba adversarial de servicio con un generador falso que devuelve el nombre; suite backend sin IA real.
- Archivos afectados: `backend/src/modules/hints/hint-safety.validator.ts`, `backend/src/modules/hints/hint.service.ts`, `backend/src/modules/hints/hint.generator.ts`, pruebas del módulo, controlador y contratos de error.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Penalizacion por pistas US-12
- Objetivo: aplicar exclusivamente la penalizacion configurada por cada pista al score final de la ronda.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios de US-12, formula de US-06, ADRs, esquema PostgreSQL, flujo de pistas y concurrencia; persistir la penalizacion en backend sin adelantar US-13 ni US-14.
- Resultado propuesto: cada pista persiste `100` en `hints.penalty` y reduce `games.total_score` en la misma transaccion que registra la pista, limitado a cero. La resolucion conserva el score acreditado por respuesta correcta sin cobrar nuevamente las pistas.
- Decision: modificada por el Tech Lead durante la prueba manual. El contrato de `/hints` devuelve `penalty` y `totalScore` posteriores a la deduccion; `/guess` y `/expire` incluyen `hintPenalty` para informar el costo acumulado.
- Decisiones descartadas: penalizacion enviada o calculada por frontend, doble descuento al resolver la ronda, migracion adicional, cambios de dificultad/bono temporal, validacion adicional de spoilers y fallback nuevo.
- Verificacion: pruebas deterministas de score sin pistas, una, dos y tres pistas, score no negativo, respuesta incorrecta, expiracion, bonos existentes y uso de penalizacion persistida; compilacion backend, build/lint frontend, revision de editor y SQL manual.
- Archivos afectados: `backend/src/modules/game/round.service.ts`, `backend/src/modules/game/round.repository.ts`, `backend/src/modules/game/game.service.test.ts`, `backend/src/modules/hints/hint.repository.ts`, `backend/src/modules/hints/hint.types.ts`, `backend/src/modules/hints/hint.service.test.ts`, `MANUAL_TEST_PLAN_US12.md` y este registro.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

### 2026-09-06 - Limite de pistas por ronda US-11
- Objetivo: implementar exclusivamente el limite de tres pistas por ronda,
  manteniendo el backend como autoridad y sin aplicar penalizaciones.
- Herramienta/modelo: GitHub Copilot.
- Prompt o resumen: revisar criterios de US-11, contrato API, esquema, ADRs,
  flujo US-09/US-10, concurrencia y seguridad; impedir llamadas a IA una vez
  alcanzado el limite y no adelantar US-12, US-13 ni US-14.
- Resultado propuesto: reutilizar `rounds.hints_used`, `hints.level` y la
  transaccion existente. La transaccion bloquea la ronda, comprueba el limite,
  genera solo con el nivel autorizado y persiste la pista con el contador.
- Decision: aceptado. Una pista se considera utilizada solo después de que
  pista y contador se persisten juntos; un fallo anterior se revierte y no
  consume una pista. El frontend solo muestra los contadores autoritativos y
  deshabilita el control como mejora de UX.
- Decision descartada: nueva migracion, estado duplicado, penalizaciones de
  puntuacion, mecanismos de sanitizacion adicionales y nuevo fallback.
- Verificacion: pruebas unitarias de niveles, limite, ausencia de invocacion
  del generador y concurrencia simulada; build backend, build/lint frontend y
  revision de contrato, seguridad y diff.
- Archivos afectados: `backend/src/modules/hints/*`,
  `frontend/src/services/api.ts`, `frontend/src/pages/Game/*`,
  `docs/API_SPECIFICATION.md`, `docs/ai/AI_USAGE.md` y
  `MANUAL_TEST_PLAN_US11.md`.
- Commit relacionado: pendiente. No se realiza commit por requerimiento del usuario.

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
