const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const { optionalParentAuth } = require('../middlewares/parentAuth');
const { resolveChildProfile } = require('../middlewares/childProfile');

const router = express.Router();
const STOP_WORDS = new Set(['about', 'after', 'again', 'also', 'because', 'from', 'have', 'into', 'more', 'that', 'their', 'there', 'these', 'they', 'this', 'were', 'what', 'when', 'where', 'which', 'with', 'would', 'your', 'over', 'under', 'some', 'many', 'than', 'then', 'them', 'will', 'each', 'made', 'make', 'used', 'uses', 'helps', 'help', 'object', 'objects', 'item', 'items', 'thing', 'things', 'look', 'notice', 'people', 'different', 'around', 'called']);

function termsFor(entry) {
  return new Set(`${entry.kidSummary || ''} ${entry.funFact || ''}`.toLowerCase()
    .match(/[\p{L}]{4,}/gu)?.filter((word) => !STOP_WORDS.has(word)) || []);
}

router.get('/', optionalParentAuth, resolveChildProfile, async (req, res) => {
  if (!req.parentId) {
    return res.status(200).json({
      success: true,
      authenticated: false,
      message: 'Sign in as a parent and choose a child profile to see saved discoveries.',
      discoveries: [],
      edges: [],
    });
  }
  try {
    const scope = { parentId: req.parentId };
    scope.childProfileId = req.childProfileId || null;
    const entries = await InteractionLog.find({ ...scope, outcome: 'identified', objectName: { $ne: null } })
      .sort({ createdAt: -1 }).limit(500)
      .select('objectName kidSummary funFact createdAt grounding.sourceTitle').lean();
    const unique = [...new Map(entries.map((entry) => [entry.objectName.toLowerCase(), entry])).values()];
    const graphEntries = unique.slice(0, 20);
    const termsByObject = graphEntries.map(termsFor);
    const edges = [];
    for (let left = 0; left < graphEntries.length; left += 1) {
      for (let right = left + 1; right < graphEntries.length; right += 1) {
        const sharedTerms = [...termsByObject[left]].filter((term) => termsByObject[right].has(term));
        if (sharedTerms.length) {
          edges.push({
            from: graphEntries[left].objectName,
            to: graphEntries[right].objectName,
            sharedTerms: sharedTerms.slice(0, 3),
            detail: `Both saved explanations mention ${sharedTerms.slice(0, 2).join(' and ')}.`,
          });
        }
      }
    }
    edges.sort((left, right) => right.sharedTerms.length - left.sharedTerms.length);
    return res.status(200).json({
      success: true,
      discoveries: unique.map(({ objectName: name, createdAt }) => ({ objectName: name, createdAt })),
      edges,
    });
  } catch (error) {
    console.error('Error loading discovery history:', error.message);
    return res.status(503).json({ error: 'HISTORY_UNAVAILABLE', message: 'Your discovery history is temporarily unavailable.' });
  }
});

module.exports = router;
