import type { Request, Response } from 'express'
import { PokemonApiError } from '../pokemon/pokemon.client.js'
import { GameNotFoundError, GameNotInProgressError, RoundExpiredError, RoundNotCompletedError, RoundNotExpiredError, ValidationError } from './game.errors.js'
import { RoundAlreadyResolvedError } from './round.repository.js'
import { GameService } from './game.service.js'
import { RoundService } from './round.service.js'
import { HintLimitReachedError } from '../hints/hint.errors.js'
import { HintService } from '../hints/hint.service.js'
import { UnsafeHintError } from '../hints/hint-safety.validator.js'

const gameService = new GameService()
const roundService = new RoundService()
const hintService = new HintService()

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

    if (error instanceof RoundNotCompletedError) {
      res.status(409).json({
        error: {
          code: 'ROUND_NOT_COMPLETED',
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

    if (error instanceof RoundAlreadyResolvedError) {
      res.status(409).json({
        error: {
          code: 'ROUND_ALREADY_RESOLVED',
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

export async function expireRoundController(req: Request, res: Response) {
  try {
    const completion = await roundService.expireRound(
      Number(req.params.gameId),
      Number(req.params.roundId),
    )

    res.status(200).json({ completion })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } })
      return
    }

    if (error instanceof GameNotFoundError) {
      res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: error.message } })
      return
    }

    if (error instanceof RoundNotExpiredError) {
      res.status(409).json({ error: { code: 'ROUND_NOT_EXPIRED', message: error.message } })
      return
    }

    console.error('Error al registrar expiracion de ronda')
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'No fue posible registrar la expiracion.' } })
  }
}

export async function requestHintController(req: Request, res: Response) {
  try {
    const hint = await hintService.requestHint({
      gameId: Number(req.params.gameId),
      roundId: Number(req.params.roundId),
    })

    res.status(201).json({ hint })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } })
      return
    }
    if (error instanceof GameNotFoundError) {
      res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: error.message } })
      return
    }
    if (error instanceof GameNotInProgressError) {
      res.status(409).json({ error: { code: 'GAME_NOT_IN_PROGRESS', message: error.message } })
      return
    }
    if (error instanceof RoundExpiredError) {
      res.status(409).json({ error: { code: 'ROUND_EXPIRED', message: error.message } })
      return
    }
    if (error instanceof RoundAlreadyResolvedError) {
      res.status(409).json({ error: { code: 'ROUND_ALREADY_RESOLVED', message: error.message } })
      return
    }
    if (error instanceof HintLimitReachedError) {
      res.status(409).json({ error: { code: 'HINT_LIMIT_REACHED', message: error.message } })
      return
    }
    if (error instanceof UnsafeHintError) {
      res.status(422).json({ error: { code: 'UNSAFE_HINT', message: 'No fue posible generar una pista segura.' } })
      return
    }
    if (error instanceof PokemonApiError) {
      res.status(503).json({ error: { code: 'POKEAPI_UNAVAILABLE', message: 'No fue posible obtener los datos del Pokemon.' } })
      return
    }

    console.error('Error al solicitar pista')
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'No fue posible solicitar la pista.' } })
  }
}

