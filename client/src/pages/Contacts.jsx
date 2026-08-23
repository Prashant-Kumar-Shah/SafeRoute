import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { contactsAPI } from '../services/api';
import styles from './Contacts.module.css';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data } = await contactsAPI.getAll();
      setContacts(data.contacts || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await contactsAPI.create(form);
      setShowForm(false);
      setForm({ name: '', phone: '', relationship: '' });
      loadContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await contactsAPI.remove(id);
      setContacts(prev => prev.filter(c => c._id !== id));
    } catch (_) {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Emergency Contacts</h1>
          <p className={styles.subtitle}>
            {contacts.length}/5 contacts · Notified instantly when SOS is triggered
          </p>
        </div>
        {contacts.length < 5 && (
          <button className="btn btn-gold btn-sm" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? '✕ Cancel' : '+ Add Contact'}
          </button>
        )}
      </div>

      <div className={styles.infoBox}>
        <span>🚨</span>
        <p>
          When you trigger SOS during navigation, all contacts below will be logged as notified
          with your GPS location and a full emergency message.
        </p>
      </div>

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
            <div className={styles.formTitle}>Add Emergency Contact</div>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Full Name *</label>
                <input className="input" placeholder="Contact Name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className={styles.field}>
                <label>Phone *</label>
                <input className="input" type="tel" placeholder="+91 xxxxxxxxx" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              </div>
            </div>
            <div className={styles.field}>
              <label>Relationship</label>
              <input className="input" placeholder="Mother, Brother, Friend..." value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} />
            </div>
            {error && <div className={styles.error}>⚠️ {error}</div>}
            <button type="submit" className="btn btn-gold" disabled={submitting}>
              {submitting ? 'Adding...' : '👤 Add Contact'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className={styles.empty}>Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p>No emergency contacts yet.</p>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Add at least one contact so SafeRoute can notify them in an emergency.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {contacts.map((c, idx) => (
            <motion.div
              key={c._id}
              className={styles.contactCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              layout
            >
              <div className={styles.avatar}>{c.name[0]?.toUpperCase()}</div>
              <div className={styles.contactInfo}>
                <div className={styles.contactName}>{c.name}</div>
                <div className={styles.contactPhone}>{c.phone}</div>
                {c.relationship && <div className={styles.contactRel}>{c.relationship}</div>}
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDelete(c._id)} title="Remove">
                ✕
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
