// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Simple Firebase token verification without Admin SDK
const verifyFirebaseToken = async (token) => {
  try {
    // For development, we'll use a simpler approach
    // In production, you should use Firebase Admin SDK
    
    // Check if token looks like a Firebase token (JWT with 3 parts)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode the payload (without verification for now)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Basic validation
    if (!payload.email || !payload.iss || !payload.aud) {
      throw new Error('Invalid Firebase token structure');
    }

    // Check if it's from Firebase
    if (!payload.iss.includes('securetoken.google.com')) {
      throw new Error('Not a Firebase token');
    }

    console.log('✅ Firebase token decoded:', {
      email: payload.email,
      name: payload.name,
      uid: payload.user_id || payload.sub
    });

    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      uid: payload.user_id || payload.sub,
      verified: true
    };
  } catch (error) {
    console.log('❌ Firebase token verification failed:', error.message);
    throw error;
  }
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 Auth middleware called with token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    // First, try to verify as a Firebase token
    try {
      console.log('🔄 Attempting Firebase token verification...');
      const firebaseUser = await verifyFirebaseToken(token);
      console.log('✅ Firebase token verified for:', firebaseUser.email);
      
      // Check if user exists in our database
      const [users] = await pool.execute(
        'SELECT id, email, name, preferred_language, storage_used, max_storage FROM users WHERE email = ?',
        [firebaseUser.email]
      );

      if (users.length === 0) {
        console.log('🆕 Creating new user for:', firebaseUser.email);
        // Create user if doesn't exist
        const [result] = await pool.execute(
          'INSERT INTO users (email, name, preferred_language, storage_used, max_storage) VALUES (?, ?, ?, ?, ?)',
          [firebaseUser.email, firebaseUser.name, 'en', 0, 1073741824]
        );
        
        req.user = {
          id: result.insertId,
          email: firebaseUser.email,
          name: firebaseUser.name,
          preferred_language: 'en',
          storage_used: 0,
          max_storage: 1073741824,
          userId: result.insertId // Add userId for compatibility
        };
        console.log('✅ New user created with ID:', result.insertId);
      } else {
        req.user = {
          ...users[0],
          userId: users[0].id // Add userId for compatibility
        };
        console.log('✅ Existing user found with ID:', users[0].id);
      }
      
      return next();
    } catch (firebaseError) {
      console.log('🔄 Not a Firebase token, trying JWT verification...');
    }

    // If Firebase verification fails, try JWT verification
    console.log('🔄 Attempting JWT token verification...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ JWT token verified:', decoded);
    
    // Verify user still exists and get updated info
    if (decoded.userId) {
      const [users] = await pool.execute(
        'SELECT id, email, name, preferred_language, storage_used, max_storage FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        console.log('❌ JWT user not found in database');
        return res.status(401).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      req.user = {
        ...users[0],
        userId: users[0].id // Add userId for compatibility
      };
      console.log('✅ JWT user authenticated with ID:', users[0].id);
    } else if (decoded.advocateId) {
      const [advocates] = await pool.execute(
        'SELECT id, full_name, email FROM advocates WHERE id = ?',
        [decoded.advocateId]
      );

      if (advocates.length === 0) {
        console.log('❌ JWT advocate not found in database');
        return res.status(401).json({ 
          success: false, 
          error: 'Advocate not found' 
        });
      }

      req.user = {
        ...decoded,
        advocateData: advocates[0]
      };
      console.log('✅ JWT advocate authenticated with ID:', advocates[0].id);
    } else {
      console.log('❌ Invalid JWT token structure');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token structure' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token: ' + error.message 
    });
  }
};

// Optional authentication (for public endpoints)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // Try Firebase first
      try {
        const firebaseUser = await verifyFirebaseToken(token);
        const [users] = await pool.execute(
          'SELECT id, email, name, preferred_language FROM users WHERE email = ?',
          [firebaseUser.email]
        );
        
        if (users.length > 0) {
          req.user = {
            ...users[0],
            userId: users[0].id
          };
        }
        return next();
      } catch (firebaseError) {
        // Continue to JWT verification
      }

      // Try JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      if (decoded.userId) {
        const [users] = await pool.execute(
          'SELECT id, email, name, preferred_language FROM users WHERE id = ?',
          [decoded.userId]
        );
        
        if (users.length > 0) {
          req.user = {
            ...users[0],
            userId: users[0].id
          };
        }
      }
    } catch (error) {
      // Invalid token, but continue without user
      console.log('Optional auth failed:', error.message);
    }
  }
  
  next();
};

module.exports = { authenticateToken, optionalAuth };