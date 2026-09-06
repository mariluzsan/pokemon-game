# Plan de Prueba Manual - US-18

## Objetivo

Verificar que, al crear una ronda, el backend selecciona un `pokemonId`
acorde con `games.difficulty` (la dificultad vigente determinada por US-17),
sin recalcular desempeño, nivel ni dificultad, y sin repetir Pokémon ya
usados en la misma partida.

## Regla aprobada

| Dificultad | Rango `pokemonId` |
|---|---|
| `EASY` | 1–151 |
| `MEDIUM` | 152–493 |
| `HARD` | 494–1025 |

Ver detalle completo del algoritmo en `docs/DIFFICULTY_RULES.md`.

## Flujo manual recomendado

1. Crear una partida nueva (`POST /api/games`). `games.difficulty` inicia en
   `EASY`.
2. Crear la primera ronda (`POST /api/games/:gameId/rounds`).
3. Consultar `rounds.pokemon_id` en base de datos y confirmar que está entre
   1 y 151.
4. Resolver rondas con desempeño controlado para forzar la adaptación de
   US-17 (por ejemplo, varias respuestas correctas sin pistas para subir a
   `MEDIUM` o `HARD`; ver `MANUAL_TEST_PLAN_US17.md` para las combinaciones
   exactas).
5. Confirmar en base de datos que `games.difficulty` cambió.
6. Crear la siguiente ronda y confirmar que `rounds.pokemon_id` cae dentro
   del rango de la **nueva** dificultad.
7. Confirmar que el `pokemon_id` de la nueva ronda es distinto de los
   `pokemon_id` de las rondas anteriores de la misma partida.
8. Confirmar que `GET /api/games/:gameId/rounds/:roundId/challenge` sigue sin
   exponer `pokemon_id` ni el nombre del Pokémon.
9. Confirmar que `POST /api/games/:gameId/rounds/:roundId/hints` y
   `POST /api/games/:gameId/rounds/:roundId/guess` siguen funcionando con la
   ronda creada.

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
    pokemon_id,
    difficulty,
    is_correct,
    hints_used,
    score,
    started_at,
    finished_at
FROM rounds
WHERE game_id = <GAME_ID>
ORDER BY round_number;
```

Resultado esperado:

- Round N: `difficulty` refleja la dificultad vigente al momento de crearse y
  `pokemon_id` cae dentro del rango correspondiente de la tabla anterior.
- Tras la adaptación (US-17), `games.difficulty` cambia.
- Round N+1: `difficulty` refleja la nueva dificultad y `pokemon_id` cae
  dentro de su rango; además es distinto de todos los `pokemon_id` de rondas
  previas de la misma partida.
- Ninguna ronda histórica (`round_number` < N+1) cambia su `difficulty` ni su
  `pokemon_id` tras la adaptación.

## Caso de error controlado

Si PokéAPI no está disponible durante la selección, `POST
/api/games/:gameId/rounds` responde `503 POKEAPI_UNAVAILABLE` y no se crea
ninguna fila en `rounds` (verificar que el conteo de rondas de la partida no
cambia).

## Alcance excluido

Este plan no cubre Sprint 4 (US-19 a US-22): no se persiste un "resultado
final" separado ni se consulta ranking.
