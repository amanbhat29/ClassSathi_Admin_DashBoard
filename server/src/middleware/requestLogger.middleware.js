import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customProps: (req) => ({ requestId: req.id }),
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});
