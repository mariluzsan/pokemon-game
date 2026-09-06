# Criterios de Aceptación

## US-04 — Disponer de un tiempo limitado para responder
- Al iniciar una ronda, el sistema asigna una duración máxima de respuesta previamente configurada.
- El temporizador comienza a contar cuando la ronda queda iniciada y muestra al jugador el tiempo restante.
- El tiempo restante disminuye de forma continua hasta llegar a cero, sin reiniciarse durante la ronda.
- Una respuesta enviada antes de que expire el tiempo se procesa normalmente y conserva el resultado correspondiente.
- Cuando el tiempo llega a cero sin una respuesta válida, la ronda se marca como expirada y deja de aceptar respuestas.
- Una respuesta enviada después de la expiración es rechazada por el backend con un error de dominio seguro y no modifica el resultado de la ronda.
- El backend determina si una respuesta llegó dentro del tiempo límite usando la hora de inicio de la ronda y la duración configurada; el temporizador del frontend no es la fuente de verdad.
- La expiración de una ronda no detiene ni corrompe la partida y permite continuar con el flujo definido para la siguiente ronda.

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
