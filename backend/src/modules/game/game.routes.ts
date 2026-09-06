import { Router } from 'express'
import { createGameController, createRoundController, getRoundChallengeController, submitGuessController } from './game.controller.js'

export const gameRouter = Router()

gameRouter.post('/games', createGameController)
gameRouter.post('/games/:gameId/rounds', createRoundController)
gameRouter.get('/games/:gameId/rounds/:roundId/challenge', getRoundChallengeController)
gameRouter.post('/games/:gameId/rounds/:roundId/guess', submitGuessController)

