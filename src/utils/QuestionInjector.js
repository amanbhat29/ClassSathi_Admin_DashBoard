import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { parseLatexToText } from './latex';

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/**
 * Helper to create an XML element with standard namespaces.
 */
function createEl(xmlDoc, tagName, attrs = {}, textContent) {
  const el = xmlDoc.createElementNS(W_NS, "w:" + tagName);
  for (const [key, val] of Object.entries(attrs)) {
    if (key.includes(':')) {
      el.setAttribute(key, val);
    } else {
      el.setAttribute("w:" + key, val);
    }
  }
  if (textContent !== undefined && textContent !== null) {
    el.textContent = textContent;
  }
  return el;
}

/**
 * Helper to fetch a child by local name from a parent element.
 */
function getFirstChildByLocalName(parent, localName) {
  if (!parent) return null;
  return Array.from(parent.children).find(child => child.localName === localName) || null;
}

/**
 * Sanitizes input text to replace unicode characters unsupported by Standard WinAnsi PDF fonts.
 */
function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/[–—]/g, '-') // en-dash, em-dash
    .replace(/[“”]/g, '"') // smart double quotes
    .replace(/[‘’]/g, "'") // smart single quotes
    .replace(/₹/g, "Rs. ") // rupee symbol
    .replace(/…/g, "...") // ellipsis
    .replace(/[×\u00d7]/g, "x") // multiplication sign
    .replace(/[^\x00-\x7F]/g, ""); // fallback: strip other non-ASCII characters to prevent encoding crash
}

/**
 * Standard text wrapping helper.
 */
function wrapText(text, maxWidth, font, fontSize) {
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

/**
 * Wraps question text keeping in mind different indentation limits for the first line.
 */
function wrapQuestionText(text, contentWidth, numWidth, marksWidth, font, fontSize) {
  const words = text.split(' ');
  const lines = [];
  
  const firstLineMax = contentWidth - numWidth - marksWidth - 15;
  const indent = 24;
  const restLineMax = contentWidth - indent;
  
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
}

/**
 * QuestionInjector Utility
 * Compiles questions lists into raw OpenXML paragraph structures (DOCX)
 * or writes them page by page on PDF templates using pdf-lib (PDF).
 */
export const QuestionInjector = {
  /* =========================================================================
     DOCX TEMPLATE SPLICING LOGIC (Preserving existing implementation exactly)
     ========================================================================= */
  createSectionHeader(xmlDoc, title, count, marks, baseRPr, basePPr) {
    const p = createEl(xmlDoc, "p");
    
    // Inherit the surrounding paragraph style if available
    const pPr = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
    p.appendChild(pPr);

    // Remove old indentation if present to ensure headings are left-aligned
    const indEl = getFirstChildByLocalName(pPr, "ind");
    if (indEl) {
      pPr.removeChild(indEl);
    }

    // Set heading spacing (before: 18pt = 360, after: 6pt = 120) and keepNext
    let spacingEl = getFirstChildByLocalName(pPr, "spacing");
    if (spacingEl) {
      spacingEl.setAttribute("w:before", "360");
      spacingEl.setAttribute("w:after", "120");
    } else {
      pPr.appendChild(createEl(xmlDoc, "spacing", { before: "360", after: "120", line: "240", lineRule: "auto" }));
    }

    if (!getFirstChildByLocalName(pPr, "keepNext")) {
      pPr.appendChild(createEl(xmlDoc, "keepNext"));
    }

    // Run 1: Section Title (Bold, size 26 = 13pt)
    const rTitle = createEl(xmlDoc, "r");
    const rPrTitle = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    
    let bEl = getFirstChildByLocalName(rPrTitle, "b");
    if (!bEl) rPrTitle.appendChild(createEl(xmlDoc, "b"));
    
    let szEl = getFirstChildByLocalName(rPrTitle, "sz");
    if (szEl) szEl.setAttribute("w:val", "26");
    else rPrTitle.appendChild(createEl(xmlDoc, "sz", { val: "26" }));
    
    let szCsEl = getFirstChildByLocalName(rPrTitle, "szCs");
    if (szCsEl) szCsEl.setAttribute("w:val", "26");
    else rPrTitle.appendChild(createEl(xmlDoc, "szCs", { val: "26" }));

    rTitle.appendChild(rPrTitle);
    rTitle.appendChild(createEl(xmlDoc, "t", {}, title));
    p.appendChild(rTitle);

    // Run 2: Section Marks (Normal, size 22 = 11pt)
    const rMarks = createEl(xmlDoc, "r");
    const rPrMarks = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    
    let bElMarks = getFirstChildByLocalName(rPrMarks, "b");
    if (bElMarks) rPrMarks.removeChild(bElMarks);

    let szElMarks = getFirstChildByLocalName(rPrMarks, "sz");
    if (szElMarks) szElMarks.setAttribute("w:val", "22");
    else rPrMarks.appendChild(createEl(xmlDoc, "sz", { val: "22" }));

    let szCsElMarks = getFirstChildByLocalName(rPrMarks, "szCs");
    if (szCsElMarks) szCsElMarks.setAttribute("w:val", "22");
    else rPrMarks.appendChild(createEl(xmlDoc, "szCs", { val: "22" }));

    rMarks.appendChild(rPrMarks);
    rMarks.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, ` (${count} × ${marks} = ${count * marks} marks)`));
    p.appendChild(rMarks);

    return p;
  },

  createQuestionNodes(xmlDoc, q, globalNum, baseRPr, basePPr) {
    const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'unicode');
    const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'unicode');
    const choicesList = q.choices || q.choicesM || q.options || null;

    const nodes = [];

    // 1. Question Paragraph
    const p = createEl(xmlDoc, "p");
    const pPr = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
    p.appendChild(pPr);

    // Indentation: hanging indent of 480 (0.33 in)
    let indEl = getFirstChildByLocalName(pPr, "ind");
    if (indEl) {
      indEl.setAttribute("w:left", "480");
      indEl.setAttribute("w:hanging", "480");
    } else {
      pPr.appendChild(createEl(xmlDoc, "ind", { left: "480", hanging: "480" }));
    }

    // Spacing: after = 120 (6pt)
    let spacingEl = getFirstChildByLocalName(pPr, "spacing");
    if (spacingEl) {
      spacingEl.setAttribute("w:after", "120");
    } else {
      pPr.appendChild(createEl(xmlDoc, "spacing", { after: "120", line: "240", lineRule: "auto" }));
    }

    // Keep questions on the same page and keep with next (prevent orphans)
    if (!getFirstChildByLocalName(pPr, "keepNext")) {
      pPr.appendChild(createEl(xmlDoc, "keepNext"));
    }
    if (!getFirstChildByLocalName(pPr, "keepLines")) {
      pPr.appendChild(createEl(xmlDoc, "keepLines"));
    }

    // Tabs: Right aligned tab stop at 9000 dxas (approx 6.25 inches) for marks
    let tabsEl = getFirstChildByLocalName(pPr, "tabs");
    if (!tabsEl) {
      tabsEl = createEl(xmlDoc, "tabs");
      pPr.appendChild(tabsEl);
    }
    tabsEl.appendChild(createEl(xmlDoc, "tab", { val: "right", pos: "9000" }));

    // Run: Number (e.g. Q1.)
    const rNum = createEl(xmlDoc, "r");
    const rPrNum = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bEl = getFirstChildByLocalName(rPrNum, "b");
    if (!bEl) rPrNum.appendChild(createEl(xmlDoc, "b"));
    rNum.appendChild(rPrNum);
    rNum.appendChild(createEl(xmlDoc, "t", {}, `Q${globalNum}. `));
    p.appendChild(rNum);

    // Run: Text
    const rText = createEl(xmlDoc, "r");
    if (baseRPr) rText.appendChild(baseRPr.cloneNode(true));
    rText.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, questionText));
    p.appendChild(rText);

    // Run: Tab to push marks to the right
    const rTab = createEl(xmlDoc, "r");
    rTab.appendChild(createEl(xmlDoc, "tab"));
    p.appendChild(rTab);

    // Run: Marks
    const rMarks = createEl(xmlDoc, "r");
    const rPrMarks = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bElMarks = getFirstChildByLocalName(rPrMarks, "b");
    if (!bElMarks) rPrMarks.appendChild(createEl(xmlDoc, "b"));
    rMarks.appendChild(rPrMarks);
    rMarks.appendChild(createEl(xmlDoc, "t", {}, `[${q.marks}]`));
    p.appendChild(rMarks);

    nodes.push(p);

    // 2. MCQ Options (if MCQ)
    if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
      choicesList.forEach((opt, optIdx) => {
        const pOpt = createEl(xmlDoc, "p");
        const pPrOpt = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
        pOpt.appendChild(pPrOpt);

        // Option indent = 480 dxa
        let indOptEl = getFirstChildByLocalName(pPrOpt, "ind");
        if (indOptEl) {
          indOptEl.setAttribute("w:left", "480");
          indOptEl.removeAttribute("w:hanging");
        } else {
          pPrOpt.appendChild(createEl(xmlDoc, "ind", { left: "480" }));
        }

        // Spacing: after = 60 (3pt)
        let spacingOptEl = getFirstChildByLocalName(pPrOpt, "spacing");
        if (spacingOptEl) {
          spacingOptEl.setAttribute("w:after", "60");
        } else {
          pPrOpt.appendChild(createEl(xmlDoc, "spacing", { after: "60", line: "240", lineRule: "auto" }));
        }

        // Keep all options intact with the question
        if (!getFirstChildByLocalName(pPrOpt, "keepLines")) {
          pPrOpt.appendChild(createEl(xmlDoc, "keepLines"));
        }
        if (optIdx < choicesList.length - 1 && !getFirstChildByLocalName(pPrOpt, "keepNext")) {
          pPrOpt.appendChild(createEl(xmlDoc, "keepNext"));
        }

        const rOpt = createEl(xmlDoc, "r");
        if (baseRPr) {
          rOpt.appendChild(baseRPr.cloneNode(true));
        }
        const cleanOpt = parseLatexToText(opt, 'unicode');
        rOpt.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, `(${"abcd"[optIdx]}) ${cleanOpt}`));
        pOpt.appendChild(rOpt);

        nodes.push(pOpt);
      });
    }



    return nodes;
  },

  buildQuestionsXmlString(questions, qtypes, baseRPr, basePPr) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString('<w:root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:root>', "text/xml");
    
    let resultXml = "";
    const serializer = new XMLSerializer();

    const SECTION_NAMES = {
      mcq: "SECTION A — MULTIPLE CHOICE QUESTIONS",
      vsa: "SECTION B — VERY SHORT ANSWER QUESTIONS",
      sa: "SECTION C — SHORT ANSWER QUESTIONS",
      la: "SECTION D — LONG ANSWER QUESTIONS"
    };

    const getQuestionsByType = (typeId) => questions.filter((q) => q.type === typeId);
    let globalQNum = 0;

    const sectionIds = ["mcq", "vsa", "sa", "la"];
    sectionIds.forEach(secId => {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) return;

      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      
      // Section Header
      const headerP = this.createSectionHeader(
        xmlDoc,
        SECTION_NAMES[secId] || secId.toUpperCase(),
        qtConf.count,
        qtConf.marks,
        baseRPr,
        basePPr
      );
      resultXml += serializer.serializeToString(headerP);

      // Question Nodes
      secQuestions.forEach(q => {
        globalQNum++;
        const qNodes = this.createQuestionNodes(xmlDoc, q, globalQNum, baseRPr, basePPr);
        qNodes.forEach(node => {
          resultXml += serializer.serializeToString(node);
        });
      });
    });

    return resultXml;
  },

  /* =========================================================================
     PDF TEMPLATE SPLICING LOGIC (Dynamic vector/text layout via pdf-lib)
     Treats the uploaded PDF as a FIXED BACKGROUND TEMPLATE.
     Questions are overlaid only inside the detected safe content zone.
     Headers, footers, and signature blocks are never overwritten.
     ========================================================================= */
  async injectQuestionsPdf(templatePdfBytes, questions, qtypes, placeholderDetails) {
    if (!templatePdfBytes) {
      throw new Error("No PDF template binary provided.");
    }
    if (!placeholderDetails) {
      throw new Error("Placeholder details are missing.");
    }

    // 1. Load PDF document
    const pdfDoc = await PDFDocument.load(templatePdfBytes);
    
    // 2. Embed Standard Fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // 3. Resolve page layout data
    let pageLayouts = placeholderDetails.pageLayouts || null;
    if (!pageLayouts) {
      try {
        const { PdfParser } = await import('./PdfParser');
        // Convert Uint8Array to ArrayBuffer
        const buffer = templatePdfBytes.buffer.slice(templatePdfBytes.byteOffset, templatePdfBytes.byteOffset + templatePdfBytes.byteLength);
        const pdfjsDoc = await PdfParser.loadPdf(buffer);
        pageLayouts = await PdfParser.scanPageLayout(pdfjsDoc, placeholderDetails);
      } catch (err) {
        console.warn("[QuestionInjector] Dynamic layout scan failed:", err);
      }
    }
    const placeholderPageIndex = placeholderDetails.pageIndex - 1; // 0-based
    const placeholderPage = pdfDoc.getPage(placeholderPageIndex);
    const { width: pgWidth, height: pgHeight } = placeholderPage.getSize();
    
    // Use actual page dimensions from pdf-lib (authoritative) rather than pdfjs viewport
    const pageWidth = pgWidth;
    const pageHeight = pgHeight;

    // 4. Determine safe content zone from scanned layouts or sensible defaults
    const placeholderLayout = pageLayouts
      ? pageLayouts.find(l => l.pageNum === placeholderDetails.pageIndex)
      : null;

    // Safe boundaries — these define where we CAN write questions
    // In PDF coordinate space: Y=0 is bottom, Y=pageHeight is top
    const defaultLeftMargin = Math.max(placeholderDetails.x || 54, 36);
    const safeLeft = placeholderLayout
      ? Math.max(placeholderLayout.leftEdge, 36)
      : defaultLeftMargin;
    const safeRight = placeholderLayout
      ? Math.min(placeholderLayout.rightEdge, pageWidth - 36)
      : pageWidth - 54;

    // The top of the safe zone is just below the header
    const safeTop = placeholderLayout
      ? placeholderLayout.headerBottomY
      : pageHeight - 80;

    // The bottom of the safe zone is just above the footer/signature block
    const safeBottom = placeholderLayout
      ? placeholderLayout.footerTopY
      : 80;

    const contentWidth = safeRight - safeLeft;
    const leftMargin = safeLeft;

    // 5. Text layout sizing
    const fontSize = 10.5;
    const lineHeight = fontSize * 1.35;

    // 6. Build layout state machine
    const templatePageIndex = placeholderPageIndex; // which page to clone for new pages
    const totalTemplatePages = pdfDoc.getPageCount();

    // Helper to white-out the template signature zone if detected on that page
    const whiteOutSignatures = (page, pageIdx) => {
      let sigLayout = null;
      if (pageLayouts) {
        // If this is a cloned page, reference the signature layout from the template placeholder page
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
      // Start writing at the placeholder Y position
      // In PDF coords, Y goes upward, so we write downward by decreasing Y
      currentY: placeholderDetails.y,
      contentWidth,
      leftMargin,
      safeTop,
      safeBottom,
      lineHeight,
      pageWidth,
      pageHeight,
      pageLayouts,
      templatePageIndex,
      totalTemplatePages,
      
      /**
      getSafeBottomForPage(pageIdx) {
        if (this.pageLayouts) {
          const targetPageNum = pageIdx < this.totalTemplatePages ? pageIdx + 1 : this.templatePageIndex + 1;
          const layout = this.pageLayouts.find(l => l.pageNum === targetPageNum);
          if (layout) return layout.footerTopY;
        }
        return safeBottom;
      },

      /**
       * Get the safe top boundary for a given page index.
       */
      getSafeTopForPage(pageIdx) {
        if (this.pageLayouts) {
          const targetPageNum = pageIdx < this.totalTemplatePages ? pageIdx + 1 : this.templatePageIndex + 1;
          const layout = this.pageLayouts.find(l => l.pageNum === targetPageNum);
          if (layout) return layout.headerBottomY;
        }
        return safeTop;
      },

      /**
       * Move to the next page when content overflows.
       * If we haven't exhausted existing template pages, advance to the next one.
       * Otherwise, clone the template page (preserving its header/footer) and
       * only white-out the body content zone.
       */
      async moveToNextPage() {
        const pageCount = this.pdfDoc.getPageCount();

        // Check if there's a next existing template page we haven't used yet
        if (this.currentPageIndex < this.totalTemplatePages - 1) {
          this.currentPageIndex++;
          this.currentPage = this.pdfDoc.getPage(this.currentPageIndex);
          const { height: pH } = this.currentPage.getSize();

          // On existing template pages, white-out only the body content area
          // Preserve header and footer
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
          // Clone the template page (the placeholder page) to maintain branding
          const [copiedPage] = await this.pdfDoc.copyPages(
            this.pdfDoc,
            [this.templatePageIndex]
          );
          this.pdfDoc.addPage(copiedPage);
          this.currentPageIndex = this.pdfDoc.getPageCount() - 1;
          this.currentPage = this.pdfDoc.getPage(this.currentPageIndex);

          // White-out only the body content zone on the cloned page
          // This preserves the header and footer from the template
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

      /**
       * Check if a block of the given height will fit on the current page.
       * Returns true if there's enough space above the safe bottom boundary.
       */
      willFit(blockHeight) {
        const bottom = this.getSafeBottomForPage(this.currentPageIndex);
        return (this.currentY - blockHeight) >= bottom;
      }
    };

    // 7. White-out ONLY the original {{QUESTION_PAPER}} placeholder text
    // This is a small, precise rectangle — it does NOT erase headers or footers
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

    // 8. Draw sections and questions sequentially
    const SECTION_NAMES = {
      mcq: "Section A \u2014 Multiple Choice Questions",
      vsa: "Section B \u2014 Very Short Answer Questions",
      sa: "Section C \u2014 Short Answer Questions",
      la: "Section D \u2014 Long Answer Questions"
    };

    const getQuestionsByType = (typeId) => questions.filter((q) => q.type === typeId);
    let globalQNum = 0;

    const sectionIds = ["mcq", "vsa", "sa", "la"];
    
    for (const secId of sectionIds) {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) continue;

      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      
      // --- Draw Section Header ---
      const headerText = `${SECTION_NAMES[secId] || secId.toUpperCase()} (${qtConf.count} \u00d7 ${qtConf.marks} = ${qtConf.count * qtConf.marks} marks)`;
      const headerLines = wrapText(sanitizeText(headerText), contentWidth, fontBold, fontSize + 1);
      const headerHeight = headerLines.length * (lineHeight + 2) + 24;

      // Calculate first question height for orphan prevention
      const firstQ = secQuestions[0];
      let firstQHeight = 0;
      if (firstQ) {
        firstQHeight = this._measureQuestionHeight(firstQ, globalQNum + 1, contentWidth, font, fontBold, fontSize, lineHeight);
      }

      // Check if header + first question fit on current page
      if (!layoutState.willFit(headerHeight + firstQHeight)) {
        await layoutState.moveToNextPage();
      }

      layoutState.currentY -= 12; // spacing before section

      for (const line of headerLines) {
        layoutState.currentPage.drawText(line, {
          x: leftMargin,
          y: layoutState.currentY - (fontSize + 1),
          size: fontSize + 1,
          font: fontBold,
          color: rgb(0, 0, 0)
        });
        layoutState.currentY -= (lineHeight + 2);
      }
      
      layoutState.currentY -= 6; // spacing after section title

      // --- Draw Questions ---
      for (const q of secQuestions) {
        globalQNum++;

        const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'ascii');
        const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'ascii');
        const choicesList = q.choices || q.choicesM || q.options || null;

        const numText = `Q${globalQNum}. `;
        const numWidth = fontBold.widthOfTextAtSize(numText, fontSize);
        const marksText = `[${q.marks}]`;
        const marksWidth = fontBold.widthOfTextAtSize(marksText, fontSize);

        const qLines = wrapQuestionText(sanitizeText(questionText), contentWidth, numWidth, marksWidth, font, fontSize);

        const optData = [];
        if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
          choicesList.forEach((opt, idx) => {
            const optPrefix = `(${"abcd"[idx]}) `;
            const fullOptText = optPrefix + sanitizeText(parseLatexToText(opt, 'ascii'));
            const optLines = wrapText(fullOptText, contentWidth - 24, font, fontSize);
            optData.push(optLines);
          });
        }

        // Calculate total height of this question block
        const qTextHeight = qLines.length * lineHeight;
        let optHeight = 0;
        optData.forEach(lines => {
          optHeight += lines.length * lineHeight + 3;
        });
        const totalQuestionHeight = qTextHeight + optHeight + 8;

        // Check space — if this is the last question, also reserve space for
        // any signature block that exists in the template footer area
        const isLastQuestion = globalQNum === questions.length;
        let spaceNeeded = totalQuestionHeight;
        if (isLastQuestion) {
          // Only add signature padding if the template doesn't already have a
          // signature zone in its footer (which is already protected by safeBottom)
          const currentPageLayout = layoutState.pageLayouts
            ? layoutState.pageLayouts.find(l => l.pageNum === layoutState.currentPageIndex + 1)
            : null;
          if (!currentPageLayout || !currentPageLayout.hasSignatureZone) {
            // No detected signature in template — no extra reservation needed
            // The safeBottom already protects footer area
          }
        }

        if (!layoutState.willFit(spaceNeeded)) {
          await layoutState.moveToNextPage();
        }

        // Draw first line: Number + Text + Marks
        const firstLine = qLines[0] || '';
        layoutState.currentPage.drawText(numText, {
          x: leftMargin,
          y: layoutState.currentY - fontSize,
          size: fontSize,
          font: fontBold,
          color: rgb(0, 0, 0)
        });
        layoutState.currentPage.drawText(firstLine, {
          x: leftMargin + numWidth,
          y: layoutState.currentY - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        layoutState.currentPage.drawText(marksText, {
          x: leftMargin + contentWidth - marksWidth,
          y: layoutState.currentY - fontSize,
          size: fontSize,
          font: fontBold,
          color: rgb(0, 0, 0)
        });

        layoutState.currentY -= lineHeight;

        // Draw subsequent lines of question text
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

        // Draw options
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
            layoutState.currentY -= 3; // option spacing
          }
        }



        layoutState.currentY -= 6; // question spacing
      }
    }

    // 9. Draw signatures at the bottom of the last page
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

    // 10. Serialize and return modified PDF ArrayBuffer bytes
    return await pdfDoc.save();
  },

  /**
   * Measures the total height of a question block (text + options + spacing).
   * Used internally for pagination calculations.
   * @private
   */
  _measureQuestionHeight(q, globalNum, contentWidth, font, fontBold, fontSize, lineHeight) {
    const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'ascii');
    const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'ascii');
    const choicesList = q.choices || q.choicesM || q.options || null;

    const numText = `Q${globalNum}. `;
    const numWidth = fontBold.widthOfTextAtSize(numText, fontSize);
    const marksText = `[${q.marks}]`;
    const marksWidth = fontBold.widthOfTextAtSize(marksText, fontSize);

    const qLines = wrapQuestionText(sanitizeText(questionText), contentWidth, numWidth, marksWidth, font, fontSize);
    const qTextHeight = qLines.length * lineHeight;

    let optHeight = 0;
    if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
      choicesList.forEach((opt, idx) => {
        const optPrefix = `(${"abcd"[idx]}) `;
        const fullOptText = optPrefix + sanitizeText(parseLatexToText(opt, 'ascii'));
        const optLines = wrapText(fullOptText, contentWidth - 24, font, fontSize);
        optHeight += optLines.length * lineHeight + 3;
      });
    }

    return qTextHeight + optHeight + 8;
  }
};

export default QuestionInjector;
