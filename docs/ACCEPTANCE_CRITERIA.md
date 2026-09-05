# Criterios de Aceptación

## Partida
- Se puede crear una partida con datos válidos.
- Cada ronda pertenece a una partida.
- El backend controla el estado y las reglas críticas.
- La partida puede finalizar y conservar su resultado.

## Intentos y puntuación
- Una respuesta produce un resultado correcto o incorrecto.
- El backend calcula la puntuación.
- La puntuación nunca es negativa.
- Las pistas aplican penalización.

## Pistas
- Se permiten como máximo tres pistas por ronda.
- Son progresivas.
- No contienen el nombre del Pokémon objetivo.
- Si la IA falla se utiliza un mecanismo de fallback.
- Un fallo de IA no debe derribar la partida.

## Dificultad
- Se registra el desempeño.
- El nivel puede ajustarse según resultados recientes.
- La selección del Pokémon respeta la dificultad calculada.

## Ranking
- El resultado válido puede persistirse.
- El ranking se obtiene desde backend.
- Las puntuaciones se ordenan principalmente de mayor a menor.

## Errores y calidad
- La API utiliza el contrato definido en `ERROR_HANDLING.md`.
- No se exponen secretos ni detalles internos.
- Una historia requiere pruebas, revisión de seguridad y documentación aplicable para considerarse terminada.
