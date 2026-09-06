# Registro de Uso de IA

## Propósito
Documentar cómo se utiliza IA durante el desarrollo y cómo se verifican sus resultados.

## Registrar
- Fecha.
- Objetivo.
- Herramienta/modelo.
- Prompt o resumen.
- Resultado propuesto.
- Decisión: aceptado, modificado o rechazado.
- Verificación.
- Archivos afectados.
- Commit relacionado.

La salida de IA es una propuesta técnica, no una autoridad.

## IA del producto
La generación de pistas se trata como una integración no confiable: timeout, errores, validación de formato, validación de spoilers, límite de pistas y fallback.

## Registros

### 2026-09-05 - Revision documental de Sprint 0
- Objetivo: analizar el estado real del repositorio y actualizar la documentacion desfasada de Sprint 0.
- Herramienta/modelo: Codex.
- Prompt o resumen: revisar documentacion, frontend, backend, migracion inicial y estado de US-01 a US-08 sin modificar codigo.
- Resultado propuesto: marcar como completados los elementos de Sprint 0 ya presentes en el codigo y mantener pendientes primer test, revision de seguridad y commit de cierre.
- Decision: aceptado por el Tech Lead mediante la alternativa 2 de alineacion documental.
- Verificacion: lectura de `AGENTS.md`, `README.md`, documentos Scrum/backlog/criterios, `.env.example`, `frontend/package.json`, `backend/package.json`, estructura de `frontend/src`, estructura de `backend/src` y migracion `001_initial_schema.sql`.
- Archivos afectados: `docs/SPRINT_0.md`, `README.md`, `docs/API_SPECIFICATION.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Primer test automatizado de Sprint 0
- Objetivo: crear una primera verificacion automatizada sin depender de servicios externos reales.
- Herramienta/modelo: Codex.
- Prompt o resumen: continuar con la creacion del primer test del proyecto.
- Resultado propuesto: agregar un script `npm test` en backend y validar la migracion inicial de PostgreSQL.
- Decision: aceptado como incremento minimo para completar el item "Primer test" de Sprint 0.
- Verificacion: `npm test` en `backend` ejecuta `npm run build` y luego el test compilado.
- Archivos afectados: `backend/package.json`, `backend/src/infrastructure/database/migrations/001_initial_schema.test.ts`, `docs/SPRINT_0.md`, `README.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.

### 2026-09-05 - Revision de seguridad de Sprint 0
- Objetivo: revisar riesgos basicos de seguridad antes de cerrar Sprint 0.
- Herramienta/modelo: Codex.
- Prompt o resumen: realizar revision de seguridad del estado actual del proyecto.
- Resultado propuesto: verificar secretos versionados, `.gitignore`, `.env.example`, CORS, logging de errores, dependencias y migracion inicial.
- Decision: aplicar ajustes minimos para CORS explicito y logging seguro del health check.
- Verificacion: `git ls-files`, `npm audit --audit-level=moderate` en backend y frontend, revision de `app.ts`, `database.ts`, `.env.example` y migracion inicial.
- Archivos afectados: `.env.example`, `backend/src/app.ts`, `docs/SECURITY.md`, `docs/SPRINT_0.md`, `README.md`, `docs/ai/AI_USAGE.md`.
- Commit relacionado: pendiente.
