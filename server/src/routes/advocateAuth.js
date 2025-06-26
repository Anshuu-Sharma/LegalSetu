// server/src/routes/advocateAuth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads (fallback to local storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/advocates/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOC, DOCX allowed.'));
    }
  }
});

// ✅ ENHANCED: Helper function to safely parse JSON with comprehensive error handling
const safeJsonParse = (jsonString, fallback = []) => {
  // Handle null, undefined, or empty values
  if (!jsonString || jsonString === null || jsonString === undefined || jsonString === '') {
    console.log('🔄 Empty or null JSON string, returning fallback:', fallback);
    return fallback;
  }
  
  // If it's already an array, return it
  if (Array.isArray(jsonString)) {
    console.log('✅ Already an array:', jsonString);
    return jsonString;
  }
  
  // If it's a string, try to parse it
  if (typeof jsonString === 'string') {
    const trimmed = jsonString.trim();
    
    // Handle empty string after trimming
    if (trimmed === '') {
      console.log('🔄 Empty string after trim, returning fallback:', fallback);
      return fallback;
    }
    
    // Check if it's already valid JSON array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          console.log('✅ Successfully parsed JSON array:', parsed);
          return parsed;
        } else {
          console.warn('⚠️ Parsed JSON is not an array:', parsed);
          return fallback;
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse JSON array:', trimmed, 'Error:', error.message);
        // Try to extract content between brackets and split by comma
        const content = trimmed.slice(1, -1).trim();
        if (content) {
          return content.split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).filter(item => item.length > 0);
        }
        return fallback;
      }
    }
    
    // Check if it's a JSON object (shouldn't happen for arrays, but handle gracefully)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      console.warn('⚠️ Found JSON object instead of array:', trimmed);
      return fallback;
    }
    
    // Handle comma-separated string
    if (trimmed.includes(',')) {
      const items = trimmed.split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).filter(item => item.length > 0);
      console.log('✅ Parsed comma-separated string:', items);
      return items;
    }
    
    // Handle single item
    if (trimmed.length > 0) {
      const cleaned = trimmed.replace(/^["']|["']$/g, '');
      console.log('✅ Single item converted to array:', [cleaned]);
      return [cleaned];
    }
  }
  
  // Handle other data types
  if (typeof jsonString === 'number') {
    console.log('🔄 Number converted to string array:', [jsonString.toString()]);
    return [jsonString.toString()];
  }
  
  console.warn('⚠️ Unhandled data type, returning fallback:', typeof jsonString, jsonString);
  return fallback;
};

// Advocate Registration
router.post('/register', (req, res) => {
  const uploadMiddleware = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]);

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
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

      console.log('Registration data received:', {
        fullName,
        email,
        phone,
        barCouncilNumber,
        experience,
        consultationFee,
        city,
        state,
        specializations,
        languages
      });

      // Validation
      if (!fullName || !email || !password || !phone || !barCouncilNumber || !experience || !consultationFee) {
        return res.status(400).json({
          success: false,
          error: 'All required fields must be provided'
        });
      }

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

      // Handle file uploads - Generate proper URLs
      const profilePhotoUrl = req.files?.profilePhoto?.[0] 
        ? `/uploads/advocates/${req.files.profilePhoto[0].filename}` 
        : null;
      const documentUrls = req.files?.documents?.map(file => `/uploads/advocates/${file.filename}`) || [];

      // ✅ ENHANCED: Properly parse arrays from strings and convert to JSON
      const specializationsArray = specializations 
        ? (typeof specializations === 'string' 
            ? specializations.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : Array.isArray(specializations) ? specializations : [])
        : [];
        
      const languagesArray = languages 
        ? (typeof languages === 'string' 
            ? languages.split(',').map(l => l.trim()).filter(l => l.length > 0)
            : Array.isArray(languages) ? languages : [])
        : [];
        
      const courtsPracticingArray = courtsPracticing 
        ? (typeof courtsPracticing === 'string' 
            ? courtsPracticing.split(',').map(c => c.trim()).filter(c => c.length > 0)
            : Array.isArray(courtsPracticing) ? courtsPracticing : [])
        : [];

      console.log('✅ Processed arrays:', {
        specializationsArray,
        languagesArray,
        courtsPracticingArray,
        profilePhotoUrl,
        documentUrls
      });

      // Insert advocate with proper JSON arrays
      const [result] = await pool.execute(`
        INSERT INTO advocates (
          full_name, email, password, phone, bar_council_number,
          experience, specializations, languages, education,
          courts_practicing, consultation_fee, bio, city, state,
          profile_photo_url, document_urls, status, is_online
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false)
      `, [
        fullName, email, hashedPassword, phone, barCouncilNumber,
        parseInt(experience), 
        JSON.stringify(specializationsArray), // ✅ Store as proper JSON
        JSON.stringify(languagesArray),      // ✅ Store as proper JSON
        education || '',
        JSON.stringify(courtsPracticingArray), // ✅ Store as proper JSON
        parseFloat(consultationFee),
        bio || '', city || '', state || '', 
        profilePhotoUrl, // ✅ Store proper URL path
        JSON.stringify(documentUrls) // ✅ Store as proper JSON
      ]);

      console.log('✅ Advocate registered with ID:', result.insertId);

      const token = jwt.sign(
        { advocateId: result.insertId, email, type: 'advocate' },
        process.env.JWT_SECRET || 'fallback-secret',
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
          status: 'pending',
          profilePhotoUrl
        }
      });
    } catch (error) {
      console.error('❌ Advocate registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed: ' + error.message
      });
    }
  });
});

// ✅ CRITICAL FIX: Advocate Login with comprehensive JSON parsing and error handling
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('🔍 Advocate login attempt for:', email);

    // Find advocate
    const [advocates] = await pool.execute(
      'SELECT * FROM advocates WHERE email = ?',
      [email]
    );

    if (advocates.length === 0) {
      console.log('❌ Advocate not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const advocate = advocates[0];
    console.log('🔍 Found advocate:', advocate.full_name, 'Status:', advocate.status);
    console.log('🔍 Raw specializations from DB:', advocate.specializations);
    console.log('🔍 Raw languages from DB:', advocate.languages);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, advocate.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (advocate.status !== 'approved') {
      console.log('❌ Advocate not approved:', email, 'Status:', advocate.status);
      return res.status(403).json({
        success: false,
        error: `Your account status is: ${advocate.status}. Please wait for approval or contact support.`
      });
    }

    // Update last seen and online status
    await pool.execute(
      'UPDATE advocates SET last_seen = CURRENT_TIMESTAMP, is_online = true WHERE id = ?',
      [advocate.id]
    );

    const token = jwt.sign(
      { advocateId: advocate.id, email: advocate.email, type: 'advocate' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    console.log('✅ Advocate login successful:', advocate.full_name);

    // ✅ CRITICAL FIX: Safely parse JSON fields with comprehensive error handling
    let parsedSpecializations = [];
    let parsedLanguages = [];
    
    try {
      parsedSpecializations = safeJsonParse(advocate.specializations, []);
      console.log('✅ Parsed specializations:', parsedSpecializations);
    } catch (error) {
      console.error('❌ Error parsing specializations:', error);
      parsedSpecializations = [];
    }
    
    try {
      parsedLanguages = safeJsonParse(advocate.languages, []);
      console.log('✅ Parsed languages:', parsedLanguages);
    } catch (error) {
      console.error('❌ Error parsing languages:', error);
      parsedLanguages = [];
    }

    const advocateResponse = {
      id: advocate.id,
      fullName: advocate.full_name,
      email: advocate.email,
      phone: advocate.phone,
      specializations: parsedSpecializations,
      languages: parsedLanguages,
      consultationFee: advocate.consultation_fee,
      rating: advocate.rating || 0,
      totalConsultations: advocate.total_consultations || 0,
      isOnline: true,
      profilePhotoUrl: advocate.profile_photo_url,
      status: advocate.status
    };

    console.log('✅ Sending advocate response:', {
      id: advocateResponse.id,
      fullName: advocateResponse.fullName,
      specializationsCount: advocateResponse.specializations.length,
      languagesCount: advocateResponse.languages.length,
      specializations: advocateResponse.specializations,
      languages: advocateResponse.languages
    });

    res.json({
      success: true,
      token,
      advocate: advocateResponse
    });
  } catch (error) {
    console.error('❌ Advocate login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed: ' + error.message
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
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
        specializations: safeJsonParse(advocate.specializations, []),
        languages: safeJsonParse(advocate.languages, []),
        courtsPracticing: safeJsonParse(advocate.courts_practicing, []),
        documentUrls: safeJsonParse(advocate.document_urls, [])
      }
    });
  } catch (error) {
    console.error('Get advocate profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile: ' + error.message });
  }
});

// Update online status
router.patch('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
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
    res.status(500).json({ success: false, error: 'Failed to update status: ' + error.message });
  }
});

// Admin route to approve advocates (for testing)
router.patch('/approve/:advocateId', async (req, res) => {
  try {
    const { advocateId } = req.params;
    const { status } = req.body; // 'approved', 'rejected', 'suspended'

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be approved, rejected, or suspended'
      });
    }

    // Update advocate status
    const [result] = await pool.execute(
      'UPDATE advocates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, advocateId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Advocate not found'
      });
    }

    // Get updated advocate info
    const [advocates] = await pool.execute(
      'SELECT id, full_name, email, status FROM advocates WHERE id = ?',
      [advocateId]
    );

    console.log(`Advocate ${advocateId} status updated to: ${status}`);

    res.json({
      success: true,
      message: `Advocate ${status} successfully`,
      advocate: advocates[0]
    });
  } catch (error) {
    console.error('Approve advocate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update advocate status: ' + error.message
    });
  }
});

// Get all advocates (for admin)
router.get('/all', async (req, res) => {
  try {
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
      specializations: safeJsonParse(advocate.specializations, []),
      languages: safeJsonParse(advocate.languages, [])
    }));

    res.json({
      success: true,
      advocates: formattedAdvocates
    });
  } catch (error) {
    console.error('Get all advocates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get advocates: ' + error.message
    });
  }
});

module.exports = router;