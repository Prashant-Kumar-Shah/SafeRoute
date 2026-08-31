import { useState } from 'react';
import RouteSearch from './RouteSearch';
import styles from './Layout.module.css';

/*
 * NOTE ON FILE LOCATION / IMPORT PATH:
 * This assumes Layout.jsx sits next to RouteSearch.jsx (both in `src/pages/`,
 * matching your project's existing folder). If you place Layout.jsx
 * somewhere else (e.g. `src/components/`), adjust the import above to
 * point at the real path, e.g. `../pages/RouteSearch`.
 *
 * NOTE ON USER INFO / AUTH:
 * userName/userEmail/onResetPassword/onLogout are all props with safe
 * fallback defaults so this renders and is clickable out of the box.
 * Replace the defaults with your real auth source (context, auth hook,
 * whatever issues the actual password-reset email and clears the session)
 * once wired up. This file has no idea how your backend auth works — it
 * just gives the UI the right shape and calls whatever you pass it.
 */

const NAV_ITEMS = [
  { key: 'navigate', icon: '🗺️', label: 'Navigate' },
  { key: 'reports', icon: '⚠️', label: 'Reports' },
  { key: 'contacts', icon: '👥', label: 'Contacts' },
];

// Mobile bottom nav gets a 4th tab — Profile — instead of a direct
// Sign Out action, so tapping it opens the profile panel rather than
// immediately logging the person out.
const MOBILE_NAV_ITEMS = [...NAV_ITEMS, { key: 'profile', icon: '👤', label: 'Profile' }];

/*
 * Placeholder pages — swap these for your real Reports/Contacts
 * components whenever they're built. Keeping them as simple stand-ins
 * for now means the layout is fully functional and testable immediately.
 */
function ReportsPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <h2>⚠️ Reports</h2>
      <p>Your incident reports history will show here.</p>
    </div>
  );
}

function ContactsPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <h2>👥 Contacts</h2>
      <p>Manage your trusted contacts here.</p>
    </div>
  );
}

function ProfilePanel({ userName, userEmail, onResetPassword, onLogout }) {
  return (
    <div className={styles.profilePanel}>
      <div className={styles.profilePanelAvatar}>👤</div>
      <h2 className={styles.profilePanelName}>{userName}</h2>
      <p className={styles.profilePanelEmail}>{userEmail}</p>

      <button type="button" className={styles.profileActionBtn} onClick={onResetPassword}>
        🔑 Reset Password
      </button>

      <button type="button" className={styles.profileLogoutBtn} onClick={onLogout}>
        🚪 Log Out
      </button>
    </div>
  );
}

export default function Layout({
  userName = 'Prashant',
  userEmail = 'prashant@gmail.com',
  onResetPassword = () => {
    console.warn('onResetPassword not wired — pass a real handler to <Layout />');
  },
  onLogout = () => {
    console.warn('onLogout not wired — pass a real handler to <Layout />');
  },
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('navigate');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);

  /*
   * Desktop sidebar clicks just switch tabs.
   * Mobile bottom-nav clicks are smarter: tapping the ALREADY-active tab
   * toggles its sheet open/closed; tapping a DIFFERENT tab switches to it
   * and opens its sheet. (This only visibly matters for the "navigate"
   * tab, since that's the only one wired to mobileSheetOpen — it's
   * harmless no-op state for the other tabs.)
   */
  const handleNavClick = (tab) => {
    if (tab === activeTab) {
      setMobileSheetOpen((previous) => !previous);
    } else {
      setActiveTab(tab);
      setMobileSheetOpen(true);
    }
  };

  return (
    <div className={styles.shell}>
      {/* ============================= DESKTOP SIDEBAR ============================= */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🛡️</span>
            {!collapsed && <span className={styles.brandLabel}>SafeRoute</span>}
          </div>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setCollapsed((previous) => !previous)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.navItem} ${activeTab === item.key ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(item.key)}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/*
         * Clicking the profile row opens the Profile tab (Name, Email,
         * Reset Password, Log Out) — it does NOT log out directly.
         */}
        <button
          type="button"
          className={`${styles.sidebarProfile} ${activeTab === 'profile' ? styles.sidebarProfileActive : ''}`}
          onClick={() => setActiveTab('profile')}
          title="Profile"
        >
          <span className={styles.profileAvatar}>👤</span>
          {!collapsed && (
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{userName}</div>
              <div className={styles.profileEmail}>{userEmail}</div>
            </div>
          )}
        </button>
      </aside>

      {/* ============================= MAIN CONTENT ============================= */}
      {/*
       * All tabs stay mounted at all times — visibility is toggled with
       * plain CSS display, not conditional rendering. Conditionally
       * rendering (e.g. `{activeTab === 'navigate' && <RouteSearch />}`)
       * would unmount/remount RouteSearch on every tab switch, which is
       * exactly the bug we fixed earlier (it re-fires the "load once on
       * mount" effect and hammers /api/incidents every time someone
       * switches tabs and back).
       */}
      <main className={styles.content}>
        <div style={{ display: activeTab === 'navigate' ? 'block' : 'none', height: '100%' }}>
          <RouteSearch
            mobileSheetOpen={mobileSheetOpen}
            onCloseMobileSheet={() => setMobileSheetOpen(false)}
          />
        </div>
        <div style={{ display: activeTab === 'reports' ? 'block' : 'none', height: '100%' }}>
          <ReportsPlaceholder />
        </div>
        <div style={{ display: activeTab === 'contacts' ? 'block' : 'none', height: '100%' }}>
          <ContactsPlaceholder />
        </div>
        <div style={{ display: activeTab === 'profile' ? 'block' : 'none', height: '100%' }}>
          <ProfilePanel
            userName={userName}
            userEmail={userEmail}
            onResetPassword={onResetPassword}
            onLogout={onLogout}
          />
        </div>
      </main>

      {/* ============================= MOBILE BOTTOM NAV ============================= */}
      <nav className={styles.bottomNav}>
        {MOBILE_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.bottomNavItem} ${activeTab === item.key ? styles.bottomNavItemActive : ''}`}
            onClick={() => handleNavClick(item.key)}
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
