const crypto = require('crypto');
const express = require('express');
const Parent = require('../models/Parent');
const ChildProfile = require('../models/ChildProfile');
const { ACCOUNT_COOKIE, createParentToken, requireParentAuth } = require('../middlewares/parentAuth');

const router = express.Router();
const HASH_ITERATIONS = 120000;

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 64, 'sha512').toString('hex'),
});

const validCredentials = (email, password) => (
  typeof email === 'string'
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  && typeof password === 'string'
  && password.length >= 8
);

const setSession = (res, parentId) => {
  const token = encodeURIComponent(createParentToken(parentId));
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${ACCOUNT_COOKIE}=${token}; Max-Age=1800; HttpOnly; SameSite=Lax; Path=/${secure}`
  );
};

router.post('/register', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!validCredentials(email, password)) {
    return res.status(400).json({
      error: 'INVALID_ACCOUNT_DETAILS',
      message: 'Use a valid email and a password with at least 8 characters.',
    });
  }
  try {
    const existing = await Parent.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: 'ACCOUNT_EXISTS', message: 'That parent account already exists.' });
    const credentials = hashPassword(password);
    const parent = await Parent.create({ email, passwordHash: credentials.hash, passwordSalt: credentials.salt });
    setSession(res, parent._id.toString());
    return res.status(201).json({ success: true, email: parent.email });
  } catch (error) {
    console.error('Parent registration failed:', error.message);
    return res.status(503).json({ error: 'ACCOUNT_UNAVAILABLE', message: 'The parent account could not be created.' });
  }
});

router.post('/login', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  try {
    const parent = await Parent.findOne({ email });
    if (!parent || !validCredentials(email, password)) {
      return res.status(401).json({ error: 'INVALID_LOGIN', message: 'The email or password was not correct.' });
    }
    const supplied = hashPassword(password, parent.passwordSalt).hash;
    const matches = crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(parent.passwordHash));
    if (!matches) return res.status(401).json({ error: 'INVALID_LOGIN', message: 'The email or password was not correct.' });
    setSession(res, parent._id.toString());
    return res.status(200).json({ success: true, email: parent.email });
  } catch (error) {
    console.error('Parent login failed:', error.message);
    return res.status(503).json({ error: 'ACCOUNT_UNAVAILABLE', message: 'Parent login is temporarily unavailable.' });
  }
});

router.post('/logout', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ACCOUNT_COOKIE}=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/${secure}`);
  return res.status(200).json({ success: true });
});

router.get('/profiles', requireParentAuth, async (req, res) => {
  if (!req.parentId) return res.status(403).json({ error: 'ACCOUNT_REQUIRED', message: 'Sign in with a parent account first.' });
  const profiles = await ChildProfile.find({ parentId: req.parentId }).sort({ createdAt: 1 }).lean();
  return res.status(200).json({ success: true, profiles });
});

router.post('/profiles', requireParentAuth, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const age = req.body?.age == null ? null : Number(req.body.age);
  if (!req.parentId) return res.status(403).json({ error: 'ACCOUNT_REQUIRED', message: 'Sign in with a parent account first.' });
  if (!name || (age !== null && (!Number.isInteger(age) || age < 1 || age > 18))) {
    return res.status(400).json({ error: 'INVALID_PROFILE', message: 'Provide a child name and an age from 1 to 18.' });
  }
  const profile = await ChildProfile.create({ parentId: req.parentId, name, age });
  return res.status(201).json({ success: true, profile });
});

module.exports = router;
