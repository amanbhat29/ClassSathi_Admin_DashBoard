import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { parseLatexToText } from './latex';

/**
 * QuestionInjector Utility
 * Compiles questions lists and overlays them page-by-page on PDF templates.
 */
export const QuestionInjector = {
  /**
   * Sanitizes text to Helvetica-compatible characters to prevent standard PDF fonts from throwing errors.
   */
  sanitizeText(str, isHelvetica = false) {
    if (!str) return '';
    if (isHelvetica) {
      return str
        .replace(/[–—]/g, '-')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/₹/g, "Rs. ")
        .replace(/…/g, "...")
        .replace(/α/g, "alpha")
        .replace(/β/g, "beta")
        .replace(/γ/g, "gamma")
        .replace(/Δ/g, "Delta")
        .replace(/δ/g, "delta")
        .replace(/θ/g, "theta")
        .replace(/π/g, "pi")
        .replace(/μ/g, "mu")
        .replace(/λ/g, "lambda")
        .replace(/σ/g, "sigma")
        .replace(/omega/g, "omega")
        .replace(/φ/g, "phi")
        .replace(/ε/g, "epsilon")
        .replace(/η/g, "eta")
        .replace(/τ/g, "tau")
        .replace(/rho/g, "rho")
        .replace(/±/g, "+/-")
        .replace(/[×\u00d7]/g, "x")
        .replace(/[÷\u00f7]/g, "/")
        .replace(/≈/g, "~")
        .replace(/neq/g, "!=")
        .replace(/[≤≤]/g, "<=")
        .replace(/[≥≥]/g, ">=")
        .replace(/∞/g, "infinity")
        .replace(/⁰/g, "^0").replace(/¹/g, "^1").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4")
        .replace(/⁵/g, "^5").replace(/⁶/g, "^6").replace(/⁷/g, "^7").replace(/⁸/g, "^8").replace(/⁹/g, "^9")
        .replace(/⁻/g, "^-").replace(/⁺/g, "^+").replace(/⁼/g, "^=").replace(/⁽/g, "^(").replace(/⁾/g, "^)")
        .replace(/ⁿ/g, "^n").replace(/ⁱ/g, "^i")
        .replace(/₀/g, "_0").replace(/₁/g, "_1").replace(/₂/g, "_2").replace(/₃/g, "_3").replace(/₄/g, "_4")
        .replace(/₅/g, "_5").replace(/₆/g, "_6").replace(/₇/g, "_7").replace(/₈/g, "_8").replace(/₉/g, "_9")
        .replace(/₋/g, "_-").replace(/₊/g, "_+").replace(/₌/g, "_=").replace(/₍/g, "_(").replace(/₎/g, "_)")
        .replace(/[^\x00-\x7F\u00B0]/g, ""); // Keep degree symbol
    } else {
      return str
        .replace(/[–—]/g, '-')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/₹/g, "Rs. ")
        .replace(/…/g, "...");
    }
  },

  wrapText(text, maxWidth, font, fontSize) {
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
  },

  wrapQuestionText(text, questionColWidth, numWidth, font, fontSize) {
    const words = text.split(' ');
    const lines = [];
    
    const firstLineMax = questionColWidth - numWidth;
    const indent = 24;
    const restLineMax = questionColWidth - indent;
    
    let currentLine = '';
    let isFirstLine = true;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      const limit = isFirstLine ? firstLineMax : restLineMax;
      
      if (width > limit) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
          isFirstLine = false;
        } else {
          lines.push(word);
          currentLine = '';
          isFirstLine = false;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  },

  /**
   * Main overlay injection routine.
   */
  async injectQuestionsPdf(pdfArrayBuffer, questions, qtypes, placeholderDetails) {
    if (!pdfArrayBuffer) {
      throw new Error("No PDF template binary loaded.");
    }
    if (!placeholderDetails) {
      throw new Error("PDF template placeholder coordinates not found.");
    }

    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    
    let font;
    let fontBold;
    let customFontLoaded = false;
    
    try {
      const regularResp = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf');
      const boldResp = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf');
      if (regularResp.ok && boldResp.ok) {
        const regularBytes = await regularResp.arrayBuffer();
        const boldBytes = await boldResp.arrayBuffer();
        font = await pdfDoc.embedFont(regularBytes);
        fontBold = await pdfDoc.embedFont(boldBytes);
        customFontLoaded = true;
      } else {
        throw new Error('CDN responded with status error');
      }
    } catch (err) {
      console.warn("[QuestionInjector] Roboto CDN load failed, falling back to standard Helvetica:", err);
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
    
    const fontSize = 10.5;
    const lineHeight = fontSize * 1.35;

    let pageLayouts = placeholderDetails.pageLayouts || null;
    if (!pageLayouts) {
      try {
        const { PdfParser } = await import('./PdfParser');
        const buffer = pdfArrayBuffer instanceof Uint8Array
          ? pdfArrayBuffer.buffer.slice(pdfArrayBuffer.byteOffset, pdfArrayBuffer.byteOffset + pdfArrayBuffer.byteLength)
          : pdfArrayBuffer;
        const pdfjsDoc = await PdfParser.loadPdf(buffer);
        pageLayouts = await PdfParser.scanPageLayout(pdfjsDoc, placeholderDetails);
      } catch (err) {
        console.warn("[QuestionInjector] Dynamic layout scan failed:", err);
      }
    }
    const placeholderPageIndex = placeholderDetails.pageIndex - 1;
    const placeholderPage = pdfDoc.getPage(placeholderPageIndex);
    const { width: pageWidth, height: pageHeight } = placeholderPage.getSize();

    const placeholderLayout = pageLayouts
      ? pageLayouts.find(l => l.pageNum === placeholderDetails.pageIndex)
      : null;

    const safeLeft = placeholderLayout
      ? Math.max(placeholderLayout.leftEdge, 36)
      : 55;
    const safeRight = placeholderLayout
      ? Math.min(placeholderLayout.rightEdge, pageWidth - 36)
      : pageWidth - 55;
    const safeTop = placeholderLayout
      ? Math.min(pageHeight - 55, placeholderLayout.headerBottomY)
      : pageHeight - 55;
    const safeBottom = placeholderLayout
      ? Math.max(55, placeholderLayout.footerTopY)
      : 55;

    const contentWidth = safeRight - safeLeft;
    const leftMargin = safeLeft;
    const templatePageIndex = placeholderPageIndex;
    const totalTemplatePages = pdfDoc.getPageCount();

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
      customFontLoaded,
      
      getSafeBottomForPage(pageIdx) {
        if (this.pageLayouts) {
          const targetPageNum = pageIdx < this.totalTemplatePages ? pageIdx + 1 : this.templatePageIndex + 1;
          const layout = this.pageLayouts.find(l => l.pageNum === targetPageNum);
          if (layout) return Math.max(55, layout.footerTopY);
        }
        return safeBottom;
      },

      getSafeTopForPage(pageIdx) {
        if (this.pageLayouts) {
          const targetPageNum = pageIdx < this.totalTemplatePages ? pageIdx + 1 : this.templatePageIndex + 1;
          const layout = this.pageLayouts.find(l => l.pageNum === targetPageNum);
          if (layout) return Math.min(pageHeight - 55, layout.headerBottomY);
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

          whiteOutSignatures(this.currentPage, this.currentPageIndex);

          this.currentY = pageSafeTop;
        } else {
          // Add a completely blank clean A4 page instead of copying logo/school-name headers
          const newPage = this.pdfDoc.addPage([595.28, 841.89]);
          this.currentPage = newPage;
          this.currentPageIndex = this.pdfDoc.getPageCount() - 1;

          this.currentY = 841.89 - 55; // start at top margin
        }
      },

      willFit(height) {
        const pageSafeBottom = this.getSafeBottomForPage(this.currentPageIndex);
        return (this.currentY - height >= pageSafeBottom);
      }
    };

    // Erase the original placeholder text
    const placeholderTextWidth = font.widthOfTextAtSize("{{QUESTION_PAPER}}", 14);
    layoutState.currentPage.drawRectangle({
      x: placeholderDetails.x - 2,
      y: placeholderDetails.y - 4,
      width: Math.max(placeholderTextWidth + 20, 180),
      height: 20,
      color: rgb(1, 1, 1),
      opacity: 1
    });

    whiteOutSignatures(layoutState.currentPage, layoutState.currentPageIndex);

    const isHelvetica = !customFontLoaded;

    const getQuestionsByType = (typeId) => questions.filter(q => q.type === typeId);
    const sectionIds = ["mcq", "vsa", "sa", "la"];

    const SECTION_NAMES = {
      mcq: "Section A — Multiple Choice Questions",
      vsa: "Section B — Very Short Answer Questions",
      sa: "Section C — Short Answer Questions",
      la: "Section D — Long Answer Questions"
    };

    let globalQNum = 0;

    for (const secId of sectionIds) {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) continue;

      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      const title = `${SECTION_NAMES[secId] || secId.toUpperCase()}`;
      const marksLabel = `${qtConf.count} × ${qtConf.marks} = ${qtConf.count * qtConf.marks} marks`;
      const fullTitle = `${title} (${marksLabel})`;

      const titleLines = this.wrapText(this.sanitizeText(fullTitle, isHelvetica), contentWidth, fontBold, 12.5);
      const headerHeight = titleLines.length * 16 + 24;

      if (!layoutState.willFit(headerHeight)) {
        await layoutState.moveToNextPage();
      }

      titleLines.forEach(line => {
        layoutState.currentPage.drawText(line, {
          x: leftMargin,
          y: layoutState.currentY - 12.5,
          size: 12.5,
          font: fontBold,
          color: rgb(0, 0, 0)
        });
        layoutState.currentY -= 16;
      });
      layoutState.currentY -= 8;

      for (const q of secQuestions) {
        globalQNum++;
        const questionText = parseLatexToText(q.questionTxt || q.text || '', 'unicode');
        const choicesList = q.choices || q.options || null;

        const numLabel = `Q${globalQNum}. `;
        const numWidth = fontBold.widthOfTextAtSize(this.sanitizeText(numLabel, isHelvetica), fontSize);
        const questionColWidth = contentWidth * 0.86;

        const qLines = this.wrapQuestionText(
          this.sanitizeText(questionText, isHelvetica),
          questionColWidth,
          numWidth,
          font,
          fontSize
        );

        const optData = [];
        let optHeight = 0;
        if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
          choicesList.forEach((opt, idx) => {
            const cleanOpt = parseLatexToText(opt, 'unicode');
            const prefix = `(${"abcd"[idx]}) `;
            const wrapped = this.wrapText(
              this.sanitizeText(prefix + cleanOpt, isHelvetica),
              questionColWidth - 24,
              font,
              fontSize
            );
            optData.push(wrapped);
            optHeight += wrapped.length * lineHeight + 3;
          });
        }

        const qHeight = qLines.length * lineHeight + optHeight + 12;

        const isLastQuestion = globalQNum === questions.length;
        let spaceNeeded = qHeight;
        if (isLastQuestion) {
          spaceNeeded += 50;
        }

        if (!layoutState.willFit(spaceNeeded)) {
          await layoutState.moveToNextPage();
        }

        layoutState.currentPage.drawText(this.sanitizeText(numLabel, isHelvetica), {
          x: leftMargin,
          y: layoutState.currentY - fontSize,
          size: fontSize,
          font: fontBold,
          color: rgb(0, 0, 0)
        });

        layoutState.currentPage.drawText(qLines[0], {
          x: leftMargin + numWidth,
          y: layoutState.currentY - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        layoutState.currentPage.drawText(this.sanitizeText(`[${q.marks}]`, isHelvetica), {
          x: leftMargin + questionColWidth + 25,
          y: layoutState.currentY - fontSize,
          size: fontSize,
          font: fontBold,
          color: rgb(0, 0, 0)
        });

        layoutState.currentY -= lineHeight;

        for (let i = 1; i < qLines.length; i++) {
          layoutState.currentPage.drawText(qLines[i], {
            x: leftMargin + 24,
            y: layoutState.currentY - fontSize,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0)
          });
          layoutState.currentY -= lineHeight;
        }

        if (optData.length > 0) {
          for (const optLines of optData) {
            for (const line of optLines) {
              layoutState.currentPage.drawText(line, {
                x: leftMargin + 24,
                y: layoutState.currentY - fontSize,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
              });
              layoutState.currentY -= lineHeight;
            }
            layoutState.currentY -= 3;
          }
        }

        layoutState.currentY -= 12;
      }
    }

    const lastPage = layoutState.currentPage;
    const signatureY = 55;
    const fontSizeSig = 10;
    const teacherText = "Teacher Signature";
    const principalText = "Principal Signature";
    const principalWidth = font.widthOfTextAtSize(this.sanitizeText(principalText, isHelvetica), fontSizeSig);

    lastPage.drawText(this.sanitizeText(teacherText, isHelvetica), {
      x: leftMargin,
      y: signatureY,
      size: fontSizeSig,
      font: font,
      color: rgb(0, 0, 0)
    });
    lastPage.drawText(this.sanitizeText(principalText, isHelvetica), {
      x: leftMargin + contentWidth - principalWidth,
      y: signatureY,
      size: fontSizeSig,
      font: font,
      color: rgb(0, 0, 0)
    });

    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const text = `Page ${i + 1} of ${pageCount}`;
      const textWidth = font.widthOfTextAtSize(text, 8);
      page.drawText(text, {
        x: leftMargin + (contentWidth - textWidth) / 2,
        y: 40,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
    }

    return await pdfDoc.save();
  }
};

export default QuestionInjector;
