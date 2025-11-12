const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Added for WebSocket support
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket

// Initialize WebSocket
const socketManager = require('./utils/socketUtils');
socketManager.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());

// Connecting to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/q-smart')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Enhanced health check route
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'OK', 
    message: 'Queue Smart Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: `${process.uptime().toFixed(2)} seconds`,
    websocket: 'Active'
  };
  res.json(healthInfo);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/queues', require('./routes/queues'));
app.use('/api/tickets', require('./routes/tickets'));

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('🚨 Error Stack:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen for WebSocket support
server.listen(PORT, () => {
  console.log('================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('================================');
});