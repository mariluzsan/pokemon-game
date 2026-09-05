# Reglas de Puntuación

La puntuación se calcula exclusivamente en backend.

## Factores
- acierto;
- tiempo empleado;
- pistas utilizadas;
- penalización de pistas;
- dificultad.

## Invariantes
- nunca negativa;
- una respuesta incorrecta no recibe el beneficio de una correcta;
- utilizar más pistas no aumenta la puntuación;
- las reglas son deterministas y probables mediante tests.

Modelo conceptual:
```text
score = max(0, baseScore + difficultyBonus + timeBonus - hintPenalties)
```

Los valores numéricos definitivos se centralizarán en `ScoringService` durante su implementación.
