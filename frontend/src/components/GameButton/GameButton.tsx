import type { ReactNode } from 'react'

interface GameButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}

function GameButton({ children, onClick, disabled = false, type = 'button' }: GameButtonProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export default GameButton
