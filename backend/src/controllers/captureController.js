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

    // Safety gate triggered
    if (!data.is_safe) {
      return res.status(200).json({
        success: true,
        identified: false,
        isSafe: false,
        message: "This item is for grown-ups. Let's find something else to explore together!",
        safetyReason: data.safety_flag_reason,
      });
    }

    // Unidentified or blurry photo
    if (!data.identified) {
      return res.status(200).json({
        success: true,
        identified: false,
        isSafe: true,
        message: "Hmm, I couldn't quite see what that was. Try holding it steady or moving to better light!",
        confidenceNote: data.confidence_note,
      });
    }

    return res.status(200).json({
      success: true,
      identified: true,
      isSafe: true,
      objectName: data.object_name,
      kidSummary: data.kid_summary,
      funFact: data.fun_fact,
      actionPrompt: data.action_prompt,
      readability: data.readability,
      grounding: data.grounding,
    });

  } catch (error) {
    console.error('Error in captureController:', error.message);
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'Could not explore this item right now. Let’s try again!',
    });
  }
};

module.exports = {
  handlePhotoUpload,
};