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
