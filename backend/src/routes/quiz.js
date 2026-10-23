const express = require('express');
const axios = require('axios');
const InteractionLog = require('../models/InteractionLog');
const { optionalParentAuth } = require('../middlewares/parentAuth');
const { resolveChildProfile } = require('../middlewares/childProfile');
const { requestWithRetry } = require('../services/aiServiceClient');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const ALLOWED_QUESTION_COUNTS = new Set([3, 5, 10]);
const router = express.Router();
router.use(optionalParentAuth, resolveChildProfile);

router.post('/', async (req, res) => {
  const objectName = typeof req.body?.object_name === 'string'
    ? req.body.object_name.trim()
    : '';
  const questionCount = Number(req.body?.question_count || 3);
  const language = typeof req.body?.language === 'string' ? req.body.language : 'english';

  if (!objectName) {
    return res.status(400).json({
      error: 'OBJECT_NAME_REQUIRED',
      message: 'Choose an object before starting a quiz.',
    });
  }
  if (!ALLOWED_QUESTION_COUNTS.has(questionCount)) {
    return res.status(400).json({
      error: 'INVALID_QUESTION_COUNT',
      message: 'Choose 3, 5, or 10 questions.',
    });
  }

  try {
    const aiResponse = await requestWithRetry(() => axios.post(
      `${AI_SERVICE_URL}/api/quiz`,
      { object_name: objectName, question_count: questionCount, language },
      { timeout: 15000 }
    ));
    const data = aiResponse.data;

    if (!data.success) {
      return res.status(502).json({
        error: 'AI_SERVICE_ANALYSIS_ERROR',
        message: 'Could not make a quiz right now. Please try again.',
      });
    }

    if (data.is_safe === false || !data.grounding?.grounded) {
      return res.status(200).json({
        success: true,
        available: false,
        isSafe: data.is_safe !== false,
        message: data.confidence_note || 'A trusted quiz is not available yet.',
      });
    }

    const historyEntry = await InteractionLog.create({
      outcome: 'quiz',
      activityType: 'quiz',
      objectName: data.object_name,
      grounding: {
        grounded: data.grounding.grounded,
        sourceTitle: data.grounding.source_title,
        sourceUrl: data.grounding.source_url,
      },
      quiz: {
        questionCount: data.questions.length,
      },
      language: data.language || language,
      parentId: req.parentId,
      childProfileId: req.childProfileId,
    });

    return res.status(200).json({
      success: true,
      available: true,
      quizId: historyEntry._id,
      objectName: data.object_name,
      questions: data.questions,
      grounding: data.grounding,
      language: data.language || language,
      parentId: req.parentId,
      childProfileId: req.childProfileId,
    });
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'Could not make a quiz right now. Please try again.',
    });
  }
});

router.post('/review', async (req, res) => {
  try {
    const questionCount = Number(req.body?.question_count || 3);
    const language = typeof req.body?.language === 'string' ? req.body.language : 'english';
    if (!ALLOWED_QUESTION_COUNTS.has(questionCount)) {
      return res.status(400).json({
        error: 'INVALID_QUESTION_COUNT',
        message: 'Choose 3, 5, or 10 questions.',
      });
    }
    const historyFilter = {
      outcome: 'identified',
      objectName: { $ne: null },
    };
    if (req.parentId) {
      historyFilter.parentId = req.parentId;
      if (req.childProfileId) historyFilter.childProfileId = req.childProfileId;
    }
    const history = await InteractionLog.find(historyFilter)
      .sort({ createdAt: -1 }).limit(8).select('objectName').lean();
    const objectNames = [...new Set(history.map((entry) => entry.objectName).filter(Boolean))];

    const aiResponse = await requestWithRetry(() => axios.post(
      `${AI_SERVICE_URL}/api/quiz/review`,
      { object_names: objectNames, question_count: questionCount, language },
      { timeout: 30000 }
    ));
    const data = aiResponse.data;

    if (!data.success) {
      return res.status(502).json({ error: 'AI_SERVICE_ANALYSIS_ERROR', message: 'Could not make a review quiz right now.' });
    }
    if (!data.questions?.length) {
      return res.status(200).json({
        success: true,
        available: false,
        message: data.confidence_note || 'Explore more objects before starting a review quiz.',
      });
    }

    const historyEntry = await InteractionLog.create({
      outcome: 'quiz',
      activityType: 'quiz',
      objectName: 'Review Quiz',
      grounding: { grounded: true, sourceTitle: 'Verified object references' },
      quiz: { questionCount: data.questions.length },
      language: data.language || language,
      parentId: req.parentId,
      childProfileId: req.childProfileId,
    });

    return res.status(200).json({
      success: true,
      available: true,
      quizId: historyEntry._id,
      objectNames: data.object_names,
      questions: data.questions,
      groundingSources: data.grounding_sources,
      language: data.language || language,
    });
  } catch (error) {
    console.error('Error generating review quiz:', error.message);
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'Could not make a review quiz right now. Please try again.',
    });
  }
});

router.put('/:id/score', async (req, res) => {
  const score = Number(req.body?.score);
  if (!Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: 'INVALID_SCORE', message: 'Quiz score is invalid.' });
  }

  try {
    const scoreFilter = { _id: req.params.id, activityType: 'quiz' };
    if (req.parentId) scoreFilter.parentId = req.parentId;
    const historyEntry = await InteractionLog.findOneAndUpdate(
      scoreFilter,
      { 'quiz.score': score },
      { new: true, runValidators: true }
    ).lean();

    if (!historyEntry) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND', message: 'Quiz history was not found.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving quiz score:', error.message);
    return res.status(503).json({
      error: 'HISTORY_UNAVAILABLE',
      message: 'The quiz result could not be saved. Please try again.',
    });
  }
});

module.exports = router;
