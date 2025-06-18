//merged
// server/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


// Import configurations
const { initializeDatabase } = require('./src/config/database');
const { testS3Connection } = require('./src/config/s3');

// Import route modules
const analyzeRoutes = require('./analyze');
const translationRoutes = require('./index');
const formsRoutes = require('./src/routes/forms'); // Add this line

const app = express();

// CORS configuration
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  process.env.PRODUCTION_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(rule =>
      typeof rule === 'string' ? rule === origin : rule.test(origin)
    )) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create upload directories for local storage fallback
const uploadDirs = ['uploads', 'uploads/users', 'uploads/forms', 'uploads/filled', 'uploads/audio'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// API Routes
app.use('/api', analyzeRoutes);
app.use('/api', translationRoutes);
app.use('/api/forms', formsRoutes); // Add this line

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'connected',
      s3: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'not configured',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }

  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Initialize services and start server
const PORT = process.env.PORT || 4000;

Promise.all([
  initializeDatabase(),
  testS3Connection()
]).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ LegalBot backend running on port ${PORT}`);
    console.log(`📊 Database: Connected`);
    console.log(`☁️  S3 Storage: ${process.env.AWS_ACCESS_KEY_ID ? 'Configured' : 'Not configured'}`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'MISSING'}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`🌐 Google Translate: ${process.env.GOOGLE_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`📋 Forms API: Available at /api/forms`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
