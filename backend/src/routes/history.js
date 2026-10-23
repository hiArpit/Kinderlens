const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const { requireParentAuth } = require('../middlewares/parentAuth');

const router = express.Router();

router.get('/', requireParentAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = req.parentId ? { parentId: req.parentId } : {};
    const history = await InteractionLog.find(filter)
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

router.get('/export', requireParentAuth, async (req, res) => {
  try {
    const filter = req.parentId ? { parentId: req.parentId } : {};
    const history = await InteractionLog.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kinderlens-history.json"');
    return res.status(200).send(JSON.stringify({
      exportedAt: new Date().toISOString(),
      history,
    }, null, 2));
  } catch (error) {
    console.error('Error exporting interaction history:', error.message);
    return res.status(503).json({
      error: 'HISTORY_UNAVAILABLE',
      message: 'History export is temporarily unavailable. Please try again.',
    });
  }
});

router.delete('/:id', requireParentAuth, async (req, res) => {
  try {
    const filter = req.parentId
      ? { _id: req.params.id, parentId: req.parentId }
      : { _id: req.params.id };
    const deleted = await InteractionLog.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({
        error: 'HISTORY_ENTRY_NOT_FOUND',
        message: 'That history entry could not be found.',
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting interaction history entry:', error.message);
    return res.status(400).json({
      error: 'INVALID_HISTORY_ENTRY',
      message: 'That history entry could not be deleted.',
    });
  }
});

router.delete('/', requireParentAuth, async (req, res) => {
  try {
    const result = await InteractionLog.deleteMany(req.parentId ? { parentId: req.parentId } : {});
    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting interaction history:', error.message);
    return res.status(503).json({
      error: 'HISTORY_UNAVAILABLE',
      message: 'History could not be deleted right now. Please try again.',
    });
  }
});

module.exports = router;
