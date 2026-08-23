import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Navbar from '../components/Navbar';
import WebGLShader from '../components/WebGLShader';
import DemoModal from '../components/DemoModal';
import InfoModal from '../components/InfoModal';
import styles from './Landing.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function Section({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: '📊',
    title: 'Safety Score',
    desc: 'Real-time intelligence analyzing lighting, crime reports, and time-of-day danger to calculate your perfect route security.',
    color: 'var(--primary)',
    bg: 'var(--primary-container)',
  },
  {
    icon: '🔀',
    title: 'Fastest vs. Safest',
    desc: 'Compare time against tranquility. Choose the absolute fastest route or the one that guarantees maximum safety.',
    color: 'var(--secondary)',
    bg: 'var(--secondary-container)',
  },
  {
    icon: '👥',
    title: 'Community Signals',
    desc: 'Crowdsourced vigilance. Instantly report broken streetlights, suspicious activity, or hazards to keep everyone alert.',
    color: 'var(--tertiary)',
    bg: 'var(--tertiary-container)',
  },
  {
    icon: '🚨',
    title: 'SOS Alert',
    desc: 'Instant crisis response. A single tap broadcasts your live GPS location and alert to emergency contacts instantly.',
    color: 'var(--error)',
    bg: 'var(--error-container)',
  },
  {
    icon: '📍',
    title: 'Live Tracking',
    desc: 'Guardian watch mode. Securely stream your real-time coordinates to trusted friends so they can walk you home virtually.',
    color: 'var(--primary)',
    bg: 'var(--primary-container)',
  },
  {
    icon: '📱',
    title: 'Installable PWA',
    desc: 'Native mobile experience. Save SafeRoute directly to your homescreen for instant access, offline maps, and lightweight execution.',
    color: 'var(--tertiary)',
    bg: 'var(--tertiary-container)',
  },
];

const USER_TYPES = [
  { icon: '👩', label: 'Solo Women' },
  { icon: '🎓', label: 'Students' },
  { icon: '🌍', label: 'Tourists' },
  { icon: '🌙', label: 'Night Shift' },
  { icon: '🚌', label: 'Commuters' },
];

export default function Landing() {
  const [showDemo, setShowDemo] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.shaderWrapper}>
          <WebGLShader className={styles.shader} />
        </div>

        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroText}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.span variants={fadeUp} className={styles.badge}>
              <span className={styles.dot} />
              Now in Bhiwandi — Free, Open Source
            </motion.span>

            <motion.h1 variants={fadeUp} className={styles.headline}>
              The Shortest Path<br />
              isn't Always the{' '}
              <span className={styles.goldText}>Safest.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className={styles.subline}>
              SafeRoute ranks navigation routes by safety score — using incident reports,
              street lighting proxies, and time-of-day risk. Pick the path that actually
              keeps you safe.
            </motion.p>

            <motion.div variants={fadeUp} className={styles.ctas}>
              <Link to="/auth?mode=signup" className="btn btn-gold btn-lg">
                Start Your Safe Journey →
              </Link>
              <button onClick={() => setShowDemo(true)} className="btn btn-ghost btn-lg">
                ▷ See How it Works
              </button>
            </motion.div>
          </motion.div>

          {/* Hero UI Mockup */}
          <motion.div
            className={styles.mockup}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className={`${styles.mockupCard} glass`}>
              <div className={styles.mockupHeader}>
                <span className="text-muted" style={{ fontSize: 13 }}>Current Route</span>
                <span className="badge badge-safe">9.2/10 SAFETY</span>
              </div>
              <div className={styles.mapPlaceholder}>
                <div className={styles.mapDot} />
                <div className={styles.mapLine} />
                <div className={styles.mapDotDest} />
                <div className={styles.mapLabel} style={{ top: '20%', left: '20%' }}>
                  <span>🟢</span> Well-lit
                </div>
                <div className={styles.mapLabel} style={{ bottom: '25%', right: '15%' }}>
                  <span>👥</span> High foot traffic
                </div>
              </div>
              <div className={styles.mockupStats}>
                <div className={styles.statBox}>
                  <p className="text-muted" style={{ fontSize: 12 }}>Time</p>
                  <p style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>14 min</p>
                </div>
                <div className={styles.statBox} style={{ borderColor: 'rgba(255,184,102,0.3)' }}>
                  <p className="text-muted" style={{ fontSize: 12 }}>Safety</p>
                  <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>High ✓</p>
                </div>
                <div className={styles.statBox}>
                  <p className="text-muted" style={{ fontSize: 12 }}>Lighting</p>
                  <p style={{ fontWeight: 700, color: 'var(--tertiary)' }}>9.4</p>
                </div>
              </div>
              <div className={styles.floatingTag}>
                <span>🛡️</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Lit Path Verified</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className={styles.comparison} id="how-it-works">
        <Section className={styles.sectionInner}>
          <motion.div variants={fadeUp} className={styles.sectionHeader}>
            <h2 className="text-headline-xl">Safety in Every Step</h2>
            <p className="text-body-lg text-muted">
              Standard GPS optimizes for time. We optimize for your well-being.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className={styles.comparisonGrid}>
            <div className={`${styles.compCard} ${styles.darkCard}`}>
              <div
                className={`${styles.compCardBg} ${styles.darkCardBg}`}
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA2SIkvldKcnk_G1Z-BLbFYmFD3ZNOVYmM_2g4yKnBlHfO0D4Zr0blsYeDtPYtTDIOSBw0ZMKmcX85CU1bh0QKvNsX1nKEXL6k-iNN6Do_EF7ZW3ypjvpY2opsrBGRkIqsFpfKgkLQbmL1Hz0BL_jw_lFZnxB4u-p3K_fH8zjWrrSLH7X4Q1Uq4CK1aiTZ1WSLRth_L4VaQ9uLgJjXciN02gk7Pu44QA9ZxqjPJjQaHSZ62WYTVBVT3aHmIHJf7HvZ1bQgm4p5dbg')`
                }}
              />
              <div className={styles.compCardOverlay} />
              <span className="badge badge-danger" style={{ position: 'absolute', top: 16, left: 16 }}>Fastest Route</span>
              <div className={styles.compCardContent}>
                <h3 className="text-headline-lg">The Dark Shortcut</h3>
                <p style={{ color: '#ffffff', fontSize: 14 }}>
                  Low lighting · Isolated paths · Zero signals
                </p>
              </div>
            </div>
            <div className={`${styles.compCard} ${styles.safeCard}`}>
              <div
                className={`${styles.compCardBg} ${styles.safeCardBg}`}
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD2zBIc5hijmRJkaXS1M4IobwBKBchoZlTC14kwGY6w-jFrjoB9R-6w6wdY1z61oLrZkYopy-Sc2UVrmCqOIk_JUUtUILndSNDb3zov6-vwWzUFiYdmc25O3-gfceehv9doqszPBvJ7mXqlmkzUSph4XsrL2n5zRebmsgi7H6ec6W96LyHFKMYV7h1rJwcBVkBxC1ioNu0mecVck9ULkjklq_9IskUTNubwgYWneOsRVUz3CEP846h6SsQjWphTSE-YQY-YWUD2Hw')`
                }}
              />
              <div className={styles.compCardOverlay} style={{ background: 'linear-gradient(to top, rgba(26,54,93,0.9), transparent)' }} />
              <span className="badge badge-safe" style={{ position: 'absolute', top: 16, left: 16, boxShadow: 'var(--glow-green)' }}>SafeRoute ✓</span>
              <div className={styles.compCardContent}>
                <h3 className="text-headline-lg">The Lit Path</h3>
                <p style={{ color: '#ffffff', fontSize: 14 }}>
                  Max lighting · Active foot traffic · SOS-ready
                </p>
              </div>
            </div>
          </motion.div>

          {/* User types */}
          <motion.div variants={fadeUp} className={styles.userTypesHeader}>
            🛡️ Guarding everyday journeys with dedicated safety intelligence:
          </motion.div>
          <motion.div variants={fadeUp} className={styles.userTypes}>
            {USER_TYPES.map(u => (
              <div key={u.label} className={`${styles.userChip} glass`}>
                <span style={{ fontSize: 24 }}>{u.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{u.label}</span>
              </div>
            ))}
          </motion.div>
        </Section>
      </section>

      {/* ── Features ── */}
      <section className={styles.features} id="features">
        <Section className={styles.sectionInner}>
          <motion.div variants={fadeUp} className={styles.sectionHeader}>
            <h2 className="text-headline-xl">Built for Safety-First Navigation</h2>
            <p className="text-body-lg text-muted">Everything you need to travel with confidence.</p>
          </motion.div>

          <motion.div variants={stagger} className={styles.featuresGrid}>
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp} className={`${styles.featureCard} glass`}>
                <div className={styles.featureIcon} style={{ background: f.bg }}>
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                </div>
                <h3 className="text-headline-lg" style={{ marginBottom: 8 }}>{f.title}</h3>
                <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </Section>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaSection} id="community">
        <Section className={styles.sectionInner}>
          <motion.div variants={fadeUp} className={styles.ctaBanner}>
            <div className={styles.ctaDecor}>🛡️</div>
            <div>
              <h2 className="text-headline-xl" style={{ marginBottom: 12 }}>Your Safety, Your Choice</h2>
              <p className="text-body-lg text-muted" style={{ marginBottom: 28, maxWidth: 480 }}>
                Join SafeRoute and navigate Bhiwandi with real safety intelligence.
                Free, open, and community-powered.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/auth?mode=signup" className="btn btn-gold btn-lg">
                  Create Free Account
                </Link>
                <Link to="/auth" className="btn btn-ghost btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </Section>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.sectionInner} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>SafeRoute</div>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>© 2026 SafeRoute · Bhiwandi, India · Built for safety</p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveModal('privacy')}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: 13, color: 'var(--on-surface-variant)', transition: 'color var(--transition-base)' }}
              onMouseEnter={e => e.target.style.color = 'var(--secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--on-surface-variant)'}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal('terms')}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: 13, color: 'var(--on-surface-variant)', transition: 'color var(--transition-base)' }}
              onMouseEnter={e => e.target.style.color = 'var(--secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--on-surface-variant)'}
            >
              Terms
            </button>
            <button
              onClick={() => setActiveModal('safety')}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: 13, color: 'var(--on-surface-variant)', transition: 'color var(--transition-base)' }}
              onMouseEnter={e => e.target.style.color = 'var(--secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--on-surface-variant)'}
            >
              Safety Tips
            </button>
            <a
              href="https://github.com/Prashant-Kumar-Shah"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--on-surface-variant)', textDecoration: 'none', transition: 'color var(--transition-base)' }}
              onMouseEnter={e => e.target.style.color = 'var(--secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--on-surface-variant)'}
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
      <InfoModal isOpen={activeModal !== null} type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
