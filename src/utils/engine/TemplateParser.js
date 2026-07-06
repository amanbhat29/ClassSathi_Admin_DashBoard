import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist';

// Configure the pdfjs worker url
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

/**
 * TemplateParser Class
 * Parses DOCX or PDF templates to identify headers, placeholders, footers, and margins.
 */
export class TemplateParser {
  /**
   * Universal parse function.
   */
  static async parse(arrayBuffer, filename) {
    const name = filename || '';
    const extension = name.split('.').pop().toLowerCase();
    
    if (extension === 'docx') {
      return await this.parseDocx(arrayBuffer);
    } else if (extension === 'pdf') {
      return await this.parsePdf(arrayBuffer);
    }
    throw new Error("Unsupported template format. Only DOCX and PDF are supported.");
  }

  /**
   * Parses Microsoft Word (.docx) templates.
   */
  static async parseDocx(arrayBuffer) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (!docXmlFile) {
        throw new Error("Invalid DOCX: missing word/document.xml");
      }
      
      const docXmlText = await docXmlFile.async("text");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXmlText, "text/xml");
      
      // Locate placeholder paragraph
      const paragraphs = xmlDoc.getElementsByTagName("w:p");
      let placeholderP = null;
      let placeholderCount = 0;
      
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const text = this._getParagraphText(p);
        if (text.includes("{{QUESTION_PAPER}}")) {
          placeholderP = p;
          placeholderCount++;
        }
      }
      
      return {
        type: 'docx',
        zip,
        xmlDoc,
        placeholderCount,
        placeholderFound: placeholderCount === 1,
        placeholderP
      };
    } catch (err) {
      throw new Error(`Failed to parse DOCX template: ${err.message}`);
    }
  }

  /**
   * Parses PDF templates.
   */
  static async parsePdf(arrayBuffer) {
    try {
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      
      let placeholderFound = false;
      let placeholderDetails = null;
      
      // Extract header/footer text runs relative to the placeholder
      const headerTextRuns = [];
      const footerTextRuns = [];
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items || [];
        const viewport = page.getViewport({ scale: 1 });
        
        let pageHasPlaceholder = false;
        let pagePlaceholderY = 0;
        
        // Scan for placeholder in this page
        for (const item of items) {
          if (item.str && item.str.includes('{{QUESTION_PAPER}}')) {
            placeholderFound = true;
            pageHasPlaceholder = true;
            pagePlaceholderY = item.transform[5];
            placeholderDetails = {
              pageIndex: pageNum,
              x: item.transform[4],
              y: item.transform[5],
              pageWidth: viewport.width,
              pageHeight: viewport.height
            };
            break;
          }
        }
        
        // Group page text runs into header/footer based on placeholder position
        for (const item of items) {
          if (item.str === '{{QUESTION_PAPER}}') continue;
          
          const y = item.transform[5];
          const textItem = {
            text: item.str,
            x: item.transform[4],
            y: y,
            page: pageNum
          };
          
          if (placeholderFound) {
            if (pageNum < placeholderDetails.pageIndex) {
              headerTextRuns.push(textItem);
            } else if (pageNum > placeholderDetails.pageIndex) {
              footerTextRuns.push(textItem);
            } else {
              // Same page: check y coordinates (y goes from bottom to top in PDF points)
              if (y > placeholderPlaceholderY(pagePlaceholderY, pageHasPlaceholder)) {
                headerTextRuns.push(textItem);
              } else {
                footerTextRuns.push(textItem);
              }
            }
          } else {
            // Placeholder not found yet: accumulate in header runs
            headerTextRuns.push(textItem);
          }
        }
      }
      
      function placeholderPlaceholderY(yVal, hasP) {
        return hasP ? yVal : 9999;
      }
      
      return {
        type: 'pdf',
        pdfDoc,
        pageCount: numPages,
        placeholderFound,
        placeholderDetails,
        headerTextRuns,
        footerTextRuns
      };
    } catch (err) {
      if (err.name === 'PasswordException') {
        throw new Error("PasswordProtected: PDF is encrypted.");
      }
      throw new Error(`Failed to parse PDF template: ${err.message || err}`);
    }
  }

  static _getParagraphText(p) {
    const rList = Array.from(p.children).filter(child => child.localName === "r");
    let text = "";
    for (const r of rList) {
      const tList = Array.from(r.children).filter(child => child.localName === "t");
      for (const t of tList) {
        text += t.textContent || "";
      }
    }
    return text;
  }
}

export default TemplateParser;
