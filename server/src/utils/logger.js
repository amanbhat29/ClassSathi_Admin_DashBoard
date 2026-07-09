import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.logLevel,
  base: {
    service: 'exam-paper-conversion-server',
    env: env.nodeEnv
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.access_token',
      '*.accessToken'
    ],
    remove: true
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
