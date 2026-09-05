# Requerimientos — Pokémon Game

## 1. Objetivo
Construir **¿Quién es ese personaje?**, un juego web de adivinanza basado en Pokémon.

El jugador observa un Pokémon parcialmente oculto, realiza intentos y puede solicitar pistas progresivas. El sistema registra la partida, calcula puntuación, adapta dificultad y permite consultar un ranking.

## 2. Alcance
### Incluido
- Creación y gestión de partidas.
- Selección de Pokémon.
- Reto visual e imagen oculta.
- Temporizador.
- Intentos de respuesta.
- Cálculo de puntuación.
- Resolución de rondas.
- Pistas progresivas.
- Generación de pistas mediante IA.
- Fallback cuando la IA no esté disponible.
- Dificultad adaptativa.
- Persistencia en PostgreSQL.
- Ranking.
- API REST.
- Pruebas, validaciones y controles de seguridad.

### Fuera de alcance
- Autenticación.
- Multijugador.
- Aplicación móvil nativa.
- Microservicios.
- Chatbot general.

## 3. Reglas principales
- Una partida contiene varias rondas.
- Cada ronda está asociada a un Pokémon.
- El jugador dispone de tiempo limitado.
- Las pistas son progresivas y tienen penalización.
- Existe un límite de pistas por ronda.
- Una pista no debe revelar directamente el nombre del Pokémon.
- El backend valida respuestas y calcula la puntuación.
- El resultado final se persiste para el ranking.

## 4. Requisitos funcionales
RF-01 Crear partida; RF-02 Seleccionar Pokémon; RF-03 Mostrar reto visual; RF-04 Controlar temporizador; RF-05 Registrar intento; RF-06 Calcular puntuación; RF-07 Resolver ronda; RF-08 Finalizar partida; RF-09 Solicitar pista; RF-10 Generar pista con IA; RF-11 Limitar pistas; RF-12 Aplicar penalización; RF-13 Validar spoiler; RF-14 Fallback de IA; RF-15 Registrar desempeño; RF-16 Calcular nivel; RF-17 Ajustar dificultad; RF-18 Seleccionar Pokémon por dificultad; RF-19 Guardar resultado; RF-20 Consultar ranking; RF-21 Ordenar puntuaciones; RF-22 Mostrar ranking.

## 5. No funcionales
- React + TypeScript + Vite.
- Node.js + Express + TypeScript.
- PostgreSQL.
- REST/JSON.
- Integraciones externas únicamente desde backend.
- Variables sensibles mediante entorno.
- Validación de entradas.
- SQL parametrizado.
- CORS configurado.
- Errores seguros.
- Pruebas unitarias, integración y API.
- Código modular y mantenible.

## 6. Definition of Done
Una funcionalidad está terminada cuando implementa una historia identificable, cumple sus criterios de aceptación, tiene pruebas apropiadas, fue revisada por seguridad/errores, está documentada cuando corresponde y queda integrada mediante Git con un commit coherente.
