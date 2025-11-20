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
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://q-smart-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
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

// Debug endpoint - list all parents and their children (dev only)
app.get('/api/debug/parents', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Debug endpoint only available in development' });
  }
  
  try {
    const parents = await require('./models/User').find({ role: 'parent' }, 'name email children');
    res.json({
      message: 'All parents and their children',
      data: parents.map(p => ({
        name: p.name,
        email: p.email,
        id: p._id,
        childrenCount: p.children?.length || 0,
        children: p.children || []
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/queues', require('./routes/queues'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/analytics', require('./routes/analytics')); // Analytics route
app.use('/api/admin', require('./routes/admin')); // Admin route
app.use('/api/parent', require('./routes/parent')); // Parent route

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