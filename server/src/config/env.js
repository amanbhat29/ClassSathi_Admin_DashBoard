import dotenv from 'dotenv';

dotenv.config();

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  maxDocxSizeMb: toInt(process.env.MAX_DOCX_SIZE_MB, 10),
  conversionTimeoutMs: toInt(process.env.CONVERSION_TIMEOUT_MS, 60000),
  logLevel: process.env.LOG_LEVEL || 'info',
  tempRoot: process.env.TEMP_ROOT || 'server/tmp',
  libreOfficePath: process.env.LIBREOFFICE_PATH || ''
};

export const maxDocxSizeBytes = env.maxDocxSizeMb * 1024 * 1024;
