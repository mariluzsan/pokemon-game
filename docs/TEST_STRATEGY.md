# Estrategia de Pruebas

## Unitarias
Priorizar:
- cálculo de puntuación;
- dificultad;
- validación de pistas;
- límites y penalizaciones;
- validación de entradas.

## Integración
- `GameService` + persistencia.
- `HintService` + proveedor de IA simulado.
- `PokemonService` + PokéAPI simulada.

## API / Postman
Validar endpoints, códigos HTTP, contratos JSON, validaciones y errores.

## Casos críticos
- máximo de tres pistas y solicitud de una cuarta;
- IA devuelve un spoiler;
- timeout o error de IA;
- fallback;
- indisponibilidad de PokéAPI;
- error de base de datos;
- puntuación y penalizaciones;
- cambio de dificultad;
- orden del ranking.

Los tests automatizados no deben depender innecesariamente de servicios externos reales.
