import { DocumentParser } from './DocumentParser';
import { WordParser } from './WordParser';
import { PdfParser } from './PdfParser';
import { DocxParser } from './DocxParser';

/**
 * Unified TemplateValidator Service
 * Routes verification requests to WordParser or PdfParser.
 */
export const TemplateValidator = {
  /**
   * Universal validate function that detects file type and routes accordingly.
   */
  async validate(arrayBuffer, filename, fileSize) {
    const detectedType = DocumentParser.detectType({ name: filename });
    
    if (detectedType === 'docx') {
      return this.validateDocx(arrayBuffer);
    } else if (detectedType === 'pdf') {
      return await this.validatePdf(arrayBuffer, fileSize);
    } else {
      return {
        type: 'unknown',
        ready: false,
        errors: ["Unsupported file format. Please upload a Microsoft Word (.docx) or PDF (.pdf) file."],
        warnings: []
      };
    }
  },

  /**
   * Existing DOCX Validation Workflow.
   */
  validateDocx(arrayBuffer) {
    const report = {
      type: 'docx',
      isValidDocx: false,
      headerDetected: false,
      footerDetected: false,
      logoFound: false,
      marginsLoaded: false,
      stylesLoaded: false,
      placeholderCount: 0,
      placeholderFound: false,
      unsupportedTextBox: false,
      ready: false,
      errors: [],
      warnings: []
    };

    try {
      const zip = WordParser.parseDocx(arrayBuffer);
      const xmlDoc = WordParser.parseDocumentXml(zip);

      report.isValidDocx = true;

      // Header / Footer Detection
      const headers = DocxParser.getHeaders(zip);
      report.headerDetected = headers.length > 0;

      const footers = DocxParser.getFooters(zip);
      report.footerDetected = footers.length > 0;
      if (!report.footerDetected) {
        report.warnings.push("Footer not detected");
      }

      // Logo / Media Detection
      const media = DocxParser.getMediaFiles(zip);
      report.logoFound = media.length > 0;

      // Page Margins Detection
      report.marginsLoaded = DocxParser.hasPageMargins(xmlDoc);

      // Styles Detection
      report.stylesLoaded = !!zip.file("word/styles.xml");

      // Textbox Check
      report.unsupportedTextBox = DocxParser.hasUnsupportedTextBox(xmlDoc);
      if (report.unsupportedTextBox) {
        report.warnings.push("Unsupported text box found");
      }

      // Count Placeholders
      const placeholderCount = WordParser.countPlaceholders(xmlDoc);
      report.placeholderCount = placeholderCount;
      report.placeholderFound = placeholderCount === 1;

      if (placeholderCount === 0) {
        report.errors.push("Missing {{QUESTION_PAPER}} placeholder");
      } else if (placeholderCount > 1) {
        report.errors.push(`Multiple {{QUESTION_PAPER}} placeholders (${placeholderCount}) found`);
      }

      // Ready status
      report.ready = report.isValidDocx && report.placeholderFound && report.errors.length === 0;

    } catch (err) {
      console.error("[TemplateValidator] DOCX validation failure:", err);
      report.errors.push(err.message || 'Corrupted file format');
    }

    return report;
  },

  /**
   * PDF Validation Workflow.
   */
  async validatePdf(arrayBuffer, fileSize) {
    const report = {
      type: 'pdf',
      isValidPdf: false,
      readable: false,
      notEncrypted: false,
      placeholderFound: false,
      placeholderCount: 0,
      pages: 0,
      sizeOk: false,
      ready: false,
      errors: [],
      warnings: [],
      // Placeholder layout details to save in context for dynamic page splicing
      placeholderDetails: null
    };

    // 1. Validate File Size (< 5MB)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      report.errors.push("File size exceeds 5 MB limit. Please upload a smaller PDF.");
    } else {
      report.sizeOk = true;
    }

    try {
      // 2. Validate Readability & Encryption
      const pdfDoc = await PdfParser.loadPdf(arrayBuffer);
      report.isValidPdf = true;
      report.readable = true;
      report.notEncrypted = true;
      report.pages = pdfDoc.numPages;

      // 3. Scan for Placeholder
      const scanResult = await PdfParser.scanPlaceholder(pdfDoc);
      if (scanResult.found) {
        report.placeholderFound = true;
        report.placeholderCount = 1;
        report.placeholderDetails = {
          pageIndex: scanResult.pageIndex,
          x: scanResult.x,
          y: scanResult.y,
          pageWidth: scanResult.pageWidth,
          pageHeight: scanResult.pageHeight
        };

        // 3.5 Scan page layouts to detect header/footer/signature zones
        try {
          const pageLayouts = await PdfParser.scanPageLayout(pdfDoc, report.placeholderDetails);
          report.placeholderDetails.pageLayouts = pageLayouts;
        } catch (layoutErr) {
          console.warn("[TemplateValidator] Page layout scan failed (non-fatal):", layoutErr);
          report.placeholderDetails.pageLayouts = null;
        }
      } else {
        report.errors.push("Missing {{QUESTION_PAPER}} placeholder");
      }

      // 4. Ready Status
      report.ready = report.isValidPdf && report.readable && report.notEncrypted && report.placeholderFound && report.sizeOk && report.errors.length === 0;

    } catch (err) {
      console.error("[TemplateValidator] PDF validation failure:", err);
      
      if (err.message && err.message.includes("PasswordProtected")) {
        report.notEncrypted = false;
        report.errors.push("Encrypted PDF: Template is password protected.");
      } else {
        report.errors.push(err.message || "Failed to read PDF structure.");
      }
    }

    return report;
  }
};

/**
 * Universal file upload validate helper
 */
export function validateTemplate(file) {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  const detectedType = DocumentParser.detectType(file);

  if (!detectedType) {
    return {
      isValid: false,
      error: `Unsupported format: Please upload a valid Microsoft Word (.docx) or PDF (.pdf) template.`
    };
  }

  return { isValid: true };
}

export default TemplateValidator;
