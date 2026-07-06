import { TemplateParser } from './TemplateParser';
import { parseLatexToText } from '../latex';
import { PaginationEngine } from './PaginationEngine';
import { QuestionRenderer } from './QuestionRenderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * DocumentEngine Class
 * Core controller that parses templates, layouts the content, and injects data safely.
 */
export class DocumentEngine {
  /**
   * Generates a compiled Word Document (.docx) template with questions.
   * Modifies the XML tree directly via DOM manipulation (no raw string concatenation).
   */
  static async generateDocx(docxArrayBuffer, questions, qtypes) {
    // 1. Parse template DOM structure
    const parsed = await TemplateParser.parseDocx(docxArrayBuffer);
    const { zip, xmlDoc, placeholderP } = parsed;

    if (!placeholderP) {
      throw new Error("Invalid Template: Missing {{QUESTION_PAPER}} placeholder in DOCX body.");
    }

    const parent = placeholderP.parentNode;
    
    // Extract baseline run properties for style inheritance
    let baseRPr = null;
    let basePPr = null;
    
    const rList = Array.from(placeholderP.children).filter(c => c.localName === "r");
    for (const r of rList) {
      const rPr = Array.from(r.children).find(c => c.localName === "rPr");
      if (rPr) {
        baseRPr = rPr.cloneNode(true);
        break;
      }
    }
    const pPrNode = Array.from(placeholderP.children).find(c => c.localName === "pPr");
    if (pPrNode) {
      basePPr = pPrNode.cloneNode(true);
    }

    // Group questions by section
    const getQuestionsByType = (typeId) => questions.filter(q => q.type === typeId);
    const sectionIds = ["mcq", "vsa", "sa", "la"];
    
    const SECTION_NAMES = {
      mcq: "Section A — Multiple Choice Questions",
      vsa: "Section B — Very Short Answer Questions",
      sa: "Section C — Short Answer Questions",
      la: "Section D — Long Answer Questions"
    };

    let globalQNum = 0;

    // 2. Inject section titles and question DOM elements before the placeholder paragraph
    sectionIds.forEach(secId => {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) return;

      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      
      // Inject Section Header Paragraph
      const headerP = QuestionRenderer.createSectionHeaderXml(
        xmlDoc,
        SECTION_NAMES[secId] || secId.toUpperCase(),
        qtConf.count,
        qtConf.marks,
        baseRPr,
        basePPr
      );
      parent.insertBefore(headerP, placeholderP);

      // Inject Question Paragraphs
      secQuestions.forEach(q => {
        globalQNum++;
        const qNodes = QuestionRenderer.createQuestionXml(xmlDoc, q, globalQNum, baseRPr, basePPr);
        qNodes.forEach(node => parent.insertBefore(node, placeholderP));
      });
    });

    // 3. Remove the original {{QUESTION_PAPER}} placeholder paragraph
    parent.removeChild(placeholderP);

    // 4. Serialize modified DOM XML back to ZIP package
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    zip.file("word/document.xml", xmlString);

    // 5. Generate package ArrayBuffer
    return await zip.generateAsync({ type: "arraybuffer" });
  }

  /**
   * Generates a compiled PDF template with questions.
   * Treats the uploaded PDF as a fixed background template.
   * Questions are overlaid only in the detected safe content zone.
   */
  static async generatePdf(pdfArrayBuffer, questions, qtypes, placeholderDetails) {
    if (!pdfArrayBuffer) {
      throw new Error("No PDF template binary loaded.");
    }
    if (!placeholderDetails) {
      throw new Error("PDF template placeholder coordinates not found.");
    }

    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const fontSize = 10.5;
    const lineHeight = fontSize * 1.35;

    // Resolve page layout data from scanned template
    let pageLayouts = placeholderDetails.pageLayouts || null;
    if (!pageLayouts) {
      try {
        const { PdfParser } = await import('../PdfParser');
        const buffer = pdfArrayBuffer instanceof Uint8Array
          ? pdfArrayBuffer.buffer.slice(pdfArrayBuffer.byteOffset, pdfArrayBuffer.byteOffset + pdfArrayBuffer.byteLength)
          : pdfArrayBuffer;
        const pdfjsDoc = await PdfParser.loadPdf(buffer);
        pageLayouts = await PdfParser.scanPageLayout(pdfjsDoc, placeholderDetails);
      } catch (err) {
        console.warn("[DocumentEngine] Dynamic layout scan failed:", err);
      }
    }
    const placeholderPageIndex = placeholderDetails.pageIndex - 1;
    const placeholderPage = pdfDoc.getPage(placeholderPageIndex);
    const { width: pageWidth, height: pageHeight } = placeholderPage.getSize();

    // Determine safe content zone from scanned layouts or defaults
    const placeholderLayout = pageLayouts
      ? pageLayouts.find(l => l.pageNum === placeholderDetails.pageIndex)
      : null;

    const safeLeft = placeholderLayout
      ? Math.max(placeholderLayout.leftEdge, 36)
      : Math.max(placeholderDetails.x || 54, 36);
    const safeRight = placeholderLayout
      ? Math.min(placeholderLayout.rightEdge, pageWidth - 36)
      : pageWidth - 54;
    const safeTop = placeholderLayout
      ? placeholderLayout.headerBottomY
      : pageHeight - 80;
    const safeBottom = placeholderLayout
      ? placeholderLayout.footerTopY
      : 80;

    const contentWidth = safeRight - safeLeft;
    const leftMargin = safeLeft;
    const templatePageIndex = placeholderPageIndex;
    const totalTemplatePages = pdfDoc.getPageCount();

    // Helper to white-out the template signature zone if detected on that page
    const whiteOutSignatures = (page, pageIdx) => {
      let sigLayout = null;
      if (pageLayouts) {
        const originalPageNum = pageIdx < totalTemplatePages ? pageIdx + 1 : placeholderDetails.pageIndex;
        const layout = pageLayouts.find(l => l.pageNum === originalPageNum);
        sigLayout = layout?.signatureLayout;
      }
      if (sigLayout) {
        page.drawRectangle({
          x: sigLayout.xMin,
          y: sigLayout.yMin,
          width: sigLayout.xMax - sigLayout.xMin,
          height: sigLayout.yMax - sigLayout.yMin,
          color: rgb(1, 1, 1),
          opacity: 1
        });
      }
    };

    const layoutState = {
      pdfDoc,
      currentPage: placeholderPage,
      currentPageIndex: placeholderPageIndex,
      currentY: placeholderDetails.y,
      contentWidth,
      leftMargin,
      safeTop,
      safeBottom,
      lineHeight,
      pageLayouts,
      templatePageIndex,
      totalTemplatePages,
      
      getSafeBottomForPage(pageIdx) {
        if (this.pageLayouts) {
          const targetPageNum = pageIdx < this.totalTemplatePages ? pageIdx + 1 : this.templatePageIndex + 1;
          const layout = this.pageLayouts.find(l => l.pageNum === targetPageNum);
          if (layout) return layout.footerTopY;
        }
        return safeBottom;
      },

      getSafeTopForPage(pageIdx) {
        if (this.pageLayouts) {
          const targetPageNum = pageIdx < this.totalTemplatePages ? pageIdx + 1 : this.templatePageIndex + 1;
          const layout = this.pageLayouts.find(l => l.pageNum === targetPageNum);
          if (layout) return layout.headerBottomY;
        }
        return safeTop;
      },

      async moveToNextPage() {
        if (this.currentPageIndex < this.totalTemplatePages - 1) {
          this.currentPageIndex++;
          this.currentPage = this.pdfDoc.getPage(this.currentPageIndex);

          const pageSafeTop = this.getSafeTopForPage(this.currentPageIndex);
          const pageSafeBottom = this.getSafeBottomForPage(this.currentPageIndex);

          this.currentPage.drawRectangle({
            x: this.leftMargin - 5,
            y: pageSafeBottom,
            width: this.contentWidth + 10,
            height: pageSafeTop - pageSafeBottom,
            color: rgb(1, 1, 1),
            opacity: 1
          });

          // Erase template signatures on this page
          whiteOutSignatures(this.currentPage, this.currentPageIndex);

          this.currentY = pageSafeTop;
        } else {
          const [copiedPage] = await this.pdfDoc.copyPages(
            this.pdfDoc,
            [this.templatePageIndex]
          );
          this.pdfDoc.addPage(copiedPage);
          this.currentPageIndex = this.pdfDoc.getPageCount() - 1;
          this.currentPage = this.pdfDoc.getPage(this.currentPageIndex);

          this.currentPage.drawRectangle({
            x: this.leftMargin - 5,
            y: safeBottom,
            width: this.contentWidth + 10,
            height: safeTop - safeBottom,
            color: rgb(1, 1, 1),
            opacity: 1
          });

          // Erase template signatures on this cloned page
          whiteOutSignatures(this.currentPage, this.currentPageIndex);

          this.currentY = safeTop;
        }
      },

      willFit(blockHeight) {
        const bottom = this.getSafeBottomForPage(this.currentPageIndex);
        return (this.currentY - blockHeight) >= bottom;
      }
    };

    // Erase the original placeholder text (small precise rectangle only)
    const placeholderTextWidth = font.widthOfTextAtSize("{{QUESTION_PAPER}}", 14);
    layoutState.currentPage.drawRectangle({
      x: placeholderDetails.x - 2,
      y: placeholderDetails.y - 4,
      width: Math.max(placeholderTextWidth + 20, 180),
      height: 20,
      color: rgb(1, 1, 1),
      opacity: 1
    });

    // Erase template signatures on page 1
    whiteOutSignatures(layoutState.currentPage, layoutState.currentPageIndex);

    const getQuestionsByType = (typeId) => questions.filter(q => q.type === typeId);
    const sectionIds = ["mcq", "vsa", "sa", "la"];
    
    const SECTION_NAMES = {
      mcq: "Section A \u2014 Multiple Choice Questions",
      vsa: "Section B \u2014 Very Short Answer Questions",
      sa: "Section C \u2014 Short Answer Questions",
      la: "Section D \u2014 Long Answer Questions"
    };

    let globalQNum = 0;

    for (const secId of sectionIds) {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) continue;

      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      
      // Measure Section Header
      const headerText = `${SECTION_NAMES[secId] || secId.toUpperCase()} (${qtConf.count} \u00d7 ${qtConf.marks} = ${qtConf.count * qtConf.marks} marks)`;
      const headerLines = this._wrapText(headerText, contentWidth, fontBold, fontSize + 1);
      const headerHeight = headerLines.length * (lineHeight + 2) + 24;

      // Estimate height of the first question for orphan checking
      const firstQ = secQuestions[0];
      let firstQHeight = 0;
      if (firstQ) {
        firstQHeight = this._estimateQuestionHeight(firstQ, globalQNum + 1, contentWidth, font, fontBold, fontSize, lineHeight);
      }

      if (!layoutState.willFit(headerHeight + firstQHeight)) {
        await layoutState.moveToNextPage();
      }

      // Render Header
      await QuestionRenderer.renderSectionHeaderToPdf(
        layoutState,
        SECTION_NAMES[secId] || secId.toUpperCase(),
        qtConf.count,
        qtConf.marks,
        fontBold,
        fontSize
      );

      // Render Questions
      for (const q of secQuestions) {
        globalQNum++;
        
        const qHeight = this._estimateQuestionHeight(q, globalQNum, contentWidth, font, fontBold, fontSize, lineHeight);
        
        let spaceNeeded = qHeight;

        if (!layoutState.willFit(spaceNeeded)) {
          await layoutState.moveToNextPage();
        }
        await QuestionRenderer.renderQuestionToPdf(
          layoutState,
          q,
          globalQNum,
          font,
          fontBold,
          fontSize
        );
      }
    }
    // Draw signatures at the bottom of the last page
    const lastPage = layoutState.currentPage;
    const signatureY = 55;
    const fontSizeSig = 10;
    const teacherText = "Teacher Signature";
    const principalText = "Principal Signature";
    const principalWidth = font.widthOfTextAtSize(principalText, fontSizeSig);

    lastPage.drawText(teacherText, {
      x: leftMargin,
      y: signatureY,
      size: fontSizeSig,
      font: font,
      color: rgb(0, 0, 0)
    });

    lastPage.drawText(principalText, {
      x: leftMargin + contentWidth - principalWidth,
      y: signatureY,
      size: fontSizeSig,
      font: font,
      color: rgb(0, 0, 0)
    });

    return await pdfDoc.save();
  }

  static _wrapText(text, maxWidth, font, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
          currentLine = '';
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  static _estimateQuestionHeight(q, globalNum, contentWidth, font, fontBold, fontSize, lineHeight) {
    const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'ascii');
    const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'ascii');
    const choicesList = q.choices || q.choicesM || q.options || null;

    const numText = `Q${globalNum}. `;
    const numWidth = fontBold.widthOfTextAtSize(numText, fontSize);
    const marksText = `[${q.marks}]`;
    const marksWidth = fontBold.widthOfTextAtSize(marksText, fontSize);
    
    // First line wrapped width
    const firstLineMax = contentWidth - numWidth - marksWidth - 15;
    const restLinesMax = contentWidth - 24;
    
    const words = questionText ? questionText.split(' ') : [];
    let lines = 0;
    let lineLength = 0;
    let isFirstLine = true;
    
    let charWidth = fontSize * 0.48;
    let firstLineLimitChars = Math.floor(firstLineMax / charWidth);
    let restLinesLimitChars = Math.floor(restLinesMax / charWidth);

    for (const word of words) {
      const limit = isFirstLine ? firstLineLimitChars : restLinesLimitChars;
      if (lineLength + word.length > limit) {
        lines++;
        lineLength = word.length;
        isFirstLine = false;
      } else {
        lineLength += word.length + 1;
      }
    }
    if (lineLength > 0) lines++;
    
    const qTextHeight = Math.max(1, lines) * lineHeight;
    
    // Options
    let optHeight = 0;
    if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
      choicesList.forEach((opt, idx) => {
        const cleanOpt = parseLatexToText(opt, 'ascii');
        const prefix = `(${"abcd"[idx]}) `;
        const optLines = this._wrapText(prefix + cleanOpt, contentWidth - 24, font, fontSize);
        optHeight += optLines.length * lineHeight + 3;
      });
    }

    return qTextHeight + optHeight + 8;
  }
}

export default DocumentEngine;
