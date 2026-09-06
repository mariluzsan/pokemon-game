import type { Request, Response } from 'express'
import { RankingService } from './ranking.service.js'

export function createGetRankingController(rankingService = new RankingService()) {
  return async function getRankingController(_req: Request, res: Response) {
    try {
      const ranking = await rankingService.getRanking()

      res.status(200).json({ ranking })
    } catch {
      console.error('Error al consultar ranking')

      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'No fue posible consultar el ranking.',
        },
      })
    }
  }
}