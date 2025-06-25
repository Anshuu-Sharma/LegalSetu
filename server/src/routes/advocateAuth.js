// server/src/routes/advocateAuth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { uploadS3 } = require('../config/multer-s3');

const router = express.Router();

// Advocate Registration
router.post('/register', (req, res) => {
  const uploadMiddleware = uploadS3.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]);

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }

    try {
      const {
        fullName,
        email,
        password,
        phone,
        barCouncilNumber,
        experience,
        specializations,
        languages,
        education,
        courtsPracticing,
        consultationFee,
        bio,
        city,
        state
      } = req.body;

      // Check if advocate already exists
      const [existing] = await pool.execute(
        'SELECT id FROM advocates WHERE email = ? OR bar_council_number = ?',
        [email, barCouncilNumber]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Advocate already exists with this email or bar council number'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Handle file uploads
      const profilePhotoUrl = req.files?.profilePhoto?.[0]?.location || null;
      const documentUrls = req.files?.documents?.map(file => file.location) || [];

      // Insert advocate
      const [result] = await pool.execute(`
        INSERT INTO advocates (
          full_name, email, password, phone, bar_council_number,
          experience, specializations, languages, education,
          courts_practicing, consultation_fee, bio, city, state,
          profile_photo_url, document_urls, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        fullName, email, hashedPassword, phone, barCouncilNumber,
        experience, JSON.stringify(specializations.split(',')),
        JSON.stringify(languages.split(',')), education,
        JSON.stringify(courtsPracticing.split(',')), consultationFee,
        bio, city, state, profilePhotoUrl, JSON.stringify(documentUrls)
      ]);

      const token = jwt.sign(
        { advocateId: result.insertId, email, type: 'advocate' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful. Your profile is under review.',
        token,
        advocate: {
          id: result.insertId,
          fullName,
          email,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Advocate registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  });
});

// Advocate Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find advocate
    const [advocates] = await pool.execute(
      'SELECT * FROM advocates WHERE email = ?',
      [email]
    );

    if (advocates.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const advocate = advocates[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, advocate.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (advocate.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Your account is not yet approved or has been suspended'
      });
    }

    const token = jwt.sign(
      { advocateId: advocate.id, email: advocate.email, type: 'advocate' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      advocate: {
        id: advocate.id,
        fullName: advocate.full_name,
        email: advocate.email,
        phone: advocate.phone,
        specializations: JSON.parse(advocate.specializations || '[]'),
        languages: JSON.parse(advocate.languages || '[]'),
        consultationFee: advocate.consultation_fee,
        rating: advocate.rating,
        totalConsultations: advocate.total_consultations,
        isOnline: advocate.is_online,
        profilePhotoUrl: advocate.profile_photo_url
      }
    });
  } catch (error) {
    console.error('Advocate login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get advocate profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'advocate') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [advocates] = await pool.execute(
      'SELECT * FROM advocates WHERE id = ?',
      [decoded.advocateId]
    );

    if (advocates.length === 0) {
      return res.status(404).json({ success: false, error: 'Advocate not found' });
    }

    const advocate = advocates[0];
    res.json({
      success: true,
      advocate: {
        ...advocate,
        specializations: JSON.parse(advocate.specializations || '[]'),
        languages: JSON.parse(advocate.languages || '[]'),
        courtsPracticing: JSON.parse(advocate.courts_practicing || '[]'),
        documentUrls: JSON.parse(advocate.document_urls || '[]')
      }
    });
  } catch (error) {
    console.error('Get advocate profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// Update online status
router.patch('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'advocate') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { isOnline } = req.body;

    await pool.execute(
      'UPDATE advocates SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [isOnline, decoded.advocateId]
    );

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

module.exports = router;