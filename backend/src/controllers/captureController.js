const axios = require('axios');
const FormData = require('form-data');
const InteractionLog = require('../models/InteractionLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const saveInteraction = async (data) => {
  const outcome = data.is_safe === false
    ? 'unsafe'
    : data.identified
      ? 'identified'
      : 'unidentified';

  await InteractionLog.create({
    outcome,
    objectName: data.object_name,
    kidSummary: data.kid_summary,
    funFact: data.fun_fact,
    actionPrompt: data.action_prompt,
    readability: data.readability && {
      gradeLevel: data.readability.grade_level,
      readingEase: data.readability.reading_ease,
      ageAppropriate: data.readability.age_appropriate,
    },
    grounding: data.grounding && {
      grounded: data.grounding.grounded,
      sourceTitle: data.grounding.source_title,
      sourceUrl: data.grounding.source_url,
    },
    confidenceNote: data.confidence_note,
    possibleObjects: data.possible_objects || [],
    needsClearerImage: data.needs_clearer_image || false,
  });
};

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

    if (!data.success) {
      console.error('AI service analysis failed:', data.error || 'Unknown vision error');
      return res.status(502).json({
        error: 'AI_SERVICE_ANALYSIS_ERROR',
        message: 'Could not analyze this item right now. Please try again.',
      });
    }

    await saveInteraction(data);

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
        message: data.confidence_note || "Hmm, I couldn't quite see what that was. Try holding it steady or moving to better light!",
        confidenceNote: data.confidence_note,
        possibleObjects: data.possible_objects || [],
        needsClearerImage: data.needs_clearer_image || false,
        grounding: data.grounding,
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