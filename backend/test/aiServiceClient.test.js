const assert = require('node:assert/strict');
const test = require('node:test');
const { isTransientError, requestWithRetry } = require('../src/services/aiServiceClient');

test('retries transient AI failures and then returns the successful response', async () => {
  let attempts = 0;
  const retryEvents = [];
  const result = await requestWithRetry(async () => {
    attempts += 1;
    if (attempts < 3) {
      const error = new Error('temporary timeout');
      error.code = 'ETIMEDOUT';
      throw error;
    }
    return { success: true };
  }, { backoffMs: 1, onRetry: (event) => retryEvents.push(event) });

  assert.deepEqual(result, { success: true });
  assert.equal(attempts, 3);
  assert.equal(retryEvents.length, 2);
});

test('does not retry permanent AI failures', async () => {
  let attempts = 0;
  await assert.rejects(
    requestWithRetry(async () => {
      attempts += 1;
      const error = new Error('bad request');
      error.response = { status: 400 };
      throw error;
    }, { backoffMs: 1 }),
    /bad request/
  );
  assert.equal(attempts, 1);
  assert.equal(isTransientError({ response: { status: 400 } }), false);
  assert.equal(isTransientError({ response: { status: 503 } }), true);
});
