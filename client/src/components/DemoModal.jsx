import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from './DemoModal.module.css';

// Fix Leaflet marker icons locally for the demo map
const getMarkerIcon = () => {
  return L.Icon.Default ? new L.Icon.Default() : undefined;
};

/*
// Start and end coordinates for the Chandigarh route
const ROUTE_START = [30.7414, 76.7682]; // Sector 17 Plaza
const ROUTE_END = [30.7600, 76.7666];   // Punjab University

const routePoints = [
  ROUTE_START,
  [30.7450, 76.7680],
  [30.7490, 76.7677],
  [30.7530, 76.7672],
  [30.7570, 76.7668],
  ROUTE_END
];
*/

// Start and end coordinates for the Bhiwandi demo route
const ROUTE_START = [19.2813, 73.0483]; // Bhiwandi
const ROUTE_END = [19.2965, 73.0550];   // Bhiwandi

const routePoints = [
  ROUTE_START,
  [19.2840, 73.0490],
  [19.2870, 73.0505],
  [19.2905, 73.0520],
  [19.2935, 73.0535],
  ROUTE_END
];

// Generate smooth path coordinates
const getInterpolatedPoints = (points, stepsPerSegment = 50) => {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const lat = start[0] + (end[0] - start[0]) * t;
      const lng = start[1] + (end[1] - start[1]) * t;
      result.push([lat, lng]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const interpolatedPoints = getInterpolatedPoints(routePoints, 40);

// Map controller to fit bounds
function MapBoundsController({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      map.fitBounds(points, { padding: [15, 15] });
    }
  }, [points, map]);
  return null;
}

// Framer motion variants for slides
const slideVariants = {
  enter: {
    x: '100%',
    opacity: 0
  },
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }
  }
};

export default function DemoModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-advance logic (slides 0 to 3)
  useEffect(() => {
    if (!isOpen) return;
    if (currentSlide > 3) return; // Success screen doesn't auto-advance

    const timer = setTimeout(() => {
      handleNext();
    }, 6000);

    return () => clearTimeout(timer);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < 4) {
      setCurrentSlide(prev => prev + 1);
      setProgressKey(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const renderProgressIndicators = () => {
    if (currentSlide > 3) return null;
    return (
      <div className={styles.progressContainer}>
        {[0, 1, 2, 3].map((idx) => {
          let fillWidth = '0%';
          let animation = 'none';

          if (idx < currentSlide) {
            fillWidth = '100%';
          } else if (idx === currentSlide) {
            animation = `${styles.fillProgress} 6s linear forwards`;
          }

          return (
            <div key={idx} className={styles.progressTrack}>
              <div 
                key={`${idx}-${progressKey}`}
                className={styles.progressFill}
                style={{ 
                  width: fillWidth,
                  animation: animation
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modalCard} glass`}>
        {/* Top bar controls */}
        <div className={styles.modalHeader}>
          {renderProgressIndicators()}
          {currentSlide <= 3 && (
            <button className={styles.closeBtn} onClick={handleSkip} title="Skip Demo">
              ✕
            </button>
          )}
        </div>

        {/* Content Area with Slide Animation */}
        <div className={styles.slideWrapper}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={styles.slideContent}
            >
              {currentSlide === 0 && <Slide1 />}
              {currentSlide === 1 && <Slide2 />}
              {currentSlide === 2 && <Slide3 />}
              {currentSlide === 3 && <Slide4 />}
              {currentSlide === 4 && <SlideSuccess onClose={onClose} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        {currentSlide <= 3 && (
          <div className={styles.modalFooter}>
            <button className={styles.skipLink} onClick={handleSkip}>
              Skip Demo
            </button>
            <button className="btn btn-gold" onClick={handleNext}>
              Next Slide →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SLIDE 1: Route Comparison ────────────────────────────────────────────────
function Slide1() {
  const [score, setScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 3;
      if (current >= 89) {
        current = 89;
        clearInterval(interval);
      }
      setScore(current);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.slideInner}>
      <h2 className={styles.title}>Two Routes. You Choose.</h2>
      <p className={styles.subtitle}>
        SafeRoute shows you the fastest path and the safest path side by side — with a safety score for each.
      </p>

      <div className={styles.slideVisual}>
        <div className={styles.routeCardsContainer}>
          {/* Card 1: Fastest */}
          <div className={styles.demoRouteCard}>
            <div className={styles.demoCardHeader}>
              <span className={styles.badgeAmber}>FASTEST ROUTE</span>
              <span className={styles.demoScoreAmber}>61/100</span>
            </div>
            <div className={styles.demoCardStats}>
              <span className={styles.statLabel}>⏱️ 12 min</span>
              <span className={styles.statLabel}>📏 4.2 km</span>
            </div>
            <div className={styles.featuresList}>
              <div className={styles.featureItemMuted}>🌑 Low lighting proxy</div>
              <div className={styles.featureItemMuted}>⚠️ 2 recent incident reports</div>
            </div>
          </div>

          {/* Card 2: Safest */}
          <div className={`${styles.demoRouteCard} ${styles.demoRouteCardSelected}`}>
            <div className={styles.demoCardHeader}>
              <span className={styles.badgeGreen}>SAFEST ROUTE</span>
              <span className={styles.demoScoreGreen}>{score}/100</span>
            </div>
            <div className={styles.demoCardStats}>
              <span className={styles.statLabel}>⏱️ 16 min</span>
              <span className={styles.statLabel}>📏 5.1 km</span>
            </div>
            <div className={styles.featuresList}>
              <div className={styles.featureItemSafe}>🟢 Well-lit path verified</div>
              <div className={styles.featureItemSafe}>👥 High active foot traffic</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 2: Live GPS Navigation ─────────────────────────────────────────────
function Slide2() {
  const [currentCoord, setCurrentCoord] = useState(ROUTE_START);

  useEffect(() => {
    let start = null;
    const duration = 5000; // Loops every 5 seconds
    let animId;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = elapsed % duration;
      const t = progress / duration;

      const idx = Math.min(
        Math.floor(t * interpolatedPoints.length),
        interpolatedPoints.length - 1
      );
      setCurrentCoord(interpolatedPoints[idx]);
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const customMarkerIcon = L.divIcon({
    className: '',
    html: `<div style="
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--primary, #adc7f7);
      border: 3px solid white;
      box-shadow: 0 0 12px rgba(173,199,247,0.8);
      animation: pulseGlow 1.5s infinite ease-in-out;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className={styles.slideInner}>
      <h2 className={styles.title}>Navigate. Stay Tracked.</h2>
      <p className={styles.subtitle}>
        A live marker follows your position along the chosen route in real time.
      </p>

      <div className={styles.slideVisual} style={{ minHeight: '240px' }}>
        <div className={styles.mapContainerWrapper}>
          <MapContainer
            center={ROUTE_START}
            zoom={14}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            dragging={false}
            boxZoom={false}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: 'var(--tertiary, #6bdc96)',
                weight: 5,
                opacity: 0.95
              }}
            />
            <Marker position={currentCoord} icon={customMarkerIcon} />
            <MapBoundsController points={routePoints} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 3: Incident Reporting ──────────────────────────────────────────────
function Slide3() {
  const [submitState, setSubmitState] = useState('idle'); // idle | success

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitState('success');
    setTimeout(() => {
      setSubmitState('idle');
    }, 1500);
  };

  return (
    <div className={styles.slideInner}>
      <h2 className={styles.title}>Report What You See.</h2>
      <p className={styles.subtitle}>
        Users report unsafe spots — like poor lighting or suspicious activity — to keep the map updated for everyone.
      </p>

      <div className={styles.slideVisual}>
        <div className={styles.mockFormContainer}>
          <form onSubmit={handleSubmit} className={styles.mockForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Incident Type</label>
              <select className={styles.select} disabled value="poor_lighting">
                <option value="poor_lighting">💡 Poor Lighting</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Location</label>
              <input type="text" className={styles.input} disabled value="Narpoli Road - Kamatghar, Bhiwandi" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea className={styles.textarea} disabled rows={2} value="Street lights not working near the underpass." />
            </div>

            <div style={{ position: 'relative', marginTop: '12px' }}>
              <AnimatePresence mode="wait">
                {submitState === 'idle' ? (
                  <motion.button
                    key="btn"
                    type="submit"
                    className="btn btn-gold"
                    style={{ width: '100%', padding: '10px' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit Report
                  </motion.button>
                ) : (
                  <motion.div
                    key="success"
                    className={styles.submitSuccessBadge}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ✓ Report Submitted!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 4: SOS Alert ───────────────────────────────────────────────────────
function Slide4() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAlert(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.slideInner}>
      <h2 className={styles.title}>One Tap. Help Is Notified.</h2>
      <p className={styles.subtitle}>
        Hold the SOS button to instantly alert your emergency contacts with your live location.
      </p>

      <div className={styles.slideVisual} style={{ minHeight: '220px' }}>
        <div className={styles.sosDemoContainer}>
          {/* Animated SOS Button Mock */}
          <div className={styles.sosButtonMock}>
            <span className={styles.sosIcon}>🚨</span>
            <span className={styles.sosLabel}>SOS</span>
            <div className={styles.pulseRing} />
          </div>

          <AnimatePresence>
            {showAlert && (
              <motion.div
                className={styles.alertCard}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              >
                <div className={styles.alertCardHeader}>
                  <span className={styles.alertIcon}>✅</span>
                  <div>
                    <h4 className={styles.alertTitle}>Alert sent to 2 contacts</h4>
                    <p className={styles.alertContact}>Rahul Sharma · +91 98XXX XXXXX</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SlideSuccess({ onClose }) {
  const handleNav = () => {
    onClose();
    // Redirect to the main app navigation
    window.location.href = '/app';
  };

  return (
    <div className={styles.successInner}>
      <div className={styles.successIcon}>🛡️</div>
      <h2 className={styles.successTitle}>You're all set.</h2>
      <p className={styles.successSubtitle}>
        SafeRoute is ready to guide you home. Navigate with absolute peace of mind.
      </p>
      <button className="btn btn-gold btn-lg" onClick={handleNav} style={{ marginTop: '24px' }}>
        Start Navigating
      </button>
    </div>
  );
}
