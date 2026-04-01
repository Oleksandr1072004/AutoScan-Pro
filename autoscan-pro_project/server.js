const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const vehicleRoutes = require('./routes/vehicles');
const scanRoutes = require('./routes/scans');
const sensorRoutes = require('./routes/sensors');
const dtcRoutes = require('./routes/dtc');
const sensorService = require('./services/sensorService');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('subscribe', ({ pids }) => {
    console.log(`[WS] ${socket.id} subscribed to PIDs:`, pids);
    socket.join('sensor-room');
    sensorService.startStreaming(io, pids);
  });
  socket.on('unsubscribe', () => {
    socket.leave('sensor-room');
    sensorService.stopStreaming();
  });
  socket.on('disconnect', () => console.log(`[WS] Disconnected: ${socket.id}`));
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/scans', scanRoutes);
app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/v1/dtc', dtcRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      websocket: 'active',
      mockObd: process.env.MOCK_OBD_ENABLED === 'true' ? 'enabled' : 'disabled',
    },
  });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🔧 AutoScan Pro API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
  console.log(`📖 Swagger docs: http://localhost:${PORT}/docs\n`);
});

module.exports = { app, server, io };
