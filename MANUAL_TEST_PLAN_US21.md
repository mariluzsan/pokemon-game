# Plan de Prueba Manual US-21

## Objetivo

Verificar que `GET /api/ranking` devuelve los resultados válidos del ranking
ordenados por puntuación de mayor a menor, manteniendo todos los empates,
incluyendo score `0` y excluyendo partidas no finalizadas.

## Fuente de verdad

- Tabla `games`.
- Participan solo filas con `status = 'FINISHED'` y `finished_at IS NOT NULL`.
- Orden funcional: `total_score DESC`.
- Estabilidad técnica interna: `id ASC` cuando el score empata.

## Preparación

1. Levantar PostgreSQL.
2. Levantar backend desde `backend/` con `npm run dev`.
3. Usar una base local de pruebas donde sea seguro insertar y borrar datos.

## Dataset de prueba

Insertar deliberadamente en un orden distinto al esperado en el ranking:

```sql
INSERT INTO games (player_name, total_score, current_round, difficulty, status, started_at, finished_at)
VALUES
  ('Brock', 0, 11, 'EASY', 'FINISHED', '2026-09-06 10:00:00', '2026-09-06 10:10:00'),
  ('Misty', 500, 11, 'MEDIUM', 'FINISHED', '2026-09-06 10:01:00', '2026-09-06 10:11:00'),
  ('Gary', 250, 11, 'HARD', 'FINISHED', '2026-09-06 10:02:00', '2026-09-06 10:12:00'),
  ('Ash', 500, 11, 'EASY', 'FINISHED', '2026-09-06 10:03:00', '2026-09-06 10:13:00'),
  ('Jessie', 9999, 5, 'HARD', 'IN_PROGRESS', '2026-09-06 10:04:00', NULL);
```

## Request

```http
GET /api/ranking
```

Ejemplo con `curl`:

```bash
curl http://localhost:3000/api/ranking
```

## Resultado esperado

La respuesta debe incluir solo partidas válidas finalizadas y en este orden:

1. `Misty` → `500`
2. `Ash` → `500`
3. `Gary` → `250`
4. `Brock` → `0`

`Jessie` no debe aparecer porque la partida está en `IN_PROGRESS`.

Respuesta esperada:

```json
{
  "ranking": [
    { "playerName": "Misty", "score": 500 },
    { "playerName": "Ash", "score": 500 },
    { "playerName": "Gary", "score": 250 },
    { "playerName": "Brock", "score": 0 }
  ]
}
```

## SQL de verificación

Datos base:

```sql
SELECT
    id,
    player_name,
    total_score,
    status,
    finished_at
FROM games;
```

Consulta equivalente al ranking implementado:

```sql
SELECT
    player_name,
    total_score
FROM games
WHERE status = 'FINISHED'
  AND finished_at IS NOT NULL
ORDER BY total_score DESC, id ASC;
```

## Verificación adicional

1. Ejecutar `GET /api/ranking` dos veces seguidas sin cambiar datos.
2. Confirmar que la secuencia es idéntica en ambas respuestas.
3. Confirmar que no se devuelve `position`, `finishedAt`, `difficulty`, `pokemon_id`, respuestas ni pistas.