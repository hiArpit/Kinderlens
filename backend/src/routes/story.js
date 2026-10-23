const express = require('express');
const axios = require('axios');
const InteractionLog = require('../models/InteractionLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const router = express.Router();

router.post('/', async (req, res) => {
  const objectName = typeof req.body?.object_name === 'string'
    ? req.body.object_name.trim()
    : '';

  if (!objectName) {
    return res.status(400).json({
      error: 'OBJECT_NAME_REQUIRED',
      message: 'Choose an object before reading a story.',
    });
  }

  try {
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/story`,
      { object_name: objectName },
      { timeout: 20000 }
    );
    const data = aiResponse.data;

    if (!data.success) {
      return res.status(502).json({
        error: 'AI_SERVICE_ANALYSIS_ERROR',
        message: 'Could not make a story right now. Please try again.',
      });
    }

    if (data.is_safe === false || !data.grounding?.grounded) {
      return res.status(200).json({
        success: true,
        available: false,
        message: data.confidence_note || 'A trusted story is not available yet.',
      });
    }

    const historyEntry = await InteractionLog.create({
      outcome: 'story',
      activityType: 'story',
      objectName: data.object_name,
      grounding: {
        grounded: data.grounding.grounded,
        sourceTitle: data.grounding.source_title,
        sourceUrl: data.grounding.source_url,
      },
      story: {
        title: data.title,
        paragraphCount: data.paragraphs.length,
      },
    });

    return res.status(200).json({
      success: true,
      available: true,
      storyId: historyEntry._id,
      objectName: data.object_name,
      title: data.title,
      paragraphs: data.paragraphs,
      grounding: data.grounding,
    });
  } catch (error) {
    console.error('Error generating story:', error.message);
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'Could not make a story right now. Please try again.',
    });
  }
});

module.exports = router;
