const express = require('express');
const axios = require('axios');
const WONDER_LIST = require('../data/wonderList');
const InteractionLog = require('../models/InteractionLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ success: true, items: WONDER_LIST });
});

router.post('/:slug/explore', async (req, res) => {
  const item = WONDER_LIST.find((entry) => entry.slug === req.params.slug);
  if (!item) {
    return res.status(404).json({ error: 'WONDER_ITEM_NOT_FOUND', message: 'That discovery is not available.' });
  }

  try {
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/explain/object`,
      { object_name: item.name, language: req.body.language || 'english' },
      { timeout: 30000 }
    );
    const data = aiResponse.data;

    if (!data.success) {
      return res.status(502).json({ error: 'AI_SERVICE_ANALYSIS_ERROR', message: 'Could not explore this item right now.' });
    }

    await InteractionLog.create({
      outcome: data.is_safe === false ? 'unsafe' : data.identified ? 'identified' : 'unidentified',
      language: data.language || req.body.language || 'english',
      objectName: data.object_name,
      kidSummary: data.kid_summary,
      funFact: data.fun_fact,
      actionPrompt: data.action_prompt,
      vocabulary: data.vocabulary || [],
      language: data.language || req.body.language || 'english',
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
    });

    return res.status(200).json({
      success: true,
      identified: data.identified,
      isSafe: data.is_safe,
      objectName: data.object_name,
      kidSummary: data.kid_summary,
      funFact: data.fun_fact,
      actionPrompt: data.action_prompt,
      vocabulary: data.vocabulary || [],
      readability: data.readability,
      grounding: data.grounding,
      message: data.confidence_note,
    });
  } catch (error) {
    console.error('Error exploring Wonder List item:', error.message);
    return res.status(502).json({ error: 'AI_SERVICE_ERROR', message: 'Could not explore this item right now.' });
  }
});

module.exports = router;
