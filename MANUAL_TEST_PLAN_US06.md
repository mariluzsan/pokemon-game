# Plan de Pruebas Manuales - US-06

## Fórmula de Puntuación Verificada

```
score = base + difficulty_bonus + time_bonus
score = 1000 + difficulty_bonus + floor(500 * remainingMs / 30_000)

base = 1000 puntos
difficulty_bonus:
  - EASY: 0
  - MEDIUM: 200
  - HARD: 400
  
time_bonus = floor(500 * max(0, 30_000 - elapsedMs) / 30_000)
  - Si elapsedMs >= 30_000: se rechaza con ROUND_EXPIRED
  
Respuesta incorrecta: 0 puntos
```

## Prerequisitos

- Backend ejecutándose en http://localhost:3000
- Frontend ejecutándose en http://localhost:5174
- PostgreSQL conectado y disponible
- psql instalado para consultas

## Pruebas

### A. RESPUESTA CORRECTA - EASY (0 bonus de dificultad)

1. Crear partida:
```powershell
$game = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/games" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ playerName = "TestPlayer1" } | ConvertTo-Json)
$gameId = $game.game.id
$gameId
```

2. Crear ronda:
```powershell
$round = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId/rounds" `
  -ContentType "application/json"
$roundId = $round.round.id
$roundId
```

3. Verificar que la dificultad es EASY:
```powershell
$round.round
```

4. Obtener desafío (para verificar imagen):
```powershell
$challenge = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/games/$gameId/rounds/$roundId/challenge"
$challenge.challenge
```

5. Enviar respuesta correcta (ajustar el pokémon según la imagen):
```powershell
$guess = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId/rounds/$roundId/guess" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ answer = "pikachu" } | ConvertTo-Json)
$guess.guess
```

**Validar:**
- isCorrect = true
- score > 0 (mínimo 1000 + 0 + timeBonus)
- score <= 1500 (máximo 1000 + 0 + 500)
- totalScore = score (primera respuesta)

6. Verificar persistencia en BD:
```powershell
psql -h localhost -U postgres -d pokemon_game -c "SELECT id, game_id, is_correct, score FROM rounds WHERE id = $roundId;"
```

**Validar:**
- is_correct = true
- score = valor recibido en respuesta

7. Verificar total_score en partida:
```powershell
psql -h localhost -U postgres -d pokemon_game -c "SELECT id, total_score FROM games WHERE id = $gameId;"
```

**Validar:**
- total_score = score de la ronda

---

### B. RESPUESTA INCORRECTA

1. Crear nueva partida y ronda:
```powershell
$game2 = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/games" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ playerName = "TestPlayer2" } | ConvertTo-Json)
$gameId2 = $game2.game.id

$round2 = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId2/rounds" `
  -ContentType "application/json"
$roundId2 = $round2.round.id
```

2. Enviar respuesta incorrecta:
```powershell
$guess2 = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId2/rounds/$roundId2/guess" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ answer = "wrongname" } | ConvertTo-Json)
$guess2.guess
```

**Validar:**
- isCorrect = false
- score = 0 (exactamente)
- totalScore = 0

3. Verificar persistencia:
```powershell
psql -h localhost -U postgres -d pokemon_game -c "SELECT id, is_correct, score FROM rounds WHERE id = $roundId2;"
```

**Validar:**
- is_correct = false
- score = 0

---

### C. SEGURIDAD - Intento de manipular score

```powershell
$guess3 = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId/rounds/$roundId/guess" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ answer = "pikachu"; score = 999999 } | ConvertTo-Json)
```

**Validar:**
- El score enviado por cliente es ignorado
- Se recibe ROUND_ALREADY_RESOLVED (segunda respuesta para misma ronda)
- O se recibe score calculado por backend, no 999999

---

### D. DOBLE ENVÍO PARA LA MISMA RONDA

1. Intentar enviar segunda respuesta a la ronda anterior:
```powershell
$guess_second = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId/rounds/$roundId/guess" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ answer = "charmander" } | ConvertTo-Json) `
  -ErrorAction Continue
$guess_second
```

**Validar:**
- Código HTTP: 409
- error.code = "ROUND_ALREADY_RESOLVED"
- message adecuado
- BD: score no cambia, totalScore no se incrementa

---

### E. EXPIRACIÓN (ROUND_EXPIRED)

1. Crear partida y ronda:
```powershell
$game3 = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/games" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ playerName = "TestPlayer3" } | ConvertTo-Json)
$gameId3 = $game3.game.id

$round3 = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId3/rounds" `
  -ContentType "application/json"
$roundId3 = $round3.round.id
$startedAt = $round3.round.startedAt
Write-Output "Ronda creada: $startedAt"
```

2. Esperar > 30 segundos y enviar respuesta:
```powershell
Start-Sleep -Seconds 31
$guess_expired = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/games/$gameId3/rounds/$roundId3/guess" `
  -Headers @{'Content-Type'='application/json'} `
  -Body (@{ answer = "pikachu" } | ConvertTo-Json) `
  -ErrorAction Continue
$guess_expired
```

**Validar:**
- Código HTTP: 409
- error.code = "ROUND_EXPIRED"
- is_correct = null en BD
- score = 0 en BD (no calculado)

---

### F. PUNTUACIÓN CON TIEMPO - DIFERENTES ESCENARIOS

Los tests unitarios cubren:
- Tiempo 0ms (max bonus): score = 1500 (EASY)
- Tiempo 5000ms: score = 1416 (EASY)
- Tiempo 30000ms (min bonus): score = 1000 (EASY)
- Dificultad MEDIUM (bonus +200): score = 1616 (a 5000ms)
- Dificultad HARD (bonus +400): score = 1816 (a 5000ms)

---

## Prueba en navegador (mínima)

1. Abrir http://localhost:5174
2. Crear partida
3. Ver imagen del Pokémon
4. Responder correctamente
5. Verificar en página que aparece:
   - "Respuesta correcta."
   - "Puntuación: X (Total: Y)"

**No implementar:**
- Pantalla completa de resultado (US-07)
- Botón para siguiente ronda (US-08)
- Información adicional del Pokémon

---

## Notas

- Los tests unitarios ya verifican la fórmula
- La persistencia atómica está implementada con transacciones
- El error ROUND_ALREADY_RESOLVED previene doble puntuación
- El score se calcula siempre en backend, nunca en frontend
