# Plan de Prueba Manual - US-09 Solicitar pistas

## Preparación

1. Iniciar PostgreSQL con la base `pokemon_game` y aplicar la migración inicial.
2. En una terminal, ejecutar `cd backend` y `npm run dev`.
3. En otra terminal, ejecutar `cd frontend` y `npm run dev`.
4. Abrir la URL indicada por Vite, crear una partida y esperar que cargue la primera ronda.

## A. Ronda activa

1. Con el temporizador en marcha, pulsar `Solicitar pista`.
2. Confirmar que el botón muestra `Solicitando pista...` y no permite una segunda solicitud mientras carga.
3. Confirmar el mensaje `Pista 1 solicitada. Estara disponible al generarse.`
4. Confirmar que la imagen, el formulario y el temporizador continúan activos.
5. Ejecutar en PostgreSQL, sustituyendo `<roundId>` por el identificador de la ronda:

```sql
SELECT hints_used, score FROM rounds WHERE id = <roundId>;
SELECT level, source, penalty, content FROM hints WHERE round_id = <roundId> ORDER BY level;
SELECT total_score FROM games WHERE id = <gameId>;
```

6. Confirmar `hints_used = 1`, un registro con `level = 1`, `source = 'AI'`, `content IS NULL`, y que `score` y `total_score` siguen sin cambios.
7. Repetir dos veces y confirmar niveles 2 y 3; en el cuarto intento, confirmar el error seguro `HINT_LIMIT_REACHED`.

## B. Ronda resuelta

1. Enviar una respuesta válida o incorrecta antes de que termine el tiempo.
2. Confirmar que ya no se muestra `Solicitar pista`.
3. Enviar manualmente `POST /api/games/<gameId>/rounds/<roundId>/hints`.
4. Confirmar `409 ROUND_ALREADY_RESOLVED` y que no se agrega una pista.

## C. Ronda expirada

1. Crear una ronda y dejar que el temporizador llegue a cero.
2. Confirmar que ya no se muestra `Solicitar pista`.
3. Enviar manualmente `POST /api/games/<gameId>/rounds/<roundId>/hints`.
4. Confirmar `409 ROUND_EXPIRED` y que no se agrega una pista.

## D. Seguridad

1. Inspeccionar la respuesta exitosa de `POST /api/games/<gameId>/rounds/<roundId>/hints`.
2. Confirmar que solo contiene `hint.level` y `hint.content`.
3. Confirmar que no contiene `pokemonId`, `pokemon_id`, el nombre correcto ni la respuesta correcta.