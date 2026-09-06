# Plan de Prueba Manual — US-14

## Objetivo
Verificar que US-14 (Fallback seguro cuando falla la IA) funciona correctamente en una partida real.

## Prerequisitos
1. Backend compilado y en ejecución: `npm run dev` en `/backend`
2. Frontend compilado: `npm run dev` en `/frontend`
3. PostgreSQL disponible
4. Archivo `.env.example` o `.env` con configuración válida

## Escenario 1: IA exitosa → Fallback no se usa

### Pasos
1. Iniciar una partida.
2. Crear una ronda.
3. Solicitar una pista (nivel 1).
4. **Esperado**: Pista generada por IA (contenido natural, mencionando atributos del Pokémon).
5. Consultar BD:
   ```sql
   SELECT id, source, level, content FROM hints WHERE round_id = <ROUND_ID> ORDER BY level;
   ```
6. **Verificar**: `source = 'AI'`

### SQL de verificación
```sql
-- Confirmar que se generó pista de IA
SELECT 
  h.id,
  h.round_id,
  h.level,
  h.source,
  h.penalty,
  h.content,
  h.created_at
FROM hints h
WHERE h.round_id = <ROUND_ID>
ORDER BY h.level;

-- Confirmar counters
SELECT 
  r.id,
  r.hints_used,
  g.total_score
FROM rounds r
JOIN games g ON r.game_id = g.id
WHERE r.id = <ROUND_ID>;
```

## Escenario 2: IA falla (timeout, error) → Fallback se usa

### Pasos
1. **Opción manual**: Esperar a que el proveedor IA esté temporalmente caído o timeout.
   - O: Pausar/bloquear conexión a API de Anthropic.
   
2. **Opción test automatizado**: Los tests ya validan esto:
   ```bash
   npm test  # Ejecutar tests de generator y service
   ```
   
   Buscar en output:
   ```
   Proveedor Anthropic no disponible { reason: 'missing_configuration' }
   ```
   
   O para timeout:
   ```
   Proveedor Anthropic no disponible { reason: 'timeout' }
   ```

3. Si se logra que IA falle, solicitar pista en juego:
4. **Esperado**: Pista generada por fallback (basada en tipos).
5. Consultar BD:
   ```sql
   SELECT source FROM hints WHERE round_id = <ROUND_ID> ORDER BY level DESC LIMIT 1;
   ```
6. **Verificar**: `source = 'FALLBACK'`

### SQL de verificación
```sql
-- Pista de fallback creada
SELECT 
  h.id,
  h.source,
  h.level,
  h.content,
  h.penalty
FROM hints h
WHERE h.round_id = <ROUND_ID>
  AND h.source = 'FALLBACK'
LIMIT 1;
```

## Escenario 3: IA es insegura (contiene nombre) → Fallback se usa

### Pasos
1. **Opción test automatizado**: Los tests ya validan esto.
   ```bash
   npm test
   ```
   Buscar en output:
   ```
   Pista de IA no cumple validación de seguridad, usando fallback
   ```

2. El test inyecta IA que devuelve: "El Pokemon es Pikachu."
3. Validador la rechaza → SafeHintGenerator intenta fallback
4. Fallback devuelve pista segura basada en tipo

### Prueba en test
En `hint.generator.test.ts`:
- `testUnsafeAIContentUsesFallback`: Valida que IA insegura resulta en fallback
- Verifica `source = 'FALLBACK'`
- Verifica que contenido NO incluye nombre del Pokémon

## Escenario 4: Fallback es progresivo

### Pasos
1. Crear una ronda.
2. Solicitar tres pistas consecutivas.
3. Verificar que fallback varía por level:
   ```sql
   SELECT level, source, content FROM hints 
   WHERE round_id = <ROUND_ID>
   ORDER BY level;
   ```

4. **Esperado**:
   - Nivel 1: Pista breve ("Pertenece al tipo...") 
   - Nivel 2: Pista media ("Su naturaleza se reconoce...")
   - Nivel 3: Pista descriptiva ("Reconócelo por...")

### SQL de verificación
```sql
-- Ver progresión de pistas
SELECT 
  h.level,
  h.source,
  LENGTH(h.content) as length,
  h.content
FROM hints h
WHERE h.round_id = <ROUND_ID>
ORDER BY h.level;
```

## Escenario 5: Una solicitud = Una pista (no double-counting)

### Pasos
1. Crear ronda con `hints_used = 0`
2. Solicitar pista (incluso si fallback)
3. Verificar que `hints_used` aumenta exactamente a 1:
   ```sql
   SELECT hints_used FROM rounds WHERE id = <ROUND_ID>;
   ```
4. Verificar que solo existe UN registro de hint para ese nivel:
   ```sql
   SELECT COUNT(*) FROM hints WHERE round_id = <ROUND_ID> AND level = 1;
   ```
5. **Esperado**: 1 registro, `hints_used = 1`

### SQL de verificación
```sql
-- Confirmar un solo hint por level
SELECT 
  level,
  COUNT(*) as qty,
  STRING_AGG(source, ', ') as sources
FROM hints
WHERE round_id = <ROUND_ID>
GROUP BY level;

-- Debe devolver: 1 registro con qty=1
```

## Escenario 6: Límite máximo de pistas (US-11 + US-14)

### Pasos
1. Crear ronda.
2. Solicitar 3 pistas → deben funcionar (IA o fallback).
3. Solicitar 4ª pista → debe ser rechazada con `HINT_LIMIT_REACHED`.
4. Verificar que no hay pista nivel 4:
   ```sql
   SELECT COUNT(*) FROM hints WHERE round_id = <ROUND_ID> AND level = 4;
   ```

### SQL de verificación
```sql
-- Confirmar límite de 3
SELECT 
  r.hints_used,
  COUNT(h.id) as hint_count
FROM rounds r
LEFT JOIN hints h ON r.id = h.round_id
WHERE r.id = <ROUND_ID>
GROUP BY r.id;

-- Debe mostrar: hints_used=3, hint_count=3
```

## Escenario 7: Penalización se aplica una sola vez (US-12 + US-14)

### Pasos
1. Crear ronda con `total_score = 1000`
2. Solicitar pista → penalización -100
3. Verificar `total_score = 900`:
   ```sql
   SELECT total_score FROM games WHERE id = <GAME_ID>;
   ```
4. Solicitar segunda pista → penalización -100 más
5. Verificar `total_score = 800`:

### SQL de verificación
```sql
-- Penalización consistente
SELECT 
  r.hints_used,
  COUNT(h.id) as hint_count,
  SUM(h.penalty) as total_penalty,
  g.total_score
FROM rounds r
LEFT JOIN hints h ON r.id = h.round_id
JOIN games g ON r.game_id = g.id
WHERE r.id = <ROUND_ID>
GROUP BY r.id;

-- Verificar: total_penalty = hints_used * 100
--           total_score = 1000 - total_penalty
```

## Escenario 8: Fallback con Pokémon dual-type

### Pasos
1. Crear partida y ronda.
2. Si Pokémon tiene 2 tipos (ej: Charizard = Fire/Flying):
   - Solicitar pista
3. Verificar contenido menciona ambos tipos:
   ```sql
   SELECT content FROM hints WHERE round_id = <ROUND_ID> ORDER BY level DESC LIMIT 1;
   ```
4. **Esperado**: Contenido incluye ambos tipos, no el nombre

### Prueba en test
En `hint.generator.test.ts`:
- `testFallbackWithDualTypes`: Valida fallback con 2 tipos

## Casos de Error

### Error: IA falla + Fallback falla
**Teorético**, pero posible si:
- PokéAPI no devuelve tipos
- FallbackHintGenerator falla

**Resultado esperado**: `422 UNSAFE_HINT` (no se persiste)

### Error: Ronda expirada
1. Esperar 30 segundos después de iniciar ronda
2. Solicitar pista → `409 ROUND_EXPIRED`

### Error: Ronda ya resuelta
1. Resolver ronda (acertar o fallar)
2. Solicitar pista → `409 ROUND_ALREADY_RESOLVED`

### Error: Límite alcanzado
1. Solicitar 3 pistas
2. Solicitar 4ª → `409 HINT_LIMIT_REACHED`

## Resumen de Tests Ejecutables

### Automatizados (recomendado)
```bash
cd backend
npm test
```

Buscar salida que incluya:
- `Hint generator tests passed` ✓
- `Hint service tests passed` ✓
- Mensajes de fallback: "Pista de IA no cumple validación de seguridad, usando fallback"

### Manuales
1. Iniciar backend y frontend
2. Crear partida
3. Crear ronda
4. Solicitar pistas (repetir 3 veces)
5. Verificar en BD con SQLs proporcionados

## Verificación Final

### SQL completo para auditoría de una ronda
```sql
-- Vista general de una partida y sus pistas
SELECT 
  g.id as game_id,
  g.player_name,
  g.total_score,
  r.id as round_id,
  r.round_number,
  r.hints_used,
  r.score as round_score,
  r.pokemon_id,
  COUNT(h.id) as hint_count,
  STRING_AGG(h.source, ', ' ORDER BY h.level) as sources,
  STRING_AGG(h.level::text, ', ' ORDER BY h.level) as levels
FROM games g
JOIN rounds r ON g.id = r.game_id
LEFT JOIN hints h ON r.id = h.round_id
WHERE g.id = <GAME_ID>
GROUP BY g.id, g.player_name, g.total_score, r.id, r.round_number, r.hints_used, r.score, r.pokemon_id
ORDER BY r.round_number;
```

## Verificación de No Regresión (US-01 a US-13)

1. Ejecutar `npm test` en backend → todos pasan
2. Crear partida y completar una ronda normal (sin pistas)
3. Crear partida y completar una ronda con pistas
4. Crear partida, expirar ronda, continuar
5. Resolver respuesta correcta e incorrecta
6. Verificar scoring:
   - Pista no debería afectar si respuesta es correcta o incorrecta
   - Penalización se aplica consistentemente

