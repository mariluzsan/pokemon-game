# Reglas del Juego

El jugador intenta identificar un Pokémon en cada ronda.

## Flujo
1. Crear partida.
2. Seleccionar Pokémon según dificultad.
3. Presentar la ronda.
4. El jugador responde o solicita una pista.
5. Backend valida la acción.
6. Se calcula el resultado y se registra desempeño.
7. Se continúa hasta finalizar.
8. El resultado final puede ingresar al ranking.

## Pistas
Máximo tres por ronda, progresivas, con penalización y sin revelar el nombre. Si la IA falla se utiliza fallback.

## Estados previstos
`IDLE`, `STARTING`, `PLAYING`, `LOADING_HINT`, `SHOWING_HINT`, `ROUND_RESULT`, `GAME_OVER`, `ERROR`.

El backend es la fuente de verdad de puntuación, dificultad, pistas y resultados.
