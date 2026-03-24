import { useState, useEffect } from 'react'
import { AliIcon } from '@/components/mascot/Ali'

interface AliPresenceProps {
  isLoading?: boolean
  message?: string
}

const IDLE_MESSAGES = [
  'I\u2019m here.',
  'Walking with you.',
  'Stay safe out there.',
  'You\u2019re not alone.',
]

export default function AliPresence({ isLoading, message }: AliPresenceProps) {
  const [visible, setVisible] = useState(false)
  const [idleMsg, setIdleMsg] = useState('')
  const [showBubble, setShowBubble] = useState(false)

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [])

  // Show a gentle idle message every ~45 seconds
  useEffect(() => {
    if (isLoading) return

    const show = () => {
      const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]
      setIdleMsg(msg)
      setShowBubble(true)
      setTimeout(() => setShowBubble(false), 4000)
    }

    const interval = setInterval(show, 45000)
    // Show first message after 12 seconds
    const first = setTimeout(show, 12000)

    return () => {
      clearInterval(interval)
      clearTimeout(first)
    }
  }, [isLoading])

  // Override with explicit message or loading state
  useEffect(() => {
    if (message) {
      setIdleMsg(message)
      setShowBubble(true)
      const t = setTimeout(() => setShowBubble(false), 5000)
      return () => clearTimeout(t)
    }
  }, [message])

  useEffect(() => {
    if (isLoading) {
      setIdleMsg('Finding you the safest path\u2026')
      setShowBubble(true)
    } else {
      setShowBubble(false)
    }
  }, [isLoading])

  return (
    <div
      className={`ali-presence-container transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      aria-live="polite"
    >
      {/* Speech bubble */}
      <div
        className={`ali-speech-bubble transition-all duration-300 ${showBubble ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}
      >
        <p className="text-[11px] text-foreground font-medium leading-snug">{idleMsg}</p>
        <div className="ali-bubble-tail" />
      </div>

      {/* Ali peeking */}
      <div className={`ali-peek ${isLoading ? 'ali-waiting' : ''}`}>
        <AliIcon size={44} />
      </div>
    </div>
  )
}
