# Reglas de Puntuación

La puntuación se calcula exclusivamente en backend.

## Cambios US-06: valores configurados

- **`baseScore = 1000` puntos.**
- **Bonificación por dificultad: `EASY` (fácil) = 0, `MEDIUM` (media) = 200, `HARD` (difícil) = 400.**
- **Duración máxima de una ronda: `30` segundos, compartida con `ROUND_TIME_LIMIT_SECONDS`.**
- **Penalización por pista: `100` puntos por cada pista utilizada.**
- **La penalización máxima por pistas es `300` puntos porque una ronda permite como máximo tres pistas.**

## Cambios US-06: fórmula y límites

Solo una respuesta correcta puede obtener una puntuación mayor que cero:

```text
elapsedMs = finishedAt - startedAt
remainingMs = max(0, 30_000 - elapsedMs)
timeBonus = floor(500 * remainingMs / 30_000)
hintPenalty = hintsUsed * 100

if isCorrect:
	score = max(0, 1000 + difficultyBonus + timeBonus - hintPenalty)
else:
	score = 0
```

El tiempo se calcula con milisegundos usando el reloj del backend. El único
redondeo es `floor` aplicado a `timeBonus`; la puntuación final no se redondea
porque ya es un entero. Una respuesta recibida con `elapsedMs >= 30_000` se
rechaza como ronda expirada, por lo que una respuesta correcta exactamente en
el límite no obtiene puntos.

## Invariantes
- nunca negativa;
- una respuesta incorrecta no recibe el beneficio de una correcta;
- utilizar más pistas no aumenta la puntuación;
- las reglas son deterministas y comprobables mediante pruebas;
- una ronda resuelta no puede volver a puntuar.

Modelo conceptual:
```text
score = max(0, baseScore + difficultyBonus + timeBonus - hintPenalty)
```

**`rounds.score` y `games.total_score` se actualizan en una única transacción,**
con la ronda bloqueada para impedir doble puntuación concurrente. Si la
transacción falla, ninguno de los dos valores cambia.
