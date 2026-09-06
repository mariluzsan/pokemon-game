import { useState } from 'react'
import GameButton from '../../components/GameButton/GameButton'
import GameTitle from '../../components/GameTitle/GameTitle'
import { createGame, type Game } from '../../services/api'
import './Home.css'

function Home() {
  const [playerName, setPlayerName] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  async function handleStartGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setGame(null)
    setIsStarting(true)

    try {
      const createdGame = await createGame(playerName)
      setGame(createdGame)
    } catch {
      setError('No fue posible iniciar la partida. Revisa el nombre e intenta de nuevo.')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <main className="home">
      <GameTitle />

      <form className="home-actions" onSubmit={handleStartGame}>
        <label className="player-name-field">
          Nombre del jugador
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={100}
            required
          />
        </label>

        <GameButton type="submit" disabled={isStarting}>
          {isStarting ? 'Iniciando...' : 'Iniciar partida'}
        </GameButton>

        <GameButton>
          Ver ranking
        </GameButton>
      </form>

      {game && (
        <p className="home-status">
          Partida #{game.id} iniciada para {game.playerName}
        </p>
      )}

      {error && (
        <p className="home-error">
          {error}
        </p>
      )}
    </main>
  )
}

export default Home
