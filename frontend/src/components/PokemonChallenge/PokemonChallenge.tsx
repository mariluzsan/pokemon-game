import './PokemonChallenge.css'

interface PokemonChallengeProps {
  imageUrl: string
  roundNumber: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export default function PokemonChallenge({ imageUrl, roundNumber, difficulty }: PokemonChallengeProps) {
  return (
    <div className="pokemon-challenge">
      <h2>Ronda {roundNumber}</h2>
      <p className="difficulty">Dificultad: {difficulty}</p>
      
      <div className="challenge-container">
        <img 
          src={imageUrl}
          alt="Pokémon desconocido"
          className="pokemon-image"
        />
      </div>
      
      <p className="challenge-text">
        ¿Quién es ese Pokémon?
      </p>
    </div>
  )
}
