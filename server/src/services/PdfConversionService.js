import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { cleanupWorkDir, createWorkDir } from '../utils/cleanup.js';
import { logger } from '../utils/logger.js';
import { withTimeout } from '../utils/timeout.js';
import { LocalLibreOfficeConverter } from '../converters/LocalLibreOfficeConverter.js';

export class PdfConversionService {
  constructor(converter = new LocalLibreOfficeConverter()) {
    this.converter = converter;
  }

  async getHealth() {
    return {
      provider: this.converter.name,
      configured: await this.converter.isConfigured()
    };
  }

  async convertDocxToPdf(docxBuffer, options) {
    const startedAt = Date.now();
    const workDir = await createWorkDir(options.requestId);

    try {
      logger.info(
        { requestId: options.requestId, provider: this.converter.name, inputBytes: docxBuffer.length },
        'Starting DOCX to PDF conversion'
      );

      const pdfBuffer = await withTimeout((signal) => this.converter.convert(docxBuffer, {
        ...options,
        workDir,
        signal,
        logger
      }), env.conversionTimeoutMs);

      logger.info({
        requestId: options.requestId,
        provider: this.converter.name,
        inputBytes: docxBuffer.length,
        outputBytes: pdfBuffer.length,
        durationMs: Date.now() - startedAt
      }, 'DOCX to PDF conversion completed');

      return {
        pdfBuffer,
        provider: this.converter.name
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('CONVERSION_FAILED', 'Could not convert the generated DOCX to PDF.', 502, {
        provider: this.converter.name,
        cause: err?.message
      });
    } finally {
      await cleanupWorkDir(workDir, options.requestId);
    }
  }
}

export const pdfConversionService = new PdfConversionService();
