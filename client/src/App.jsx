import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppLayout from './pages/AppLayout';
import RouteSearch from './pages/RouteSearch';
import Incidents from './pages/Incidents';
import Contacts from './pages/Contacts';
import 'leaflet/dist/leaflet.css';

// ─── Protected Route Guard ────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--background)', color: 'var(--primary)',
        fontSize: 20, gap: 12
      }}>
        🛡️ Loading SafeRoute...
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected App */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RouteSearch />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="contacts" element={<Contacts />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
