const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

// Store latest vitals data
let latestData = {};

// Handle Socket.IO client connection
io.on('connection', (socket) => {
  console.log('Web client connected:', socket.id);

  // Send latest vitals data on new connection
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

  // Update latest data and broadcast
  latestData = vitalsData;
  console.log('Received vitals data via POST:', vitalsData);
  io.emit('vitals', vitalsData);

  res.status(200).json({ message: 'Vitals data received and broadcasted' });
});

// Start the server
server.listen(5000, () => {
  console.log('Server running on port 5000');
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
