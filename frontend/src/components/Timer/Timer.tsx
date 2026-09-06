import { useEffect, useRef, useState } from 'react'
import './Timer.css'

interface TimerProps {
  startedAt: string
  durationSeconds: number
  onExpired?: () => void
}

function getRemainingSeconds(startedAt: string, durationSeconds: number, now: number): number {
  const deadline = new Date(startedAt).getTime() + durationSeconds * 1000
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

export default function Timer({ startedAt, durationSeconds, onExpired }: TimerProps) {
  const onExpiredRef = useRef(onExpired)
  const reportedExpirationRef = useRef(false)
  const [remainingSeconds, setRemainingSeconds] = useState(() => (
    getRemainingSeconds(startedAt, durationSeconds, Date.now())
  ))

  useEffect(() => {
    onExpiredRef.current = onExpired
  }, [onExpired])

  useEffect(() => {
    reportedExpirationRef.current = false
    const updateRemainingSeconds = () => {
      const remaining = getRemainingSeconds(startedAt, durationSeconds, Date.now())
      setRemainingSeconds(remaining)

      if (remaining === 0 && !reportedExpirationRef.current) {
        reportedExpirationRef.current = true
        onExpiredRef.current?.()
      }
    }

    updateRemainingSeconds()
    const intervalId = window.setInterval(() => {
      updateRemainingSeconds()
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [startedAt, durationSeconds])

  const isExpired = remainingSeconds === 0

  return (
    <div className={`round-timer${isExpired ? ' round-timer--expired' : ''}`} aria-live="polite">
      <span className="round-timer__label">Tiempo restante</span>
      <strong>{remainingSeconds}s</strong>
      {isExpired && <span className="round-timer__status">Tiempo agotado</span>}
    </div>
  )
}