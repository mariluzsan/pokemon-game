import { Router } from 'express'
import { createGameController } from './game.controller.js'

export const gameRouter = Router()

gameRouter.post('/games', createGameController)

