# Arquitectura de Base de Datos

## Motor
PostgreSQL.

## Modelo
```text
GAME
 |
 +-- 1:N --> ROUND
              |
              +-- 1:N --> HINT
```

## games
`id`, `player_name`, `total_score`, `current_round`, `difficulty`, `status`, `started_at`, `finished_at`.

## rounds
`id`, `game_id`, `round_number`, `pokemon_id`, `difficulty`, `started_at`, `finished_at`, `time_taken`, `is_correct`, `hints_used`, `score`.

## hints
`id`, `round_id`, `level`, `source`, `penalty`, `created_at`, `content` opcional.

## Seguridad
Las operaciones SQL usarán parámetros/prepared statements. PostgreSQL será accesible únicamente desde backend.
