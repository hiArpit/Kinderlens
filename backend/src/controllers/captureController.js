const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const handlePhotoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_PROVIDED',
        message: 'Please take or choose a photo.',
      });
    }

    // Prepare multipart form to forward the in-memory buffer to the Python AI service
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'capture.jpg',
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/vision/recognize`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 15000,
    });

    const data = aiResponse.data;

    // Handle low-confidence / unidentified cases gracefully (no silent errors)
    if (!data.identified) {
      return res.status(200).json({
        success: true,
        identified: false,
        message: "Hmm, I couldn't quite see what that was. Try holding it steady or moving to better light!",
        confidenceNote: data.confidence_note,
      });
    }

    return res.status(200).json({
      success: true,
      identified: true,
      objectName: data.object_name,
      rawDescription: data.raw_description,
    });

  } catch (error) {
    console.error('Error forwarding to AI service:', error.message);
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'Could not recognize the object right now. Please try again.',
    });
  }
};

module.exports = {
  handlePhotoUpload,
};