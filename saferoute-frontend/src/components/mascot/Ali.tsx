import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

/* ─── Shared palette ─── */
const PINK_BODY = '#F08090'
const PINK_HEAD = '#EE7B8B'
const PINK_DARK = '#D96B7A'
const PINK_LIGHT = '#F4A0AD'
const PEACH_TIP = '#F0A898'
const WING_FILL = '#F8C8D0'
const WING_OPACITY = 0.45
const CHEEK = '#E86880'
const GLOW_WARM = '#FFE566'
const GLOW_LIME = '#C8FF00'
const ABDOMEN_GLOW_LIGHT = '#FFD54F'

/* ─────────────────────────────────────────────
   AliIcon — full mascot illustration (front-facing)
   Default 40×40, used as chatbot/mascot icon
   ───────────────────────────────────────────── */
interface AliIconProps {
  size?: number
  className?: string
}

export function AliIcon({ size = 40, className }: AliIconProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ali the firefly, ALAITAPTAP mascot"
      className={cn('ali-mascot', className)}
    >
      <defs>
        <radialGradient id="ali-abdomen-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GLOW_WARM} stopOpacity="0.9" />
          <stop offset="70%" stopColor={ABDOMEN_GLOW_LIGHT} stopOpacity="0.5" />
          <stop offset="100%" stopColor={ABDOMEN_GLOW_LIGHT} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ali-head-grad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={PINK_LIGHT} />
          <stop offset="100%" stopColor={PINK_HEAD} />
        </radialGradient>
        <radialGradient id="ali-body-grad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={PINK_LIGHT} />
          <stop offset="100%" stopColor={PINK_BODY} />
        </radialGradient>
      </defs>

      {/* Wings */}
      <ellipse cx="25" cy="48" rx="18" ry="24" fill={WING_FILL} opacity={WING_OPACITY} transform="rotate(-15 25 48)" />
      <ellipse cx="75" cy="48" rx="18" ry="24" fill={WING_FILL} opacity={WING_OPACITY} transform="rotate(15 75 48)" />

      {/* Abdomen glow (dark mode animated, light mode static) */}
      <ellipse
        cx="50"
        cy="95"
        rx="22"
        ry="20"
        fill="url(#ali-abdomen-glow)"
        className={isDark ? 'ali-glow-pulse' : undefined}
        opacity={isDark ? 1 : 0.3}
      />

      {/* Abdomen (tail segment) */}
      <ellipse
        cx="50"
        cy="90"
        rx="16"
        ry="14"
        fill={isDark ? GLOW_WARM : PINK_BODY}
        className={isDark ? 'ali-glow-pulse' : undefined}
      />

      {/* Body */}
      <ellipse cx="50" cy="70" rx="20" ry="22" fill="url(#ali-body-grad)" />

      {/* Head */}
      <circle cx="50" cy="38" r="24" fill="url(#ali-head-grad)" />

      {/* Antennae */}
      <path d="M42 18 Q38 4, 34 2" stroke={PINK_DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="2" r="4" fill={PEACH_TIP} />
      <path d="M58 18 Q62 4, 66 2" stroke={PINK_DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="66" cy="2" r="4" fill={PEACH_TIP} />

      {/* Eyes (happy crescents) */}
      <path d="M39 36 Q42 42, 45 36" stroke="#5A3040" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M55 36 Q58 42, 61 36" stroke="#5A3040" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <circle cx="36" cy="43" r="4" fill={CHEEK} opacity="0.4" />
      <circle cx="64" cy="43" r="4" fill={CHEEK} opacity="0.4" />

      {/* Mouth */}
      <path d="M46 47 Q50 51, 54 47" stroke="#5A3040" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Arms */}
      <path d="M32 65 Q26 72, 30 78" stroke={PINK_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M68 65 Q74 72, 70 78" stroke={PINK_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Feet */}
      <ellipse cx="42" cy="92" rx="5" ry="3" fill={PINK_DARK} />
      <ellipse cx="58" cy="92" rx="5" ry="3" fill={PINK_DARK} />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   AliSilhouette — single-color filled silhouette (side profile)
   Default 32×32, uses currentColor, for app logo mark
   ───────────────────────────────────────────── */
interface AliSilhouetteProps {
  size?: number
  className?: string
}

export function AliSilhouette({ size = 32, className }: AliSilhouetteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Side-profile silhouette of Ali — traced from App logo.png
          Wings to the left, head+body to the right, antennae at top-right */}
      <path d="
        M66 8 Q62 4, 60 6 Q58 10, 62 16
        M72 4 Q70 0, 68 2 Q66 6, 70 14
        M68 16
        C80 14, 90 22, 88 36
        C86 32, 84 42, 78 46
        C84 52, 82 62, 74 68
        C70 74, 66 78, 62 82
        C58 86, 54 84, 52 78
        C48 82, 42 80, 38 72
        C34 68, 26 62, 18 54
        C10 46, 6 36, 14 26
        C18 20, 28 22, 34 28
        C38 32, 42 36, 46 38
        C44 32, 46 24, 52 18
        C56 14, 62 14, 68 16
        Z
      " fillRule="evenodd" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   AliPointer — top-down navigation pointer for map
   Based on "Ali Facing Back" — head at top, wings spread, glowing tail below.
   Accepts heading (0-360°) and isMoving for animation speed control.
   ───────────────────────────────────────────── */
interface AliPointerProps {
  heading?: number
  isMoving?: boolean
  size?: number
  className?: string
}

export function AliPointer({ heading = 0, isMoving = false, size = 48, className }: AliPointerProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const glowClass = isDark
    ? isMoving ? 'ali-glow-active' : 'ali-glow-idle'
    : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Your current location"
      className={cn('ali-pointer', className)}
      style={{
        transform: `rotate(${heading}deg)`,
        transition: 'transform 200ms ease-out',
      }}
    >
      <defs>
        <radialGradient id="ali-ptr-glow" cx="50%" cy="65%" r="40%">
          <stop offset="0%" stopColor={GLOW_WARM} stopOpacity="0.9" />
          <stop offset="100%" stopColor={GLOW_LIME} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ali-ptr-head" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor={PINK_LIGHT} />
          <stop offset="100%" stopColor={PINK_HEAD} />
        </radialGradient>
      </defs>

      {/* Wings spread — viewed from above */}
      <ellipse cx="15" cy="50" rx="14" ry="22" fill={WING_FILL} opacity={WING_OPACITY} transform="rotate(-10 15 50)" />
      <ellipse cx="65" cy="50" rx="14" ry="22" fill={WING_FILL} opacity={WING_OPACITY} transform="rotate(10 65 50)" />

      {/* Abdomen glow aura */}
      <ellipse cx="40" cy="78" rx="18" ry="16" fill="url(#ali-ptr-glow)" className={glowClass} opacity={isDark ? 1 : 0.2} />

      {/* Abdomen (tail) */}
      <ellipse cx="40" cy="74" rx="14" ry="12" fill={isDark ? GLOW_WARM : PINK_BODY} className={glowClass} />

      {/* Body */}
      <ellipse cx="40" cy="54" rx="18" ry="20" fill={PINK_BODY} />

      {/* Head */}
      <circle cx="40" cy="26" r="20" fill="url(#ali-ptr-head)" />

      {/* Antennae */}
      <path d="M34 10 Q30 -2, 28 -4" stroke={PINK_DARK} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="28" cy="-4" r="3.5" fill={PEACH_TIP} />
      <path d="M46 10 Q50 -2, 52 -4" stroke={PINK_DARK} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="-4" r="3.5" fill={PEACH_TIP} />

      {/* Directional indicator — subtle triangle pointing up (forward) */}
      <polygon points="40,0 36,8 44,8" fill={isDark ? GLOW_WARM : PINK_DARK} opacity="0.6" />
    </svg>
  )
}

/* Utility: render AliPointer to static markup for Leaflet DivIcon */
export function renderAliPointerHTML(heading: number, isMoving: boolean, isDark: boolean, size = 48): string {
  const glowClass = isDark
    ? isMoving ? 'ali-glow-active' : 'ali-glow-idle'
    : ''

  return `<svg width="${size}" height="${size}" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your current location" style="transform:rotate(${heading}deg);transition:transform 200ms ease-out;">
    <defs>
      <radialGradient id="ali-ptr-glow-l" cx="50%" cy="65%" r="40%">
        <stop offset="0%" stop-color="${GLOW_WARM}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${GLOW_LIME}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ali-ptr-head-l" cx="40%" cy="35%" r="55%">
        <stop offset="0%" stop-color="${PINK_LIGHT}"/>
        <stop offset="100%" stop-color="${PINK_HEAD}"/>
      </radialGradient>
    </defs>
    <ellipse cx="15" cy="50" rx="14" ry="22" fill="${WING_FILL}" opacity="${WING_OPACITY}" transform="rotate(-10 15 50)"/>
    <ellipse cx="65" cy="50" rx="14" ry="22" fill="${WING_FILL}" opacity="${WING_OPACITY}" transform="rotate(10 65 50)"/>
    <ellipse cx="40" cy="78" rx="18" ry="16" fill="url(#ali-ptr-glow-l)" class="${glowClass}" opacity="${isDark ? 1 : 0.2}"/>
    <ellipse cx="40" cy="74" rx="14" ry="12" fill="${isDark ? GLOW_WARM : PINK_BODY}" class="${glowClass}"/>
    <ellipse cx="40" cy="54" rx="18" ry="20" fill="${PINK_BODY}"/>
    <circle cx="40" cy="26" r="20" fill="url(#ali-ptr-head-l)"/>
    <path d="M34 10 Q30 -2, 28 -4" stroke="${PINK_DARK}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="28" cy="-4" r="3.5" fill="${PEACH_TIP}"/>
    <path d="M46 10 Q50 -2, 52 -4" stroke="${PINK_DARK}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="52" cy="-4" r="3.5" fill="${PEACH_TIP}"/>
    <polygon points="40,0 36,8 44,8" fill="${isDark ? GLOW_WARM : PINK_DARK}" opacity="0.6"/>
  </svg>`
}
