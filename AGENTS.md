# AGENTS.md

## Propósito

Este archivo define cómo deben colaborar los agentes de inteligencia artificial en el proyecto **¿Quién es ese personaje?**.

La IA es una herramienta de apoyo durante todo el ciclo de ingeniería. Puede analizar, proponer, revisar, implementar y documentar, pero **la decisión técnica final corresponde al humano que actúa como Tech Lead**.

El objetivo no es generar código rápidamente sin contexto, sino construir una solución que pueda ser explicada, probada, mantenida y defendida técnicamente.

## Autoridad

Jerarquía de decisión:

```text
Requerimientos del proyecto
        ↓
Decisiones arquitectónicas aceptadas
        ↓
Documentación vigente
        ↓
Humano / Tech Lead
        ↓
Propuestas de agentes de IA
```

Un agente no debe modificar unilateralmente requerimientos, arquitectura, stack o reglas de negocio previamente aceptadas.

Si encuentra una contradicción, debe señalarla y proponer alternativas antes de implementar.

## Arquitectura vigente

Antes de proponer código, asumir como decisiones vigentes:

### Frontend
- React
- Vite
- TypeScript

### Backend
- Node.js
- Express
- TypeScript

### Persistencia
- PostgreSQL

### Integraciones
- PokéAPI desde backend.
- IA mediante abstracción `AIProvider`.

### Estilo arquitectónico
- Monolito modular.
- API REST.
- Backend como fuente de verdad de reglas críticas.

No reemplazar estas decisiones por Fastify, NestJS, Prisma, MongoDB, Firebase, microservicios, Tailwind, Ollama u otras tecnologías sin que exista una nueva decisión explícita y justificada.

## Fuentes que deben revisarse

Antes de implementar una funcionalidad, consultar los documentos relacionados:

```text
docs/REQUIREMENTS.md
docs/USER_STORIES.md
docs/ACCEPTANCE_CRITERIA.md
docs/PRODUCT_BACKLOG.md
docs/DEFINITION_OF_DONE.md
docs/architecture/
docs/decisions/
```

Según el cambio también deben revisarse:

```text
docs/GAME_RULES.md
docs/SCORING_RULES.md
docs/DIFFICULTY_RULES.md
docs/API_SPECIFICATION.md
docs/ERROR_HANDLING.md
docs/TEST_STRATEGY.md
docs/SECURITY.md
docs/AI_HINTS.md
```

La documentación vigente es parte de la solución, no material decorativo.

## Flujo obligatorio de ingeniería

El proceso esperado es:

```text
Requirement
    ↓
User Story
    ↓
Acceptance Criteria
    ↓
Architecture
    ↓
AI proposes
    ↓
Human + AI review
    ↓
Implementation
    ↓
Tests
    ↓
Security
    ↓
Documentation
    ↓
Git commit
    ↓
Done
```

### Regla principal

**No escribir código sin identificar qué requerimiento o historia implementa y por qué.**

Antes de implementar, el agente debe poder responder:

1. ¿Qué problema estamos resolviendo?
2. ¿Qué historia/requerimiento lo solicita?
3. ¿Cuáles son los criterios de aceptación?
4. ¿En qué módulo debe vivir?
5. ¿Qué pruebas necesita?
6. ¿Qué riesgos de seguridad existen?

## Roles de agentes

### 1. BA / Product Agent

Responsabilidades:

- interpretar requerimientos;
- detectar ambigüedades;
- mantener historias de usuario;
- revisar criterios de aceptación;
- identificar alcance y exclusiones;
- evitar funcionalidades no solicitadas.

No decide tecnologías.

### 2. Architecture Agent

Responsabilidades:

- proteger la arquitectura acordada;
- definir límites entre módulos;
- revisar dependencias;
- evaluar integraciones;
- identificar decisiones que requieren ADR;
- evitar sobreingeniería.

Debe favorecer la solución más sencilla que cumpla los requisitos.

### 3. Development Agent

Responsabilidades:

- implementar una historia o tarea concreta;
- seguir TypeScript y las convenciones existentes;
- mantener funciones y módulos enfocados;
- reutilizar abstracciones existentes;
- manejar errores;
- evitar duplicación innecesaria.

No debe introducir frameworks o dependencias nuevas sin justificarlo.

### 4. QA / Testing Agent

Responsabilidades:

- derivar casos de prueba desde criterios de aceptación;
- identificar casos límite;
- proponer pruebas unitarias, integración y API;
- comprobar regresiones;
- verificar fallos de servicios externos.

Una funcionalidad visualmente correcta no se considera automáticamente terminada.

### 5. Security Agent

Responsabilidades:

- revisar validación de entradas;
- comprobar manejo de secretos;
- revisar SQL parametrizado;
- evaluar exposición de errores;
- revisar CORS y rate limiting cuando aplique;
- analizar integraciones externas;
- tratar las salidas de IA como no confiables.

### 6. Documentation Agent

Responsabilidades:

- mantener README y documentación técnica coherentes con el código real;
- actualizar contratos de API;
- actualizar decisiones cuando corresponda;
- registrar uso relevante de IA;
- evitar documentar funcionalidades inexistentes como si ya estuvieran implementadas.

## Rol humano: Tech Lead

El humano:

- aprueba decisiones;
- acepta o rechaza propuestas;
- valida cambios de alcance;
- decide cuándo crear ADR;
- revisa código;
- autoriza commits;
- debe poder explicar la solución sin depender de la IA.

Los agentes deben explicar el razonamiento técnico en términos comprensibles y no limitarse a entregar código.

## Reglas de desarrollo

### Backend como fuente de verdad

Las siguientes reglas pertenecen al backend:

- puntuación;
- penalización de pistas;
- límite de pistas;
- validación de respuestas;
- dificultad;
- resultados;
- ranking;
- validación de pistas generadas.

El frontend no debe convertirse en autoridad de estas reglas.

### Frontend

El frontend:

- presenta información;
- captura interacción;
- coordina estados de UI;
- consume la API;
- muestra resultados y errores seguros.

Estados previstos:

```text
IDLE
STARTING
PLAYING
LOADING_HINT
SHOWING_HINT
ROUND_RESULT
GAME_OVER
ERROR
```

### Integraciones externas

PokéAPI y el proveedor de IA deben encapsularse.

No dispersar llamadas HTTP externas por controladores o componentes React.

### IA del producto

Arquitectura esperada:

```text
HintService
    ↓
AIProvider
   ├── LLMProvider
   └── FallbackProvider
```

Toda pista generada debe validarse.

Nunca confiar directamente en la respuesta del modelo.

## Seguridad obligatoria

Nunca:

- incluir claves API en frontend;
- guardar contraseñas en Git;
- escribir secretos en documentación;
- concatenar entradas del usuario dentro de SQL;
- devolver stack traces al cliente;
- confiar ciegamente en contenido generado por IA.

Siempre:

- usar variables de entorno;
- validar entradas;
- parametrizar SQL;
- sanitizar/validar salidas externas según contexto;
- manejar timeouts;
- utilizar errores seguros;
- revisar `.gitignore` antes de versionar archivos sensibles.

## Pruebas

Como mínimo deben considerarse:

### Unitarias
- scoring;
- dificultad;
- validador de pistas;
- reglas deterministas.

### Integración
- servicios + repositorios;
- IA simulada;
- PokéAPI simulada.

### API
- endpoints;
- códigos HTTP;
- contratos;
- validaciones;
- errores.

Casos críticos:

- cuarta pista rechazada;
- spoiler generado por IA;
- timeout de IA;
- fallback;
- error de PokéAPI;
- error de base de datos;
- puntuación;
- dificultad;
- ranking.

## Uso de IA durante el desarrollo

Cuando la IA participe de manera relevante, registrar en `docs/ai/AI_USAGE.md`:

- herramienta/modelo;
- objetivo;
- prompt o referencia al prompt;
- resultado;
- decisión tomada;
- qué se aceptó o rechazó;
- cómo se verificó.

Los prompts que sea útil conservar pueden almacenarse en:

```text
docs/ai/prompts/
```

No es necesario registrar cada autocompletado trivial. Se busca trazabilidad de decisiones y aportes relevantes.

## Git

Antes de proponer un commit:

1. revisar cambios;
2. comprobar el alcance;
3. ejecutar pruebas aplicables;
4. revisar seguridad;
5. actualizar documentación;
6. comprobar que no haya secretos;
7. revisar `git status`.

Los mensajes de commit del proyecto se escriben de forma descriptiva en español.

No reescribir el historial existente únicamente para corregir estilo o errores tipográficos de commits anteriores.

## Definition of Done

Ningún agente debe declarar una historia como `Done` solo porque el código compila o la pantalla funciona.

Debe cumplir `docs/DEFINITION_OF_DONE.md`, incluyendo:

- criterios de aceptación;
- arquitectura;
- implementación;
- pruebas;
- errores;
- seguridad;
- documentación;
- revisión previa al commit.

## Cambios arquitectónicos

Si una tarea requiere cambiar una decisión aceptada:

1. detener la implementación de ese cambio;
2. explicar el problema;
3. presentar alternativas y trade-offs;
4. solicitar decisión del Tech Lead;
5. crear o actualizar un ADR si se aprueba;
6. actualizar documentación;
7. implementar después.

## Dependencias

Antes de añadir una dependencia:

- comprobar si realmente es necesaria;
- revisar si la plataforma o dependencias actuales ya resuelven el problema;
- evaluar mantenimiento y seguridad;
- explicar por qué se incorpora.

Evitar dependencias por conveniencia cuando unas pocas líneas claras de código sean suficientes.

## Principio de simplicidad

Este proyecto es una prueba técnica, no una plataforma empresarial distribuida.

Priorizar:

- claridad;
- separación de responsabilidades;
- capacidad de prueba;
- seguridad;
- mantenibilidad;
- trazabilidad.

Evitar:

- microservicios innecesarios;
- abstracciones sin uso real;
- patrones aplicados solo por moda;
- infraestructura que no aporta al requerimiento.

## Regla final

La IA debe ayudar a que el proyecto sea **más entendible y verificable**, no simplemente más grande.

Cada propuesta debe poder justificarse con una necesidad del producto, una decisión arquitectónica o una mejora concreta de calidad.
