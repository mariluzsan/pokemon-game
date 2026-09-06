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

## US-06 — Obtener puntuación según el desempeño
- El backend calcula la puntuación de cada ronda a partir del resultado de la respuesta, el tiempo empleado, la dificultad y las pistas utilizadas.
- El cálculo utiliza las mismas reglas para entradas equivalentes y produce resultados deterministas.
- Una respuesta incorrecta no recibe el beneficio de una respuesta correcta.
- El uso de pistas reduce la puntuación según la penalización configurada y utilizar más pistas no aumenta la puntuación.
- La puntuación de una ronda y la puntuación acumulada de la partida nunca son negativas.
- La puntuación calculada queda asociada al resultado de la ronda y se refleja en el total de la partida cuando corresponda.

## US-07 — Conocer el resultado de cada ronda
- Al resolver una ronda, el sistema informa si la respuesta fue correcta, incorrecta o si la ronda expiró.
- El resultado incluye la puntuación obtenida en la ronda cuando corresponda.
- El resultado respeta las pistas utilizadas, la penalización aplicada y la dificultad de la ronda.
- Una ronda resuelta no puede volver a modificar su resultado mediante una respuesta posterior.
- El resultado de la ronda permite continuar con la siguiente ronda o finalizar la partida según el flujo definido.

## US-08 — Finalizar la partida al completar las rondas
- La partida se marca como finalizada cuando se completan todas las rondas configuradas.
- Una partida finalizada conserva su puntuación total y el resultado final.
- Una partida finalizada no acepta nuevas rondas, respuestas ni acciones que modifiquen su puntuación.
- El sistema informa al jugador que la partida terminó y muestra el resultado acumulado.
- La finalización de la partida puede persistirse y no depende exclusivamente del estado visual del frontend.

## US-09 — Solicitar pistas
- El jugador puede solicitar una pista durante una ronda vigente.
- Cada solicitud válida devuelve una pista asociada al Pokémon objetivo de la ronda.
- Las pistas de una misma ronda se entregan en orden progresivo.
- El backend registra la cantidad de pistas utilizadas antes de aplicar la siguiente solicitud.
- Una solicitud realizada fuera de una ronda vigente, con una partida inválida o después del límite permitido se rechaza con un error seguro.
- Solicitar una pista no resuelve la ronda ni revela directamente la respuesta.

## US-10 — Recibir pistas generadas con IA sin revelar la respuesta
- El sistema intenta generar la pista mediante el proveedor de IA configurado en el backend.
- La pista generada se valida antes de mostrarse al jugador por contenido, formato, longitud y ausencia del nombre del Pokémon objetivo.
- Una pista válida es relevante para el Pokémon objetivo y respeta el nivel progresivo correspondiente.
- Una salida inválida de la IA no se muestra al jugador.
- Un timeout, error o salida inválida del proveedor de IA activa el mecanismo de fallback sin interrumpir la partida.
- Las credenciales y detalles internos del proveedor de IA no se exponen al frontend ni al jugador.

## US-12 — Aplicar penalización por uso de pistas
- Cada pista utilizada aplica la penalización configurada para la ronda.
- La penalización se calcula y aplica en el backend, no en el frontend.
- La penalización acumulada aumenta o se mantiene al utilizar pistas adicionales y nunca incrementa la puntuación.
- La puntuación final de la ronda se calcula considerando todas las pistas utilizadas antes de resolverla.
- La aplicación de penalizaciones no permite que la puntuación de la ronda ni la acumulada de la partida sea negativa.

## US-16 — Calcular el nivel de desempeño
- El sistema registra los resultados necesarios para evaluar el desempeño del jugador, incluidos aciertos, errores, tiempo y pistas utilizadas.
- El nivel de desempeño se calcula mediante reglas deterministas a partir del desempeño reciente.
- El resultado del cálculo pertenece a uno de los niveles definidos por el dominio, como `EASY`, `MEDIUM` o `HARD`.
- Un mismo conjunto de resultados produce siempre el mismo nivel de desempeño.
- El cálculo se realiza en el backend y no depende de valores enviados por el frontend sin validar.

## US-17 — Adaptar la dificultad según el desempeño
- El sistema puede aumentar la dificultad cuando el jugador mantiene un buen desempeño.
- El sistema puede reducir la dificultad cuando el desempeño del jugador es bajo.
- La dificultad solo cambia según las reglas configuradas y la información de desempeño registrada.
- La dificultad se mantiene dentro de los niveles válidos y no puede quedar fuera de sus límites.
- La dificultad calculada se utiliza en el flujo de selección de la siguiente ronda.
- La adaptación de dificultad es determinista y no altera retroactivamente los resultados de rondas ya resueltas.

## US-22 — Visualizar claramente el ranking
- El jugador puede consultar el ranking desde la aplicación.
- El ranking muestra como mínimo la posición, el jugador y la puntuación registrada.
- Las posiciones reflejan el orden recibido desde el backend y no se recalculan de forma contradictoria en el frontend.
- El ranking informa claramente cuando no existen resultados disponibles.
- Un error al consultar el ranking se muestra mediante un mensaje seguro y comprensible, sin detalles internos.
- La visualización permite distinguir cada registro y su puntuación sin ambigüedad.

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
