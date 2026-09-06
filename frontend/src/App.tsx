import { useEffect, useState } from 'react'
import Home from './pages/Home/Home'
import Game from './pages/Game/Game'

type PageType = 'home' | 'game'

interface PageState {
  currentPage: PageType
  gameId: string | null
}

function getPageStateFromPath(path: string): PageState {
  if (path.startsWith('/game/')) {
    return {
      currentPage: 'game',
      gameId: path.split('/game/')[1],
    }
  }

  return {
    currentPage: 'home',
    gameId: null,
  }
}

function App() {
  const [pageState, setPageState] = useState<PageState>(() => getPageStateFromPath(window.location.pathname))

  useEffect(() => {
    // Handle browser back/forward navigation
    const handlePopState = () => {
      setPageState(getPageStateFromPath(window.location.pathname))
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
          window.history.pushState({}, '', path)
          setPageState(getPageStateFromPath(path))
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