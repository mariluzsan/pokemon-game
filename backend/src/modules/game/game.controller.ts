import type { Request, Response } from 'express'
import { ValidationError } from './game.errors.js'
import { GameService } from './game.service.js'

const gameService = new GameService()

export async function createGameController(req: Request, res: Response) {
  try {
    const game = await gameService.createGame({
      playerName: req.body?.playerName,
    })

    res.status(201).json({ game })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      })
      return
    }

    console.error('Error al crear partida')

    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'No fue posible crear la partida.',
      },
    })
  }
}

