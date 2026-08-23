import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sosAPI } from '../services/api';
import styles from './SOSButton.module.css';

export default function SOSButton({ position }) {
  const [phase, setPhase] = useState('idle'); // idle | countdown | sending | sent
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [timerRef, setTimerRef] = useState(null);

  const startSOS = () => {
    setPhase('countdown');
    setCountdown(3);
    let count = 3;

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        sendSOS();
      }
    }, 1000);
    setTimerRef(interval);
  };

  const cancel = () => {
    clearInterval(timerRef);
    setPhase('idle');
    setCountdown(3);
  };

  const sendSOS = async () => {
    setPhase('sending');
    try {
      const lat = position?.lat || 30.7333;
      const lng = position?.lng || 76.7794;
      const { data } = await sosAPI.trigger({ lat, lng });
      setResult(data);
      setPhase('sent');
    } catch (err) {
      setPhase('idle');
      alert('Failed to send SOS. Please call emergency services directly: 112');
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setCountdown(3);
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.button
            key="idle"
            className={styles.sosBtn}
            onClick={startSOS}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.sosBtnIcon}>🚨</span>
            <span className={styles.sosBtnLabel}>SOS</span>
            <div className={styles.pulseRing} />
          </motion.button>
        )}

        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            className={styles.countdownCard}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.countdownNum}>{countdown}</div>
            <p>Sending SOS in {countdown}s</p>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
          </motion.div>
        )}

        {phase === 'sending' && (
          <motion.div key="sending" className={styles.sendingCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.spinner} />
            <p>Sending alert...</p>
          </motion.div>
        )}

        {phase === 'sent' && result && (
          <motion.div
            key="sent"
            className={styles.sentCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.sentHeader}>
              <span className={styles.sentIcon}>✅</span>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--tertiary)' }}>SOS Alert Logged</p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  {result.contactsNotified?.length > 0
                    ? `${result.contactsNotified.length} contact(s) to be notified`
                    : 'No contacts saved — add them in Contacts'}
                </p>
              </div>
            </div>

            {/* Show message */}
            <pre className={styles.messageBox}>{result.message}</pre>

            {/* Location link */}
            <a
              href={result.location?.osmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
            >
              📍 View on Map
            </a>

            {result.contactsNotified?.length > 0 && (
              <div className={styles.contactList}>
                {result.contactsNotified.map((c, i) => (
                  <div key={i} className={styles.contactRow}>
                    <span>👤 {c.name}</span>
                    <span style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>{c.phone}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-primary btn-sm" onClick={reset} style={{ width: '100%' }}>
              ✓ Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
