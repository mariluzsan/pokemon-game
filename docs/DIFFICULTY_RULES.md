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
