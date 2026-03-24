import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

/* ── Palette (matches app theme tokens) ── */
const C = {
  bg: '#1A1A1A',
  bgDeep: '#1E1E1E',
  bgSos: '#1A1A1A',
  card: '#242424',
  road: '#2E2E2E',
  border: 'rgba(255,255,255,0.07)',
  notch: '#111111',
  phoneBg: '#181818',
  primary: '#FF91A4',
  primaryGlow: '#FFC1CC',
  primaryA: (a: number) => `rgba(255,145,164,${a})`,
  safe: '#22c55e',
  safeA: (a: number) => `rgba(34,197,94,${a})`,
  danger: '#ef4444',
  dangerA: (a: number) => `rgba(239,68,68,${a})`,
  warning: '#f59e0b',
  warningA: (a: number) => `rgba(245,158,11,${a})`,
  text: '#F7F8FC',
  textSub: 'rgba(247,248,252,0.5)',
  textMuted: 'rgba(247,248,252,0.3)',
  bgA: (a: number) => `rgba(26,26,26,${a})`,
  cardA: (a: number) => `rgba(36,36,36,${a})`,
} as const

const SCENES = [
  { id: 'home', label: 'Home / Idle', ali: { left: 46, top: 152 }, aliClass: '', duration: 4000 },
  { id: 'route', label: 'Route Selection', ali: { left: 42, top: 218 }, aliClass: '', duration: 4500 },
  { id: 'nav', label: 'Active Navigation', ali: { left: 148, top: 396 }, aliClass: '', duration: 4500 },
  { id: 'risk', label: 'Risk Alert', ali: { left: 136, top: 342 }, aliClass: 'phone-ali-risk', duration: 4000 },
  { id: 'sos', label: 'SOS / Emergency', ali: { left: 142, top: 236 }, aliClass: 'phone-ali-sos', duration: 4200 },
] as const

const gridBg = (base: string) => `
  repeating-linear-gradient(0deg, transparent, transparent 34px, rgba(255,255,255,0.08) 34px, rgba(255,255,255,0.08) 35px),
  repeating-linear-gradient(90deg, transparent, transparent 34px, rgba(255,255,255,0.08) 34px, rgba(255,255,255,0.08) 35px),
  ${base}`

function StatusBar({ variant }: { variant?: 'sos' }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-12 flex items-end justify-between px-6 pb-1.5 z-[100] text-[11px] font-medium"
      style={{
        color: variant === 'sos' ? C.dangerA(0.6) : 'rgba(255,255,255,0.6)',
        background: `linear-gradient(to bottom, ${C.bgA(0.9)} 0%, transparent 100%)`,
      }}
    >
      <span>22:14</span>
      <span>●●●</span>
    </div>
  )
}

function SceneHome() {
  return (
    <div className="absolute inset-0" style={{ background: C.bg }}>
      <div className="absolute inset-0 opacity-40" style={{ background: gridBg(C.bg) }} />

      {[195, 375].map((t) => (
        <div key={`h${t}`} className="absolute left-0 right-0 h-9" style={{ top: t, background: C.road }} />
      ))}
      {[115, 218].map((l) => (
        <div key={`v${l}`} className="absolute top-0 bottom-0 w-9" style={{ left: l, background: C.road }} />
      ))}

      {[
        { top: 96, left: 18, w: 85, h: 85 },
        { top: 96, left: 162, w: 134, h: 85 },
        { top: 242, left: 18, w: 85, h: 118 },
        { top: 242, left: 162, w: 134, h: 118 },
        { top: 422, left: 18, w: 85, h: 80 },
        { top: 422, left: 162, w: 134, h: 80 },
      ].map((b, i) => (
        <div
          key={i}
          className="absolute rounded-[3px]"
          style={{ top: b.top, left: b.left, width: b.w, height: b.h, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        />
      ))}

      {[
        { top: 118, left: 38, o: 0.5 }, { top: 132, left: 58, o: 0.3 },
        { top: 112, left: 198, o: 0.55 }, { top: 138, left: 238, o: 0.4 },
        { top: 268, left: 48, o: 0.5 }, { top: 288, left: 192, o: 0.6 },
        { top: 438, left: 28, o: 0.45 }, { top: 448, left: 218, o: 0.5 },
      ].map((l, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full"
          style={{ top: l.top, left: l.left, opacity: l.o, background: C.primaryGlow }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to bottom, ${C.bgA(0.5)} 0%, transparent 35%, transparent 55%, ${C.bgA(0.95)} 100%)` }}
      />

      <div className="phone-demo-bubble" style={{ position: 'absolute', bottom: 192, left: 48 }}>
        Where are you going?<br />I'll help you get there safely.
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 pb-9 pt-6">
        <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>
          Good evening.
        </div>
        <div style={{ fontSize: 12, color: C.textSub, marginBottom: 20, letterSpacing: '0.02em' }}>
          Ali is ready to guide you.
        </div>
        <div
          className="flex items-center gap-2.5 rounded-[14px] px-4 py-3.5"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13 }}
        >
          <div
            className="relative shrink-0"
            style={{ width: 16, height: 16, border: `1.5px solid ${C.textMuted}`, borderRadius: '50%' }}
          >
            <div className="absolute" style={{ bottom: -4, right: -4, width: 6, height: 1.5, background: C.textMuted, transform: 'rotate(45deg)' }} />
          </div>
          Where are you headed?
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

function SceneRoute() {
  return (
    <div className="absolute inset-0" style={{ background: C.bg }}>
      <div className="absolute top-12 left-0 right-0 h-64 overflow-hidden">
        <div className="absolute inset-0 opacity-35" style={{ background: gridBg(C.bg) }} />
        <div className="absolute left-0 right-0 h-9" style={{ top: 88, background: C.road }} />
        <div className="absolute left-0 right-0 h-9" style={{ top: 178, background: C.road }} />
        <div className="absolute top-0 bottom-0 w-9" style={{ left: 98, background: C.road }} />
        <div className="absolute top-0 bottom-0 w-9" style={{ left: 208, background: C.road }} />

        <svg className="absolute inset-0" viewBox="0 0 320 256" fill="none">
          <path d="M 58 230 L 58 178 L 208 178 L 208 88 L 278 88" stroke={C.safe} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
          <path d="M 58 230 L 58 178 L 208 178 L 208 88 L 278 88" stroke={C.safe} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          <path d="M 58 230 L 98 230 L 98 88 L 278 88" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" strokeDasharray="6 5" />
          <circle cx="58" cy="230" r="5" fill="white" stroke={C.primary} strokeWidth="2" />
          <circle cx="278" cy="88" r="11" fill={C.primaryA(0.12)} />
          <circle cx="278" cy="88" r="5" fill={C.primary} />
        </svg>

        <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: `linear-gradient(to bottom, transparent, ${C.bg})` }} />
      </div>

      <StatusBar />

      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl px-[18px] pt-[18px] pb-8"
        style={{ background: C.bgDeep, borderTop: `1px solid ${C.border}` }}
      >
        <div className="mx-auto mb-4 h-[3px] w-9 rounded-sm" style={{ background: C.border }} />
        <div className="mb-3 text-[11px] uppercase tracking-[0.1em]" style={{ color: C.textMuted }}>
          Choose your route
        </div>

        {/* Recommended route */}
        <div
          className="relative mb-2 flex items-center gap-3 overflow-hidden rounded-[14px] p-3.5"
          style={{ background: `linear-gradient(135deg, ${C.primaryA(0.06)}, ${C.card})`, border: `1px solid ${C.primaryA(0.3)}` }}
        >
          <div className="absolute top-2 right-2.5 text-[8px] font-medium tracking-[0.12em] opacity-80" style={{ color: C.primaryGlow }}>
            ALI RECOMMENDS
          </div>
          <div className="size-2.5 shrink-0 rounded-full" style={{ background: C.safe, boxShadow: `0 0 8px ${C.safeA(0.25)}` }} />
          <div className="flex-1">
            <div className="text-[13px] font-medium" style={{ color: C.text }}>Via España Blvd.</div>
            <div className="text-[11px]" style={{ color: C.textSub }}>18 min · 1.4 km · well-lit</div>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: C.safeA(0.1), color: C.safe, border: `1px solid ${C.safeA(0.2)}` }}
          >
            Safest
          </span>
        </div>

        {/* Fast route */}
        <div
          className="mb-2 flex items-center gap-3 rounded-[14px] p-3.5"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="size-2.5 shrink-0 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
          <div className="flex-1">
            <div className="text-[13px] font-medium" style={{ color: C.text }}>Via Legarda St.</div>
            <div className="text-[11px]" style={{ color: C.textSub }}>13 min · 1.1 km · less active</div>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: C.textSub, border: `1px solid ${C.border}` }}
          >
            Fastest
          </span>
        </div>

        <div
          className="mt-2 rounded-r-[10px] py-2 pr-2.5 pl-2.5 text-[11px] italic"
          style={{ background: C.primaryA(0.05), borderLeft: `2px solid ${C.primary}`, color: C.textSub }}
        >
          ✦ "This route passes by open establishments and has more people around."
        </div>
      </div>
    </div>
  )
}

function SceneNav() {
  return (
    <div className="absolute inset-0" style={{ background: C.bg }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30" style={{ background: gridBg(C.bg) }} />
        <div className="absolute left-0 right-0 h-10" style={{ top: 185, background: C.road }} />
        <div className="absolute left-0 right-0 h-10" style={{ top: 375, background: C.road }} />
        <div className="absolute top-0 bottom-0 w-10" style={{ left: 138, background: C.road }} />
        <div className="absolute top-0 bottom-0 w-10" style={{ left: 258, background: C.road }} />

        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 320 640" fill="none">
          <path d="M 158 580 L 158 375 L 258 375 L 258 185 L 198 185" stroke={C.primary} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
          <path d="M 158 580 L 158 375 L 258 375 L 258 185 L 198 185" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" className="phone-demo-path-draw" />
          <path d="M 158 450 L 158 375 L 258 375 L 258 280" stroke={C.primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>

        <div
          className="absolute z-10"
          style={{
            left: 150, top: 442, width: 16, height: 16,
            background: '#fff', border: `3px solid ${C.primary}`, borderRadius: '50%',
            boxShadow: `0 0 16px ${C.primaryA(0.3)}`,
          }}
        />

        {[
          { top: 205, left: 18, w: 108, h: 158 },
          { top: 40, left: 18, w: 108, h: 132 },
          { top: 205, left: 280, w: 28, h: 158 },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute rounded-[3px]"
            style={{ top: b.top, left: b.left, width: b.w, height: b.h, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          />
        ))}
      </div>

      {/* Turn card */}
      <div
        className="absolute top-14 left-4 right-4 flex items-center gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: C.cardA(0.93), border: `1px solid ${C.border}`, backdropFilter: 'blur(10px)' }}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: C.primary }}>
          <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: `13px solid ${C.bg}` }} />
        </div>
        <div>
          <div className="text-[15px] font-medium" style={{ color: C.text }}>Turn right</div>
          <div className="text-[11px]" style={{ color: C.textSub }}>onto España Blvd.</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-light" style={{ color: C.primary }}>80</div>
          <div className="text-[10px]" style={{ color: C.textMuted }}>meters</div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center gap-3.5 px-5 pt-4 pb-9"
        style={{ background: C.bgA(0.96), borderTop: `1px solid ${C.border}`, backdropFilter: 'blur(10px)' }}
      >
        <div className="flex-1">
          <div className="text-[22px] font-light" style={{ color: C.text }}>12 min</div>
          <div className="text-[11px]" style={{ color: C.textMuted }}>estimated arrival</div>
        </div>
        <div className="flex-1">
          <div className="text-[11px]" style={{ color: C.textMuted, marginBottom: 3 }}>Via España Blvd.</div>
          <div className="text-[11px]" style={{ color: C.textSub }}>0.9 km remaining</div>
        </div>
        <div className="flex flex-col items-center">
          <div
            className="flex size-11 items-center justify-center rounded-full text-[13px] font-medium"
            style={{ border: `2px solid ${C.safe}`, color: C.safe, boxShadow: `0 0 12px ${C.safeA(0.25)}` }}
          >
            87
          </div>
          <div className="mt-0.5 text-center text-[9px] uppercase tracking-[0.06em]" style={{ color: C.textMuted }}>
            Safety
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

function SceneRisk() {
  return (
    <div className="absolute inset-0" style={{ background: C.bg }}>
      <div className="absolute inset-0 opacity-20" style={{ background: gridBg(C.bg) }} />
      <div className="absolute left-0 right-0 h-10" style={{ top: 195, background: C.road }} />
      <div className="absolute top-0 bottom-0 w-10" style={{ left: 148, background: C.road }} />

      <div
        className="absolute rounded-full"
        style={{ width: 200, height: 200, top: 160, left: 48, background: `radial-gradient(circle, ${C.dangerA(0.15)} 0%, transparent 70%)` }}
      />
      <div
        className="absolute rounded-full opacity-70"
        style={{ width: 140, height: 140, top: 195, left: 90, background: `radial-gradient(circle, ${C.dangerA(0.15)} 0%, transparent 70%)` }}
      />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 640" fill="none">
        <path d="M 148 580 L 148 195 L 278 195" stroke={C.dangerA(0.4)} strokeWidth="2.5" strokeDasharray="7 5" strokeLinecap="round" />
      </svg>

      <div
        className="absolute z-10"
        style={{
          left: 140, top: 378, width: 16, height: 16,
          background: '#fff', border: `3px solid ${C.danger}`, borderRadius: '50%',
          boxShadow: `0 0 16px ${C.dangerA(0.25)}`,
        }}
      />

      {/* Risk banner */}
      <div
        className="absolute top-14 left-4 right-4 flex items-center gap-2.5 rounded-[14px] px-3.5 py-3"
        style={{ background: C.dangerA(0.08), border: `1px solid ${C.dangerA(0.25)}`, backdropFilter: 'blur(10px)' }}
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[13px]"
          style={{ background: C.dangerA(0.15), border: `1px solid ${C.dangerA(0.3)}` }}
        >
          ⚠
        </div>
        <div>
          <div className="text-[13px] font-medium" style={{ color: C.danger }}>Low activity area ahead</div>
          <div className="text-[11px]" style={{ color: C.textSub }}>Fewer people on this street right now</div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-[18px] pt-4 pb-9"
        style={{ background: C.bgA(0.97), borderTop: `1px solid ${C.border}`, backdropFilter: 'blur(10px)' }}
      >
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.08em]" style={{ color: C.textMuted }}>
          Ali suggests an alternative
        </div>
        <div
          className="mb-2 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
          style={{ background: C.safeA(0.08), border: `1px solid ${C.safeA(0.2)}` }}
        >
          <div className="size-2 shrink-0 rounded-full" style={{ background: C.safe, boxShadow: `0 0 8px ${C.safeA(0.25)}` }} />
          <div>
            <div className="text-[12.5px]" style={{ color: C.text }}>Reroute via Lacson Ave.</div>
            <div className="text-[10.5px]" style={{ color: C.textMuted }}>+3 min · more people · brighter</div>
          </div>
        </div>
        <div
          className="rounded-xl py-3 text-center text-xs"
          style={{ color: C.textMuted, border: `1px solid ${C.border}` }}
        >
          Continue on current route
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

function SceneSOS() {
  return (
    <div className="absolute inset-0" style={{ background: C.bgSos }}>
      <div
        className="absolute inset-0 phone-demo-sos-pulse"
        style={{ background: `radial-gradient(ellipse at 50% 45%, ${C.dangerA(0.12)} 0%, transparent 65%)` }}
      />

      <div className="absolute top-[60px] left-0 right-0 flex flex-col items-center px-5 text-center">
        <div className="phone-demo-sos-pulse relative mb-3.5 flex size-[72px] items-center justify-center rounded-full" style={{ border: `2px solid ${C.dangerA(0.5)}` }}>
          <div
            className="absolute -inset-2 rounded-full phone-demo-sos-pulse"
            style={{ border: `1px solid ${C.dangerA(0.2)}`, animationDelay: '0.3s' }}
          />
          <div
            className="absolute -inset-4 rounded-full phone-demo-sos-pulse"
            style={{ border: `1px solid ${C.dangerA(0.1)}`, animationDelay: '0.6s' }}
          />
          <div className="flex size-11 items-center justify-center rounded-full text-xl" style={{ background: C.dangerA(0.15) }}>
            🛡
          </div>
        </div>
        <div className="mb-1.5 text-[17px] font-medium" style={{ color: C.text }}>Sending alert…</div>
        <div className="text-xs leading-relaxed" style={{ color: C.textSub, maxWidth: 220 }}>
          Your location has been shared.<br />Stay calm. Help is coming.
        </div>
      </div>

      <div className="absolute left-4 right-4" style={{ top: 262 }}>
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: C.textMuted }}>
          Emergency contacts notified
        </div>

        {[
          { initials: 'Ma', name: 'Mama', status: '+63 917 *** ****', badge: 'Notified ✓', blink: false },
          { initials: 'JK', name: 'Juan Kuya', status: '+63 998 *** ****', badge: 'Calling…', blink: true },
        ].map((c) => (
          <div
            key={c.name}
            className="mb-2 flex items-center gap-3 rounded-xl px-3.5 py-3"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div
              className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-xs font-medium"
              style={{ background: 'linear-gradient(135deg, #3a3a3a, #2a2a2a)', color: C.textSub }}
            >
              {c.initials}
            </div>
            <div>
              <div className="text-[13px]" style={{ color: C.text }}>{c.name}</div>
              <div className="text-[10.5px]" style={{ color: C.textMuted }}>{c.status}</div>
            </div>
            <div
              className={cn('ml-auto whitespace-nowrap rounded-full px-2 py-0.5 text-[10px]', c.blink && 'phone-demo-blink')}
              style={{ color: C.safe, background: C.safeA(0.1), border: `1px solid ${C.safeA(0.2)}` }}
            >
              {c.badge}
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-9 left-5 right-5 rounded-[14px] py-3.5 text-center text-[13px]"
        style={{ color: C.textSub, border: `1px solid ${C.border}`, background: C.card }}
      >
        Cancel SOS
      </div>

      <StatusBar variant="sos" />
    </div>
  )
}

function AliFirefly({ left, top, className }: { left: number; top: number; className: string }) {
  return (
    <div
      className={cn('absolute z-50 pointer-events-none', className)}
      style={{
        left, top,
        transition: 'left 1.8s cubic-bezier(0.4,0,0.2,1), top 1.8s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div className="phone-demo-ali-tail" />
      <div className="phone-demo-ali-core" />
    </div>
  )
}

export default function PhoneDemo() {
  const [current, setCurrent] = useState(0)

  const goTo = useCallback((idx: number) => {
    setCurrent(idx)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      goTo((current + 1) % SCENES.length)
    }, SCENES[current].duration)
    return () => clearTimeout(timer)
  }, [current, goTo])

  const scene = SCENES[current]

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative overflow-hidden"
        style={{
          width: 320, height: 640,
          background: C.phoneBg,
          borderRadius: 44,
          border: '1.5px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[200]"
          style={{ width: 90, height: 26, background: C.notch, borderRadius: 20 }}
        />

        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 43 }}>
          {[SceneHome, SceneRoute, SceneNav, SceneRisk, SceneSOS].map((Scene, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: current === i ? 1 : 0, pointerEvents: current === i ? 'auto' : 'none' }}
            >
              <Scene />
            </div>
          ))}

          <AliFirefly left={scene.ali.left} top={scene.ali.top} className={scene.aliClass} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className="transition-all duration-400 rounded-full cursor-pointer"
            style={{
              width: current === i ? 20 : 6,
              height: 6,
              background: current === i ? C.primary : 'rgba(255,255,255,0.2)',
            }}
            aria-label={`Go to ${s.label}`}
          />
        ))}
      </div>

      <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground text-center">
        {scene.label}
      </div>
    </div>
  )
}
