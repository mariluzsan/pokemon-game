# US-06 Implementada - Reporte Final

## Criterios de Aceptación → Evidencia

### 1. "El backend calcula la puntuación de cada ronda a partir del resultado..."
- ✅ Implementado en `RoundService.calculateScore()`
- Considera: resultado, tiempo, dificultad
- Archivo: [backend/src/modules/game/round.service.ts](backend/src/modules/game/round.service.ts#L23-L36)

### 2. "El cálculo utiliza las mismas reglas para entradas equivalentes..."
- ✅ Función pura, sin estado externo
- Tests unitarios verifican determinismo
- Archivos: [game.service.test.ts](backend/src/modules/game/game.service.test.ts#L350-L395)

### 3. "Una respuesta incorrecta no recibe el beneficio..."
- ✅ Si `isCorrect === false`, retorna 0
- Verificado en test y BD (score = 0)
- Código: [round.service.ts](backend/src/modules/game/round.service.ts#L34)

### 4. "El uso de pistas reduce la puntuación..." (Sprint 2)
- ℹ️ No aplica a US-06. Implementado en Sprint 2 (US-12)

### 5. "La puntuación nunca es negativa"
- ✅ Implementado con `Math.max(0, ...)` en timeBonus
- score base = 1000, nunca puede ser negativo

### 6. "La puntuación calculada queda asociada al resultado..."
- ✅ Persistida en `rounds.score`
- Actualizada en `games.total_score`
- Verificado en BD

### 7. "La puntuación base es 1000 puntos"
- ✅ Constante: `const baseScore = 1000`
- Archivo: [round.service.ts](backend/src/modules/game/round.service.ts#L23)

### 8. "Bonificación por dificultad: 0/EASY, 200/MEDIUM, 400/HARD"
- ✅ Implementado en `DIFFICULTY_BONUS`
- Archivo: [round.service.ts](backend/src/modules/game/round.service.ts#L19-L23)

### 9. "Bono temporal: floor(500 * remainingMs / 30_000)"
- ✅ `const timeBonus = Math.floor((TIME_BONUS_COEFFICIENT * remainingMs) / TIME_BONUS_DIVISOR)`
- TIME_BONUS_COEFFICIENT = 500
- TIME_BONUS_DIVISOR = 30_000
- remainingMs = max(0, 30_000 - elapsedMs)

### 10. "Cada pista resta 100 puntos..." (Sprint 2)
- ℹ️ No aplica a US-06. Implementado en Sprint 2 (US-12)

### 11. "Una respuesta incorrecta obtiene exactamente 0 puntos"
- ✅ `if (!isCorrect) return 0`
- Verificado en test y BD (respuesta incorrecta → score: 0)

### 12. "Respuesta con elapsedMs >= 30_000 se rechaza..."
- ✅ Recibe error 409 ROUND_EXPIRED
- No se calcula score
- Archivo: [round.service.ts](backend/src/modules/game/round.service.ts#L128-L130)

### 13. "El cálculo usa floor solo para bono temporal..."
- ✅ `Math.floor()` aplicado solo a timeBonus
- Archivo: [round.service.ts](backend/src/modules/game/round.service.ts#L31)

### 14. "Actualización de rounds.score y games.total_score es atómica"
- ✅ Transacción SQL implementada
- BEGIN → UPDATE rounds → UPDATE games → COMMIT/ROLLBACK
- Archivo: [round.repository.ts](backend/src/modules/game/round.repository.ts#L76-L125)

### 15. "Un segundo envío para ronda ya resuelta se rechaza con 409 ROUND_ALREADY_RESOLVED"
- ✅ Verificación en updateGuess()
- Revisa finished_at antes de procesar
- Error code: "ROUND_ALREADY_RESOLVED"
- Archivos: [round.repository.ts](backend/src/modules/game/round.repository.ts#L88-L93)
           [game.controller.ts](backend/src/modules/game/game.controller.ts#L180-L188)

---

## Fórmula de Puntuación

```
score = base + difficulty_bonus + time_bonus

Donde:
  base = 1000

  difficulty_bonus = { 0 si EASY, 200 si MEDIUM, 400 si HARD }

  time_bonus = floor(500 * remainingMs / 30_000)
    donde remainingMs = max(0, 30_000 - elapsedMs)

Casos especiales:
  - Si isCorrect === false: score = 0
  - Si elapsedMs >= 30_000: rechazado con ROUND_EXPIRED (no calcula)
```

### Constantes (sin números mágicos)

```typescript
const baseScore = 1000
const TIME_BONUS_COEFFICIENT = 500
const TIME_BONUS_DIVISOR = 30_000
const ROUND_TIME_LIMIT_SECONDS = 30
const DIFFICULTY_BONUS: Record<string, number> = {
  EASY: 0,
  MEDIUM: 200,
  HARD: 400,
}
```

---

## Ejemplos de Cálculo

### Ejemplo 1: Respuesta Correcta, EASY, 5 segundos

```
elapsedMs = 5000
remainingMs = max(0, 30_000 - 5000) = 25000
time_bonus = floor(500 * 25000 / 30_000) = floor(416.67) = 416

score = 1000 + 0 + 416 = 1416 puntos
```

### Ejemplo 2: Respuesta Correcta, MEDIUM, 5 segundos

```
elapsedMs = 5000
remainingMs = 25000
time_bonus = 416

score = 1000 + 200 + 416 = 1616 puntos
```

### Ejemplo 3: Respuesta Correcta, HARD, 5 segundos

```
score = 1000 + 400 + 416 = 1816 puntos
```

### Ejemplo 4: Respuesta Correcta, EASY, 0 segundos (máximo bonus)

```
remainingMs = max(0, 30_000 - 0) = 30000
time_bonus = floor(500 * 30000 / 30_000) = floor(500) = 500

score = 1000 + 0 + 500 = 1500 puntos (máximo para EASY)
```

### Ejemplo 5: Respuesta Correcta, EASY, 30 segundos (mínimo bonus)

```
remainingMs = max(0, 30_000 - 30000) = 0
time_bonus = floor(500 * 0 / 30_000) = 0

score = 1000 + 0 + 0 = 1000 puntos (mínimo para respuesta correcta)
```

### Ejemplo 6: Respuesta Incorrecta (cualquier tiempo/dificultad)

```
score = 0 puntos (exactamente)
```

---

## Flujo Implementado

```
Partida (status: IN_PROGRESS)
    ↓
POST /api/games/:gameId/rounds
    ↓
Ronda creada
    ↓
GET /api/games/:gameId/rounds/:roundId/challenge
    ↓
Imagen mostrada al jugador
Timer cuenta 30 segundos
    ↓
POST /api/games/:gameId/rounds/:roundId/guess
    ↓
Backend verifica:
  - ¿Partida existe y está IN_PROGRESS?
  - ¿Ronda existe y pertenece a partida?
  - ¿Ronda ya fue resuelta? (finished_at != null)
    - SÍ → Error 409 ROUND_ALREADY_RESOLVED
    - NO → Continuar
  - ¿Tiempo expirado? (elapsedMs >= 30_000)
    - SÍ → Error 409 ROUND_EXPIRED
    - NO → Continuar
    ↓
Backend obtiene nombre correcto de PokéAPI
Backend evalúa respuesta (normalización)
Backend calcula score usando fórmula
    ↓
Transacción:
  - UPDATE rounds SET score, is_correct, finished_at, time_taken
  - UPDATE games SET total_score = total_score + score
  - COMMIT (atómica)
    ↓
Respuesta HTTP 200 OK:
{
  "guess": {
    "isCorrect": boolean,
    "score": number,
    "totalScore": number
  }
}
    ↓
Frontend recibe score y totalScore
Frontend muestra:
  - "Respuesta correcta/incorrecta"
  - "Puntuación: X (Total: Y)"
```

---

## Endpoint: POST /api/games/:gameId/rounds/:roundId/guess

### Contrato Final

#### Request

```json
{
  "answer": "pikachu"
}
```

#### Response - Éxito 200 OK

**Respuesta correcta (EASY, 5 segundos):**
```json
{
  "guess": {
    "isCorrect": true,
    "score": 1416,
    "totalScore": 1416
  }
}
```

**Respuesta incorrecta:**
```json
{
  "guess": {
    "isCorrect": false,
    "score": 0,
    "totalScore": 0
  }
}
```

#### Response - Errores

**409 ROUND_EXPIRED**
```json
{
  "error": {
    "code": "ROUND_EXPIRED",
    "message": "El tiempo de la ronda ha expirado."
  }
}
```

**409 ROUND_ALREADY_RESOLVED**
```json
{
  "error": {
    "code": "ROUND_ALREADY_RESOLVED",
    "message": "La ronda ya ha sido resuelta."
  }
}
```

**404 GAME_NOT_FOUND**
```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "La partida no existe."
  }
}
```

**400 VALIDATION_ERROR**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

**503 POKEAPI_UNAVAILABLE**
```json
{
  "error": {
    "code": "POKEAPI_UNAVAILABLE",
    "message": "No fue posible validar la respuesta."
  }
}
```

---

## Persistencia

### Cambios en rounds.score

- **Antes:** DEFAULT 0, nunca se actualizaba
- **Después:** Se actualiza en transacción junto con is_correct y finished_at
- Archivo: [round.repository.ts](backend/src/modules/game/round.repository.ts#L109-L114)

### Cambios en games.total_score

- **Antes:** DEFAULT 0, nunca se actualizaba
- **Después:** Se suma score de cada ronda resuelta
- Fórmula: `total_score = total_score + score`
- Garantiza: nunca negativo (score >= 0 siempre)
- Archivo: [round.repository.ts](backend/src/modules/game/round.repository.ts#L116-L122)

### Atomicidad

Implementada mediante transacción SQL:

```typescript
BEGIN
  UPDATE rounds SET score = $5, is_correct = $4, finished_at = $2, time_taken = $3 WHERE id = $1
  UPDATE games SET total_score = total_score + $2 WHERE id = $1
COMMIT
```

Si falla cualquier operación, ambas se revierten (ROLLBACK).
Archivo: [round.repository.ts](backend/src/modules/game/round.repository.ts#L76-L125)

---

## Protección Contra Doble Puntuación

### Mecanismo

1. Antes de aceptar una respuesta, se verifica `rounds.finished_at`
2. Si `finished_at IS NOT NULL`, la ronda ya fue resuelta
3. Se rechaza con error 409 ROUND_ALREADY_RESOLVED
4. No se modifica rounds.score ni games.total_score

### Código

```typescript
const round = roundCheckResult.rows[0]
if (round.finished_at !== null) {
  await client.query('ROLLBACK')
  throw new RoundAlreadyResolvedError()
}
```

Archivo: [round.repository.ts](backend/src/modules/game/round.repository.ts#L88-L93)

### Test

```typescript
async function testRejectsSecondGuessForSameRound() {
  // ... crear ronda ...
  updateGuess: async () => {
    throw new RoundAlreadyResolvedError()
  }
  // Intento de segundo envío lanza RoundAlreadyResolvedError
  await assert.rejects(
    () => roundService.submitGuess(...),
    RoundAlreadyResolvedError,
  )
}
```

Archivo: [game.service.test.ts](backend/src/modules/game/game.service.test.ts#L428-L452)

---

## Frontend

### Archivos Modificados

1. [frontend/src/services/api.ts](frontend/src/services/api.ts#L28-L31)
   - Actualizado `GuessResult` interface: agregado `score` y `totalScore`

2. [frontend/src/pages/Game/Game.tsx](frontend/src/pages/Game/Game.tsx)
   - Agregado estado para `score` y `totalScore`
   - Actualizado `handleSubmitGuess()` para capturar valores
   - Mostrar puntuación de forma mínima

### Visualización

```
Respuesta correcta.
Puntuación: 1416 (Total: 1416)
```

O para respuesta incorrecta:
```
Respuesta incorrecta.
Puntuación: 0 (Total: 0)
```

### Lo que NO se implementó (US-07/US-08)

- ❌ Pantalla completa de resultado de ronda
- ❌ Revelación adicional del Pokémon
- ❌ Botón "Siguiente ronda"
- ❌ Finalización de partida automática
- ❌ Cierre de flujo de juego

---

## Seguridad

### ✅ Score calculado exclusivamente en backend

- Cliente NO puede enviar `"score": 999999` en request
- Backend ignora campos adicionales en body
- Cálculo es determinístico basado en tiempo servidor

### ✅ Score enviado por cliente no puede alterar resultado

- El valor se calcula en `RoundService.calculateScore()`
- Basado en: `elapsedMs`, `isCorrect`, `difficulty`
- Valores provienen de BD, no de cliente

### ✅ pokemon_id no se expone

- Nunca se devuelve en respuestas de API
- Solo se usa internamente en backend
- Verificado en tests

### ✅ Nombre correcto no se expone anticipadamente

- Se obtiene solo en momento de evaluación
- Se compara con respuesta normalizada
- Nunca se devuelve al frontend

---

## Archivos Creados

Ninguno. Todos los cambios son en archivos existentes.

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| [backend/src/modules/game/game.errors.ts](backend/src/modules/game/game.errors.ts) | Agregada clase `RoundAlreadyResolvedError` |
| [backend/src/modules/game/round.types.ts](backend/src/modules/game/round.types.ts) | Actualizado `GuessResult` con `score` y `totalScore` |
| [backend/src/modules/game/round.service.ts](backend/src/modules/game/round.service.ts) | Implementada función `calculateScore()`, actualizado `submitGuess()` |
| [backend/src/modules/game/round.repository.ts](backend/src/modules/game/round.repository.ts) | Reescrita `updateGuess()` con transacción atómica, captura de finishedAt e isCorrect |
| [backend/src/modules/game/game.controller.ts](backend/src/modules/game/game.controller.ts) | Agregado manejo de error `ROUND_ALREADY_RESOLVED` |
| [backend/src/modules/game/game.service.test.ts](backend/src/modules/game/game.service.test.ts) | Agregadas 8 tests para US-06: cálculo de score, doble envío, etc. |
| [frontend/src/services/api.ts](frontend/src/services/api.ts) | Actualizado `GuessResult` interface |
| [frontend/src/pages/Game/Game.tsx](frontend/src/pages/Game/Game.tsx) | Agregado estado y visualización de score |

---

## Base de Datos

### Migraciones

Ninguna. El esquema ya contenía:
- `rounds.score INTEGER DEFAULT 0`
- `rounds.finished_at TIMESTAMP NULL`
- `rounds.is_correct BOOLEAN NULL`
- `games.total_score INTEGER DEFAULT 0`

### Cambios en Datos

- `rounds.score` ahora se actualiza en cada respuesta
- `rounds.finished_at` se establece en la evaluación
- `rounds.is_correct` se establece en la evaluación
- `games.total_score` se suma acumulativamente

---

## Pruebas Ejecutadas

### Tests Unitarios

```
Command: npm run build && npm test
Backend: 
  ✅ Initial schema tests passed
  ✅ Game service tests passed (20 tests, incluyendo 8 de US-06)
  ✅ Pokemon client tests passed

Frontend:
  ✅ npm run build exitoso
  ⚠️ npm run lint: 2 errores preexistentes (App.tsx, Home.tsx)
```

### Tests de US-06 Específicos

1. `testCalculateScoreWithCorrectAnswerEasy()` → ✅ score = 1416
2. `testCalculateScoreWithCorrectAnswerMedium()` → ✅ score = 1616
3. `testCalculateScoreWithCorrectAnswerHard()` → ✅ score = 1816
4. `testCalculateScoreWithIncorrectAnswer()` → ✅ score = 0
5. `testCalculateScoreWithMaxTimeBonus()` → ✅ score = 1500 (0ms)
6. `testCalculateScoreWithZeroTimeBonus()` → ✅ score = 1000 (30000ms)
7. `testCalculateScoreWithFlooringEffect()` → ✅ score = 1483 (floor validado)
8. `testSubmitsGuessWithScoreAndTotalScore()` → ✅ estructura de respuesta correcta
9. `testRejectsSecondGuessForSameRound()` → ✅ ROUND_ALREADY_RESOLVED

### Pruebas Manuales

**Prueba de Respuesta Incorrecta:**
```
Partida: 36, Ronda: 36
Respuesta: squirtle (incorrecto)
Resultado API: { isCorrect: false, score: 0, totalScore: 0 }
BD: rounds.score = 0, is_correct = false ✅
```

**Verificación de Persistencia:**
```sql
SELECT id, game_id, is_correct, score FROM rounds WHERE game_id = 36;
 36 |      36 | f          |     0
```

---

## Riesgos o Pendientes

### Ninguno

- Todos los criterios de US-06 están implementados
- Todos los tests pasan
- Protección contra doble puntuación está en lugar
- Atomicidad garantizada
- Frontend compila sin errores de US-06

---

## Git Status Final

```
 M backend/src/modules/game/game.controller.ts
 M backend/src/modules/game/game.errors.ts
 M backend/src/modules/game/game.service.test.ts
 M backend/src/modules/game/round.repository.ts
 M backend/src/modules/game/round.service.ts
 M backend/src/modules/game/round.types.ts
 M frontend/src/pages/Game/Game.tsx
 M frontend/src/services/api.ts
```

Cambios limitados a US-06. No hay cambios innecesarios.

---

## Conclusión

**US-06 puede considerarse funcionalmente terminada: SÍ**

✅ Todos los criterios de aceptación implementados
✅ Fórmula exacta según especificación
✅ Persistencia atómica en BD
✅ Protección contra doble puntuación
✅ Seguridad: score calculado en backend
✅ Tests unitarios pasan
✅ Frontend integrado sin errores
✅ Contrato de API completo
✅ No se implementó fuera del alcance de US-06

---

## Cómo Revisar

1. **Fórmula:** [backend/src/modules/game/round.service.ts](backend/src/modules/game/round.service.ts#L23-L36)
2. **Persistencia atómica:** [backend/src/modules/game/round.repository.ts](backend/src/modules/game/round.repository.ts#L76-L125)
3. **Doble puntuación:** [backend/src/modules/game/round.repository.ts](backend/src/modules/game/round.repository.ts#L88-L93)
4. **Tests:** [backend/src/modules/game/game.service.test.ts](backend/src/modules/game/game.service.test.ts#L350-L485)
5. **Controller:** [backend/src/modules/game/game.controller.ts](backend/src/modules/game/game.controller.ts#L180-L188)
6. **Frontend:** [frontend/src/pages/Game/Game.tsx](frontend/src/pages/Game/Game.tsx) y [frontend/src/services/api.ts](frontend/src/services/api.ts#L28-L31)
