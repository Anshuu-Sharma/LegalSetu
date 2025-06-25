require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


const { initializeDatabase } = require('./src/config/database');
const { testS3Connection } = require('./src/config/s3');

const analyzeRoutes = require('./analyze');
const translationRoutes = require('./index');
const formsRoutes = require('./src/routes/forms');
const ttsRoute = require('./src/routes/tts');
const lawyerRoutes = require('./src/routes/lawyerRoutes');



const app = express();

// ✅ Body parsers FIRST
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Serve static audio files
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads/audio')));

// ✅ TTS Route
app.use(ttsRoute);

// ✅ Other routes
app.use('/api', analyzeRoutes);
app.use('/api', translationRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/lawyers', lawyerRoutes);

// ✅ Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/users',
  'uploads/forms',
  'uploads/filled',
  'uploads/audio'
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ✅ Health check
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
// ✅ Root route for health check or friendly message
app.get('/', (req, res) => {
  res.send('LegalSetu backend is running!');
});

// ✅ Error handler
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

// ✅ Start server
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
