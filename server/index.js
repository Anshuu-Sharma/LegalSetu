// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

const router = express.Router();

// MySQL Pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL_CA
    ? {
        ca: fs.readFileSync(process.env.DB_SSL_CA),
        rejectUnauthorized: true
      }
    : undefined,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 60000,
});

// Database connection verification with retry logic
const verifyConnection = async (attempt = 1) => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database');
    conn.release();
  } catch (err) {
    console.error(`Connection attempt ${attempt} failed:`, err.message);
    if (attempt < 3) {
      console.log(`Retrying connection in 5 seconds...`);
      setTimeout(() => verifyConnection(attempt + 1), 5000);
    } else {
      console.error('Failed to connect after 3 attempts');
      process.exit(1);
    }
  }
};

// Connection keep-alive
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Keep-alive query successful');
  } catch (err) {
    console.error('Keep-alive query failed:', err.message);
  }
}, 5 * 60 * 1000);

// Handle pool errors
pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('Connection error:', err.message);
  });
});

// Initialize connection
verifyConnection();

// Translation endpoint with connection recovery
router.post('/translate', async (req, res) => {
  const { text, targetLang, sourceLang = 'en' } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex');

  try {
    // Attempt to execute query
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

    // Store in database with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await pool.execute(
          `INSERT INTO translations
           (source_text_hash, source_lang, target_lang, translated_text)
           VALUES (?, ?, ?, ?)`,
          [hash, sourceLang, targetLang, translated]
        );
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`Retrying insert (${retries} attempts remaining)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

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
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Handle specific MySQL errors
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting to reconnect to database...');
      await verifyConnection();
    }

    res.status(500).json({
      error: 'Translation failed',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack
      })
    });
  }
});

module.exports = router;
