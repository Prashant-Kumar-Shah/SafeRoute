import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import styles from './InfoModal.module.css';

const MODAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Your location is your business. We keep it that way.',
    icon: '🛡️',
    sections: [
      {
        heading: '1. Local-First Processing',
        text: 'Your routing requests, GPS logs, and safety checks are processed locally on your device whenever possible. We do not construct or retain profiles of your travel history.'
      },
      {
        heading: '2. Zero Historical Tracking',
        text: 'We store safety incident reports to warn other travelers, but we never link these reports to your personal identity or track your movement history over time.'
      },
      {
        heading: '3. Encrypted Emergency Signals',
        text: 'When you trigger an SOS signal, your location is encrypted end-to-end and sent directly to your designated emergency contacts. No permanent copy remains on our tracking database.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Rules of the road for the SafeRoute community.',
    icon: '📜',
    sections: [
      {
        heading: '1. Community Accuracy',
        text: 'SafeRoute is powered by citizens helping citizens. You agree to submit only authentic, accurate incident and lighting reports. False reports undermine public safety and are strictly prohibited.'
      },
      {
        heading: '2. Emergency Limitations',
        text: 'SafeRoute is a supplementary tool and should not replace professional emergency services. In critical danger, always contact local emergency authorities (112) immediately.'
      },
      {
        heading: '3. Open Source Spirit',
        text: 'SafeRoute is entirely free, non-commercial, and open source. Any modification, redistribution, or derivation must respect the GPL open-source guidelines.'
      }
    ]
  },
  safety: {
    title: 'Safety Tips',
    subtitle: 'Smart navigation guidelines for safe travel.',
    icon: '💡',
    sections: [
      {
        heading: '1. Stay Digitally and Visually Alert',
        text: 'Always keep one earbud out while walking at night. Keep your eyes on the road and avoid staring continuously at your phone screen while in motion.'
      },
      {
        heading: '2. Pre-set and Test SOS Contacts',
        text: 'Add your trusted friends and family to your SOS contacts list. Ensure they are aware that they will receive automated SMS/system alerts if you activate SOS mode.'
      },
      {
        heading: '3. Share Your Virtual Link',
        text: 'Before walking in poorly-lit areas, share your Live Tracking link with a close contact. They can virtually monitor your route progress in real-time.'
      },
      {
        heading: '4. Trust Instincts Over Algorithms',
        text: 'If a route has a high safety score but feels unsafe or changes dynamically (e.g., unexpected street gatherings), walk to the nearest safe haven or public spot.'
      }
    ]
  }
};

export default function InfoModal({ isOpen, type, onClose }) {
  const content = MODAL_CONTENT[type];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          {/* Backdrop click */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className={`${styles.container} glass`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.titleArea}>
                <span className={styles.icon}>{content.icon}</span>
                <div>
                  <h2 className={styles.title}>{content.title}</h2>
                  <p className={styles.subtitle}>{content.subtitle}</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className={styles.content}>
              {content.sections.map((sec, idx) => (
                <div key={idx} className={styles.section}>
                  <h3 className={styles.heading}>{sec.heading}</h3>
                  <p className={styles.text}>{sec.text}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button className="btn btn-gold btn-md" onClick={onClose}>
                Understood
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
