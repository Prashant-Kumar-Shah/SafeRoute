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
      {/* Sidebar (desktop) / Bottom nav (mobile) */}
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
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.name}</span>
              <span className={styles.profileEmail}>{user?.email}</span>
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                className={styles.profileMenu}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  🚪 Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
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
        <button onClick={handleLogout} className={styles.bottomItem} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
          <span style={{ fontSize: 22 }}>🚪</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Sign Out</span>
        </button>
      </nav>
    </div>
  );
}
