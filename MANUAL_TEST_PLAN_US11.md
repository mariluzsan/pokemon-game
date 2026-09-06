# Plan de Prueba Manual - US-11 Limitar pistas por ronda

## Preparacion

1. Iniciar PostgreSQL con la base `pokemon_game` y aplicar la migracion inicial.
2. Ejecutar `npm run dev` desde `backend` y `frontend` en terminales separadas.
3. Abrir la URL mostrada por Vite, crear una partida y esperar la primera ronda.

## A. Limite y experiencia de usuario

1. Solicitar la primera pista durante una ronda vigente.
2. Confirmar la pista de nivel 1 y el texto `Pistas usadas: 1. Restantes: 2.`.
3. Solicitar la segunda pista y confirmar nivel 2, usadas 2 y restantes 1.
4. Solicitar la tercera pista y confirmar nivel 3, usadas 3 y restantes 0.
5. Confirmar que el control queda deshabilitado y muestra `Límite de pistas alcanzado`.
6. Confirmar que el temporizador, la imagen y el formulario de respuesta siguen funcionando.
7. Resolver la ronda y pulsar `Continuar`.
8. Confirmar que la siguiente ronda muestra `Pistas usadas: 0.` y permite solicitar una pista; tras recibirla, debe mostrar los valores autoritativos de esa nueva ronda (1 usada y 2 restantes).

## B. Peticion directa despues del limite

Tras obtener las tres pistas, ejecutar en Postman o con cURL:

```powershell
curl.exe -i -X POST http://localhost:3000/api/games/<GAME_ID>/rounds/<ROUND_ID>/hints
```

Confirmar `409 Conflict` y:

```json
{
  "error": {
    "code": "HINT_LIMIT_REACHED",
    "message": "Se alcanzo el limite de pistas para esta ronda."
  }
}
```

## C. Verificacion SQL

Sustituir `<ROUND_ID>` por la ronda probada:

```sql
SELECT
    id,
    game_id,
    round_number,
    hints_used,
    score
FROM rounds
WHERE id = <ROUND_ID>;

SELECT
    id,
    round_id,
    level,
    source,
    penalty,
    content,
    created_at
FROM hints
WHERE round_id = <ROUND_ID>
ORDER BY level;
```

Confirmar que `hints_used` coincide con el numero de registros de `hints`, los
niveles son consecutivos desde 1 y no hay nivel superior a 3. Confirmar tambien
que `score` y `games.total_score` no cambian por solicitar pistas.