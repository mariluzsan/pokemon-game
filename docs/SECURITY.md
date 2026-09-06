# Seguridad

- `.env` y secretos no se versionan.
- `.env.example` solo contiene plantillas seguras.
- Claves de IA y credenciales de BD existen unicamente en backend.
- Toda entrada relevante se valida.
- SQL debe ser parametrizado.
- CORS se configura explicitamente mediante `FRONTEND_ORIGIN`.
- Aplicar rate limiting razonable donde corresponda.
- No devolver stack traces ni informacion sensible.
- La salida de IA se considera no confiable y debe validarse.
- El proveedor de IA debe tener timeout y fallback.
- No registrar contrasenas, tokens o cadenas de conexion completas.
- Revisar vulnerabilidades de dependencias y evitar paquetes innecesarios.

## Revision Sprint 0

- `.env` y secretos estan ignorados por Git.
- `.env.example` contiene solo valores de plantilla y no incluye secretos reales.
- `FRONTEND_ORIGIN` define el origen permitido para CORS en desarrollo local.
- La conexion a PostgreSQL se realiza desde backend.
- El endpoint `GET /api/health` no devuelve stack traces ni detalles internos al cliente.
- `npm audit --audit-level=moderate` no reporta vulnerabilidades en backend ni frontend.
- La migracion inicial usa claves foraneas y restricciones para limites de pistas.
