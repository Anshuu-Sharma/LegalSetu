// server/src/config/multer-s3.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3 } = require('./s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/tiff',
    'image/bmp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, TIFF, BMP allowed.'), false);
  }
};

// S3 upload configuration
const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'private', // Files are private by default
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedBy: req.user?.id || 'anonymous',
        uploadedAt: new Date().toISOString()
      });
    },
    key: function (req, file, cb) {
      const userId = req.user?.id || 'anonymous';
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const s3Key = `users/${userId}/documents/${fileName}`;
      
      // Store the key for later use
      req.s3Key = s3Key;
      cb(null, s3Key);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Local storage configuration (fallback)
const uploadLocal = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = `uploads/users/${req.user?.id || 'anonymous'}/`;
      require('fs').mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, fileName);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});

// Export both configurations
module.exports = {
  uploadS3,
  uploadLocal,
  fileFilter
};
