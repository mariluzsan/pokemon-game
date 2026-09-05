import GameButton from '../../components/GameButton/GameButton'
import GameTitle from '../../components/GameTitle/GameTitle'

function Home() {
  return (
    <main>
      <GameTitle />

      <GameButton>
        Iniciar partida
      </GameButton>

      <GameButton>
        Ver ranking
      </GameButton>
    </main>
  )
}

export default Home