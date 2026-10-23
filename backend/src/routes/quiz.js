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
      message: 'Choose an object before starting a quiz.',
    });
  }

  try {
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/quiz`,
      { object_name: objectName },
      { timeout: 15000 }
    );
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
    });

    return res.status(200).json({
      success: true,
      available: true,
      quizId: historyEntry._id,
      objectName: data.object_name,
      questions: data.questions,
      grounding: data.grounding,
    });
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'Could not make a quiz right now. Please try again.',
    });
  }
});

router.put('/:id/score', async (req, res) => {
  const score = Number(req.body?.score);
  if (!Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: 'INVALID_SCORE', message: 'Quiz score is invalid.' });
  }

  try {
    const historyEntry = await InteractionLog.findOneAndUpdate(
      { _id: req.params.id, activityType: 'quiz' },
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
