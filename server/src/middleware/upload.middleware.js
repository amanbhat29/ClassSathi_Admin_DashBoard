import multer from 'multer';
import { maxDocxSizeBytes } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const uploadDocx = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxDocxSizeBytes,
    files: 1,
    fields: 5
  },
  fileFilter(req, file, cb) {
    const name = file.originalname || '';
    const extensionOk = name.toLowerCase().endsWith('.docx');
    const mimeOk = !file.mimetype || file.mimetype === DOCX_MIME || file.mimetype === 'application/octet-stream';

    if (!extensionOk || !mimeOk) {
      cb(new AppError('DOCX_INVALID_TYPE', 'Only generated DOCX files can be converted to PDF.', 400));
      return;
    }

    cb(null, true);
  }
});

export function requireDocxFile(req, _res, next) {
  if (!req.file) {
    next(new AppError('DOCX_MISSING', 'A generated DOCX file is required.', 400));
    return;
  }

  if (!req.file.buffer?.length) {
    next(new AppError('DOCX_EMPTY', 'The uploaded DOCX file is empty.', 400));
    return;
  }

  const zipSignature = req.file.buffer.subarray(0, 4);
  if (!zipSignature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    next(new AppError('DOCX_INVALID', 'The uploaded file is not a valid DOCX package.', 400));
    return;
  }

  next();
}
