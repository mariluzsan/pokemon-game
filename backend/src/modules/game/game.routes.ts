import { Router } from 'express'
import { createGameController, createRoundController } from './game.controller.js'

export const gameRouter = Router()

gameRouter.post('/games', createGameController)
gameRouter.post('/games/:gameId/rounds', createRoundController)

