const crypto = require('crypto');
const express = require('express');
const { createParentToken } = require('../middlewares/parentAuth');

const router = express.Router();

router.post('/unlock', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const configuredPin = process.env.PARENT_PIN;
  const submittedPin = typeof req.body?.pin === 'string' ? req.body.pin : '';

  if (!configuredPin || !process.env.PARENT_SESSION_SECRET) {
    console.error('Parent unlock is unavailable: missing parent auth configuration');
    return res.status(503).json({
      error: 'PARENT_AUTH_UNAVAILABLE',
      message: 'Parent access is not configured yet.',
    });
  }

  const submittedBuffer = Buffer.from(submittedPin);
  const configuredBuffer = Buffer.from(configuredPin);
  const pinMatches = submittedBuffer.length === configuredBuffer.length
    && crypto.timingSafeEqual(submittedBuffer, configuredBuffer);

  if (!pinMatches) {
    return res.status(401).json({
      error: 'INVALID_PARENT_PIN',
      message: 'That PIN was not correct.',
    });
  }

  return res.status(200).json({
    success: true,
    token: createParentToken(),
  });
});

module.exports = router;
