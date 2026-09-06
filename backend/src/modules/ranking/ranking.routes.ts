import { Router } from 'express'
import { createGetRankingController } from './ranking.controller.js'
import { RankingService, type RankingReader } from './ranking.service.js'

export function createRankingRouter(rankingReader?: RankingReader) {
  const rankingRouter = Router()
  const rankingService = rankingReader
    ? new RankingService(rankingReader)
    : new RankingService()

  rankingRouter.get('/ranking', createGetRankingController(rankingService))

  return rankingRouter
}

export const rankingRouter = createRankingRouter()