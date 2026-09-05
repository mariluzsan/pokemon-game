# Estrategia de Agentes e IA

La IA se utiliza durante todo el ciclo de ingeniería.

```text
Requirement -> User Story -> Architecture -> AI proposes -> Human + AI review -> Implementation -> Tests -> Security -> Documentation -> Git commit -> Done
```

## Roles
1. BA / Product
2. Architecture
3. Development
4. QA / Testing
5. Security
6. Documentation
7. Humano = Tech Lead / autoridad final

## Principios
- No escribir código sin conocer el requisito.
- No aceptar IA sin revisión.
- No considerar terminada una funcionalidad sin pruebas.
- No incluir secretos en prompts o código.
- Registrar decisiones relevantes y uso de IA.

## IA del producto
`HintService -> AIProvider -> LLMProvider / FallbackProvider`.
El backend valida la salida antes de entregarla al usuario.
