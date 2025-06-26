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

// ✅ IMPROVED Admin route to approve advocates
app.patch('/admin/advocates/:advocateId/status', async (req, res) => {
  try {
    const { advocateId } = req.params;
    const { status } = req.body;
    const { pool } = require('./src/config/database');

    console.log(`🔧 Admin: Updating advocate ${advocateId} status to: ${status}`);

    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: approved, rejected, suspended, or pending'
      });
    }

    // Check if advocate exists first
    const [existing] = await pool.execute(
      'SELECT id, full_name, email, status FROM advocates WHERE id = ?',
      [advocateId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Advocate with ID ${advocateId} not found`
      });
    }

    console.log(`📋 Current advocate: ${existing[0].full_name} (${existing[0].email}) - Status: ${existing[0].status}`);

    // Update advocate status
    const [result] = await pool.execute(
      'UPDATE advocates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, advocateId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update advocate status'
      });
    }

    // Get updated advocate info
    const [updated] = await pool.execute(
      'SELECT id, full_name, email, status, updated_at FROM advocates WHERE id = ?',
      [advocateId]
    );

    console.log(`✅ Successfully updated advocate ${advocateId} to status: ${status}`);

    res.json({
      success: true,
      message: `Advocate ${status} successfully`,
      advocate: updated[0]
    });
  } catch (error) {
    console.error('❌ Admin status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update advocate status: ' + error.message
    });
  }
});

// ✅ FIXED Bulk approve all pending advocates
app.post('/admin/advocates/approve-all', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    
    console.log('🔄 Starting bulk approval process...');
    
    // Get all pending advocates - FIXED QUERY
    const [pending] = await pool.execute(
      'SELECT id, full_name, email FROM advocates WHERE status = ?',
      ['pending']  // ✅ Fixed: Use parameterized query instead of string literal
    );

    if (pending.length === 0) {
      console.log('ℹ️ No pending advocates found');
      return res.json({
        success: true,
        message: 'No pending advocates to approve',
        approved: []
      });
    }

    console.log(`🔄 Found ${pending.length} pending advocates to approve:`);
    pending.forEach(advocate => {
      console.log(`   - ${advocate.full_name} (${advocate.email}) - ID: ${advocate.id}`);
    });

    // Approve all pending advocates - FIXED QUERY
    const [result] = await pool.execute(
      'UPDATE advocates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE status = ?',
      ['approved', 'pending']  // ✅ Fixed: Use parameterized query
    );

    console.log(`✅ Bulk approved ${result.affectedRows} advocates`);

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

// ✅ NEW: Quick approve single advocate by ID
app.post('/admin/advocates/:advocateId/approve', async (req, res) => {
  try {
    const { advocateId } = req.params;
    const { pool } = require('./src/config/database');

    console.log(`🚀 Quick approving advocate ID: ${advocateId}`);

    // Get advocate info first
    const [advocate] = await pool.execute(
      'SELECT id, full_name, email, status FROM advocates WHERE id = ?',
      [advocateId]
    );

    if (advocate.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Advocate with ID ${advocateId} not found`
      });
    }

    const advocateInfo = advocate[0];
    console.log(`📋 Approving: ${advocateInfo.full_name} (${advocateInfo.email}) - Current status: ${advocateInfo.status}`);

    // Update to approved
    const [result] = await pool.execute(
      'UPDATE advocates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', advocateId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to approve advocate'
      });
    }

    console.log(`✅ Successfully approved advocate: ${advocateInfo.full_name}`);

    res.json({
      success: true,
      message: `Advocate ${advocateInfo.full_name} approved successfully`,
      advocate: {
        id: advocateInfo.id,
        name: advocateInfo.full_name,
        email: advocateInfo.email,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('❌ Quick approve error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Admin route to get all advocates with detailed info
app.get('/admin/advocates', async (req, res) => {
  try {
    const { pool } = require('./src/config/database');
    const [advocates] = await pool.execute(`
      SELECT 
        id, full_name, email, phone, bar_council_number, experience,
        specializations, languages, consultation_fee, rating, 
        total_consultations, is_online, status, city, state,
        created_at, updated_at
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
    console.log(`👨‍💼 Admin: Available at /admin/advocates`);
    console.log(`🚀 Quick Approve: POST /admin/advocates/{id}/approve`);
    console.log(`📦 Bulk Approve: POST /admin/advocates/approve-all`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;