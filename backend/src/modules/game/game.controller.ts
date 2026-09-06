import type { Request, Response } from 'express'
import { PokemonApiError } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, ValidationError } from './game.errors.js'
import { GameService } from './game.service.js'
import { RoundService } from './round.service.js'

const gameService = new GameService()
const roundService = new RoundService()

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

export async function createRoundController(req: Request, res: Response) {
  try {
    const round = await roundService.createRound({
      gameId: Number(req.params.gameId),
    })

    res.status(201).json({ round })
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

    if (error instanceof GameNotFoundError) {
      res.status(404).json({
        error: {
          code: 'GAME_NOT_FOUND',
          message: error.message,
        },
      })
      return
    }

    if (error instanceof GameNotInProgressError) {
      res.status(409).json({
        error: {
          code: 'GAME_NOT_IN_PROGRESS',
          message: error.message,
        },
      })
      return
    }

    if (error instanceof PokemonApiError) {
      res.status(503).json({
        error: {
          code: 'POKEAPI_UNAVAILABLE',
          message: 'No fue posible seleccionar un Pokemon.',
        },
      })
      return
    }

    console.error('Error al crear ronda')

    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'No fue posible crear la ronda.',
      },
    })
  }
}

export async function getRoundChallengeController(req: Request, res: Response) {
  try {
    const challenge = await roundService.getRoundChallenge(
      Number(req.params.gameId),
      Number(req.params.roundId),
    )

    res.status(200).json({ challenge })
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

    if (error instanceof PokemonApiError) {
      res.status(503).json({
        error: {
          code: 'POKEAPI_UNAVAILABLE',
          message: 'No fue posible obtener los datos del desafio.',
        },
      })
      return
    }

    console.error('Error al obtener desafio de ronda')

    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'No fue posible obtener los datos del desafio.',
      },
    })
  }
}

export async function submitGuessController(req: Request, res: Response) {
  try {
    const guess = await roundService.submitGuess({
      gameId: Number(req.params.gameId),
      roundId: Number(req.params.roundId),
      answer: req.body?.answer,
    })

    res.status(200).json({ guess })
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

    if (error instanceof GameNotFoundError) {
      res.status(404).json({
        error: {
          code: 'GAME_NOT_FOUND',
          message: error.message,
        },
      })
      return
    }

    if (error instanceof GameNotInProgressError) {
      res.status(409).json({
        error: {
          code: 'GAME_NOT_IN_PROGRESS',
          message: error.message,
        },
      })
      return
    }

    if (error instanceof RoundExpiredError) {
      res.status(409).json({
        error: {
          code: 'ROUND_EXPIRED',
          message: error.message,
        },
      })
      return
    }

    if (error instanceof PokemonApiError) {
      res.status(503).json({
        error: {
          code: 'POKEAPI_UNAVAILABLE',
          message: 'No fue posible validar la respuesta.',
        },
      })
      return
    }

    console.error('Error al registrar respuesta')

    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'No fue posible registrar la respuesta.',
      },
    })
  }
}

