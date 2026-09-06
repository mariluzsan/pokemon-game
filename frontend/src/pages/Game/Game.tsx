import { useCallback, useEffect, useRef, useState } from 'react'
import PokemonChallenge from '../../components/PokemonChallenge/PokemonChallenge'
import GameButton from '../../components/GameButton/GameButton'
import Timer from '../../components/Timer/Timer'
import { createRound, expireRound, getRoundChallenge, requestHint, submitGuess, type Round, type RoundChallenge } from '../../services/api'
import './Game.css'

interface GameProps {
  gameId: string
}

type RoundResultStatus = 'CORRECT' | 'INCORRECT' | 'EXPIRED' | null

interface GamePageState {
  round: Round | null
  challenge: RoundChallenge | null
  isLoading: boolean
  error: string | null
  isSubmitting: boolean
  roundResult: RoundResultStatus
  guessError: string | null
  isRequestingHint: boolean
  hintLevel: number | null
  hintContent: string | null
  hintError: string | null
  hintsUsed: number
  hintsRemaining: number | null
  hintPenalty: number | null
  score: number | null
  totalScore: number | null
  gameStatus: 'IN_PROGRESS' | 'FINISHED'
}

export default function Game({ gameId }: GameProps) {
  const initializedGameId = useRef<string | null>(null)
  const [state, setState] = useState<GamePageState>({
    round: null,
    challenge: null,
    isLoading: false,
    error: null,
    isSubmitting: false,
    roundResult: null,
    guessError: null,
    isRequestingHint: false,
    hintLevel: null,
    hintContent: null,
    hintError: null,
    hintsUsed: 0,
    hintsRemaining: null,
    hintPenalty: null,
    score: null,
    totalScore: null,
    gameStatus: 'IN_PROGRESS',
  })
  const [answer, setAnswer] = useState('')

  const loadNextRound = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      round: null,
      challenge: null,
      roundResult: null,
      guessError: null,
      isRequestingHint: false,
      hintLevel: null,
      hintContent: null,
      hintError: null,
      hintsUsed: 0,
      hintsRemaining: null,
      hintPenalty: null,
      score: null,
      totalScore: null,
    }))
    setAnswer('')

    try {
      const roundData = await createRound(Number(gameId))
      const challengeData = await getRoundChallenge(Number(gameId), roundData.id)
      setState((prev) => ({ ...prev, round: roundData, challenge: challengeData, isLoading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido.',
      }))
    }
  }, [gameId])

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

      await loadNextRound()
    }

    initializeRound()
  }, [gameId, loadNextRound])

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

    if (state.roundResult || state.isSubmitting || state.isRequestingHint || !state.round || !answer.trim()) {
      return
    }

    setState((prev) => ({ ...prev, isSubmitting: true, guessError: null, score: null, totalScore: null }))

    try {
      const result = await submitGuess(Number(gameId), state.round.id, answer)
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        roundResult: result.isCorrect ? 'CORRECT' : 'INCORRECT',
        score: result.score,
        hintPenalty: result.hintPenalty,
        totalScore: result.totalScore,
        gameStatus: result.status,
      }))
      // Clear answer field after submission
      setAnswer('')
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

  async function handleRoundExpired() {
    if (state.roundResult || !state.round) {
      return
    }

    try {
      const completion = await expireRound(Number(gameId), state.round.id)
      setState((prev) => ({
        ...prev,
        roundResult: 'EXPIRED',
        score: 0,
        hintPenalty: completion.hintPenalty,
        totalScore: completion.totalScore,
        gameStatus: completion.status,
        hintError: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        guessError: error instanceof Error ? error.message : 'No fue posible registrar la expiración.',
      }))
    }
  }

  async function handleRequestHint() {
    if (state.roundResult || state.isRequestingHint || !state.round) {
      return
    }

    setState((prev) => ({ ...prev, isRequestingHint: true, hintError: null }))

    try {
      const hint = await requestHint(Number(gameId), state.round.id)
      setState((prev) => ({
        ...prev,
        isRequestingHint: false,
        hintLevel: hint.level,
        hintContent: hint.content,
        hintPenalty: hint.penalty,
        totalScore: hint.totalScore,
        hintsUsed: hint.hintsUsed,
        hintsRemaining: hint.hintsRemaining,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRequestingHint: false,
        hintError: error instanceof Error ? error.message : 'No fue posible solicitar la pista.',
      }))
    }
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
        isActive={state.roundResult === null}
        onExpired={() => { void handleRoundExpired() }}
      />

      <section className="game-rules" aria-labelledby="game-rules-title">
        <h2 id="game-rules-title">Puntuación de la ronda</h2>
        <div className="game-rules__items">
          <p><strong>30 s</strong><span>para responder</span></p>
          <p><strong>1000</strong><span>puntos base</span></p>
          <p><strong>Bonos</strong><span>Fácil +0, Medio +200, Difícil +400</span></p>
          <p><strong>+0 a +500</strong><span>según el tiempo que quede</span></p>
          <p><strong>-100</strong><span>por pista, hasta 3</span></p>
          <p><strong>0 puntos</strong><span>si fallas o expira</span></p>
        </div>
      </section>

      {state.roundResult === null && (
        <>
          <p className="hint-usage">
            Pistas usadas: {state.hintsUsed}.
            {state.hintsRemaining !== null && ` Restantes: ${state.hintsRemaining}.`}
          </p>
          {state.totalScore !== null && (
            <p className="total-score">Total acumulado: {state.totalScore}</p>
          )}
          <form className="game-actions" onSubmit={handleSubmitGuess}>
            <label className="answer-field">
              Tu respuesta
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={state.isSubmitting || state.isRequestingHint}
                autoComplete="off"
                required
              />
            </label>
            <GameButton type="submit" disabled={state.isSubmitting || state.isRequestingHint || !answer.trim()}>
              {state.isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
            </GameButton>
            <GameButton
              type="button"
              onClick={() => { void handleRequestHint() }}
              disabled={state.isSubmitting || state.isRequestingHint || state.hintsRemaining === 0}
            >
              {state.isRequestingHint ? 'Solicitando pista...' : state.hintsRemaining === 0 ? 'Límite de pistas alcanzado' : 'Solicitar pista'}
            </GameButton>
          </form>
        </>
      )}

      {state.guessError && <p className="error">{state.guessError}</p>}
      {state.hintLevel !== null && (
        <p className="hint-status">Pista {state.hintLevel}: {state.hintContent} (-{state.hintPenalty ?? 0} puntos)</p>
      )}
      {state.hintError && <p className="error">{state.hintError}</p>}
      {state.roundResult !== null && (
        <div className={`game-status game-status--${state.roundResult.toLowerCase()}`}>
          <p className="game-status__heading">
            {state.roundResult === 'CORRECT' && 'Respuesta correcta.'}
            {state.roundResult === 'INCORRECT' && 'Respuesta incorrecta.'}
            {state.roundResult === 'EXPIRED' && 'Tiempo agotado. La ronda ya no acepta respuestas.'}
          </p>
          {state.roundResult !== 'EXPIRED' && state.score !== null && (
            <div className="game-status__scores">
              <p><span>Puntos de ronda</span><strong>{state.score}</strong></p>
              <p><span>Penalización por pistas</span><strong>-{state.hintPenalty ?? 0}</strong></p>
              <p><span>Total acumulado</span><strong>{state.totalScore}</strong></p>
            </div>
          )}
          {state.roundResult === 'EXPIRED' && state.totalScore !== null && (
            <div className="game-status__scores">
              <p><span>Puntos de ronda</span><strong>0</strong></p>
              <p><span>Penalización por pistas</span><strong>-{state.hintPenalty ?? 0}</strong></p>
              <p><span>Total acumulado</span><strong>{state.totalScore}</strong></p>
            </div>
          )}
          {state.gameStatus === 'FINISHED' ? (
            <>
              <p className="game-status__final">Partida terminada. Puntuación final: {state.totalScore}</p>
              <div className="game-status__actions">
                <a className="game-status__link" href="/ranking">Ver ranking</a>
                <a className="game-status__link" href="/">Volver al inicio</a>
              </div>
            </>
          ) : (
            <GameButton onClick={() => { void loadNextRound() }} disabled={state.isLoading}>
              Continuar
            </GameButton>
          )}
        </div>
      )}
    </main>
  )
}

