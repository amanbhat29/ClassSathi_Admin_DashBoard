import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export async function createWorkDir(requestId) {
  const resolvedRoot = path.resolve(env.tempRoot);
  const workDir = path.join(resolvedRoot, requestId);
  await fs.mkdir(workDir, { recursive: true });
  return workDir;
}

export async function cleanupWorkDir(workDir, requestId) {
  if (!workDir) return;

  const resolvedRoot = path.resolve(env.tempRoot);
  const resolvedWorkDir = path.resolve(workDir);
  if (!resolvedWorkDir.startsWith(resolvedRoot + path.sep)) {
    logger.error({ requestId, workDir }, 'Refused to cleanup path outside temp root');
    return;
  }

  try {
    await fs.rm(resolvedWorkDir, { recursive: true, force: true });
  } catch (err) {
    logger.warn({ requestId, err }, 'Failed to cleanup conversion working directory');
  }
}
