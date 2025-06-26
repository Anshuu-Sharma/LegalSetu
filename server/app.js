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

// Make io available to routes
app.set('io', io);

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

// ✅ Enhanced Socket.IO for real-time chat and notifications
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Handle user/advocate joining their room
  socket.on('join-room', (data) => {
    const { userId, userType } = data; // userType: 'user' or 'advocate'
    const roomName = `${userType}-${userId}`;
    socket.join(roomName);
    console.log(`👤 ${userType} ${userId} joined room: ${roomName}`);
    
    // Update advocate online status if it's an advocate
    if (userType === 'advocate') {
      updateAdvocateOnlineStatus(userId, true);
    }
  });

  // Handle joining specific consultation room
  socket.on('join-consultation', (consultationId) => {
    socket.join(`consultation-${consultationId}`);
    console.log(`💬 User ${socket.id} joined consultation ${consultationId}`);
  });

  // Handle sending messages in consultation
  socket.on('send-message', (data) => {
    socket.to(`consultation-${data.consultationId}`).emit('new-message', data);
    console.log(`📨 Message sent in consultation ${data.consultationId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`consultation-${data.consultationId}`).emit('user-typing', {
      userId: data.userId,
      userType: data.userType
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`consultation-${data.consultationId}`).emit('user-stopped-typing', {
      userId: data.userId,
      userType: data.userType
    });
  });

  // Handle advocate status updates
  socket.on('update-advocate-status', (data) => {
    const { advocateId, isOnline } = data;
    updateAdvocateOnlineStatus(advocateId, isOnline);
    
    // Broadcast status update to all users
    io.emit('advocate-status-update', {
      advocateId,
      isOnline,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    // Note: In production, you might want to track which advocate disconnected
    // and update their online status accordingly
  });
});

// Helper function to update advocate online status
async function updateAdvocateOnlineStatus(advocateId, isOnline) {
  try {
    const { pool } = require('./src/config/database');
    await pool.execute(
      'UPDATE advocates SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [isOnline, advocateId]
    );
    console.log(`✅ Updated advocate ${advocateId} online status: ${isOnline}`);
  } catch (error) {
    console.error('❌ Error updating advocate status:', error);
  }
}

// ✅ Routes
app.use('/api', analyzeRoutes);
app.use('/api', translationRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/advocate-auth', advocateAuthRoutes);
app.use('/api/advocate-chat', advocateChat);
app.use(ttsRoute);

// ✅ Production-ready admin routes for advocate management
app.get('/admin/advocates', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    const [advocates] = await pool.execute(`
      SELECT 
        id, full_name, email, phone, bar_council_number, experience,
        specializations, languages, consultation_fee, rating, 
        total_consultations, is_online, status, city, state,
        created_at, updated_at, last_seen
      FROM advocates 
      ORDER BY created_at DESC
    `);

    const formattedAdvocates = advocates.map(advocate => ({
      ...advocate,
      specializations: JSON.parse(advocate.specializations || '[]'),
      languages: JSON.parse(advocate.languages || '[]')
    }));

    res.json({
      success: true,
      count: advocates.length,
      advocates: formattedAdvocates
    });
  } catch (error) {
    console.error('❌ Admin get advocates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Bulk approve all pending advocates
app.post('/admin/advocates/approve-all', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    
    console.log('🔄 Starting bulk approval process...');
    
    const [pending] = await pool.execute(
      'SELECT id, full_name, email FROM advocates WHERE status = ?',
      ['pending']
    );

    if (pending.length === 0) {
      console.log('ℹ️ No pending advocates found');
      return res.json({
        success: true,
        message: 'No pending advocates to approve',
        approved: []
      });
    }

    console.log(`🔄 Found ${pending.length} pending advocates to approve`);

    const [result] = await pool.execute(
      'UPDATE advocates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE status = ?',
      ['approved', 'pending']
    );

    console.log(`✅ Bulk approved ${result.affectedRows} advocates`);

    // Notify all newly approved advocates via Socket.IO
    pending.forEach(advocate => {
      io.to(`advocate-${advocate.id}`).emit('status-update', {
        status: 'approved',
        message: 'Congratulations! Your advocate profile has been approved.',
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      message: `Successfully approved ${result.affectedRows} advocates`,
      approved: pending.map(a => ({ id: a.id, name: a.full_name, email: a.email }))
    });
  } catch (error) {
    console.error('❌ Bulk approve error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Set advocates online for testing
app.post('/admin/advocates/set-online', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    
    console.log('🔄 Setting advocates online...');
    
    const [advocates] = await pool.execute(
      'SELECT id, full_name, email FROM advocates WHERE status = ?',
      ['approved']
    );
    
    if (advocates.length === 0) {
      return res.json({
        success: true,
        message: 'No approved advocates found',
        onlineAdvocates: []
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE advocates SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE status = ?',
      ['approved']
    );
    
    console.log(`✅ Set ${result.affectedRows} advocates online`);
    
    // Broadcast status updates
    advocates.forEach(advocate => {
      io.emit('advocate-status-update', {
        advocateId: advocate.id,
        isOnline: true,
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      message: `Successfully set ${result.affectedRows} advocates online`,
      onlineAdvocates: advocates.map(a => ({ id: a.id, name: a.full_name, email: a.email }))
    });
  } catch (error) {
    console.error('❌ Set online error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Real-time statistics endpoint
app.get('/admin/stats', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    
    const [advocateStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_advocates,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_advocates,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_advocates,
        SUM(CASE WHEN is_online = true AND status = 'approved' THEN 1 ELSE 0 END) as online_advocates
      FROM advocates
    `);

    const [consultationStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_consultations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_consultations
      FROM consultations
    `);

    const [userStats] = await pool.execute(`
      SELECT COUNT(*) as total_users FROM users
    `);

    res.json({
      success: true,
      stats: {
        advocates: advocateStats[0],
        consultations: consultationStats[0],
        users: userStats[0],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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

// ✅ Health check with real-time status
app.get('/health', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    
    // Test database connection
    await pool.execute('SELECT 1');
    
    // Get real-time counts
    const [advocateCount] = await pool.execute('SELECT COUNT(*) as count FROM advocates WHERE is_online = true');
    const [activeConsultations] = await pool.execute('SELECT COUNT(*) as count FROM consultations WHERE status = "active"');
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
        socketio: 'active',
        advocateSystem: 'active'
      },
      realTimeStats: {
        onlineAdvocates: advocateCount[0].count,
        activeConsultations: activeConsultations[0].count,
        connectedSockets: io.engine.clientsCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Root route
app.get('/', (req, res) => {
  res.json({
    message: 'LegalSetu Production API',
    version: '1.0.0',
    features: [
      'Real-time advocate chat',
      'Document analysis',
      'Form filling',
      'Multi-language support',
      'Live notifications'
    ],
    endpoints: {
      advocates: '/api/advocate-chat/advocates',
      auth: '/api/advocate-auth',
      admin: '/admin/advocates',
      health: '/health',
      stats: '/admin/stats'
    }
  });
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
    console.log(`🚀 LegalSetu Production Server running on port ${PORT}`);
    console.log(`📊 Database: Connected`);
    console.log(`👩‍⚖️ Advocate System: Initialized`);
    console.log(`🔌 Socket.IO: Active for real-time features`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using fallback'}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`🌐 Google Translate: ${process.env.GOOGLE_API_KEY ? 'Set' : 'MISSING'}`);
    console.log(`📋 Forms API: Available at /api/forms`);
    console.log(`⚖️  Advocate API: Available at /api/advocate-auth & /api/advocate-chat`);
    console.log(`🔍 Admin Panel: Available at /admin/advocates`);
    console.log(`📊 Real-time Stats: Available at /admin/stats`);
    console.log(`🏥 Health Check: Available at /health`);
    console.log(`🌍 Production Ready: Real-time chat, notifications, and advocate management`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;