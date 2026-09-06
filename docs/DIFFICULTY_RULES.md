# Reglas de Dificultad Adaptativa

## Objetivo
Ajustar gradualmente el reto según el desempeño.

## Señales
- aciertos y errores;
- tiempo;
- pistas utilizadas;
- desempeño reciente.

Los niveles del dominio serán explícitos, por ejemplo `EASY`, `MEDIUM` y `HARD`.

Buen desempeño sostenido puede aumentar dificultad y desempeño bajo puede reducirla. La lógica pertenece a `DifficultyService`, debe ser determinista, independiente del frontend y cubierta por pruebas.

La dificultad resultante interviene en la selección de Pokémon.

## Regla aprobada para US-17

La partida inicia en `EASY`. Después de cada ronda completada, incluida una
ronda expirada, el backend toma el `PerformanceLevel` calculado por US-16 para
esa misma partida y desplaza `games.difficulty` como máximo un nivel hacia ese
resultado. No existe una cantidad mínima de rondas y no hay saltos directos
entre `EASY` y `HARD`.

| Dificultad actual | PerformanceLevel `EASY` | PerformanceLevel `MEDIUM` | PerformanceLevel `HARD` |
|---|---|---|---|
| `EASY` | `EASY` | `MEDIUM` | `MEDIUM` |
| `MEDIUM` | `EASY` | `MEDIUM` | `HARD` |
| `HARD` | `MEDIUM` | `MEDIUM` | `HARD` |

`games.difficulty` representa la dificultad vigente de la partida. Al crear
una ronda, `rounds.difficulty` conserva una copia de esa dificultad; por ello,
una adaptación posterior solo afecta la siguiente ronda y nunca modifica una
ronda histórica.

## Regla aprobada para US-18 — selección de Pokémon por dificultad

Al crear una ronda, el backend traduce `games.difficulty` en un rango cerrado
de `pokemonId` de PokéAPI (clasificación objetiva por generación):

| Dificultad | Rango `pokemonId` |
|---|---|
| `EASY` | 1–151 |
| `MEDIUM` | 152–493 |
| `HARD` | 494–1025 |

Los rangos son exclusivos y cubren exactamente 1 a 1025 sin huecos ni
solapamiento: cada `pokemonId` pertenece a un único nivel.

Algoritmo de selección:
1. Se determina el rango de la dificultad vigente de la partida.
2. Se excluyen los `pokemon_id` ya utilizados en rondas previas de la misma
   partida (`rounds.pokemon_id`), para no repetir Pokémon dentro de una
   partida.
3. Se elige aleatoriamente un `pokemonId` dentro del rango que no esté
   excluido, con un máximo de 20 intentos aleatorios.
4. Si el rango completo ya está excluido, o se agotan los intentos sin
   encontrar un candidato válido, no se crea la ronda y se devuelve un error
   controlado (`503 POKEAPI_UNAVAILABLE`).
5. El candidato elegido se valida contra PokéAPI (mismo mecanismo existente
   de `PokemonApiClient`) antes de persistirse.

La selección ocurre en `PokemonApiClient.selectRandomPokemon(difficulty,
excludedPokemonIds)`, reutilizando el mismo cliente HTTP de US-02; la
clasificación pura (rangos y elección de candidato) vive en
`backend/src/modules/pokemon/pokemon-difficulty.ts` y es independiente de la
llamada HTTP, lo que permite probarla sin red y con aleatoriedad inyectada.

## Pipeline completo de Sprint 3

```text
Resultados de rondas
  -> US-15 Performance Snapshot (agregación de aciertos, errores, tiempo y pistas)
  -> US-16 Performance Level (EASY/MEDIUM/HARD determinista)
  -> US-17 Difficulty (adapta games.difficulty un nivel hacia el Performance Level)
  -> US-18 Pokemon Selection (elige pokemonId dentro del rango de games.difficulty,
     excluyendo pokemon_id ya usados en la partida)
```

