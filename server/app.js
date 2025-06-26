require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const { initializeDatabase } = require('./src/config/database');
const { initializeAdvocateDatabase } = require('./src/config/advocateDatabase');

const analyzeRoutes = require('./analyze');
const translationRoutes = require('./index');
const formsRoutes = require('./src/routes/forms');
const ttsRoute = require('./src/routes/tts');
const lawyerRoutes = require('./src/routes/lawyerRoutes');
const advocateAuthRoutes = require('./src/routes/advocateAuth');
const advocateChat = require('./src/routes/advocateChat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ Body parsers FIRST
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads/audio')));

// ✅ Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-consultation', (consultationId) => {
    socket.join(`consultation-${consultationId}`);
    console.log(`User ${socket.id} joined consultation ${consultationId}`);
  });

  socket.on('send-message', (data) => {
    socket.to(`consultation-${data.consultationId}`).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ✅ Routes
app.use('/api', analyzeRoutes);
app.use('/api', translationRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/advocate-auth', advocateAuthRoutes);
app.use('/api/advocate-chat', advocateChat);
app.use(ttsRoute);

// ✅ Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/users',
  'uploads/forms',
  'uploads/filled',
  'uploads/audio',
  'uploads/advocates'
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
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
      socketio: 'active',
      advocateSystem: 'active'
    }
  });
});

// ✅ Root route
app.get('/', (req, res) => {
  res.send('LegalSetu backend with Advocate Chat is running!');
});

// ✅ Debug route to check advocates
app.get('/debug/advocates', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    const [advocates] = await pool.execute('SELECT * FROM advocates');
    res.json({
      success: true,
      count: advocates.length,
      advocates: advocates.map(a => ({
        id: a.id,
        name: a.full_name,
        email: a.email,
        status: a.status,
        is_online: a.is_online,
        created_at: a.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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

  if (error.message && error.message.includes('CORS')) {
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
const PORT = process.env.PORT || 5000;

Promise.all([
  initializeDatabase(),
  initializeAdvocateDatabase()
]).then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ LegalBot backend with Advocate Chat running on port ${PORT}`);
    console.log(`📊 Database: Connected`);
    console.log(`👩‍⚖️ Advocate System: Initialized`);
    console.log(`🔌 Socket.IO: Active`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using fallback'}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`🌐 Google Translate: ${process.env.GOOGLE_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`📋 Forms API: Available at /api/forms`);
    console.log(`⚖️  Advocate API: Available at /api/advocate-auth & /api/advocate-chat`);
    console.log(`🔍 Debug: Available at /debug/advocates`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;