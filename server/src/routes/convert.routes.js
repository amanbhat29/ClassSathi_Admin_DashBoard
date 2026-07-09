import { Router } from 'express';
import { convertDocxToPdf } from '../controllers/convert.controller.js';
import { requireDocxFile, uploadDocx } from '../middleware/upload.middleware.js';

export const convertRoutes = Router();

convertRoutes.post('/docx-to-pdf', uploadDocx.single('file'), requireDocxFile, convertDocxToPdf);
