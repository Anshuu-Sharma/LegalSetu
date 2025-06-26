// server/src/routes/advocateChat.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Middleware to authenticate users and advocates
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get available advocates
router.get('/advocates', authenticateUser, async (req, res) => {
  try {
    const { specialization, language, minRating, maxFee, isOnline } = req.query;
    
    console.log('Fetching advocates with filters:', { specialization, language, minRating, maxFee, isOnline });
    
    let query = `
      SELECT 
        id, full_name, specializations, languages, experience,
        consultation_fee, rating, total_consultations, is_online,
        profile_photo_url, bio, city, state, last_seen
      FROM advocates 
      WHERE status = 'approved'
    `;
    
    const params = [];

    if (specialization) {
      query += ` AND JSON_CONTAINS(specializations, ?)`;
      params.push(`"${specialization}"`);
    }

    if (language) {
      query += ` AND JSON_CONTAINS(languages, ?)`;
      params.push(`"${language}"`);
    }

    if (minRating) {
      query += ` AND rating >= ?`;
      params.push(parseFloat(minRating));
    }

    if (maxFee) {
      query += ` AND consultation_fee <= ?`;
      params.push(parseFloat(maxFee));
    }

    if (isOnline === 'true') {
      query += ` AND is_online = true`;
    }

    query += ` ORDER BY is_online DESC, rating DESC, total_consultations DESC`;

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [advocates] = await pool.execute(query, params);

    console.log(`Found ${advocates.length} advocates`);

    const formattedAdvocates = advocates.map(advocate => ({
      ...advocate,
      specializations: JSON.parse(advocate.specializations || '[]'),
      languages: JSON.parse(advocate.languages || '[]')
    }));

    res.json({
      success: true,
      advocates: formattedAdvocates
    });
  } catch (error) {
    console.error('Get advocates error:', error);
    res.status(500).json({ success: false, error: 'Failed to get advocates: ' + error.message });
  }
});

// Get advocate details
router.get('/advocates/:advocateId', authenticateUser, async (req, res) => {
  try {
    const { advocateId } = req.params;

    const [advocates] = await pool.execute(`
      SELECT 
        id, full_name, specializations, languages, experience,
        consultation_fee, rating, total_consultations, is_online,
        profile_photo_url, bio, city, state, education,
        courts_practicing, bar_council_number, last_seen
      FROM advocates 
      WHERE id = ? AND status = 'approved'
    `, [advocateId]);

    if (advocates.length === 0) {
      return res.status(404).json({ success: false, error: 'Advocate not found' });
    }

    const advocate = advocates[0];

    // Get recent reviews
    const [reviews] = await pool.execute(`
      SELECT rating, review_text, created_at, u.name as user_name
      FROM advocate_reviews ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.advocate_id = ?
      ORDER BY ar.created_at DESC
      LIMIT 5
    `, [advocateId]);

    res.json({
      success: true,
      advocate: {
        ...advocate,
        specializations: JSON.parse(advocate.specializations || '[]'),
        languages: JSON.parse(advocate.languages || '[]'),
        courtsPracticing: JSON.parse(advocate.courts_practicing || '[]'),
        reviews
      }
    });
  } catch (error) {
    console.error('Get advocate details error:', error);
    res.status(500).json({ success: false, error: 'Failed to get advocate details: ' + error.message });
  }
});

// Start consultation
router.post('/consultations/start', authenticateUser, async (req, res) => {
  try {
    const { advocateId, consultationType = 'chat' } = req.body;
    const userId = req.user.userId || req.user.advocateId;

    console.log('Starting consultation:', { advocateId, userId, consultationType });

    if (!advocateId) {
      return res.status(400).json({
        success: false,
        error: 'Advocate ID is required'
      });
    }

    // Check if advocate is available
    const [advocates] = await pool.execute(
      'SELECT * FROM advocates WHERE id = ? AND status = "approved"',
      [advocateId]
    );

    if (advocates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Advocate is not available or not found'
      });
    }

    const advocate = advocates[0];

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create consultation session
    const [result] = await pool.execute(`
      INSERT INTO consultations (
        user_id, advocate_id, consultation_type, fee_amount, status
      ) VALUES (?, ?, ?, ?, 'active')
    `, [userId, advocateId, consultationType, advocate.consultation_fee]);

    const consultationId = result.insertId;

    // Create initial chat room
    await pool.execute(`
      INSERT INTO chat_rooms (
        consultation_id, user_id, advocate_id, status
      ) VALUES (?, ?, ?, 'active')
    `, [consultationId, userId, advocateId]);

    console.log('Consultation created with ID:', consultationId);

    res.json({
      success: true,
      consultation: {
        id: consultationId,
        advocateId,
        advocateName: advocate.full_name,
        consultationType,
        feeAmount: advocate.consultation_fee,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({ success: false, error: 'Failed to start consultation: ' + error.message });
  }
});

// Get user's consultations
router.get('/consultations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.advocateId;
    const userType = req.user.type || 'user';

    let query, params;

    if (userType === 'advocate') {
      query = `
        SELECT 
          c.*, u.name as user_name, u.email as user_email,
          cr.id as chat_room_id, cr.last_message, cr.last_message_time
        FROM consultations c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN chat_rooms cr ON c.id = cr.consultation_id
        WHERE c.advocate_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          c.*, a.full_name as advocate_name, a.profile_photo_url,
          cr.id as chat_room_id, cr.last_message, cr.last_message_time
        FROM consultations c
        JOIN advocates a ON c.advocate_id = a.id
        LEFT JOIN chat_rooms cr ON c.id = cr.consultation_id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    }

    const [consultations] = await pool.execute(query, params);

    res.json({
      success: true,
      consultations
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get consultations: ' + error.message });
  }
});

// Send message
router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { consultationId, message, messageType = 'text' } = req.body;
    const senderId = req.user.userId || req.user.advocateId;
    const senderType = req.user.type || 'user';

    if (!consultationId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Consultation ID and message are required'
      });
    }

    // Verify consultation exists and user has access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?) AND status = 'active'
    `, [consultationId, senderId, senderId]);

    if (consultations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or consultation not found'
      });
    }

    // Insert message
    const [result] = await pool.execute(`
      INSERT INTO chat_messages (
        consultation_id, sender_id, sender_type, message, message_type
      ) VALUES (?, ?, ?, ?, ?)
    `, [consultationId, senderId, senderType, message, messageType]);

    // Update chat room last message
    await pool.execute(`
      UPDATE chat_rooms 
      SET last_message = ?, last_message_time = CURRENT_TIMESTAMP
      WHERE consultation_id = ?
    `, [message, consultationId]);

    res.json({
      success: true,
      message: {
        id: result.insertId,
        consultationId,
        senderId,
        senderType,
        message,
        messageType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message: ' + error.message });
  }
});

// Get messages for consultation
router.get('/consultations/:consultationId/messages', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId || req.user.advocateId;

    // Verify access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?)
    `, [consultationId, userId, userId]);

    if (consultations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [messages] = await pool.execute(`
      SELECT * FROM chat_messages 
      WHERE consultation_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [consultationId, parseInt(limit), offset]);

    res.json({
      success: true,
      messages: messages.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages: ' + error.message });
  }
});

// End consultation
router.patch('/consultations/:consultationId/end', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.userId || req.user.advocateId;

    // Verify access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?) AND status = 'active'
    `, [consultationId, userId, userId]);

    if (consultations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or consultation not found'
      });
    }

    // End consultation
    await pool.execute(`
      UPDATE consultations 
      SET status = 'completed', ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [consultationId]);

    // Update chat room status
    await pool.execute(`
      UPDATE chat_rooms 
      SET status = 'closed'
      WHERE consultation_id = ?
    `, [consultationId]);

    res.json({
      success: true,
      message: 'Consultation ended successfully'
    });
  } catch (error) {
    console.error('End consultation error:', error);
    res.status(500).json({ success: false, error: 'Failed to end consultation: ' + error.message });
  }
});

// Submit review
router.post('/reviews', authenticateUser, async (req, res) => {
  try {
    const { consultationId, advocateId, rating, reviewText } = req.body;
    const userId = req.user.userId;

    if (req.user.type === 'advocate') {
      return res.status(403).json({
        success: false,
        error: 'Advocates cannot submit reviews'
      });
    }

    if (!consultationId || !advocateId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Consultation ID, advocate ID, and rating are required'
      });
    }

    // Verify consultation exists and is completed
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND user_id = ? AND advocate_id = ? AND status = 'completed'
    `, [consultationId, userId, advocateId]);

    if (consultations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consultation or consultation not completed'
      });
    }

    // Check if review already exists
    const [existingReviews] = await pool.execute(`
      SELECT id FROM advocate_reviews 
      WHERE consultation_id = ? AND user_id = ?
    `, [consultationId, userId]);

    if (existingReviews.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Review already submitted for this consultation'
      });
    }

    // Insert review
    await pool.execute(`
      INSERT INTO advocate_reviews (
        consultation_id, user_id, advocate_id, rating, review_text
      ) VALUES (?, ?, ?, ?, ?)
    `, [consultationId, userId, advocateId, rating, reviewText || '']);

    // Update advocate's average rating
    const [ratingStats] = await pool.execute(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM advocate_reviews 
      WHERE advocate_id = ?
    `, [advocateId]);

    await pool.execute(`
      UPDATE advocates 
      SET rating = ?, total_reviews = ?
      WHERE id = ?
    `, [ratingStats[0].avg_rating, ratingStats[0].total_reviews, advocateId]);

    res.json({
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review: ' + error.message });
  }
});

module.exports = router;