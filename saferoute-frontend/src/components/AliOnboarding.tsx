import { useState, useEffect, useCallback } from 'react'
import { AliIcon } from '@/components/mascot/Ali'

const STORAGE_KEY = 'alaitaptap-onboarded'

const LINES = [
  { text: 'Hi\u2026 I\u2019m Ali.', pause: 1800 },
  { text: 'I\u2019ll be with you while you move.', pause: 2200 },
  { text: 'Not just to guide you faster\u2014\nbut to guide you safer.', pause: 3000 },
  { text: 'I look at the streets, the light,\nthe people around you\u2026\nand help you find paths where\nyou can feel at ease.', pause: 3600 },
  { text: 'You don\u2019t have to walk alone anymore.', pause: 2400 },
  { text: 'Whenever you\u2019re unsure\u2026\njust follow the light.', pause: 2800 },
]

interface AliOnboardingProps {
  onComplete: () => void
}

export default function AliOnboarding({ onComplete }: AliOnboardingProps) {
  const [currentLine, setCurrentLine] = useState(-1)
  const [displayedText, setDisplayedText] = useState('')
  const [typing, setTyping] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [aliVisible, setAliVisible] = useState(false)

  // Fade Ali in after a beat
  useEffect(() => {
    const t = setTimeout(() => setAliVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Start the first line after Ali appears
  useEffect(() => {
    if (aliVisible && currentLine === -1) {
      const t = setTimeout(() => setCurrentLine(0), 1200)
      return () => clearTimeout(t)
    }
  }, [aliVisible, currentLine])

  // Typewriter effect
  useEffect(() => {
    if (currentLine < 0 || currentLine >= LINES.length) return

    const line = LINES[currentLine]
    let charIdx = 0
    setDisplayedText('')
    setTyping(true)

    const interval = setInterval(() => {
      charIdx++
      setDisplayedText(line.text.slice(0, charIdx))
      if (charIdx >= line.text.length) {
        clearInterval(interval)
        setTyping(false)
      }
    }, 45)

    return () => clearInterval(interval)
  }, [currentLine])

  // Auto-advance after pause (or on click)
  useEffect(() => {
    if (typing || currentLine < 0 || currentLine >= LINES.length) return

    const t = setTimeout(() => {
      if (currentLine < LINES.length - 1) {
        setCurrentLine(prev => prev + 1)
      }
    }, LINES[currentLine].pause)

    return () => clearTimeout(t)
  }, [typing, currentLine])

  const handleAdvance = useCallback(() => {
    if (typing) return

    if (currentLine >= LINES.length - 1) {
      setFadeOut(true)
      localStorage.setItem(STORAGE_KEY, '1')
      setTimeout(onComplete, 600)
    } else {
      setCurrentLine(prev => prev + 1)
    }
  }, [typing, currentLine, onComplete])

  const handleSkip = useCallback(() => {
    setFadeOut(true)
    localStorage.setItem(STORAGE_KEY, '1')
    setTimeout(onComplete, 400)
  }, [onComplete])

  const isLastLine = currentLine >= LINES.length - 1 && !typing

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleAdvance}
      role="dialog"
      aria-label="Meet Ali"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full blur-[100px] transition-opacity duration-[2000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(255,229,102,0.25) 0%, rgba(255,145,164,0.15) 50%, transparent 70%)',
            opacity: aliVisible ? 1 : 0,
          }}
        />
      </div>

      {/* Ali */}
      <div
        className={`relative transition-all duration-[1200ms] ease-out ${aliVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <AliIcon size={120} className="ali-onboarding-float" />
      </div>

      {/* Text area */}
      <div className="relative mt-8 min-h-[120px] flex items-center justify-center px-6">
        <p
          className={`text-center text-lg md:text-xl font-medium leading-relaxed text-foreground whitespace-pre-line transition-opacity duration-300 ${currentLine >= 0 ? 'opacity-100' : 'opacity-0'}`}
        >
          {displayedText}
          {typing && <span className="ali-cursor">|</span>}
        </p>
      </div>

      {/* Sparkle / CTA */}
      <div
        className={`mt-8 transition-all duration-500 ${isLastLine ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <span className="text-sm text-primary font-medium tracking-wide">
          I'll be right here.
        </span>
      </div>

      {/* Tap hint */}
      <p
        className={`absolute bottom-8 text-xs text-muted-foreground transition-opacity duration-500 ${currentLine >= 0 && !typing ? 'opacity-60' : 'opacity-0'}`}
      >
        {isLastLine ? 'Tap anywhere to begin' : 'Tap to continue'}
      </p>

      {/* Skip */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSkip() }}
        className="absolute top-6 right-6 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        Skip
      </button>
    </div>
  )
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(STORAGE_KEY)
}
