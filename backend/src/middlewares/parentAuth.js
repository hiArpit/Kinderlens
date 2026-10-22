const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 60 * 1000;

const getSecret = () => process.env.PARENT_SESSION_SECRET;

const sign = (value) => crypto
  .createHmac('sha256', getSecret())
  .update(value)
  .digest('base64url');

const hasMatchingSignature = (provided, expected) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const createParentToken = () => {
  const payload = Buffer.from(JSON.stringify({
    role: 'parent',
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
};

const requireParentAuth = (req, res, next) => {
  const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !getSecret()) {
    return res.status(401).json({
      error: 'PARENT_AUTH_REQUIRED',
      message: 'Parent access is required.',
    });
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !hasMatchingSignature(signature, sign(payload))) {
    return res.status(401).json({
      error: 'PARENT_AUTH_REQUIRED',
      message: 'Parent access is required.',
    });
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.role !== 'parent' || parsed.expiresAt <= Date.now()) {
      throw new Error('Expired parent token');
    }
  } catch (error) {
    return res.status(401).json({
      error: 'PARENT_AUTH_REQUIRED',
      message: 'Parent access is required.',
    });
  }

  return next();
};

module.exports = {
  createParentToken,
  requireParentAuth,
};
