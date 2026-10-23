const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

process.env.PARENT_SESSION_SECRET = 'test-parent-secret';
process.env.PARENT_PIN = '2468';

const app = require('../src/app');
const { createParentToken, requireParentAuth } = require('../src/middlewares/parentAuth');

test('health endpoint reports a healthy backend', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'healthy');
});

test('capture rejects requests without a photo', async () => {
  const response = await request(app)
    .post('/api/capture/upload')
    .field('language', 'hindi');

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'NO_FILE_PROVIDED');
});

test('quiz validates object and question count before calling AI', async () => {
  const missingObject = await request(app).post('/api/quiz').send({ question_count: 3 });
  const invalidCount = await request(app)
    .post('/api/quiz')
    .send({ object_name: 'Moon', question_count: 4, language: 'hindi' });

  assert.equal(missingObject.status, 400);
  assert.equal(missingObject.body.error, 'OBJECT_NAME_REQUIRED');
  assert.equal(invalidCount.status, 400);
  assert.equal(invalidCount.body.error, 'INVALID_QUESTION_COUNT');
});

test('story validates object before calling AI', async () => {
  const response = await request(app).post('/api/story').send({ language: 'hinglish' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'OBJECT_NAME_REQUIRED');
});

test('parent account registration validates credentials before database access', async () => {
  const response = await request(app)
    .post('/api/account/register')
    .send({ email: 'not-an-email', password: 'short' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'INVALID_ACCOUNT_DETAILS');
});

test('child profiles require an account session', async () => {
  const response = await request(app).get('/api/account/profiles');

  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'PARENT_AUTH_REQUIRED');
});

test('activity cannot select a child profile without parent authentication', async () => {
  const response = await request(app)
    .post('/api/quiz')
    .send({ object_name: 'Moon', question_count: 3, child_profile_id: '507f1f77bcf86cd799439011' });

  assert.equal(response.status, 403);
  assert.equal(response.body.error, 'ACCOUNT_REQUIRED');
});

test('parent history rejects missing and invalid authorization', async () => {
  const missing = await request(app).get('/api/history');
  const invalid = await request(app)
    .get('/api/history')
    .set('Authorization', 'Bearer invalid-token');

  assert.equal(missing.status, 401);
  assert.equal(missing.body.error, 'PARENT_AUTH_REQUIRED');
  assert.equal(invalid.status, 401);
  assert.equal(invalid.body.error, 'PARENT_AUTH_REQUIRED');
});

test('history privacy endpoints require parent authorization', async () => {
  const exportResponse = await request(app).get('/api/history/export');
  const deleteAllResponse = await request(app).delete('/api/history');
  const deleteOneResponse = await request(app).delete('/api/history/507f1f77bcf86cd799439011');

  assert.equal(exportResponse.status, 401);
  assert.equal(deleteAllResponse.status, 401);
  assert.equal(deleteOneResponse.status, 401);
});

test('history child filtering requires account authorization', async () => {
  const response = await request(app)
    .get('/api/history?child_profile_id=507f1f77bcf86cd799439011')
    .set('Authorization', `Bearer ${createParentToken()}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error, 'CHILD_PROFILE_FORBIDDEN');
});

test('parent auth middleware accepts a valid signed token', () => {
  const token = createParentToken();
  let nextCalled = false;
  const req = {
    get: (header) => (header === 'Authorization' ? `Bearer ${token}` : undefined),
  };
  const res = {
    status: () => ({
      json: () => {
        throw new Error('valid parent token was rejected');
      },
    }),
  };

  requireParentAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
