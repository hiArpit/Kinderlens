const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { handlePhotoUpload } = require('../controllers/captureController');

// Multer wrapper to capture and format upload errors cleanly
const uploadSinglePhoto = (req, res, next) => {
  const uploadHandler = upload.single('photo');

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'The photo is too large. Please use a photo under 5MB.',
        });
      }
      if (err.code === 'UNSUPPORTED_FORMAT') {
        return res.status(400).json({
          error: 'UNSUPPORTED_FORMAT',
          message: 'Please upload a valid image (JPEG, PNG, or WebP).',
        });
      }
      return res.status(400).json({
        error: 'UPLOAD_FAILED',
        message: err.message,
      });
    }
    next();
  });
};

router.post('/upload', uploadSinglePhoto, handlePhotoUpload);

module.exports = router;