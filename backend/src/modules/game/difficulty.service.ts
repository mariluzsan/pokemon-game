import type { Difficulty, PerformanceLevel } from './game.types.js'

const DIFFICULTIES: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD']

export function mapPerformanceLevelToDifficulty(
  currentDifficulty: Difficulty,
  performanceLevel: PerformanceLevel,
): Difficulty {
  const currentIndex = DIFFICULTIES.indexOf(currentDifficulty)
  const targetIndex = DIFFICULTIES.indexOf(performanceLevel)

  if (targetIndex > currentIndex) {
    return DIFFICULTIES[currentIndex + 1]
  }

  if (targetIndex < currentIndex) {
    return DIFFICULTIES[currentIndex - 1]
  }

  return currentDifficulty
}