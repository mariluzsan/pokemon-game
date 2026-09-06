# Reglas de Puntuación

La puntuación se calcula exclusivamente en backend.

## Cambios US-06: valores configurados

- **`baseScore = 1000` puntos.**
- **Bonificación por dificultad: `EASY` (fácil) = 0, `MEDIUM` (media) = 200, `HARD` (difícil) = 400.**
- **Duración máxima de una ronda: `30` segundos, compartida con `ROUND_TIME_LIMIT_SECONDS`.**
- **Penalización por pista: `100` puntos por cada pista utilizada.**
- **La penalización máxima por pistas es `300` puntos porque una ronda permite como máximo tres pistas.**

## Penalización inmediata por pistas

Cada solicitud válida de pista persiste `hints.penalty = 100` y descuenta ese
valor inmediatamente de `games.total_score`, sin permitir que el acumulado sea
negativo. La operación se realiza junto con la persistencia de la pista y la
actualización de `rounds.hints_used` en una única transacción.

El costo se aplica una única vez al solicitar la pista. Solo una respuesta
correcta puede acreditar puntuación de ronda:

```text
elapsedMs = finishedAt - startedAt
remainingMs = max(0, 30_000 - elapsedMs)
timeBonus = floor(500 * remainingMs / 30_000)
hintPenalty = SUM(hints.penalty)

on each valid hint:
  games.totalScore = max(0, games.totalScore - 100)

if isCorrect:
	roundScore = 1000 + difficultyBonus + timeBonus
	games.totalScore = games.totalScore + roundScore
else:
	roundScore = 0
```

El tiempo se calcula con milisegundos usando el reloj del backend. El único
redondeo es `floor` aplicado a `timeBonus`; la puntuación de ronda no se
redondea porque ya es un entero. Una respuesta recibida con `elapsedMs >=
30_000` se rechaza como ronda expirada. Una respuesta incorrecta o una ronda
expirada obtiene `roundScore = 0`; las penalizaciones ya aplicadas por sus
pistas permanecen reflejadas en el total.

## Invariantes
- nunca negativa;
- una respuesta incorrecta no recibe el beneficio de una correcta;
- cada pista reduce el acumulado como máximo una vez;
- las reglas son deterministas y comprobables mediante pruebas;
- una ronda resuelta no puede volver a puntuar.

Modelo conceptual:
```text
totalScore = max(0, totalScoreAnterior - hintPenaltySolicitada) + roundScore
```

**La solicitud de pista y la actualización de `games.total_score` son atómicas.**
La resolución de una respuesta actualiza `rounds.score` y acredita ese mismo
`roundScore` en `games.total_score` en una segunda transacción, con la ronda
bloqueada para impedir doble puntuación concurrente.
