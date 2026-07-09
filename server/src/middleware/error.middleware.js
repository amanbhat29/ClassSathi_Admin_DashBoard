import multer from 'multer';
import { env, maxDocxSizeBytes } from '../config/env.js';
import { AppError, isOperationalError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function notFound(_req, _res, next) {
  next(new AppError('NOT_FOUND', 'The requested endpoint does not exist.', 404));
}

export function errorHandler(err, req, res, next) {
  void next;
  let normalized = err;

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      normalized = new AppError(
        'DOCX_TOO_LARGE',
        `The generated DOCX exceeds the ${Math.round(maxDocxSizeBytes / 1024 / 1024)} MB limit.`,
        413
      );
    } else {
      normalized = new AppError('UPLOAD_FAILED', 'The DOCX upload could not be processed.', 400);
    }
  }

  const status = normalized.status || 500;
  const code = normalized.code || 'INTERNAL_ERROR';
  const message = isOperationalError(normalized)
    ? normalized.message
    : 'An unexpected server error occurred.';

  const logPayload = {
    requestId: req.id,
    code,
    status,
    err: normalized
  };

  if (status >= 500) {
    logger.error(logPayload, 'Request failed');
  } else {
    logger.warn(logPayload, 'Request rejected');
  }

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.id,
      ...(env.nodeEnv !== 'production' && normalized.details ? { details: normalized.details } : {})
    }
  });
}
