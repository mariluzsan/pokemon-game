import { useEffect, useState } from 'react'
import Home from './pages/Home/Home'
import Game from './pages/Game/Game'

type PageType = 'home' | 'game'

interface PageState {
  currentPage: PageType
  gameId: string | null
}

function App() {
  const [pageState, setPageState] = useState<PageState>({
    currentPage: 'home',
    gameId: null,
  })

  useEffect(() => {
    // Handle browser back/forward navigation
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/game/')) {
        const gameId = path.split('/game/')[1]
        setPageState({ currentPage: 'game', gameId })
      } else {
        setPageState({ currentPage: 'home', gameId: null })
      }
    }

    // Parse initial URL
    const path = window.location.pathname
    if (path.startsWith('/game/')) {
      const gameId = path.split('/game/')[1]
      setPageState({ currentPage: 'game', gameId })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle client-side navigation
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href.startsWith(window.location.origin)) {
        const path = link.href.replace(window.location.origin, '')
        if (path.startsWith('/game/')) {
          event.preventDefault()
          const gameId = path.split('/game/')[1]
          window.history.pushState({}, '', path)
          setPageState({ currentPage: 'game', gameId })
        }
      }
    }

    document.addEventListener('click', handleLinkClick)
    return () => document.removeEventListener('click', handleLinkClick)
  }, [])

  if (pageState.currentPage === 'game' && pageState.gameId) {
    return <Game gameId={pageState.gameId} />
  }

  return <Home />
}

export default App