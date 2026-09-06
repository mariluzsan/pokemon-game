# Prueba Manual - US-13 Validacion de Spoilers

## Precondiciones

- PostgreSQL esta disponible con `backend/src/infrastructure/database/migrations/001_initial_schema.sql` aplicada.
- El backend se ejecuta desde `backend` mediante `npm run dev`.
- La clave de IA esta configurada solo en `backend/.env` y no se expone al navegador.

## Caso A - Flujo normal con IA

1. Crear una partida y una ronda mediante `POST /api/games` y `POST /api/games/:gameId/rounds`.
2. Solicitar una o más pistas con `POST /api/games/:gameId/rounds/:roundId/hints` antes de que expiren los 30 segundos.
3. Confirmar que cada respuesta `201` contiene solo `level`, `content`, `penalty`, `totalScore`, `hintsUsed` y `hintsRemaining`; no contiene nombre ni identificador del Pokémon.
4. Comprobar que el texto de cada pista no nombra al Pokémon y que los niveles progresan.
5. Resolver la ronda y confirmar que la puntuación y la penalización siguen las reglas existentes.

## Caso B - Defensa adversarial reproducible

1. Desde `backend`, ejecutar `npm test`.
2. Confirmar la ejecución de `Hint service tests passed`.
3. La prueba `testUnsafeHintIsRejectedWithoutPersistenceOrConsumption` inyecta un `HintGenerator` falso que devuelve `El Pokemon es Pikachu.`.
4. Confirmar que la prueba recibe `UnsafeHintError`, que el mensaje no contiene `Pikachu` y que el fake de persistencia no se ejecuta ni incrementa el contador.

Este caso no modifica la configuración de producción ni depende de intentar que el proveedor real viole el prompt.

## SQL de verificacion

Sustituir `<ROUND_ID>` por el identificador real. Después de una pista segura debe existir una fila por nivel. Después de un `422 UNSAFE_HINT`, repetir las consultas: no debe aparecer una fila nueva ni cambiar `hints_used`.

```sql
SELECT
    r.id,
    r.game_id,
    r.round_number,
    r.hints_used,
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