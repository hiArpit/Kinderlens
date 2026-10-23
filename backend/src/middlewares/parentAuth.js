const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const ACCOUNT_COOKIE = 'kinderlens_parent_session';

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

const createParentToken = (parentId = null) => {
  const payload = Buffer.from(JSON.stringify({
    role: 'parent',
    parentId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
};

const getToken = (req) => {
  const authorization = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (authorization) return authorization;
  const cookies = req.get('Cookie') || '';
  const cookie = cookies.split(';').map((value) => value.trim())
    .find((value) => value.startsWith(`${ACCOUNT_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(ACCOUNT_COOKIE.length + 1)) : null;
};

const requireParentAuth = (req, res, next) => {
  const token = getToken(req);
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

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.role !== 'parent' || parsed.expiresAt <= Date.now()) {
      throw new Error('Expired parent token');
    }
  } catch (error) {
    return res.status(401).json({
      error: 'PARENT_AUTH_REQUIRED',
      message: 'Parent access is required.',
    });
  }

  req.parentId = parsed.parentId || null;
  return next();
};

module.exports = {
  ACCOUNT_COOKIE,
  createParentToken,
  requireParentAuth,
};
