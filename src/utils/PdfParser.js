import * as pdfjs from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up the worker source
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

/**
 * Signature/footer-related keywords used to detect protected zones at the
 * bottom of template pages. These zones must never be overwritten by
 * generated question content.
 */
const SIGNATURE_KEYWORDS = [
  'signature', 'principal', 'teacher', 'seal', 'stamp',
  'examiner', 'invigilator', 'head', 'coordinator',
  'sign', 'hod', 'controller'
];

const FOOTER_KEYWORDS = [
  'page', 'confidential', 'footer', 'copyright',
  'printed', 'generated', 'classsathi', 'all rights'
];

/**
 * PdfParser Service
 * Loads PDF files via pdfjs-dist and scans pages to locate structure and placeholders.
 */
export const PdfParser = {
  /**
   * Loads the PDF document from an ArrayBuffer.
   */
  async loadPdf(arrayBuffer) {
    try {
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
      });
      return await loadingTask.promise;
    } catch (err) {
      if (err.name === 'PasswordException') {
        throw new Error("PasswordProtected: The PDF template is encrypted.");
      }
      throw new Error(`Failed to load PDF template: ${err.message || err}`);
    }
  },

  /**
   * Scans PDF pages to find the placeholder {{QUESTION_PAPER}} coordinates and metadata.
   */
  async scanPlaceholder(pdfDoc) {
    const numPages = pdfDoc.numPages;
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items || [];
      
      // 1. Exact match within single text item
      for (const item of items) {
        if (item.str && item.str.includes('{{QUESTION_PAPER}}')) {
          const viewport = page.getViewport({ scale: 1 });
          return {
            found: true,
            pageIndex: pageNum,
            x: item.transform[4],
            y: item.transform[5],
            pageWidth: viewport.width,
            pageHeight: viewport.height,
            itemText: item.str
          };
        }
      }
      
      // 2. Concatenated match (e.g. if the placeholder was split into separate spans)
      const pageText = items.map(it => it.str || '').join('');
      if (pageText.includes('{{QUESTION_PAPER}}')) {
        // Find the first text item containing the opening brackets
        for (const item of items) {
          if (item.str && (item.str.includes('{{') || item.str.includes('QUESTION_PAPER'))) {
            const viewport = page.getViewport({ scale: 1 });
            return {
              found: true,
              pageIndex: pageNum,
              x: item.transform[4],
              y: item.transform[5],
              pageWidth: viewport.width,
              pageHeight: viewport.height,
              itemText: item.str
            };
          }
        }
      }
    }
    
    return { found: false };
  },

  /**
   * Scans every page of the PDF to build a layout map describing the safe
   * content zone for each page.  For each page we detect:
   *
   *  - headerBottomY : Y coordinate just below the lowest header text item
   *  - footerTopY    : Y coordinate just above the highest footer/signature item
   *  - leftEdge      : leftmost X of any text item (proxy for left margin)
   *  - rightEdge     : rightmost X+width of any text item (proxy for right margin)
   *  - pageWidth / pageHeight
   *  - hasSignatureZone : whether we detected signature-related labels
   *  - signatureTopY : Y of the topmost signature-related item (if any)
   *
   * All Y values are in native PDF coordinate space (origin at bottom-left,
   * Y increases upward).
   */
  async scanPageLayout(pdfDoc, placeholderDetails = null) {
    const numPages = pdfDoc.numPages;
    const layouts = [];

    const placeholderPageIndex = placeholderDetails && placeholderDetails.pageIndex;
    const placeholderY = placeholderDetails && placeholderDetails.y;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;
      const textContent = await page.getTextContent();
      const items = textContent.items || [];

      // Skip the placeholder text itself when analysing content zones
      const contentItems = items.filter(it => {
        if (!it.str || !it.str.trim()) return false;
        if (it.str.includes('{{QUESTION_PAPER}}') || it.str.includes('{@QUESTION_PAPER}')) return false;
        return true;
      });

      if (contentItems.length === 0) {
        // Blank page — use generous defaults
        layouts.push({
          pageNum,
          pageWidth,
          pageHeight,
          headerBottomY: pageHeight - 50,   // 50pt from top
          footerTopY: 50,                    // 50pt from bottom
          leftEdge: 50,
          rightEdge: pageWidth - 50,
          hasSignatureZone: false,
          signatureTopY: null
        });
        continue;
      }

      // Collect Y positions (bottom of text item) and X positions
      let allYPositions = [];
      let allXLeft = [];
      let allXRight = [];
      let signatureItems = [];
      let footerItems = [];

      for (const item of contentItems) {
        const y = item.transform[5];                       // baseline Y
        const x = item.transform[4];                       // left X
        const fontSize = item.transform[0] || 12;          // approximate font size from transform matrix
        const textWidth = (item.width || item.str.length * fontSize * 0.5);
        const textLower = item.str.toLowerCase().trim();

        allYPositions.push(y);
        allXLeft.push(x);
        allXRight.push(x + textWidth);

        // Detect signature-related items
        const isSignature = SIGNATURE_KEYWORDS.some(kw => textLower.includes(kw));
        if (isSignature) {
          signatureItems.push({ y, text: item.str });
        }

        // Detect footer-related items
        const isFooter = FOOTER_KEYWORDS.some(kw => textLower.includes(kw));
        if (isFooter && y < pageHeight * 0.25) {
          // Only count as footer if it's in the bottom quarter of the page
          footerItems.push({ y, text: item.str });
        }
      }

      // Sort Y positions ascending (bottom to top in PDF space)
      allYPositions.sort((a, b) => a - b);
      allXLeft.sort((a, b) => a - b);
      allXRight.sort((a, b) => b - a);

      // --- Detect HEADER zone ---
      // Header items are at the TOP of the page (highest Y values in PDF space).
      // We look for a cluster of items in the top 15% of the page.
      const topThreshold = pageHeight * 0.85;
      const headerItems = allYPositions.filter(y => y >= topThreshold);
      let headerBottomY;
      if (headerItems.length > 0) {
        // Header bottom = lowest Y among header items, minus a small gap
        headerBottomY = Math.min(...headerItems) - 12;
      } else {
        // No distinct header detected — use 54pt from top (standard margin)
        headerBottomY = pageHeight - 54;
      }

      // --- Detect SIGNATURE zone ---
      // Signature items that are in the lower half of the page, OR below the placeholder on the placeholder page
      const sigItemsLowerHalf = signatureItems.filter(si => {
        if (pageNum === placeholderPageIndex && placeholderY !== null) {
          return si.y < placeholderY - 5;
        }
        return si.y < pageHeight * 0.5;
      });
      let hasSignatureZone = sigItemsLowerHalf.length > 0;
      let signatureTopY = null;
      let signatureLayout = null;

      if (hasSignatureZone) {
        // Collect exact bounding box for signature zone
        const sigItemsContent = contentItems.filter(it => {
          const y = it.transform[5];
          const textLower = it.str.toLowerCase().trim();
          const isSig = SIGNATURE_KEYWORDS.some(kw => textLower.includes(kw));
          if (pageNum === placeholderPageIndex && placeholderY !== null) {
            return isSig && y < placeholderY - 5;
          }
          return isSig && y < pageHeight * 0.5;
        });

        if (sigItemsContent.length > 0) {
          const xCoords = sigItemsContent.map(it => it.transform[4]);
          const yCoords = sigItemsContent.map(it => it.transform[5]);
          const fontSize = sigItemsContent[0].transform[0] || 12;
          const widths = sigItemsContent.map(it => it.width || it.str.length * fontSize * 0.5);

          signatureLayout = {
            xMin: Math.min(...xCoords) - 15,
            xMax: Math.max(...xCoords.map((x, idx) => x + widths[idx])) + 15,
            yMin: Math.min(...yCoords) - 15,
            yMax: Math.max(...yCoords) + 20
          };
        }

        // The protected zone starts at the topmost signature item + generous padding
        signatureTopY = Math.max(...sigItemsLowerHalf.map(s => s.y)) + 24;
      }

      // --- Detect FOOTER zone ---
      // Footer items are at the BOTTOM of the page (lowest Y values in PDF space).
      // We look for a cluster of items in the bottom 15% of the page, excluding signatures.
      const bottomThreshold = pageHeight * 0.15;
      const bottomItems = allYPositions.filter(y => {
        if (signatureLayout) {
          return y <= bottomThreshold && (y < signatureLayout.yMin || y > signatureLayout.yMax);
        }
        return y <= bottomThreshold;
      });
      let footerTopY;
      if (bottomItems.length > 0) {
        // Footer top = highest Y among footer items, plus a small gap
        footerTopY = Math.max(...bottomItems) + 18;
      } else {
        // No distinct footer detected — use 54pt from bottom
        footerTopY = 54;
      }


      // --- Detect margins ---
      // Use the 5th percentile and 95th percentile to avoid outliers
      const leftEdge = allXLeft.length > 2
        ? allXLeft[Math.min(1, allXLeft.length - 1)]   // second-smallest X
        : (allXLeft[0] || 50);
      const rightEdge = allXRight.length > 2
        ? allXRight[Math.min(1, allXRight.length - 1)]  // second-largest right X
        : (allXRight[0] || pageWidth - 50);

      layouts.push({
        pageNum,
        pageWidth,
        pageHeight,
        headerBottomY: Math.max(headerBottomY, pageHeight * 0.5),  // never let header consume more than half the page
        footerTopY: Math.min(footerTopY, pageHeight * 0.75),        // never let footer consume more than 75% of the page
        leftEdge: Math.max(leftEdge, 20),                           // minimum 20pt margin
        rightEdge: Math.min(rightEdge, pageWidth - 20),
        hasSignatureZone,
        signatureTopY,
        signatureLayout
      });
    }

    return layouts;
  }
};

export default PdfParser;
