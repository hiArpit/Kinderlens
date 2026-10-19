// Handles receiving the uploaded photo buffer
const handlePhotoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_PROVIDED',
        message: 'Please take or choose a photo.',
      });
    }

    // In Phase 1 Step 2, req.file.buffer will be sent to the AI service.
    // For Step 1, verify and acknowledge receipt:
    return res.status(200).json({
      success: true,
      fileInfo: {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        sizeBytes: req.file.size,
      },
      message: 'Photo received and validated successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Something went wrong while receiving the photo.',
    });
  }
};

module.exports = {
  handlePhotoUpload,
};