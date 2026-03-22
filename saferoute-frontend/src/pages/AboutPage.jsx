import './AboutPage.css'

const TEAM = [
  { name: 'SafeRoute Team', role: 'ASEAN Challenge 2025', emoji: '🧑‍💻' }
]

export default function AboutPage() {
  return (
    <div className="about">
      <div className="about-container">

        <header className="about-header">
          <h1>About SafeRoute</h1>
          <p className="header-sub">A pedestrian safety platform built for Metro Manila</p>
        </header>

        <section className="about-section glass-card">
          <h2>🎯 The Problem</h2>
          <p>
            Metro Manila ranks among the most dangerous cities in Southeast Asia for pedestrians.
            Snatching, mugging, and harassment remain common especially at night. Traditional
            navigation apps like Google Maps optimize for speed — but ignore safety.
          </p>
          <p>
            Women, students, and workers traveling alone have no tool to plan which streets to
            walk, which areas to avoid after dark, or who to alert if things go wrong.
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>💡 Our Solution</h2>
          <p>
            SafeRoute is an AI-powered pedestrian safety navigator that ranks walking routes
            by a composite <strong>Safety Score</strong> combining:
          </p>
          <ul className="about-list">
            <li>🚨 <strong>Crime incident density</strong> — weighted by recency and severity</li>
            <li>💡 <strong>Street lighting</strong> — bright corridors score higher at night</li>
            <li>🏪 <strong>Safe waypoints</strong> — routes through police stations, convenience stores</li>
            <li>👥 <strong>Foot traffic presence</strong> — populated streets are safer</li>
            <li>⏰ <strong>Time-of-day adjustment</strong> — safety scores shift dynamically</li>
          </ul>
        </section>

        <section className="about-section glass-card">
          <h2>⚙️ How We Built It</h2>
          <div className="tech-grid">
            {[
              { icon: '🗄️', name: 'FastAPI', desc: 'Python REST API backend' },
              { icon: '🤖', name: 'scikit-learn', desc: 'Safety score ML model' },
              { icon: '🗺️', name: 'OpenRouteService', desc: 'Real walking directions' },
              { icon: '⚛️', name: 'React + Vite', desc: 'Frontend SPA' },
              { icon: '🌿', name: 'Leaflet.js', desc: 'Interactive dark map' },
              { icon: '📱', name: 'Twilio SMS', desc: 'Emergency buddy alerts' },
              { icon: '🐘', name: 'PostgreSQL', desc: 'Incident & spot data' },
              { icon: '📊', name: 'CartoDB Dark', desc: 'Dark map tile layer' },
            ].map(t => (
              <div key={t.name} className="tech-card">
                <span className="tech-icon">{t.icon}</span>
                <div>
                  <div className="tech-name">{t.name}</div>
                  <div className="tech-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section glass-card">
          <h2>📊 Safety Score Algorithm</h2>
          <p>Each route is scored 0–100 using a weighted formula:</p>
          <div className="formula-box">
            <code>
              SafetyScore = 100<br/>
              &nbsp;&nbsp;- crime_count × 4.0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(recent incidents)<br/>
              &nbsp;&nbsp;+ lit_ratio × 15 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(well-lit streets)<br/>
              &nbsp;&nbsp;+ safe_spot_count × 3.0 (nearby safe spots)<br/>
              &nbsp;&nbsp;+ foot_traffic × 10 &nbsp;&nbsp;&nbsp;(busy corridors)<br/>
              &nbsp;&nbsp;- night_penalty &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(12-5am deduction)
            </code>
          </div>
        </section>

        <section className="about-section glass-card">
          <h2>⚠️ Disclaimer</h2>
          <p>
            This prototype uses <strong>synthetic demo data</strong> for demonstration purposes.
            In production, it would integrate with official PNP crime blotter APIs, MMDA data,
            and crowdsourced incident reports. SafeRoute is not a substitute for personal
            safety judgment. Always stay alert and trust your instincts.
          </p>
        </section>

        <footer className="about-footer">
          <p>🛡️ SafeRoute · Built for ASEAN Innovation Challenge 2025 · Open Source</p>
        </footer>

      </div>
    </div>
  )
}
