import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/app', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signup(form.name, form.email, form.password, form.phone);
      } else {
        await login(form.email, form.password);
      }
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background gradient */}
      <div className={styles.bg} />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className={styles.brand}>
          🛡️ <span>SafeRoute</span>
        </Link>

        {/* Mode Toggle */}
        <div className={styles.tabs}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              className={`${styles.tab} ${mode === m ? styles.active : ''}`}
              onClick={() => { setMode(m); setError(''); }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            className={styles.form}
            initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {mode === 'signup' && (
              <div className={styles.field}>
                <label>Full Name</label>
                <input
                  className="input"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className={styles.field}>
              <label>Email</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {mode === 'signup' && (
              <div className={styles.field}>
                <label>Phone (optional — for SOS)</label>
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  placeholder="+91 xxxxxxxxxx"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  className={styles.error}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="btn btn-gold"
              style={{ width: '100%', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? '...' : mode === 'login' ? 'Sign In to SafeRoute' : 'Create Account'}
            </button>

            {mode === 'login' && (
              <p className={styles.switch}>
                New to SafeRoute?{' '}
                <button type="button" onClick={() => setMode('signup')}>Create account</button>
              </p>
            )}
            {mode === 'signup' && (
              <p className={styles.switch}>
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')}>Sign in</button>
              </p>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
