import { Link } from 'react-router-dom'
import {
  Map,
  Flame,
  Shield,
  Siren,
  Clock,
  MapPin,
  Route,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BrandName } from '@/components/BrandName'
import { AliIcon } from '@/components/mascot/Ali'
import PhoneDemo from '@/components/PhoneDemo'
import appLogoUrl from '../../images/App logo.png'

const FEATURES = [
  {
    icon: Map,
    title: 'Safety-Scored Routes',
    desc: 'Get multiple route options ranked by safety score using real-time crime pattern analysis and well-lit corridor data.',
  },
  {
    icon: Flame,
    title: 'Live Crime Heatmap',
    desc: 'See crime hotspots overlaid on Metro Manila in real time. Know which areas to avoid before you even step outside.',
  },
  {
    icon: Shield,
    title: 'Safe Spot Waypoints',
    desc: "Routes pass through police stations, 24/7 convenience stores, and security posts so you're never far from help.",
  },
  {
    icon: Siren,
    title: 'Buddy Alert System',
    desc: 'Share your route with a trusted contact via SMS. If something feels wrong, trigger a one-tap emergency alert.',
  },
  {
    icon: Clock,
    title: 'Time-Aware Safety',
    desc: "Safety scores adjust by time of day. A route that's safe at noon can be risky at midnight — ALAITAPTAP knows the difference.",
  },
  {
    icon: MapPin,
    title: 'Metro Manila Coverage',
    desc: 'Built for Philippine conditions. Covers all 17 cities of Metro Manila with locally relevant incident data.',
  },
]

const STATS = [
  { value: '2,000+', label: 'Incidents Mapped' },
  { value: '150+', label: 'Safe Spots Marked' },
  { value: '5+', label: 'Smart Route Options' },
  { value: '24/7', label: 'Real-Time Updates' },
]

const STEPS = [
  {
    n: 1,
    icon: MapPin,
    title: 'Enter Your Route',
    desc: 'Type your start and end location anywhere in Metro Manila.',
  },
  {
    n: 2,
    icon: Route,
    title: 'Compare Routes',
    desc: 'Compare five or more route options scored by safety, distance, and travel time.',
  },
  {
    n: 3,
    icon: ShieldCheck,
    title: 'Walk with Confidence',
    desc: 'Pass through safe waypoints and alert a buddy before you go.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(255, 145, 164, 0.25)' }} />
          <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(255, 193, 204, 0.30)' }} />
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-[80px]" style={{ background: 'rgba(255, 145, 164, 0.15)' }} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — text content */}
          <div className="text-center lg:text-left">
            <div className="mb-6 ali-onboarding-float inline-block">
              <AliIcon size={80} />
            </div>

            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-primary/30 bg-primary/5 px-3 py-1 text-sm text-primary"
            >
              <MapPin className="size-3.5" />
              Built for Metro Manila
            </Badge>

            <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
              Navigate the City
              <br />
              <span className="text-primary">Without Fear</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              ALAITAPTAP uses crime pattern data and AI-powered routing to help you
              walk safely in Metro Manila — especially at night.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="gap-2 text-base">
                <Link to="/map">
                  <Map className="size-4" />
                  Start Safe Route
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 text-base">
                <a href="#features">
                  Learn More
                  <ChevronRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right — interactive phone demo */}
          <div className="hidden lg:flex justify-center">
            <PhoneDemo />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              Everything You Need to Walk Safe
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              A complete safety toolkit designed for Philippine urban realities
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="cursor-pointer border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              How <BrandName className="inline font-bold text-3xl md:text-5xl" /> Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Three simple steps to a safer walk
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-16 hidden h-px bg-border md:block"
            />

            {STEPS.map((step) => (
              <div key={step.n} className="relative text-center">
                <div className="relative z-10 mx-auto mb-4 flex h-10 w-10 items-center justify-center">
                  <Badge className="h-8 w-8 rounded-full text-sm font-bold">
                    {step.n}
                  </Badge>
                </div>

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="size-7 text-primary" />
                </div>

                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-card p-12 text-center border border-border">
          {/* Subtle warm glow behind Ali */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[200px] rounded-full blur-[60px]"
            style={{ background: 'radial-gradient(circle, rgba(255,229,102,0.2) 0%, transparent 70%)' }}
          />

          <div className="relative">
            <div className="mx-auto mb-4 ali-onboarding-float">
              <AliIcon size={56} />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              You Don't Have to Walk Alone
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground italic">
              Whenever you're unsure... just follow the light.
            </p>
            <Button asChild size="lg" className="mt-8 gap-2 text-base">
              <Link to="/map">
                Walk With Ali
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 py-12">
        <div className="mx-auto max-w-7xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-foreground">
            <img
              src={appLogoUrl}
              alt=""
              width={20}
              height={20}
              decoding="async"
              draggable={false}
              className="size-5 shrink-0 object-contain"
              aria-hidden
            />
            <BrandName className="inline font-medium text-sm" />
            <span className="text-muted-foreground">
              &middot; 2026 ASEAN AI Youth Challenge &middot; Open Source
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Data is synthetic demo data. Not a substitute for personal safety
            judgment.
          </p>
        </div>
      </footer>
    </div>
  )
}
