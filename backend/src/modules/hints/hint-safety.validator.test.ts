import assert from 'node:assert/strict'
import { HintSafetyValidator, UnsafeHintError, isSafeHint } from './hint-safety.validator.js'

const validator = new HintSafetyValidator()

function testDetectsNormalizedPokemonNames() {
  for (const content of ['Pikachu es electrico.', 'pikachu', 'PIKACHU', '  Creo que es Pikachu.  ']) {
    assert.equal(isSafeHint(content, 'pikachu'), false)
    assert.throws(() => validator.validate(content, 'pikachu'), UnsafeHintError)
  }
}

function testNormalizesAccentedNamesWithoutMatchingDifferentNames() {
  assert.equal(isSafeHint('FLABEBE tiene una flor.', 'flabebe'), false)
  assert.equal(isSafeHint('Sus mejillas almacenan electricidad.', 'pikachu'), true)
  assert.equal(isSafeHint('Pichu tambien es electrico.', 'pikachu'), true)
}

function testDoesNotTreatEmptyContentAsSpoiler() {
  assert.equal(isSafeHint('', 'pikachu'), true)
  assert.doesNotThrow(() => validator.validate('', 'pikachu'))
}

function runTests() {
  testDetectsNormalizedPokemonNames()
  testNormalizesAccentedNamesWithoutMatchingDifferentNames()
  testDoesNotTreatEmptyContentAsSpoiler()
  console.log('Hint safety validator tests passed')
}

runTests()