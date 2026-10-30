const buckets = new Map();

const getClientKey = (req) => req.ip || req.socket.remoteAddress || 'unknown';

const rateLimit = ({ windowMs, max, name }) => (req, res, next) => {
  const now = Date.now();
  const key = `${name}:${getClientKey(req)}`;
  const current = buckets.get(key);
  const bucket = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);
  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));

  if (bucket.count > max) {
    res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment and try again.',
    });
  }
  return next();
};

const clearRateLimitBuckets = () => buckets.clear();

module.exports = { rateLimit, clearRateLimitBuckets };
