// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // For development, you can use a service account key
    // In production, use environment variables or other secure methods
    admin.initializeApp({
      // You can add your Firebase config here if needed
      // For now, we'll handle Firebase tokens manually
    });
  } catch (error) {
    console.log('Firebase Admin initialization skipped:', error.message);
  }
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    // First, try to verify as a Firebase token
    try {
      if (admin.apps.length > 0) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('✅ Firebase token verified:', decodedToken.uid);
        
        // Check if user exists in our database
        const [users] = await pool.execute(
          'SELECT id, email, name, preferred_language, storage_used, max_storage FROM users WHERE email = ?',
          [decodedToken.email]
        );

        if (users.length === 0) {
          // Create user if doesn't exist
          const [result] = await pool.execute(
            'INSERT INTO users (email, name, preferred_language) VALUES (?, ?, ?)',
            [decodedToken.email, decodedToken.name || 'User', 'en']
          );
          
          req.user = {
            id: result.insertId,
            email: decodedToken.email,
            name: decodedToken.name || 'User',
            preferred_language: 'en',
            storage_used: 0,
            max_storage: 1073741824,
            userId: result.insertId // Add userId for compatibility
          };
        } else {
          req.user = {
            ...users[0],
            userId: users[0].id // Add userId for compatibility
          };
        }
        
        return next();
      }
    } catch (firebaseError) {
      console.log('🔄 Not a Firebase token, trying JWT...');
    }

    // If Firebase verification fails, try JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ JWT token verified:', decoded);
    
    // Verify user still exists and get updated info
    if (decoded.userId) {
      const [users] = await pool.execute(
        'SELECT id, email, name, preferred_language, storage_used, max_storage FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      req.user = {
        ...users[0],
        userId: users[0].id // Add userId for compatibility
      };
    } else if (decoded.advocateId) {
      const [advocates] = await pool.execute(
        'SELECT id, full_name, email FROM advocates WHERE id = ?',
        [decoded.advocateId]
      );

      if (advocates.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'Advocate not found' 
        });
      }

      req.user = {
        ...decoded,
        advocateData: advocates[0]
      };
    } else {
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
      error: 'Invalid or expired token' 
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
      if (admin.apps.length > 0) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          const [users] = await pool.execute(
            'SELECT id, email, name, preferred_language FROM users WHERE email = ?',
            [decodedToken.email]
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