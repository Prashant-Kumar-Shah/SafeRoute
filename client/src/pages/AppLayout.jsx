import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/app', icon: '🗺️', label: 'Navigate', end: true },
  { to: '/app/incidents', icon: '⚠️', label: 'Reports' },
  { to: '/app/contacts', icon: '👥', label: 'Contacts' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>🛡️</span>
          <span>SafeRoute</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            className={styles.profileBtn}
            onClick={() => setShowProfile(true)}
          >
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.name}</span>
              <span className={styles.profileEmail}>{user?.email}</span>
            </div>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `${styles.bottomItem} ${isActive ? styles.bottomActive : ''}`}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowProfile(true)}
          className={styles.bottomItem}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
        >
          <span style={{ fontSize: 22 }}>👤</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Profile</span>
        </button>
      </nav>

      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfile(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(11,19,38,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 5000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'relative',
                background: '#131b2e',
                border: '1px solid var(--outline-variant)',
                borderRadius: 24,
                width: '100%',
                maxWidth: 380,
                padding: 28,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                color: '#ffffff',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  color: 'var(--on-surface-variant)',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>

              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--surface-container-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 800,
                  margin: '0 auto 14px',
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>

              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 24 }}>
                {user?.email}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: 13,
                  borderRadius: 10,
                  background: 'rgba(255,95,109,0.12)',
                  border: '1px solid rgba(255,95,109,0.4)',
                  color: '#ff5f6d',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🚪 Sign Out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
