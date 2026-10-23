const express = require('express');
const cors = require('cors');

const app = express();

const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS origin is not allowed'));
  },
}));
app.use(express.json({ limit: '100kb' }));

const { rateLimit } = require('./middlewares/rateLimit');
const captureRoutes = require('./routes/capture');
app.use('/api/capture', rateLimit({ name: 'capture', windowMs: 60 * 1000, max: 30 }), captureRoutes);
const historyRoutes = require('./routes/history');
app.use('/api/history', historyRoutes);
const parentRoutes = require('./routes/parent');
app.use('/api/parent', rateLimit({ name: 'pin-auth', windowMs: 15 * 60 * 1000, max: 10 }), parentRoutes);
const accountRoutes = require('./routes/account');
const accountAuthLimit = rateLimit({ name: 'account-auth', windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/account', (req, res, next) => {
  if (req.method === 'POST' && ['/register', '/login'].includes(req.path)) {
    return accountAuthLimit(req, res, next);
  }
  return next();
}, accountRoutes);
const wonderListRoutes = require('./routes/wonderList');
app.use('/api/wonder-list', rateLimit({ name: 'ai', windowMs: 60 * 1000, max: 30 }), wonderListRoutes);
const quizRoutes = require('./routes/quiz');
app.use('/api/quiz', rateLimit({ name: 'ai', windowMs: 60 * 1000, max: 30 }), quizRoutes);
const storyRoutes = require('./routes/story');
app.use('/api/story', rateLimit({ name: 'ai', windowMs: 60 * 1000, max: 30 }), storyRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'kinderlens-backend' });
});

module.exports = app;
