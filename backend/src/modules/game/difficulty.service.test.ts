import assert from 'node:assert/strict'
import { mapPerformanceLevelToDifficulty } from './difficulty.service.js'

function testMapsEveryCombinationWithOneStepTransitions() {
  const cases = [
    ['EASY', 'EASY', 'EASY'],
    ['EASY', 'MEDIUM', 'MEDIUM'],
    ['EASY', 'HARD', 'MEDIUM'],
    ['MEDIUM', 'EASY', 'EASY'],
    ['MEDIUM', 'MEDIUM', 'MEDIUM'],
    ['MEDIUM', 'HARD', 'HARD'],
    ['HARD', 'EASY', 'MEDIUM'],
    ['HARD', 'MEDIUM', 'MEDIUM'],
    ['HARD', 'HARD', 'HARD'],
  ] as const

  for (const [currentDifficulty, performanceLevel, expectedDifficulty] of cases) {
    assert.equal(
      mapPerformanceLevelToDifficulty(currentDifficulty, performanceLevel),
      expectedDifficulty,
      `${currentDifficulty} con ${performanceLevel}`,
    )
  }
}

function testMappingIsDeterministic() {
  assert.equal(
    mapPerformanceLevelToDifficulty('MEDIUM', 'HARD'),
    mapPerformanceLevelToDifficulty('MEDIUM', 'HARD'),
  )
}

testMapsEveryCombinationWithOneStepTransitions()
testMappingIsDeterministic()
console.log('Difficulty service tests passed')