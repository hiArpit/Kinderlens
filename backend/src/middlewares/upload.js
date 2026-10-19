const multer = require('multer');

// Store strictly in RAM buffer to respect data minimisation (Principle 4)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('UNSUPPORTED_FORMAT');
    error.code = 'UNSUPPORTED_FORMAT';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max limit
  },
  fileFilter,
});

module.exports = upload;