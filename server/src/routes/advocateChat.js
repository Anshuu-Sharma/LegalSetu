// server/src/routes/advocateChat.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Simple authentication middleware specifically for advocate chat
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided in advocate chat');
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    console.log('🔍 Advocate chat - verifying token...');
    
    // Try Firebase token first (simple decode without verification for development)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        console.log('🔍 Token payload check:', {
          hasEmail: !!payload.email,
          email: payload.email,
          hasIss: !!payload.iss,
          exp: payload.exp,
          iat: payload.iat
        });
        
        // Basic validation for Firebase token
        if (payload.email && payload.iss && payload.iss.includes('securetoken.google.com')) {
          console.log('✅ Firebase-like token detected for:', payload.email);
          
          // Check if user exists in database
          const [users] = await pool.execute(
            'SELECT id, email, name FROM users WHERE email = ?',
            [payload.email]
          );
          
          if (users.length === 0) {
            console.log('🆕 Creating new user for advocate chat:', payload.email);
            // Create user if doesn't exist - with default password
            try {
              const [result] = await pool.execute(
                'INSERT INTO users (email, name, preferred_language, password) VALUES (?, ?, ?, ?)',
                [payload.email, payload.name || payload.email.split('@')[0], 'en', 'firebase_user']
              );
              
              req.user = {
                userId: result.insertId,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                type: 'user'
              };
              console.log('✅ New user created for advocate chat:', result.insertId);
            } catch (dbError) {
              console.error('❌ Database error creating user:', dbError);
              return res.status(500).json({ 
                success: false, 
                error: 'Failed to create user account' 
              });
            }
          } else {
            req.user = {
              userId: users[0].id,
              email: users[0].email,
              name: users[0].name,
              type: 'user'
            };
            console.log('✅ Existing user found for advocate chat:', users[0].id);
          }
          
          return next();
        }
      }
    } catch (firebaseError) {
      console.log('🔄 Firebase token parsing failed:', firebaseError.message);
    }

    // Try JWT token
    console.log('🔄 Trying JWT verification...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ JWT token decoded:', { userId: decoded.userId, advocateId: decoded.advocateId, type: decoded.type });
    
    // Check if it's a user token or advocate token
    if (decoded.userId) {
      // This is a regular user token
      const [users] = await pool.execute(
        'SELECT id, email, name FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (users.length === 0) {
        console.log('❌ JWT User not found in database');
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      
      req.user = { 
        userId: users[0].id,
        email: users[0].email,
        name: users[0].name,
        type: 'user'
      };
      console.log('✅ JWT user authenticated for advocate chat:', users[0].id);
    } else if (decoded.advocateId) {
      // This is an advocate token
      const [advocates] = await pool.execute(
        'SELECT id, full_name, email FROM advocates WHERE id = ?',
        [decoded.advocateId]
      );
      
      if (advocates.length === 0) {
        console.log('❌ JWT Advocate not found in database');
        return res.status(401).json({ success: false, error: 'Advocate not found' });
      }
      
      req.user = { 
        advocateId: advocates[0].id,
        email: advocates[0].email,
        name: advocates[0].full_name,
        type: 'advocate'
      };
      console.log('✅ JWT advocate authenticated for advocate chat:', advocates[0].id);
    } else {
      console.log('❌ Invalid JWT token structure');
      return res.status(401).json({ success: false, error: 'Invalid token structure' });
    }
    
    next();
  } catch (error) {
    console.error('❌ Advocate chat authentication error:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed. Please login again.' 
    });
  }
};

// ✅ FIXED: Helper function to safely parse JSON with better error handling
const safeJsonParse = (jsonString, fallback = []) => {
  if (!jsonString || jsonString === null || jsonString === undefined || jsonString === '') {
    return fallback;
  }
  
  // If it's already an array, return it
  if (Array.isArray(jsonString)) {
    return jsonString;
  }
  
  // If it's a string that looks like a comma-separated list, parse it
  if (typeof jsonString === 'string') {
    // Check if it's already JSON
    if (jsonString.startsWith('[') && jsonString.endsWith(']')) {
      try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (error) {
        console.warn('⚠️ Failed to parse JSON array:', jsonString, 'Error:', error.message);
        return fallback;
      }
    }
    
    // If it's a comma-separated string, split it
    if (jsonString.includes(',')) {
      return jsonString.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // If it's a single item, return as array
    if (jsonString.trim().length > 0) {
      return [jsonString.trim()];
    }
  }
  
  return fallback;
};

// Get available advocates
router.get('/advocates', authenticateUser, async (req, res) => {
  try {
    const { specialization, language, minRating, maxFee, isOnline } = req.query;
    
    console.log('🔍 Fetching advocates with filters:', { specialization, language, minRating, maxFee, isOnline });
    console.log('🔍 User making request:', { userId: req.user.userId, email: req.user.email });
    
    let query = `
      SELECT 
        id, full_name, specializations, languages, experience,
        consultation_fee, rating, total_consultations, is_online,
        profile_photo_url, bio, city, state, last_seen
      FROM advocates 
      WHERE status = ?
    `;
    
    const params = ['approved']; // ✅ FIXED: Use parameterized query instead of string literal

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

    console.log('📝 Executing query:', query);
    console.log('📝 With params:', params);

    const [advocates] = await pool.execute(query, params);

    console.log(`✅ Found ${advocates.length} advocates`);

    // ✅ FIXED: Safely parse JSON fields for each advocate with better error handling
    const formattedAdvocates = advocates.map(advocate => {
      try {
        return {
          ...advocate,
          specializations: safeJsonParse(advocate.specializations, []),
          languages: safeJsonParse(advocate.languages, []),
          // ✅ Ensure profile photo URL is properly formatted
          profile_photo_url: advocate.profile_photo_url 
            ? (advocate.profile_photo_url.startsWith('http') 
                ? advocate.profile_photo_url 
                : `${process.env.API_BASE_URL || 'http://localhost:5000'}${advocate.profile_photo_url}`)
            : null,
          // ✅ Ensure numeric fields are properly formatted
          rating: advocate.rating ? parseFloat(advocate.rating) : 0,
          consultation_fee: advocate.consultation_fee ? parseFloat(advocate.consultation_fee) : 0,
          total_consultations: advocate.total_consultations ? parseInt(advocate.total_consultations) : 0,
          experience: advocate.experience ? parseInt(advocate.experience) : 0
        };
      } catch (error) {
        console.error('❌ Error formatting advocate:', advocate.id, error);
        return {
          ...advocate,
          specializations: [],
          languages: [],
          profile_photo_url: null,
          rating: 0,
          consultation_fee: 0,
          total_consultations: 0,
          experience: 0
        };
      }
    });

    return res.json({
      success: true,
      advocates: formattedAdvocates
    });
  } catch (error) {
    console.error('❌ Error fetching advocates:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get advocates: ' + error.message 
    });
  }
});

// Get advocate details with complete information
router.get('/advocates/:advocateId', authenticateUser, async (req, res) => {
  try {
    const { advocateId } = req.params;

    const [advocates] = await pool.execute(`
      SELECT 
        id, full_name, email, phone, bar_council_number, experience,
        specializations, languages, education, courts_practicing,
        consultation_fee, rating, total_consultations, total_reviews,
        is_online, profile_photo_url, document_urls, bio, city, state, 
        last_seen, created_at
      FROM advocates 
      WHERE id = ? AND status = ?
    `, [advocateId, 'approved']); // ✅ FIXED: Use parameterized query

    if (advocates.length === 0) {
      return res.status(404).json({ success: false, error: 'Advocate not found' });
    }

    const advocate = advocates[0];

    // ✅ FIXED: Get recent reviews with proper column aliasing to avoid ambiguity
    const [reviews] = await pool.execute(`
      SELECT 
        ar.rating, 
        ar.review_text, 
        ar.created_at as review_date,
        u.name as user_name
      FROM advocate_reviews ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.advocate_id = ?
      ORDER BY ar.created_at DESC
      LIMIT 5
    `, [advocateId]);

    return res.json({
      success: true,
      advocate: {
        ...advocate,
        specializations: safeJsonParse(advocate.specializations, []),
        languages: safeJsonParse(advocate.languages, []),
        courts_practicing: safeJsonParse(advocate.courts_practicing, []),
        document_urls: safeJsonParse(advocate.document_urls, []),
        profile_photo_url: advocate.profile_photo_url 
          ? (advocate.profile_photo_url.startsWith('http') 
              ? advocate.profile_photo_url 
              : `${process.env.API_BASE_URL || 'http://localhost:5000'}${advocate.profile_photo_url}`)
          : null,
        reviews
      }
    });
  } catch (error) {
    console.error('Get advocate details error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get advocate details: ' + error.message 
    });
  }
});

// Get advocate reviews
router.get('/advocates/:advocateId/reviews', authenticateUser, async (req, res) => {
  try {
    const { advocateId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // ✅ FIXED: Use proper column aliasing to avoid ambiguity
    const [reviews] = await pool.execute(`
      SELECT 
        ar.rating, 
        ar.review_text, 
        ar.created_at as review_date,
        u.name as user_name
      FROM advocate_reviews ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.advocate_id = ?
      ORDER BY ar.created_at DESC
      LIMIT ? OFFSET ?
    `, [advocateId, parseInt(limit), offset]);

    return res.json({
      success: true,
      reviews: reviews.map(review => ({
        ...review,
        created_at: review.review_date // Map back to expected field name
      }))
    });
  } catch (error) {
    console.error('Get advocate reviews error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get reviews: ' + error.message 
    });
  }
});

// Start consultation
router.post('/consultations/start', authenticateUser, async (req, res) => {
  try {
    const { advocateId, consultationType = 'chat' } = req.body;
    const userId = req.user.userId;

    console.log('🚀 Starting consultation:', { advocateId, userId, consultationType });

    if (!advocateId) {
      return res.status(400).json({
        success: false,
        error: 'Advocate ID is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    // ✅ FIXED: Check if advocate is available using parameterized query
    const [advocates] = await pool.execute(
      'SELECT * FROM advocates WHERE id = ? AND status = ?',
      [advocateId, 'approved'] // ✅ FIXED: Use parameterized query instead of string literal
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

    console.log('✅ Consultation created with ID:', consultationId);

    return res.json({
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
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to start consultation: ' + error.message 
    });
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

    return res.json({
      success: true,
      consultations
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get consultations: ' + error.message 
    });
  }
});

// Send message
router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { consultationId, message, messageType = 'text' } = req.body;
    const senderId = req.user.userId || req.user.advocateId;
    const senderType = req.user.type || 'user';

    console.log('📤 Processing message send:', { consultationId, senderId, senderType, messageLength: message?.length });

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
      console.error('❌ Consultation access denied:', { consultationId, senderId });
      return res.status(403).json({
        success: false,
        error: 'Access denied or consultation not found'
      });
    }

    console.log('✅ Consultation access verified');

    // Insert message
    const [result] = await pool.execute(`
      INSERT INTO chat_messages (
        consultation_id, sender_id, sender_type, message, message_type
      ) VALUES (?, ?, ?, ?, ?)
    `, [consultationId, senderId, senderType, message, messageType]);

    console.log('✅ Message inserted with ID:', result.insertId);

    // Update chat room last message
    await pool.execute(`
      UPDATE chat_rooms 
      SET last_message = ?, last_message_time = CURRENT_TIMESTAMP
      WHERE consultation_id = ?
    `, [message, consultationId]);

    console.log('✅ Chat room updated');

    return res.json({
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
    console.error('❌ Send message error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send message: ' + error.message 
    });
  }
});

// ✅ FIXED: Get messages for consultation with proper parameter handling
router.get('/consultations/:consultationId/messages', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const userId = req.user.userId || req.user.advocateId;

    console.log('📨 Fetching messages for consultation:', { consultationId, userId, page, limit });

    // ✅ FIXED: Ensure parameters are properly converted to integers
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    console.log('📊 Query parameters:', { pageNum, limitNum, offset });

    // Verify access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?)
    `, [consultationId, userId, userId]);

    if (consultations.length === 0) {
      console.error('❌ Access denied to consultation:', consultationId);
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    console.log('✅ Consultation access verified');

    // ✅ FIXED: Use proper integer parameters for LIMIT and OFFSET
    const [messages] = await pool.execute(`
      SELECT * FROM chat_messages 
      WHERE consultation_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [consultationId, limitNum, offset]);

    console.log(`✅ Retrieved ${messages.length} messages`);

    return res.json({
      success: true,
      messages: messages.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get messages: ' + error.message 
    });
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

    return res.json({
      success: true,
      message: 'Consultation ended successfully'
    });
  } catch (error) {
    console.error('End consultation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to end consultation: ' + error.message 
    });
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

    return res.json({
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to submit review: ' + error.message 
    });
  }
});

module.exports = router;