import { useEffect, useState } from 'react'
import GameButton from '../../components/GameButton/GameButton'
import GameTitle from '../../components/GameTitle/GameTitle'
import RankingTable from '../../components/RankingTable/RankingTable'
import { getRanking, type RankingEntry } from '../../services/api'
import '../../components/RankingTable/RankingTable.css'
import './Ranking.css'

type RankingViewState = 'LOADING' | 'SUCCESS_WITH_DATA' | 'SUCCESS_EMPTY' | 'ERROR'

function Ranking() {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [viewState, setViewState] = useState<RankingViewState>('LOADING')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadRanking() {
      setViewState('LOADING')

      try {
        const ranking = await getRanking(abortController.signal)

        if (abortController.signal.aborted) {
          return
        }

        setEntries(ranking)
        setViewState(ranking.length > 0 ? 'SUCCESS_WITH_DATA' : 'SUCCESS_EMPTY')
      } catch {
        if (abortController.signal.aborted) {
          return
        }

        setEntries([])
        setViewState('ERROR')
      }
    }

    void loadRanking()

    return () => {
      abortController.abort()
    }
  }, [])

  return (
    <main className="ranking-page">
      <div className="ranking-page__content">
        <GameTitle />

        <section className="ranking-panel" aria-labelledby="ranking-title">
          <div className="ranking-panel__header">
            <div>
              <p className="ranking-panel__eyebrow">Ranking</p>
              <h2 id="ranking-title">Clasificación de jugadores</h2>
            </div>
            <a className="ranking-panel__home-link" href="/">Volver al inicio</a>
          </div>

          {viewState === 'LOADING' && (
            <p className="ranking-panel__status" role="status">Cargando ranking...</p>
          )}

          {viewState === 'ERROR' && (
            <p className="ranking-panel__status ranking-panel__status--error" role="alert">
              No fue posible consultar el ranking. Intenta nuevamente en unos instantes.
            </p>
          )}

          {viewState === 'SUCCESS_EMPTY' && (
            <p className="ranking-panel__status" role="status">Todavía no hay resultados registrados.</p>
          )}

          {viewState === 'SUCCESS_WITH_DATA' && (
            <RankingTable entries={entries} />
          )}
        </section>

        <div className="ranking-page__actions">
          <a href="/">
            <GameButton>Volver al inicio</GameButton>
          </a>
        </div>
      </div>
    </main>
  )
}

export default Ranking