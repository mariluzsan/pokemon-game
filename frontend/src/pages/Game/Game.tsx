import { useEffect, useRef, useState } from 'react'
import PokemonChallenge from '../../components/PokemonChallenge/PokemonChallenge'
import GameButton from '../../components/GameButton/GameButton'
import Timer from '../../components/Timer/Timer'
import { createRound, getRoundChallenge, submitGuess, type Round, type RoundChallenge } from '../../services/api'
import './Game.css'

interface GameProps {
  gameId: string
}

interface GamePageState {
  round: Round | null
  challenge: RoundChallenge | null
  isLoading: boolean
  error: string | null
  isExpired: boolean
  isSubmitting: boolean
  guessResult: boolean | null
  guessError: string | null
}

export default function Game({ gameId }: GameProps) {
  const initializedGameId = useRef<string | null>(null)
  const [state, setState] = useState<GamePageState>({
    round: null,
    challenge: null,
    isLoading: false,
    error: null,
    isExpired: false,
    isSubmitting: false,
    guessResult: null,
    guessError: null,
  })
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    async function initializeRound() {
      if (!gameId) {
        setState((prev) => ({ ...prev, error: 'ID de partida inválido.' }))
        return
      }

      if (initializedGameId.current === gameId) {
        return
      }

      initializedGameId.current = gameId

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const roundData = await createRound(Number(gameId))
        setState((prev) => ({ ...prev, round: roundData }))

        const challengeData = await getRoundChallenge(Number(gameId), roundData.id)
        setState((prev) => ({
          ...prev,
          challenge: challengeData,
          isLoading: false,
          isExpired: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error desconocido.',
        }))
      }
    }

    initializeRound()
  }, [gameId])

  if (!gameId) {
    return (
      <main className="game">
        <p className="error">ID de partida inválido.</p>
        <GameButton onClick={() => (window.location.href = '/')}>
          Volver al inicio
        </GameButton>
      </main>
    )
  }

  async function handleSubmitGuess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (state.isExpired || state.isSubmitting || !state.round || !answer.trim()) {
      return
    }

    setState((prev) => ({ ...prev, isSubmitting: true, guessError: null, guessResult: null }))

    try {
      const result = await submitGuess(Number(gameId), state.round.id, answer)
      setState((prev) => ({ ...prev, isSubmitting: false, guessResult: result.isCorrect }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        guessError: error instanceof Error ? error.message : 'No fue posible enviar la respuesta.',
      }))
    }
  }

  if (state.isLoading) {
    return (
      <main className="game">
        <p className="loading">Cargando desafío...</p>
      </main>
    )
  }

  if (state.error) {
    return (
      <main className="game">
        <p className="error">{state.error}</p>
        <GameButton onClick={() => (window.location.href = '/')}>
          Volver al inicio
        </GameButton>
      </main>
    )
  }

  if (!state.challenge || !state.round) {
    return (
      <main className="game">
        <p className="error">No se pudo cargar el desafío.</p>
        <GameButton onClick={() => (window.location.href = '/')}>
          Volver al inicio
        </GameButton>
      </main>
    )
  }

  return (
    <main className="game">
      <PokemonChallenge
        imageUrl={state.challenge.imageUrl}
        roundNumber={state.challenge.roundNumber}
        difficulty={state.challenge.difficulty}
      />

      <Timer
        startedAt={state.round.startedAt}
        durationSeconds={state.challenge.timeLimitSeconds}
        onExpired={() => setState((prev) => ({ ...prev, isExpired: true }))}
      />

      <form className="game-actions" onSubmit={handleSubmitGuess}>
        <label className="answer-field">
          Tu respuesta
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={state.isExpired || state.isSubmitting}
            autoComplete="off"
            required
          />
        </label>
        <GameButton type="submit" disabled={state.isExpired || state.isSubmitting || !answer.trim()}>
          {state.isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
        </GameButton>
      </form>

      {state.isExpired && !state.guessResult && (
        <p className="game-status">Tiempo agotado. La ronda ya no acepta respuestas.</p>
      )}
      {state.guessError && <p className="error">{state.guessError}</p>}
      {state.guessResult !== null && (
        <p className="game-status">{state.guessResult ? 'Respuesta correcta.' : 'Respuesta incorrecta.'}</p>
      )}
    </main>
  )
}

