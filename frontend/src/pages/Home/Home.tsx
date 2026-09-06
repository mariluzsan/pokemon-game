import { useEffect, useState } from 'react'
import GameButton from '../../components/GameButton/GameButton'
import GameTitle from '../../components/GameTitle/GameTitle'
import { createGame, type Game } from '../../services/api'
import './Home.css'

function Home() {
  const [playerName, setPlayerName] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    if (!game) {
      return
    }

    window.location.assign(`/game/${game.id}`)
  }, [game])

  async function handleStartGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setGame(null)
    setIsStarting(true)

    try {
      const createdGame = await createGame(playerName)
      setGame(createdGame)
      // Store game ID in localStorage for the Game page to access
      localStorage.setItem('currentGameId', createdGame.id.toString())
    } catch {
      setError('No fue posible iniciar la partida. Revisa el nombre e intenta de nuevo.')
    } finally {
      setIsStarting(false)
    }
  }

  if (game) {
    return null
  }

  return (
    <main className="home">
      <div className="home__content">
        <GameTitle />

        <form className="home-actions" onSubmit={handleStartGame}>
          <p className="home-actions__label">Comienza una partida</p>
          <label className="player-name-field">
            Nombre del jugador
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              maxLength={100}
              placeholder="Escribe tu nombre"
              required
            />
          </label>

          <GameButton type="submit" disabled={isStarting}>
            {isStarting ? 'Iniciando...' : 'Jugar ahora'}
          </GameButton>
        </form>

        {error && <p className="home-error">{error}</p>}
      </div>
      <p className="home__footnote">10 rondas · 30 segundos por ronda · hasta 3 pistas</p>
    </main>
  )
}

export default Home
