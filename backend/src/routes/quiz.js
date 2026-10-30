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

function getReviewCutoff(value) {
  const now = new Date();
  const requestedCutoff = value ? new Date(value) : now;
  const latestAllowed = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(requestedCutoff.getTime()) || requestedCutoff < now || requestedCutoff > latestAllowed) {
    return now;
  }
  return requestedCutoff;
}

function getReviewDayStart(value, dueThrough) {
  const now = new Date();
  const requestedStart = value ? new Date(value) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (Number.isNaN(requestedStart.getTime()) || requestedStart > now || requestedStart >= dueThrough) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return requestedStart;
}

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

router.get('/due', async (req, res) => {
  if (!req.parentId) {
    return res.status(200).json({
      success: true,
      authenticated: false,
      available: false,
      objectNames: [],
      nextReviewAt: null,
      message: 'Sign in as a parent and choose a child profile to review saved discoveries.',
    });
  }
  try {
    const scope = { parentId: req.parentId };
    scope.childProfileId = req.childProfileId || null;
    const dueThrough = getReviewCutoff(req.query.due_through);
    const dueFrom = getReviewDayStart(req.query.due_from, dueThrough);
    const entries = await InteractionLog.find({
      ...scope,
      outcome: 'identified',
      objectName: { $ne: null },
    }).sort({ createdAt: -1 }).limit(500).select('objectName review.dueAt').lean();
    const uniqueEntries = [...new Map(entries.map((entry) => [entry.objectName.toLowerCase(), entry])).values()];
    const objectNames = uniqueEntries.map((entry) => entry.objectName).slice(0, 8);
    const dueEntries = uniqueEntries.filter((entry) => !entry.review?.dueAt || entry.review.dueAt <= dueThrough);
    const dueObjectNames = dueEntries.map((entry) => entry.objectName).slice(0, 8);
    const overdueDates = dueEntries
      .map((entry) => entry.review?.dueAt)
      .filter((dueAt) => dueAt && dueAt < dueFrom)
      .sort((left, right) => left - right);
    const nextEntry = uniqueEntries
      .filter((entry) => entry.review?.dueAt && entry.review.dueAt > dueThrough)
      .sort((left, right) => left.review.dueAt - right.review.dueAt)[0];
    return res.status(200).json({
      success: true,
      available: objectNames.length > 0,
      objectNames,
      dueObjectNames,
      nextReviewAt: nextEntry?.review?.dueAt || null,
      overdueSince: overdueDates[0] || null,
    });
  } catch (error) {
    console.error('Error loading due reviews:', error.message);
    return res.status(503).json({ error: 'HISTORY_UNAVAILABLE', message: 'Review reminders are temporarily unavailable.' });
  }
});

router.post('/review', async (req, res) => {
  if (!req.parentId) {
    return res.status(200).json({
      success: true,
      available: false,
      message: 'Sign in as a parent and choose a child profile to review saved discoveries.',
    });
  }
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
      parentId: req.parentId,
      childProfileId: req.childProfileId || null,
      outcome: 'identified',
      objectName: { $ne: null },
    };
    const history = await InteractionLog.find(historyFilter)
      .sort({ 'review.dueAt': 1, createdAt: 1 }).limit(40).select('objectName').lean();
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
      quiz: { questionCount: data.questions.length, reviewObjects: data.object_names },
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
    scoreFilter.childProfileId = req.childProfileId || null;
    const historyEntry = await InteractionLog.findOneAndUpdate(
      scoreFilter,
      { 'quiz.score': score },
      { new: true, runValidators: true }
    ).lean();

    if (!historyEntry) {
      return res.status(404).json({ error: 'QUIZ_NOT_FOUND', message: 'Quiz history was not found.' });
    }

    const reviewedObjects = historyEntry.quiz?.reviewObjects || [];
    if (reviewedObjects.length) {
      const ratio = historyEntry.quiz.questionCount ? score / historyEntry.quiz.questionCount : 0;
      const nextReviewAt = new Date();
      for (const objectName of reviewedObjects) {
        const objectScope = {
          outcome: 'identified', objectName,
          ...(historyEntry.parentId ? { parentId: historyEntry.parentId } : { parentId: null }),
          ...(historyEntry.childProfileId ? { childProfileId: historyEntry.childProfileId } : {}),
        };
        const latest = await InteractionLog.findOne(objectScope).sort({ createdAt: -1 }).select('review.intervalDays').lean();
        const previous = latest?.review?.intervalDays || 1;
        const intervalDays = ratio < 0.5 ? 1 : ratio < 0.8 ? Math.min(14, Math.max(3, previous + 2)) : Math.min(30, Math.max(7, previous * 2));
        nextReviewAt.setTime(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
        await InteractionLog.updateMany(objectScope, {
          $set: {
            'review.intervalDays': intervalDays,
            'review.dueAt': nextReviewAt,
            'review.lastReviewedAt': new Date(),
          },
        });
      }
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
