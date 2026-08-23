require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// ─── Connect to MongoDB (loud-fail if not Atlas) ──────────────────────────────
connectDB();

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const CLIENT_URL = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;

// ─── Socket.io (Live Location) ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// In-memory last-known positions: { userId: { lat, lng, timestamp } }
const userPositions = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client streams their live position
  socket.on('position:update', (data) => {
    const { userId, lat, lng } = data;
    if (userId && lat && lng) {
      userPositions.set(userId, { lat, lng, timestamp: new Date(), socketId: socket.id });
    }
  });

  // SOS uses last known position if real-time coord not available
  socket.on('sos:request_position', (userId) => {
    const pos = userPositions.get(userId);
    socket.emit('sos:position_response', pos || null);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Expose position store to routes
app.set('userPositions', userPositions);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Request Logging (dev only) ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString().substr(11, 8)} ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/safe-havens', require('./routes/safeHavens'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SafeRoute API',
    timestamp: new Date().toISOString(),
    mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🛡️  SafeRoute API running on port ${PORT}`);
  console.log(`📡 Socket.io live tracking enabled`);
  console.log(`🗺️  OSRM: ${process.env.OSRM_BASE_URL || 'http://router.project-osrm.org'}`);
  console.log(`🌍 Client: ${CLIENT_URL}\n`);
});

module.exports = { app, server };
