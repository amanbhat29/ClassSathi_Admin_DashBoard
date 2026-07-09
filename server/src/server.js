import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();
const server = createServer(app);

server.requestTimeout = env.conversionTimeoutMs + 15000;
server.headersTimeout = env.conversionTimeoutMs + 20000;

server.listen(env.port, () => {
  logger.info({ port: env.port, converter: 'local-libreoffice' }, 'Conversion server started');
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down conversion server');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
