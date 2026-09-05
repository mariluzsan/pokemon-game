import GameButton from '../../components/GameButton/GameButton'
import GameTitle from '../../components/GameTitle/GameTitle'
import './Home.css'

function Home() {
  return (
    <main className="home">
      <GameTitle />

      <div className="home-actions">
        <GameButton>
          Iniciar partida
        </GameButton>

        <GameButton>
          Ver ranking
        </GameButton>
      </div>
    </main>
  )
}

export default Home