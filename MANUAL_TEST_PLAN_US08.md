# Plan de prueba manual US-08

## Precondiciones

- PostgreSQL esta activo y la migracion inicial fue aplicada.
- Backend ejecutandose en `http://localhost:3000`.
- Frontend ejecutandose en la URL de Vite.
- La partida estandar tiene diez rondas, segun `docs/GAME_RULES.md` y `docs/ACCEPTANCE_CRITERIA.md`.

## Partida completa

1. Abrir el frontend y crear una partida con un nombre valido.
2. Confirmar que se muestra la ronda 1 y que el temporizador inicia desde su `startedAt`.
3. Resolver la ronda con una respuesta antes del limite.
4. Confirmar el resultado y la puntuacion de la ronda.
5. Pulsar `Continuar` una sola vez.
6. Confirmar que se muestra la ronda 2 y que el desafio y temporizador son nuevos.
7. Repetir los pasos 3 a 6 hasta la ronda 9.
8. Resolver la ronda 10.
9. Confirmar el mensaje de partida terminada y la puntuacion final acumulada.
10. Intentar continuar de nuevo y confirmar que el backend rechaza la solicitud y no crea una ronda 11.
11. Confirmar en la base de datos que `status = 'FINISHED'` y `finished_at IS NOT NULL`.

## Expiracion

1. Crear una partida y cargar una ronda.
2. Dejar que el temporizador llegue a cero sin enviar respuesta.
3. Confirmar que la ronda muestra `EXPIRED` y puntuacion cero.
4. Pulsar `Continuar`.
5. Confirmar que se carga la siguiente ronda, sin quedar bloqueada la partida.
6. En la ultima ronda, repetir la expiracion y confirmar que la partida termina con el total acumulado sin incremento.

## SQL de comprobacion

Reemplazar `:game_id` por el identificador real:

```sql
SELECT
  id,
  current_round,
  total_score,
  status,
  started_at,
  finished_at
FROM games
WHERE id = :game_id;

SELECT
  id,
  round_number,
  started_at,
  finished_at,
  is_correct,
  time_taken,
  score
FROM rounds
WHERE game_id = :game_id
ORDER BY round_number;
```

Para verificar que no existe ronda 11:

```sql
SELECT COUNT(*) AS round_eleven_count
FROM rounds
WHERE game_id = :game_id
  AND round_number = 11;
```

La respuesta esperada es `0`.

## Prueba de integridad por API

Con una ronda activa, repetir `POST /api/games/:game_id/rounds` debe devolver `409` con `ROUND_NOT_COMPLETED`.
Despues de resolver o expirar la ronda, una sola solicitud crea la siguiente ronda con el numero consecutivo.
Despues de finalizar, cualquier solicitud para crear otra ronda debe devolver `409` y no modificar `games`.
