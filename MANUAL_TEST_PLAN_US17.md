# Plan de Prueba Manual - US-17

## Objetivo

Verificar que, al completar cada ronda, el backend usa el nivel de US-16 para
adaptar en un único paso la dificultad vigente de la partida. La adaptación no
selecciona Pokémon; esa responsabilidad queda pendiente para US-18.

## Regla

| Dificultad actual | Nivel `EASY` | Nivel `MEDIUM` | Nivel `HARD` |
|---|---|---|---|
| `EASY` | `EASY` | `MEDIUM` | `MEDIUM` |
| `MEDIUM` | `EASY` | `MEDIUM` | `HARD` |
| `HARD` | `MEDIUM` | `MEDIUM` | `HARD` |

## Escenarios reproducibles

### A: nivel inferior

- Dificultad antes: `MEDIUM`.
- Rondas completadas: una ronda incorrecta o expirada, sin pistas.
- Métricas US-15: `correctAnswers=0`, `incorrectAnswers=1`,
  `averageResponseTimeSeconds=30`, `totalHintsUsed=0`.
- Nivel US-16: `EASY` (`score=15`).
- Dificultad esperada después: `EASY`.

### B: nivel medio

- Dificultad antes: `EASY`.
- Rondas completadas: dos, una correcta, una incorrecta; dos pistas en total.
- Métricas US-15: `correctAnswers=1`, `incorrectAnswers=1`,
  `averageResponseTimeSeconds` cualquiera, `totalHintsUsed=2`.
- Nivel US-16: `MEDIUM` (`score=40`).
- Dificultad esperada después: `MEDIUM`.

### C: nivel superior

- Dificultad antes: `MEDIUM`.
- Rondas completadas: una correcta con una pista.
- Métricas US-15: `correctAnswers=1`, `incorrectAnswers=0`,
  `averageResponseTimeSeconds` cualquiera, `totalHintsUsed=1`.
- Nivel US-16: `HARD` (`score=70`).
- Dificultad esperada después: `HARD`.

Para comprobar el límite de transición, repetir C partiendo de `EASY` debe
dejar la dificultad en `MEDIUM`, no en `HARD`. Un segundo intento de respuesta
para la misma ronda debe devolver `409 ROUND_ALREADY_RESOLVED` y conservar la
dificultad ya persistida.

## SQL de verificación

```sql
SELECT
    id,
    total_score,
    current_round,
    difficulty,
    status
FROM games
WHERE id = <GAME_ID>;

SELECT
    id,
    game_id,
    round_number,
    difficulty,
    time_taken,
    is_correct,
    hints_used,
    score,
    finished_at
FROM rounds
WHERE game_id = <GAME_ID>
ORDER BY round_number;
```

La consulta debe mostrar la dificultad adaptada en `games.difficulty` y el
valor original en cada `rounds.difficulty` histórica.