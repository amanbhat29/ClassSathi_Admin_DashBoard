import { pdfConversionService } from '../services/PdfConversionService.js';
import { pdfFilename, sanitizeFilename } from '../utils/filenames.js';

export async function convertDocxToPdf(req, res, next) {
  try {
    const examName = req.body.examName || req.file.originalname || 'Exam_Paper';
    const filename = `${sanitizeFilename(req.file.originalname, 'generated-paper')}.docx`;

    const { pdfBuffer, provider } = await pdfConversionService.convertDocxToPdf(req.file.buffer, {
      requestId: req.id,
      filename,
      examName
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename(examName)}"`);
    res.setHeader('x-conversion-provider', provider);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
