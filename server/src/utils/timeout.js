import { AppError } from './AppError.js';

export async function withTimeout(promiseFactory, timeoutMs, timeoutCode = 'CONVERSION_TIMEOUT') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await promiseFactory(controller.signal);
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new AppError(timeoutCode, 'Document conversion timed out.', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
