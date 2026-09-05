# ADR-004 — Abstracción del Proveedor de IA

**Estado:** Aceptado

## Decisión
Definir una interfaz `AIProvider` y encapsular el proveedor LLM concreto.

## Consecuencia
El dominio queda desacoplado del proveedor y las pruebas pueden utilizar mocks.
