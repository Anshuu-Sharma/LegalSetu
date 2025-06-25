// server/src/config/advocateDatabase.js
const { pool } = require('./database');

const initializeAdvocateDatabase = async () => {
  try {
    // Advocates table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advocates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        bar_council_number VARCHAR(50) UNIQUE NOT NULL,
        experience INT NOT NULL,
        specializations JSON,
        languages JSON,
        education TEXT,
        courts_practicing JSON,
        consultation_fee DECIMAL(10,2) NOT NULL,
        bio TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        profile_photo_url VARCHAR(500),
        document_urls JSON,
        status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
        is_online BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_consultations INT DEFAULT 0,
        total_reviews INT DEFAULT 0,
        last_seen TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_specializations ((CAST(specializations AS CHAR(255)))),
        INDEX idx_rating (rating),
        INDEX idx_is_online (is_online)
      )
    `);

    // Consultations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        advocate_id INT NOT NULL,
        consultation_type ENUM('chat', 'voice', 'video') DEFAULT 'chat',
        fee_amount DECIMAL(10,2) NOT NULL,
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        duration_minutes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_status (status),
        INDEX idx_started_at (started_at)
      )
    `);

    // Chat rooms table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultation_id INT NOT NULL,
        user_id INT NOT NULL,
        advocate_id INT NOT NULL,
        status ENUM('active', 'closed') DEFAULT 'active',
        last_message TEXT,
        last_message_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_user_id (user_id),
        INDEX idx_advocate_id (advocate_id)
      )
    `);

    // Chat messages table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultation_id INT NOT NULL,
        sender_id INT NOT NULL,
        sender_type ENUM('user', 'advocate') NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file', 'voice') DEFAULT 'text',
        file_url VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_sender (sender_id, sender_type),
        INDEX idx_created_at (created_at)
      )
    `);

    // Advocate reviews table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advocate_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultation_id INT NOT NULL,
        user_id INT NOT NULL,
        advocate_id INT NOT NULL,
        rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        UNIQUE KEY unique_review (consultation_id, user_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_rating (rating)
      )
    `);

    // Advocate availability table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advocate_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        advocate_id INT NOT NULL,
        day_of_week TINYINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_day_of_week (day_of_week)
      )
    `);

    // Wallet transactions table (for payment handling)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        advocate_id INT,
        consultation_id INT,
        transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        payment_gateway_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE SET NULL,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_status (status)
      )
    `);

    console.log('✅ Advocate database tables initialized successfully');
  } catch (error) {
    console.error('❌ Advocate database initialization failed:', error);
    throw error;
  }
};

module.exports = { initializeAdvocateDatabase };