import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { incidentsAPI } from '../services/api';
import { useGPS } from '../hooks/useGPS';
import { useAuth } from '../context/AuthContext';
import styles from './Incidents.module.css';

const TYPE_LABELS = {
  poor_lighting: { label: 'Poor Lighting', icon: '💡' },
  suspicious_activity: { label: 'Suspicious Activity', icon: '👁️' },
  harassment: { label: 'Harassment', icon: '🛑' },
  theft: { label: 'Theft / Robbery', icon: '💰' },
  vandalism: { label: 'Vandalism', icon: '🔨' },
  poor_road_condition: { label: 'Poor Road Condition', icon: '🚧' },
  no_footpath: { label: 'No Footpath', icon: '🚶' },
  isolated_area: { label: 'Isolated Area', icon: '🌑' },
  other: { label: 'Other', icon: '❗' },
};

export default function Incidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'poor_lighting',
    description: '',
    locationType: 'gps',
    customAddress: '',
    customCoords: null,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 4000);
  };

  const customRef = useRef(null);
  const { position, getOnce } = useGPS();

  useEffect(() => {
    getOnce();
    loadIncidents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customRef.current && !customRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!form.customAddress || form.customAddress.trim() === '' || form.customAddress.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.customAddress)}&format=json&limit=5&countrycodes=in&viewbox=76.6,30.6,76.9,30.8&bounded=1`
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Incident geocoding search failed:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.customAddress]);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const { data } = await incidentsAPI.getAll();
      setIncidents(data.incidents || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let reportLat, reportLng;

    if (form.locationType === 'gps') {
      if (!position) {
        setError('Location required. Please enable GPS or choose custom location.');
        return;
      }
      reportLat = position.lat;
      reportLng = position.lng;
    } else {
      if (!form.customCoords) {
        setError('Please select a valid location from the search suggestions.');
        return;
      }
      reportLat = form.customCoords.lat;
      reportLng = form.customCoords.lng;
    }

    setSubmitting(true);
    try {
      await incidentsAPI.create({
        type: form.type,
        description: form.description,
        lat: reportLat,
        lng: reportLng,
      });
      showToast('Report submitted! It will appear on the safety map.', 'success');
      setShowForm(false);
      setForm({
        type: 'poor_lighting',
        description: '',
        locationType: 'gps',
        customAddress: '',
        customCoords: null,
      });
      loadIncidents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      await incidentsAPI.remove(id);
      setIncidents(prev => prev.filter(i => i._id !== id));
      showToast('Incident report removed.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove.', 'error');
    }
  };

  const handleConfirm = async (id) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await incidentsAPI.confirm(id);
      setIncidents(prev => prev.map(i => i._id === id ? data.incident : i));
      showToast('Incident confirmation registered!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Safety Reports</h1>
          <p className={styles.subtitle}>{incidents.length} active reports · Bhiwandi</p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
          {showForm ? '✕ Cancel' : '+ Report'}
        </button>
      </div>

      {/* Report Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            className={styles.form}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.formTitle}>Report Unsafe Condition</div>

            <div className={styles.typeGrid}>
              {Object.entries(TYPE_LABELS).map(([val, { label, icon }]) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.typeChip} ${form.type === val ? styles.typeSelected : ''}`}
                  onClick={() => setForm(f => ({ ...f, type: val }))}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <textarea
              className={`input ${styles.textarea}`}
              placeholder="Brief description (optional)..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={500}
            />

            <div className={styles.locationSelector}>
              <button
                type="button"
                className={`${styles.locationTab} ${form.locationType === 'gps' ? styles.locationTabActive : ''}`}
                onClick={() => setForm(f => ({ ...f, locationType: 'gps' }))}
              >
                📍 Current GPS
              </button>
              <button
                type="button"
                className={`${styles.locationTab} ${form.locationType === 'custom' ? styles.locationTabActive : ''}`}
                onClick={() => setForm(f => ({ ...f, locationType: 'custom' }))}
              >
                🔍 Search Location
              </button>
            </div>

            {form.locationType === 'gps' && (
              <div className={styles.locationNote}>
                {position
                  ? `📍 Using your location: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                  : '⏳ Acquiring location... (GPS must be enabled)'}
              </div>
            )}

            {form.locationType === 'custom' && (
              <div className={styles.searchGroup} ref={customRef}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search location in Bhiwandi... (e.g. Amzadiya road)"
                  value={form.customAddress}
                  onChange={e => {
                    setForm(f => ({ ...f, customAddress: e.target.value, customCoords: null }));
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                
                <AnimatePresence>
                  {showDropdown && suggestions.length > 0 && (
                    <motion.div
                      className={styles.autocompleteDropdown}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className={styles.autocompleteItem}
                          onClick={() => {
                            setForm(f => ({
                              ...f,
                              customAddress: item.display_name,
                              customCoords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
                            }));
                            setShowDropdown(false);
                          }}
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {form.customCoords && (
                  <div className={styles.locationNote} style={{ marginTop: 6 }}>
                    🎯 Selected coordinates: {form.customCoords.lat.toFixed(4)}, {form.customCoords.lng.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {error && <div className={styles.error}>⚠️ {error}</div>}

            <button type="submit" className="btn btn-gold" disabled={submitting || (form.locationType === 'gps' && !position) || (form.locationType === 'custom' && !form.customCoords)}>
              {submitting ? 'Submitting...' : '🛡️ Submit Report'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast.message && (
          <motion.div
            className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ duration: 0.3 }}
          >
            <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incidents List */}
      {loading ? (
        <div className={styles.loading}>Loading reports...</div>
      ) : incidents.length === 0 ? (
        <div className={styles.empty}>
          <p>🟢 No active reports in your area.</p>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Be the first to report an unsafe condition.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {incidents.map(inc => {
            const typeInfo = TYPE_LABELS[inc.type] || { label: inc.type, icon: '❗' };
            const age = Math.floor((Date.now() - new Date(inc.createdAt)) / (1000 * 60 * 60 * 24));
            const loggedInUserId = user?.id || user?._id;
            const reporterId = inc.reportedBy?._id || inc.reportedBy;
            const isOwnReport = loggedInUserId && reporterId && (reporterId.toString() === loggedInUserId.toString());
            return (
              <motion.div
                key={inc._id}
                className={styles.incidentCard}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <div className={styles.incidentHeader}>
                  <span className={styles.incidentIcon}>{typeInfo.icon}</span>
                  <div>
                    <div className={styles.incidentType}>{typeInfo.label}</div>
                    <div className={styles.incidentMeta}>
                      {age === 0 ? 'Today' : `${age}d ago`} ·
                      Confidence: {Math.round(inc.confidence * 100)}% ·
                      {inc.confirmations} confirmation{inc.confirmations !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className={styles.incidentBadge} style={{
                    background: inc.confidence > 0.8 ? 'var(--error-container)' : 'rgba(255,184,102,0.15)',
                    color: inc.confidence > 0.8 ? 'var(--error)' : 'var(--secondary)',
                  }}>
                    {inc.confidence > 0.8 ? 'High' : 'Moderate'}
                  </div>
                </div>
                {inc.description && <p className={styles.incidentDesc}>{inc.description}</p>}
                <div className={styles.incidentActions}>
                  <button className={styles.actionBtn} onClick={() => handleConfirm(inc._id)}>
                    👍 Confirm ({inc.confirmations})
                  </button>
                  {isOwnReport && (
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(inc._id)}>
                      ✕ Remove (yours only)
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
