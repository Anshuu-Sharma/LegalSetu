// server/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configurations
const { initializeDatabase } = require('./src/config/database');
const { testS3Connection } = require('./src/config/s3');

// Import route modules (now properly exporting routers)
const analyzeRoutes = require('./analyze');
const translationRoutes = require('./index');

// Import new routes
// const authRoutes = require('./src/routes/auth');
// const documentRoutes = require('./src/routes/document');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create upload directories
const uploadDirs = ['uploads'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// API Routes
app.use('/api', analyzeRoutes);
app.use('/api', translationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Initialize services and start server
const PORT = process.env.PORT || 5000;

Promise.all([
  initializeDatabase(),
  testS3Connection()
]).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ LegalBot backend running on port ${PORT}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`🌐 Google Translate: ${process.env.GOOGLE_API_KEY ? 'Set' : 'MISSING'}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;