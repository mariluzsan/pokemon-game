import type { RankingEntry } from '../../services/api'

interface RankingTableProps {
  entries: RankingEntry[]
}

function RankingTable({ entries }: RankingTableProps) {
  return (
    <div className="ranking-table" role="region" aria-label="Tabla de ranking">
      <table>
        <thead>
          <tr>
            <th scope="col">Posición</th>
            <th scope="col">Jugador</th>
            <th scope="col">Puntuación</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={`${entry.playerName}-${index}`}>
              <td>{index + 1}</td>
              <td>{entry.playerName}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RankingTable