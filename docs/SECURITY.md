# Seguridad

- `.env` y secretos no se versionan.
- `.env.example` solo contiene plantillas seguras.
- Claves de IA y credenciales de BD existen únicamente en backend.
- Toda entrada relevante se valida.
- SQL debe ser parametrizado.
- CORS se configura explícitamente.
- Aplicar rate limiting razonable donde corresponda.
- No devolver stack traces ni información sensible.
- La salida de IA se considera no confiable y debe validarse.
- El proveedor de IA debe tener timeout y fallback.
- No registrar contraseñas, tokens o cadenas de conexión completas.
- Revisar vulnerabilidades de dependencias y evitar paquetes innecesarios.
