const express = require('express');
const InteractionLog = require('../models/InteractionLog');
const { optionalParentAuth } = require('../middlewares/parentAuth');
const { resolveChildProfile } = require('../middlewares/childProfile');

const router = express.Router();
const OVERVIEW_NODE_LIMIT = 12;
const CONNECTIONS_PER_PAGE = 8;
const STOP_WORDS = new Set(['about', 'after', 'again', 'also', 'because', 'from', 'have', 'into', 'more', 'that', 'their', 'there', 'these', 'they', 'this', 'were', 'what', 'when', 'where', 'which', 'with', 'would', 'your', 'over', 'under', 'some', 'many', 'than', 'then', 'them', 'will', 'each', 'made', 'make', 'used', 'uses', 'helps', 'help', 'object', 'objects', 'item', 'items', 'thing', 'things', 'look', 'notice', 'people', 'different', 'around', 'called', 'like', 'know', 'well', 'first', 'also', 'one', 'two', 'can', 'its', 'their', 'very', 'often', 'many']);

function sentenceForTerm(entry, term) {
  const text = `${entry.kidSummary || ''} ${entry.funFact || ''}`;
  const sentences = text.split(/(?<=[.!?।])\s+|\n+/u).map((sentence) => sentence.trim()).filter(Boolean);
  const matching = sentences.find((sentence) => termsIn(sentence).has(term));
  if (!matching) return null;
  return matching.length > 180 ? `${matching.slice(0, 177).trimEnd()}...` : matching;
}

function termsIn(text) {
  return new Set(text.toLowerCase().match(/[\p{L}]{4,}/gu) || []);
}

function termsFor(entry) {
  return new Set([...termsIn(`${entry.kidSummary || ''} ${entry.funFact || ''}`)]
    .filter((word) => !STOP_WORDS.has(word)));
}

function buildEdges(entries) {
  const termsByObject = entries.map(termsFor);
  const edges = [];
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const sharedTerms = [...termsByObject[left]]
        .filter((term) => termsByObject[right].has(term))
        .map((term) => ({
          term,
          fromFact: sentenceForTerm(entries[left], term),
          toFact: sentenceForTerm(entries[right], term),
        }))
        .filter((connection) => connection.fromFact && connection.toFact)
        .sort((a, b) => b.term.length - a.term.length);
      if (!sharedTerms.length) continue;
      const bestConnection = sharedTerms[0];
      edges.push({
        from: entries[left].objectName,
        to: entries[right].objectName,
        sharedIdea: bestConnection.term,
        fromFact: bestConnection.fromFact,
        toFact: bestConnection.toFact,
        sharedTerms: sharedTerms.map((connection) => connection.term),
      });
    }
  }
  return edges.sort((left, right) => right.sharedTerms.length - left.sharedTerms.length);
}

function buildFocusedEdges(focusEntry, entries) {
  const focusTerms = termsFor(focusEntry);
  return entries
    .filter((entry) => entry !== focusEntry)
    .map((entry) => {
      const sharedTerms = [...focusTerms]
        .filter((term) => termsFor(entry).has(term))
        .map((term) => ({
          term,
          fromFact: sentenceForTerm(focusEntry, term),
          toFact: sentenceForTerm(entry, term),
        }))
        .filter((connection) => connection.fromFact && connection.toFact)
        .sort((a, b) => b.term.length - a.term.length);
      if (!sharedTerms.length) return null;
      const bestConnection = sharedTerms[0];
      return {
        from: focusEntry.objectName,
        to: entry.objectName,
        sharedIdea: bestConnection.term,
        fromFact: bestConnection.fromFact,
        toFact: bestConnection.toFact,
        sharedTerms: sharedTerms.map((connection) => connection.term),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.sharedTerms.length - left.sharedTerms.length);
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
    const graphEntries = unique.slice(0, OVERVIEW_NODE_LIMIT);
    const focusName = typeof req.query.focus === 'string' ? req.query.focus.trim().toLowerCase() : '';
    const focusEntry = focusName ? unique.find((entry) => entry.objectName.toLowerCase() === focusName) : null;
    const allEdges = focusEntry
      ? buildFocusedEdges(focusEntry, unique)
      : buildEdges(graphEntries);
    const pageCount = Math.ceil(allEdges.length / CONNECTIONS_PER_PAGE);
    const requestedPage = Number.parseInt(req.query.page, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const edges = focusEntry
      ? allEdges.slice((page - 1) * CONNECTIONS_PER_PAGE, page * CONNECTIONS_PER_PAGE)
      : allEdges.slice(0, 10);
    return res.status(200).json({
      success: true,
      discoveries: unique.map(({ objectName: name, createdAt }) => ({ objectName: name, createdAt })),
      edges,
      focusedObject: focusEntry?.objectName || null,
      totalConnections: allEdges.length,
      page: focusEntry ? page : 1,
      pageCount: focusEntry ? pageCount : 1,
    });
  } catch (error) {
    console.error('Error loading discovery history:', error.message);
    return res.status(503).json({ error: 'HISTORY_UNAVAILABLE', message: 'Your discovery history is temporarily unavailable.' });
  }
});

module.exports = router;
module.exports.buildEdges = buildEdges;
module.exports.buildFocusedEdges = buildFocusedEdges;
