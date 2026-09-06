import { useEffect, useRef, useState } from 'react'
import PokemonChallenge from '../../components/PokemonChallenge/PokemonChallenge'
import GameButton from '../../components/GameButton/GameButton'
import { createRound, getRoundChallenge, type RoundChallenge } from '../../services/api'
import './Game.css'

interface GameProps {
  gameId: string
}

interface GamePageState {
  round: { id: number; roundNumber: number } | null
  challenge: RoundChallenge | null
  isLoading: boolean
  error: string | null
}

export default function Game({ gameId }: GameProps) {
  const initializedGameId = useRef<string | null>(null)
  const [state, setState] = useState<GamePageState>({
    round: null,
    challenge: null,
    isLoading: false,
    error: null,
  })

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

      <div className="game-actions">
        <GameButton>Enviar respuesta</GameButton>
        <GameButton>Solicitar pista</GameButton>
      </div>
    </main>
  )
}

