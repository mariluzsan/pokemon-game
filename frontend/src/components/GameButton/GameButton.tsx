import type { ReactNode } from 'react'

interface GameButtonProps {
  children: ReactNode
  onClick?: () => void
}

function GameButton({ children, onClick }: GameButtonProps) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  )
}

export default GameButton