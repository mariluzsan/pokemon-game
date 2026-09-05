# Plan Scrum

## Objetivo

Organizar la ejecución del proyecto "¿Quién es ese Pokémon?" en incrementos
funcionales, manteniendo trazabilidad entre las Historias de Usuario,
el Product Backlog, el tablero de GitHub Projects y la implementación.

El detalle funcional de cada historia se encuentra en `USER_STORIES.md`
y sus criterios verificables en `ACCEPTANCE_CRITERIA.md`.

---

## Sprint 0 — Fundación

### Objetivo

Preparar la base técnica, documental y de trabajo necesaria para desarrollar
el producto de forma incremental.

### Alcance

- Inicializar el repositorio Git.
- Definir la estructura general del proyecto.
- Configurar el frontend base con React + Vite.
- Configurar el backend base con Node.js + Express.
- Configurar PostgreSQL.
- Establecer la conexión inicial entre backend y base de datos.
- Configurar variables de entorno.
- Crear la documentación inicial del proyecto.
- Documentar arquitectura y decisiones técnicas.
- Configurar GitHub Projects y el flujo Scrum.
- Preparar el entorno para desarrollo asistido por agentes.

### Historias de Usuario

Este Sprint no contiene Historias de Usuario funcionales.

Corresponde a trabajo técnico habilitador necesario para implementar
las historias del Product Backlog.

### Resultado esperado

Entorno de desarrollo operativo y arquitectura base preparada para iniciar
la implementación funcional del producto.

---

## Sprint 1 — Juego principal / MVP

### Objetivo

Construir el flujo mínimo jugable de una partida de principio a fin.

### Historias de Usuario

- **US-01 — Iniciar partida**  
  Como jugador, quiero iniciar una partida para comenzar el juego.

- **US-02 — Seleccionar Pokémon**  
  Como sistema, quiero seleccionar un Pokémon para construir una ronda.

- **US-03 — Visualizar personaje oculto**  
  Como jugador, quiero visualizar el personaje oculto para intentar identificarlo.

- **US-04 — Temporizador de ronda**  
  Como jugador, quiero disponer de un tiempo limitado para responder.

- **US-05 — Enviar respuesta**  
  Como jugador, quiero enviar mi respuesta para conocer si acerté.

- **US-06 — Calcular puntuación**  
  Como jugador, quiero obtener puntuación según mi desempeño.

- **US-07 — Resolver ronda**  
  Como jugador, quiero conocer el resultado de cada ronda.

- **US-08 — Finalizar partida**  
  Como jugador, quiero finalizar la partida al completar las rondas.

### Resultado esperado

El usuario puede iniciar y completar una partida básica utilizando Pokémon
obtenidos de la fuente de datos definida, realizando intentos, recibiendo
resultados y acumulando puntuación.

---

## Sprint 2 — Pistas + IA

### Objetivo

Incorporar un sistema de pistas que aporte valor al juego mediante IA,
sin revelar directamente la respuesta y manteniendo la partida funcional
ante fallos del servicio.

### Historias de Usuario

- **US-09 — Solicitar pista**  
  Como jugador, quiero solicitar pistas cuando las necesite.

- **US-10 — Generar pista con IA**  
  Como jugador, quiero recibir pistas generadas con IA sin que revelen la respuesta.

- **US-11 — Limitar pistas**  
  Como sistema, quiero limitar las pistas por ronda.

- **US-12 — Penalizar pistas**  
  Como sistema, quiero penalizar el uso de pistas.

- **US-13 — Validar spoilers**  
  Como sistema, quiero impedir que una pista revele el Pokémon.

- **US-14 — Fallback de IA**  
  Como jugador, quiero recibir una pista alternativa si falla la IA.

### Resultado esperado

El jugador puede solicitar pistas progresivas y seguras durante una ronda.
El uso de pistas afecta la puntuación y existe un mecanismo alternativo
cuando el servicio de IA no está disponible.

---

## Sprint 3 — Dificultad adaptativa

### Objetivo

Adaptar progresivamente la dificultad del juego según el desempeño del jugador.

### Historias de Usuario

- **US-15 — Registrar desempeño**  
  Como sistema, quiero registrar el desempeño del jugador.

- **US-16 — Calcular nivel de desempeño**  
  Como sistema, quiero calcular su nivel de desempeño.

- **US-17 — Adaptar dificultad**  
  Como sistema, quiero adaptar la dificultad según el desempeño.

- **US-18 — Seleccionar Pokémon por dificultad**  
  Como sistema, quiero seleccionar Pokémon acordes con la dificultad.

### Resultado esperado

El sistema utiliza el desempeño acumulado del jugador para determinar
un nivel de dificultad y seleccionar Pokémon apropiados para dicho nivel.

---

## Sprint 4 — Persistencia y Ranking

### Objetivo

Persistir el resultado de las partidas y permitir consultar un ranking
ordenado de jugadores y puntuaciones.

### Historias de Usuario

- **US-19 — Guardar resultado**  
  Como jugador, quiero que mi resultado final quede guardado.

- **US-20 — Consultar ranking**  
  Como jugador, quiero consultar el ranking.

- **US-21 — Ordenar puntuaciones**  
  Como sistema, quiero ordenar correctamente las puntuaciones.

- **US-22 — Mostrar ranking**  
  Como jugador, quiero visualizar claramente el ranking.

### Resultado esperado

Los resultados de las partidas quedan almacenados de forma durable
y el usuario puede consultar una clasificación ordenada correctamente.

---

## Sprint 5 — Hardening y entrega

### Objetivo

Preparar el producto para su entrega y sustentación, mejorando calidad,
robustez, seguridad y documentación.

### Alcance

- Ejecutar pruebas funcionales de extremo a extremo.
- Completar pruebas automatizadas priorizadas.
- Revisar validaciones y manejo de errores.
- Revisar estados de carga y error del frontend.
- Revisar seguridad de variables de entorno y secretos.
- Validar integración frontend → backend → PostgreSQL.
- Validar integración con PokéAPI.
- Validar comportamiento de IA y fallback.
- Revisar casos límite.
- Corregir defectos encontrados.
- Completar `README.md`.
- Completar `DECISIONS.md`.
- Completar `AI_USAGE.md`.
- Revisar `PRODUCT_BACKLOG.md`.
- Revisar criterios de aceptación.
- Preparar demostración y sustentación técnica.

### Historias de Usuario

Este Sprint no introduce nuevas Historias de Usuario funcionales.

Su propósito es verificar, estabilizar y documentar las historias
implementadas en los Sprints anteriores.

### Resultado esperado

Producto ejecutable de principio a fin, documentado, probado y preparado
para la entrega y sustentación.

---

# Relación Sprint ↔ Historias de Usuario

| Sprint | Historias |
|---|---|
| Sprint 0 — Fundación | Trabajo técnico habilitador |
| Sprint 1 — Juego principal / MVP | US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08 |
| Sprint 2 — Pistas + IA | US-09, US-10, US-11, US-12, US-13, US-14 |
| Sprint 3 — Dificultad adaptativa | US-15, US-16, US-17, US-18 |
| Sprint 4 — Persistencia y Ranking | US-19, US-20, US-21, US-22 |
| Sprint 5 — Hardening y entrega | QA, pruebas, seguridad, documentación y cierre |

---

# Flujo de trabajo

Las Historias de Usuario se gestionarán como Issues de GitHub y se
visualizarán en GitHub Projects utilizando el siguiente flujo:

`Backlog → Ready → In Progress → Review → Done`

- **Backlog:** trabajo identificado y pendiente de priorización/ejecución.
- **Ready:** historia preparada para comenzar.
- **In Progress:** implementación en curso.
- **Review:** implementación terminada y asociada a un Pull Request.
- **Done:** Pull Request integrado o Issue cerrado satisfactoriamente.

Cada incremento debe procurar mantener trazabilidad entre:

`Historia de Usuario → Issue → Rama → Commits → Pull Request → Done`