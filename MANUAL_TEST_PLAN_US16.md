# Plan Manual US-16

## Objetivo

Validar que el backend calcule el nivel de desempeño de una partida reutilizando el snapshot de US-15, sin modificar la dificultad de la partida ni seleccionar Pokémon por nivel.

## Formula aprobada

- `roundsPlayed = correctAnswers + incorrectAnswers`
- `precision = roundsPlayed === 0 ? 0 : correctAnswers / roundsPlayed * 100`
- `independence = roundsPlayed === 0 ? 0 : max(0, 1 - totalHintsUsed / (roundsPlayed * 3)) * 100`
- `score = precision * 0.60 + independence * 0.15`
- `EASY < 40`
- `MEDIUM >= 40 AND < 70`
- `HARD >= 70`

## Verificacion SQL base

```sql
SELECT
    g.id,
    g.total_score,
    g.current_round,
    g.difficulty,
    g.status
FROM games g
WHERE g.id = <GAME_ID>;

SELECT
    r.id,
    r.round_number,
    r.difficulty,
    r.time_taken,
    r.is_correct,
    r.hints_used,
    r.score,
    r.finished_at
FROM rounds r
WHERE r.game_id = <GAME_ID>
ORDER BY r.round_number;

SELECT
    COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND is_correct IS TRUE)::INTEGER AS correct_answers,
    COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND is_correct IS FALSE)::INTEGER AS incorrect_answers,
    COALESCE(AVG(time_taken) FILTER (WHERE finished_at IS NOT NULL), 0)::FLOAT8 AS average_response_time_seconds,
    COALESCE(SUM(hints_used) FILTER (WHERE finished_at IS NOT NULL), 0)::INTEGER AS total_hints_used
FROM rounds
WHERE game_id = <GAME_ID>;
```

## Escenarios recomendados

### Escenario 1: cero rondas

- rounds completadas: 0
- correctas: 0
- incorrectas: 0
- tiempos: 0
- hints: 0
- score: 0
- metricas US-15 esperadas: `correctAnswers=0`, `incorrectAnswers=0`, `averageResponseTimeSeconds=0`, `totalHintsUsed=0`
- nivel US-16 esperado: `EASY`

### Escenario 2: justo por debajo de MEDIUM

- rounds completadas: 2
- correctas: 1
- incorrectas: 1
- tiempos: cualquiera, no impacta US-16
- hints totales: 3
- score de rondas: cualquiera ya persistido, no impacta US-16
- metricas US-15 esperadas: `correctAnswers=1`, `incorrectAnswers=1`, `totalHintsUsed=3`
- calculo esperado: `precision=50`, `independence=50`, `score=37.5`
- nivel US-16 esperado: `EASY`

### Escenario 3: umbral exacto de MEDIUM

- rounds completadas: 2
- correctas: 1
- incorrectas: 1
- hints totales: 2
- metricas US-15 esperadas: `correctAnswers=1`, `incorrectAnswers=1`, `totalHintsUsed=2`
- calculo esperado: `precision=50`, `independence=66.6667`, `score=40`
- nivel US-16 esperado: `MEDIUM`

### Escenario 4: justo por encima de MEDIUM

- rounds completadas: 2
- correctas: 1
- incorrectas: 1
- hints totales: 1
- metricas US-15 esperadas: `correctAnswers=1`, `incorrectAnswers=1`, `totalHintsUsed=1`
- calculo esperado: `precision=50`, `independence=83.3333`, `score=42.5`
- nivel US-16 esperado: `MEDIUM`

### Escenario 5: justo por debajo de HARD

- rounds completadas: 1
- correctas: 1
- incorrectas: 0
- hints totales: 2
- metricas US-15 esperadas: `correctAnswers=1`, `incorrectAnswers=0`, `totalHintsUsed=2`
- calculo esperado: `precision=100`, `independence=33.3333`, `score=65`
- nivel US-16 esperado: `MEDIUM`

### Escenario 6: umbral exacto de HARD

- rounds completadas: 1
- correctas: 1
- incorrectas: 0
- hints totales: 1
- metricas US-15 esperadas: `correctAnswers=1`, `incorrectAnswers=0`, `totalHintsUsed=1`
- calculo esperado: `precision=100`, `independence=66.6667`, `score=70`
- nivel US-16 esperado: `HARD`

### Escenario 7: por encima de HARD

- rounds completadas: 2
- correctas: 2
- incorrectas: 0
- hints totales: 1
- metricas US-15 esperadas: `correctAnswers=2`, `incorrectAnswers=0`, `totalHintsUsed=1`
- calculo esperado: `precision=100`, `independence=83.3333`, `score=72.5`
- nivel US-16 esperado: `HARD`

## Ejecucion automatizada recomendada

La forma mas directa de validar US-16 hoy es ejecutar:

```powershell
cd backend
npm test
```

Los casos de borde viven en `backend/src/modules/game/performance.service.test.ts`.

## Criterios de integridad

- `games.difficulty` no debe cambiar por calcular el nivel.
- `rounds.difficulty` no debe cambiar.
- no deben crearse rondas nuevas.
- no debe alterarse `score` ni `total_score`.
- no debe consultarse PokéAPI ni IA para calcular el nivel.