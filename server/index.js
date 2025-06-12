require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const axios = require('axios');

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,  // All localhost ports
  process.env.PRODUCTION_URL    // Your production domain
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Check against allowed origins
    if (allowedOrigins.some(rule => 
      typeof rule === 'string' 
        ? rule === origin 
        : rule.test(origin)
    )) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Database connection verification
pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Translation endpoint
app.post('/translate', async (req, res) => {
  const { text, targetLang, sourceLang = 'en' } = req.body;
  
  // Input validation
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  
  try {
    // Cache check
    const [cached] = await pool.execute(
      `SELECT translated_text FROM translations 
       WHERE source_text_hash = ? 
         AND source_lang = ? 
         AND target_lang = ? 
       LIMIT 1`,
      [hash, sourceLang, targetLang]
    );

    if (cached.length > 0) {
      await pool.execute(
        `UPDATE translations 
         SET last_used = CURRENT_TIMESTAMP 
         WHERE source_text_hash = ?`,
        [hash]
      );
      return res.json({ 
        translation: cached[0].translated_text, 
        cached: true 
      });
    }

    // Google Translate API call
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
      },
      {
        params: { key: process.env.GOOGLE_API_KEY },
        timeout: 5000
      }
    );

    if (!response.data?.data?.translations?.[0]?.translatedText) {
      throw new Error('Invalid API response structure');
    }

    const translated = response.data.data.translations[0].translatedText;

    // Store in database
    await pool.execute(
      `INSERT INTO translations 
       (source_text_hash, source_lang, target_lang, translated_text)
       VALUES (?, ?, ?, ?)`,
      [hash, sourceLang, targetLang, translated]
    );

    res.json({ 
      translation: translated, 
      cached: false 
    });

  } catch (err) {
    console.error('Translation error:');
    console.error('Request:', req.body);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      response: err.response?.data
    });

    res.status(500).json({ 
      error: 'Translation failed',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack
      })
    });
  }
});

// Server startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Google API Key:', process.env.GOOGLE_API_KEY ? '***' : 'MISSING');
  console.log('Allowed Origins:', allowedOrigins);
});
