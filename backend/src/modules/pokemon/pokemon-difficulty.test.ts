import assert from 'node:assert/strict'
import {
  POKEMON_DIFFICULTY_RANGES,
  getPokemonDifficultyRange,
  isPokemonInDifficultyRange,
  pickCandidatePokemonId,
  type PokemonDifficulty,
} from './pokemon-difficulty.js'

const DIFFICULTIES: PokemonDifficulty[] = ['EASY', 'MEDIUM', 'HARD']

function testEasyRangeMatchesApprovedRule() {
  assert.deepEqual(getPokemonDifficultyRange('EASY'), { min: 1, max: 151 })
}

function testMediumRangeMatchesApprovedRule() {
  assert.deepEqual(getPokemonDifficultyRange('MEDIUM'), { min: 152, max: 493 })
}

function testHardRangeMatchesApprovedRule() {
  assert.deepEqual(getPokemonDifficultyRange('HARD'), { min: 494, max: 1025 })
}

function testEasyLowerBoundary() {
  assert.equal(isPokemonInDifficultyRange(1, 'EASY'), true)
}

function testEasyUpperBoundary() {
  assert.equal(isPokemonInDifficultyRange(151, 'EASY'), true)
  assert.equal(isPokemonInDifficultyRange(152, 'EASY'), false)
}

function testMediumLowerBoundary() {
  assert.equal(isPokemonInDifficultyRange(151, 'MEDIUM'), false)
  assert.equal(isPokemonInDifficultyRange(152, 'MEDIUM'), true)
}

function testMediumUpperBoundary() {
  assert.equal(isPokemonInDifficultyRange(493, 'MEDIUM'), true)
  assert.equal(isPokemonInDifficultyRange(494, 'MEDIUM'), false)
}

function testHardLowerBoundary() {
  assert.equal(isPokemonInDifficultyRange(493, 'HARD'), false)
  assert.equal(isPokemonInDifficultyRange(494, 'HARD'), true)
}

function testHardUpperBoundary() {
  assert.equal(isPokemonInDifficultyRange(1025, 'HARD'), true)
}

function testRangesPartitionWithoutGapsOrOverlap() {
  for (let pokemonId = 1; pokemonId <= 1025; pokemonId += 1) {
    const matches = DIFFICULTIES.filter((difficulty) => isPokemonInDifficultyRange(pokemonId, difficulty))
    assert.equal(matches.length, 1, `pokemonId ${pokemonId} debe pertenecer a exactamente una dificultad, pero pertenece a ${matches.join(',') || 'ninguna'}`)
  }
}

function testRangesCoverExactlyTheDeclaredTable() {
  assert.deepEqual(Object.keys(POKEMON_DIFFICULTY_RANGES).sort(), ['EASY', 'HARD', 'MEDIUM'])
}

function testPicksDeterministicCandidateWithoutExclusions() {
  const candidateId = pickCandidatePokemonId('EASY', [], () => 0)
  assert.equal(candidateId, 1)
}

function testPicksCandidateAtUpperBoundaryOfRange() {
  // random() -> 0.999999 debe mapear al ultimo id del rango (150 * 0.999999 ~= 150 -> +1 min)
  const candidateId = pickCandidatePokemonId('EASY', [], () => 0.999999)
  assert.equal(candidateId, 151)
}

function testSkipsExcludedIdsUsingSubsequentRandomValues() {
  let call = 0
  const sequence = [0, 0.5] // primero elige min (excluido), luego otro valor
  const random = () => sequence[call++] ?? 0.9

  const candidateId = pickCandidatePokemonId('EASY', [1], random)
  assert.equal(candidateId, 1 + Math.floor(0.5 * 151))
  assert.notEqual(candidateId, 1)
}

function testReturnsNullWhenEntireRangeIsExcluded() {
  const range = getPokemonDifficultyRange('EASY')
  const allIds = Array.from({ length: range.max - range.min + 1 }, (_unused, index) => range.min + index)

  const candidateId = pickCandidatePokemonId('EASY', allIds, () => 0)
  assert.equal(candidateId, null)
}

function testReturnsNullAfterExhaustingAttemptsOnPersistentCollision() {
  // El random siempre devuelve el mismo id excluido: no hay forma de escapar en 3 intentos.
  const candidateId = pickCandidatePokemonId('MEDIUM', [152], () => 0, 3)
  assert.equal(candidateId, null)
}

function testClassificationIsDeterministicForSameInput() {
  const first = isPokemonInDifficultyRange(300, 'MEDIUM')
  const second = isPokemonInDifficultyRange(300, 'MEDIUM')
  assert.equal(first, second)
  assert.equal(first, true)
}

function runTests() {
  testEasyRangeMatchesApprovedRule()
  testMediumRangeMatchesApprovedRule()
  testHardRangeMatchesApprovedRule()
  testEasyLowerBoundary()
  testEasyUpperBoundary()
  testMediumLowerBoundary()
  testMediumUpperBoundary()
  testHardLowerBoundary()
  testHardUpperBoundary()
  testRangesPartitionWithoutGapsOrOverlap()
  testRangesCoverExactlyTheDeclaredTable()
  testPicksDeterministicCandidateWithoutExclusions()
  testPicksCandidateAtUpperBoundaryOfRange()
  testSkipsExcludedIdsUsingSubsequentRandomValues()
  testReturnsNullWhenEntireRangeIsExcluded()
  testReturnsNullAfterExhaustingAttemptsOnPersistentCollision()
  testClassificationIsDeterministicForSameInput()
  console.log('Pokemon difficulty tests passed')
}

runTests()
