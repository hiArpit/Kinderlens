const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

process.env.PARENT_SESSION_SECRET = 'test-parent-secret';
process.env.PARENT_PIN = '2468';

const app = require('../src/app');
const InteractionLog = require('../src/models/InteractionLog');
const { buildEdges, buildFocusedEdges } = require('../src/routes/discovery');
const { createParentToken, requireParentAuth } = require('../src/middlewares/parentAuth');
const { clearRateLimitBuckets } = require('../src/middlewares/rateLimit');

test.afterEach(() => clearRateLimitBuckets());

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

test('logged-out discovery and review endpoints never expose anonymous history', async () => {
  const graph = await request(app).get('/api/discovery');
  const dueReviews = await request(app).get('/api/quiz/due');
  const reviewQuiz = await request(app).post('/api/quiz/review').send({ question_count: 3 });

  assert.equal(graph.status, 200);
  assert.equal(graph.body.authenticated, false);
  assert.deepEqual(graph.body.discoveries, []);
  assert.deepEqual(graph.body.edges, []);
  assert.equal(dueReviews.status, 200);
  assert.equal(dueReviews.body.authenticated, false);
  assert.deepEqual(dueReviews.body.objectNames, []);
  assert.equal(reviewQuiz.status, 200);
  assert.equal(reviewQuiz.body.available, false);
});

test('learning graph links show the grounded facts behind a shared idea', () => {
  const edges = buildEdges([
    {
      objectName: 'Moon',
      kidSummary: 'The Moon goes around Earth. Sunlight makes it look bright.',
      funFact: 'People can see the Moon at night.',
    },
    {
      objectName: 'Dinosaur',
      kidSummary: 'Dinosaurs lived on Earth long ago. Some dinosaurs ate plants.',
      funFact: 'A few dinosaurs had feathers.',
    },
  ]);

  assert.equal(edges.length, 1);
  assert.equal(edges[0].sharedIdea, 'earth');
  assert.equal(edges[0].fromFact, 'The Moon goes around Earth.');
  assert.equal(edges[0].toFact, 'Dinosaurs lived on Earth long ago.');
  assert.equal(Object.hasOwn(edges[0], 'detail'), false);
});

test('focused learning graph finds relationships beyond the overview objects', () => {
  const focus = {
    objectName: 'Moon',
    kidSummary: 'The Moon goes around Earth.',
    funFact: '',
  };
  const olderDiscovery = {
    objectName: 'Dinosaur',
    kidSummary: 'Dinosaurs lived on Earth long ago.',
    funFact: '',
  };

  const edges = buildFocusedEdges(focus, [focus, olderDiscovery]);

  assert.equal(edges.length, 1);
  assert.equal(edges[0].to, 'Dinosaur');
  assert.equal(edges[0].sharedIdea, 'earth');
});

test('focused learning graph paginates large connection sets', async () => {
  const records = [
    { objectName: 'Moon', kidSummary: 'The Moon goes around Earth.', funFact: '', createdAt: new Date() },
    ...Array.from({ length: 10 }, (_, index) => ({
      objectName: `Object ${index + 1}`,
      kidSummary: `Object ${index + 1} connects with Earth.`,
      funFact: '',
      createdAt: new Date(Date.now() - index - 1),
    })),
  ];
  const originalFind = InteractionLog.find;
  InteractionLog.find = () => ({
    sort() { return this; },
    limit() { return this; },
    select() { return this; },
    lean: async () => records,
  });

  try {
    const token = createParentToken('parent-1');
    const response = await request(app)
      .get('/api/discovery?focus=Moon&page=2')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.focusedObject, 'Moon');
    assert.equal(response.body.totalConnections, 10);
    assert.equal(response.body.pageCount, 2);
    assert.equal(response.body.edges.length, 2);
  } finally {
    InteractionLog.find = originalFind;
  }
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

test('shared parent PIN is disabled in production, including previously issued prototype tokens', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const unlock = await request(app).post('/api/parent/unlock').send({ pin: '2468' });
    const legacyToken = createParentToken();
    const history = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${legacyToken}`);

    assert.equal(unlock.status, 403);
    assert.equal(unlock.body.error, 'PARENT_PIN_DISABLED');
    assert.equal(history.status, 401);
    assert.equal(history.body.error, 'PARENT_AUTH_REQUIRED');
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
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

  test('auth rate limits return retry guidance', async () => {
    const responses = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      responses.push(await request(app).post('/api/parent/unlock').send({ pin: 'wrong' }));
    }
    const limited = responses.at(-1);

    assert.equal(limited.status, 429);
    assert.equal(limited.body.error, 'RATE_LIMITED');
    assert.ok(limited.headers['retry-after']);
  });

  assert.equal(nextCalled, true);
});
