const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 250;

const isTransientError = (error) => {
  const status = error?.response?.status;
  return (
    [408, 429, 500, 502, 503, 504].includes(status)
    || ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'].includes(error?.code)
  );
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const requestWithRetry = async (
  request,
  { retries = DEFAULT_RETRIES, backoffMs = DEFAULT_BACKOFF_MS, onRetry } = {}
) => {
  let attempt = 0;
  while (true) {
    try {
      return await request();
    } catch (error) {
      if (!isTransientError(error) || attempt >= retries) throw error;
      attempt += 1;
      const delay = backoffMs * (2 ** (attempt - 1));
      if (onRetry) onRetry({ attempt, delay, error });
      await wait(delay);
    }
  }
};

module.exports = { isTransientError, requestWithRetry };
