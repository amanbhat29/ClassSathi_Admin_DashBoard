import { DocumentExporter } from '../DocumentExporter';

/**
 * ExportEngine Class
 * Encapsulates client side document triggers and naming schemas.
 */
export class ExportEngine {
  /**
   * Triggers download of generated DOCX file.
   */
  static downloadDocx(arrayBuffer, examName) {
    const filename = `${examName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Paper.docx`;
    DocumentExporter.downloadDocx(arrayBuffer, filename);
  }

  /**
   * Triggers download of generated PDF file.
   */
  static downloadPdf(blobOrArrayBuffer, examName) {
    const filename = `${examName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Paper.pdf`;
    DocumentExporter.downloadPdf(blobOrArrayBuffer, filename);
  }
}

export default ExportEngine;
