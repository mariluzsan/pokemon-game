# Prueba Manual - US-12 Penalizacion por Uso de Pistas

## Precondiciones

- PostgreSQL esta disponible con la migracion `001_initial_schema.sql` aplicada.
- Backend ejecutado desde `backend` con `npm run dev`.
- Se conoce el nombre correcto de cada Pokemon solo para realizar el POST de prueba; no debe aparecer en respuestas de la API.
- Las rondas comparadas usan la misma dificultad y se responden con tiempos lo mas cercanos posible.

La formula vigente es:

```text
totalScore = max(0, totalScoreAnterior - 100 por cada pista) + roundScore
```

`roundScore` es `1000 + difficultyBonus + floor(500 * max(0, 30000 - elapsedMs) / 30000)` solo para una respuesta correcta; es `0` si la respuesta es incorrecta o la ronda expira. `difficultyBonus` es `0` para `EASY`, `200` para `MEDIUM` y `400` para `HARD`. Cada pista registrada tiene `penalty = 100`.

## Caso A - Sin pistas

1. Crear una partida y una ronda mediante `POST /api/games` y `POST /api/games/:gameId/rounds`.
2. No solicitar pistas.
3. Enviar la respuesta correcta antes de los 30 segundos con `POST /api/games/:gameId/rounds/:roundId/guess`.
4. Registrar `guess.score` y `guess.totalScore`.
5. Ejecutar las consultas SQL de verificacion con el identificador de la ronda.
6. Confirmar `hints_used = 0`, que no hay filas en `hints`, que `score` coincide con `roundScore` y que el total contiene ese mismo incremento.

## Caso B - Una pista

1. Crear otra ronda de la misma dificultad.
2. Solicitar una pista con `POST /api/games/:gameId/rounds/:roundId/hints`.
3. Confirmar que la respuesta contiene `hintsUsed: 1` y no acepta `penalty` en el request.
4. Enviar la respuesta correcta con un tiempo comparable al caso A.
5. Confirmar una fila de nivel `1` con `penalty = 100`, `hints_used = 1`, que la respuesta de `/hints` redujo `totalScore` en 100 y que una respuesta correcta acredita solo su `roundScore`, sin un segundo descuento.

## Caso C - Maximo de pistas

1. Crear una nueva ronda vigente.
2. Solicitar tres pistas y confirmar niveles `1`, `2` y `3`.
3. Intentar una cuarta solicitud y confirmar `409 HINT_LIMIT_REACHED`.
4. Responder correctamente antes del limite.
5. Confirmar `hints_used = 3`, tres filas con `penalty = 100`, `SUM(penalty) = 300` y una reducción acumulada de 300 en el total, limitada a cero.

## Caso D - Respuesta incorrecta

1. Crear una nueva ronda y solicitar una o mas pistas.
2. Enviar una respuesta incorrecta antes de 30 segundos.
3. Confirmar `guess.isCorrect = false`, `guess.score = 0`, `rounds.score = 0` y que el total conserva las penalizaciones aplicadas al pedir las pistas, sin volverse negativo.

## Caso E - Expiracion con pistas

1. Crear una ronda, solicitar una o mas pistas y esperar 30 segundos.
2. Ejecutar `POST /api/games/:gameId/rounds/:roundId/expire`.
3. Confirmar `rounds.is_correct = false`, `rounds.score = 0` y que el total no cambia por la expiracion porque las penalizaciones ya se descontaron al solicitar las pistas.

## SQL de verificacion

Sustituir `<ROUND_ID>` por el identificador real:

```sql
SELECT
    r.id,
    r.game_id,
    r.round_number,
    r.difficulty,
    r.hints_used,
    r.time_taken,
    r.is_correct,
    r.score,
    g.total_score
FROM rounds r
JOIN games g ON g.id = r.game_id
WHERE r.id = <ROUND_ID>;
```

```sql
SELECT
    id,
    round_id,
    level,
    source,
    penalty,
    content
FROM hints
WHERE round_id = <ROUND_ID>
ORDER BY level;
```

```sql
SELECT
    COALESCE(SUM(penalty), 0) AS total_hint_penalty
FROM hints
WHERE round_id = <ROUND_ID>;
```