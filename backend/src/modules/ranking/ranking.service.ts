import { RankingRepository } from './ranking.repository.js'
import type { RankingEntry } from './ranking.types.js'

export interface RankingReader {
  listRanking(): Promise<RankingEntry[]>
}

export class RankingService {
  constructor(private readonly rankingRepository: RankingReader = new RankingRepository()) {}

  async getRanking(): Promise<RankingEntry[]> {
    return this.rankingRepository.listRanking()
  }
}