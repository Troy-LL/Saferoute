import { Link } from 'react-router-dom'
import './HomePage.css'

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Safety-Scored Routes',
    desc: 'Get multiple route options ranked by safety score using real-time crime pattern analysis and well-lit corridor data.'
  },
  {
    icon: '🔥',
    title: 'Live Crime Heatmap',
    desc: 'See crime hotspots overlaid on Metro Manila in real time. Know which areas to avoid before you even step outside.'
  },
  {
    icon: '🛡️',
    title: 'Safe Spot Waypoints',
    desc: 'Routes pass through police stations, 24/7 convenience stores, and security posts so you\'re never far from help.'
  },
  {
    icon: '🆘',
    title: 'Buddy Alert System',
    desc: 'Share your route with a trusted contact via SMS. If something feels wrong, trigger a one-tap emergency alert.'
  },
  {
    icon: '⏰',
    title: 'Time-Aware Safety',
    desc: 'Safety scores adjust by time of day. A route that\'s safe at noon can be risky at midnight — SafeRoute knows the difference.'
  },
  {
    icon: '📍',
    title: 'Metro Manila Coverage',
    desc: 'Built for Philippine conditions. Covers all 17 cities of Metro Manila with locally relevant incident data.'
  }
]

const STATS = [
  { value: '500+', label: 'Incidents Mapped' },
  { value: '60+', label: 'Safe Spots Marked' },
  { value: '3', label: 'Route Alternatives' },
  { value: '24/7', label: 'Real-Time Updates' }
]

export default function HomePage() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
        </div>
        <div className="hero-content">
          <div className="hero-badge badge badge-green animate-in">
            🇵🇭 Built for Metro Manila
          </div>
          <h1 className="hero-title animate-in">
            Navigate the City<br/>
            <span className="hero-accent">Without Fear</span>
          </h1>
          <p className="hero-desc animate-in">
            SafeRoute uses crime pattern data and AI-powered routing to help you walk<br/>
            safely in Metro Manila — especially at night.
          </p>
          <div className="hero-actions animate-in">
            <Link to="/map" className="btn btn-primary btn-lg" id="hero-cta">
              🗺️ Start Safe Route
            </Link>
            <Link to="/about" className="btn btn-glass btn-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        {STATS.map(s => (
          <div key={s.label} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2>Everything You Need to Walk Safe</h2>
            <p>A complete safety toolkit designed for Philippine urban realities</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card glass-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="how-container">
          <div className="section-header">
            <h2>How SafeRoute Works</h2>
            <p>Three simple steps to a safer walk</p>
          </div>
          <div className="steps">
            {[
              { n: '1', emoji: '📍', title: 'Enter Your Route', desc: 'Type your start and end location anywhere in Metro Manila.' },
              { n: '2', emoji: '🏃', title: 'Compare Routes', desc: 'Get 3 route options scored by safety, distance, and travel time.' },
              { n: '3', emoji: '🆘', title: 'Walk with Confidence', desc: 'Pass through safe waypoints and alert a buddy before you go.' }
            ].map(step => (
              <div key={step.n} className="step-card">
                <div className="step-number">{step.n}</div>
                <div className="step-icon">{step.emoji}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to Walk Safer?</h2>
          <p>Join thousands navigating Metro Manila with confidence</p>
          <Link to="/map" className="btn btn-primary btn-lg" style={{ animationDelay: '0.1s' }}>
            🛡️ Get My Safe Route Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>🛡️ SafeRoute · Built for ASEAN Challenge 2025 · Open Source</p>
        <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Data is synthetic demo data. Not a substitute for personal safety judgment.
        </p>
      </footer>
    </div>
  )
}
