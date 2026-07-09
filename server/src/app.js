import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { convertRoutes } from './routes/convert.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import { requestId } from './utils/requestId.js';
import { pdfConversionService } from './services/PdfConversionService.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: env.frontendOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id', 'x-conversion-provider', 'Content-Disposition']
  }));
  app.use(requestId);
  app.use(requestLogger);

  app.get('/health', async (_req, res, next) => {
    try {
      const converter = await pdfConversionService.getHealth();
      res.json({
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        converter
      });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/convert', rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false
  }), convertRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
