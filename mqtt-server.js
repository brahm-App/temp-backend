const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const wifi = require('node-wifi'); // WiFi control

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json()); // For parsing application/json

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize wifi
wifi.init({
  iface: null // auto-detect network interface
});

// Auto-connect credentials (🛜 Replace these with your actual SSID and password)
const WIFI_SSID = 'BrahmWorksACT';
const WIFI_PASSWORD = 'lockwater069';

// Store latest vitals data
let latestData = {};

// Handle Socket.IO client connection
io.on('connection', (socket) => {
  console.log('Web client connected:', socket.id);

  if (Object.keys(latestData).length > 0) {
    socket.emit('vitals', latestData);
  }

  socket.on('disconnect', () => {
    console.log('Web client disconnected:', socket.id);
  });
});

// POST route to receive vitals data and emit it via WebSocket
app.post('/vitals', (req, res) => {
  const vitalsData = req.body;

  if (!vitalsData || typeof vitalsData !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  latestData = vitalsData;
  console.log('Received vitals data via POST:', vitalsData);
  io.emit('vitals', vitalsData);

  res.status(200).json({ message: 'Vitals data received and broadcasted' });
});

// Optional: Also keep /connect-wifi route in case you want dynamic switching later
app.post('/connect-wifi', (req, res) => {
  const { ssid, password } = req.body;

  if (!ssid || !password) {
    return res.status(400).json({ error: 'SSID and password are required' });
  }

  wifi.connect({ ssid, password }, error => {
    if (error) {
      console.error('WiFi connection error:', error);
      return res.status(500).json({ error: 'Failed to connect to WiFi', details: error.message });
    }

    console.log(`Connected to WiFi: ${ssid}`);
    res.status(200).json({ message: `Connected to WiFi: ${ssid}` });
  });
});

// Start the server and auto-connect to WiFi
server.listen(5000, () => {
  console.log('Server running on port 5000');

  // Auto-connect to WiFi
  wifi.connect({ ssid: WIFI_SSID, password: WIFI_PASSWORD }, error => {
    if (error) {
      console.error('❌ Failed to auto-connect to WiFi:', error);
    } else {
      console.log(`✅ Auto-connected to WiFi: ${WIFI_SSID}`);
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');

  server.close(() => {
    console.log('HTTP server closed');
  });

  io.close(() => {
    console.log('Socket.IO server closed');
  });

  process.exit(0);
});
