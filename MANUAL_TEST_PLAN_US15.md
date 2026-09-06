# Plan de Prueba Manual - US-15

## Objetivo
Verificar que el backend ya registra y permite obtener las señales de desempeño respaldadas por la documentación: aciertos, errores, tiempo de respuesta y pistas utilizadas.

## Alcance
- No clasifica nivel de desempeño.
- No cambia dificultad.
- No altera la selección de Pokémon.
- No requiere endpoint público nuevo.

## Flujo manual recomendado
1. Crear una partida nueva.
2. Crear y resolver una ronda correcta sin pistas.
3. Crear y resolver una ronda incorrecta con una pista.
4. Crear una tercera ronda, solicitar dos pistas y dejar que expire.
5. Verificar en base de datos los datos crudos de `games`, `rounds` y la agregación equivalente de desempeño.

## SQL de validación

```sql
SELECT
    g.id,
    g.total_score,
    g.current_round,
    g.difficulty,
    g.status,
    g.started_at,
    g.finished_at
FROM games g
WHERE g.id = <GAME_ID>;
```

```sql
SELECT
    r.id,
    r.round_number,
    r.difficulty,
    r.started_at,
    r.finished_at,
    r.time_taken,
    r.is_correct,
    r.hints_used,
    r.score
FROM rounds r
WHERE r.game_id = <GAME_ID>
ORDER BY r.round_number;
```

```sql
SELECT
    COUNT(*) FILTER (WHERE r.finished_at IS NOT NULL AND r.is_correct IS TRUE)::INTEGER AS correct_answers,
    COUNT(*) FILTER (WHERE r.finished_at IS NOT NULL AND r.is_correct IS FALSE)::INTEGER AS incorrect_answers,
    COALESCE(AVG(r.time_taken) FILTER (WHERE r.finished_at IS NOT NULL), 0)::FLOAT8 AS average_response_time_seconds,
    COALESCE(SUM(r.hints_used) FILTER (WHERE r.finished_at IS NOT NULL), 0)::INTEGER AS total_hints_used
FROM rounds r
WHERE r.game_id = <GAME_ID>;
```

## Resultado esperado
- La ronda correcta suma un acierto.
- La ronda incorrecta suma un error.
- La ronda expirada queda contada como incorrecta porque persiste `is_correct = FALSE`, `score = 0` y `time_taken = 30`.
- La agregación usa solo las rondas de la partida consultada.
- Las rondas activas no participan porque no tienen `finished_at`.
- Si la partida no tiene rondas completadas, la agregación devuelve ceros.