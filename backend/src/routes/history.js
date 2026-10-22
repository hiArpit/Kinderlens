const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const { requireParentAuth } = require('../middlewares/parentAuth');

const router = express.Router();

router.get('/', requireParentAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const history = await InteractionLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error loading interaction history:', error.message);
    return res.status(503).json({
      error: 'HISTORY_UNAVAILABLE',
      message: 'History is temporarily unavailable. Please try again.',
    });
  }
});

module.exports = router;
