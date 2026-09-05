# Estrategia Git y GitHub

## Rama
Durante esta fase se utiliza `main` con cambios pequeños y verificables.

## Commits
Mensajes descriptivos en español y una unidad lógica por commit.

Ejemplos:
```text
Configuracion_backend_Express_TypeScript
Implementacion_endpoint_health
Creacion_servicio_puntuacion
Documentacion_estrategia_pruebas
```

## Antes de commit
1. revisar `git status`;
2. ejecutar pruebas aplicables;
3. comprobar que no hay secretos;
4. actualizar documentación;
5. agregar únicamente archivos previstos;
6. hacer commit.

No versionar `.env`, `node_modules`, builds, logs, claves ni contraseñas.

No se reescribe el historial anterior solo para corregir el estilo de mensajes ya creados.
