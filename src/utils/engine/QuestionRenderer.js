import { rgb, StandardFonts } from 'pdf-lib';
import { parseLatexToText } from '../latex';

// WordprocessingML Namespace URI
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

function getFirstChildByLocalName(parent, localName) {
  if (!parent) return null;
  return Array.from(parent.children).find(child => child.localName === localName) || null;
}

function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/₹/g, "Rs. ")
    .replace(/…/g, "...")
    .replace(/[×\u00d7]/g, "x")
    .replace(/[^\x00-\x7F]/g, "");
}

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
 * QuestionRenderer Class
 * Renders document sections and question elements into format-specific representations.
 */
export class QuestionRenderer {
  /* =========================================================================
     OpenXML Renderers (DOCX)
     ========================================================================= */
  static createSectionHeaderXml(xmlDoc, title, count, marks, baseRPr, basePPr) {
    const p = createEl(xmlDoc, "p");
    const pPr = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
    p.appendChild(pPr);

    const indEl = getFirstChildByLocalName(pPr, "ind");
    if (indEl) {
      pPr.removeChild(indEl);
    }

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

    const rTitle = createEl(xmlDoc, "r");
    const rPrTitle = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    
    let bEl = getFirstChildByLocalName(rPrTitle, "b");
    if (!bEl) rPrTitle.appendChild(createEl(xmlDoc, "b"));
    
    let szEl = getFirstChildByLocalName(rPrTitle, "sz");
    if (szEl) szEl.setAttribute("w:val", "26");
    else rPrTitle.appendChild(createEl(xmlDoc, "sz", { val: "26" }));

    rTitle.appendChild(rPrTitle);
    rTitle.appendChild(createEl(xmlDoc, "t", {}, title));
    p.appendChild(rTitle);

    const rMarks = createEl(xmlDoc, "r");
    const rPrMarks = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bElMarks = getFirstChildByLocalName(rPrMarks, "b");
    if (bElMarks) rPrMarks.removeChild(bElMarks);

    let szElMarks = getFirstChildByLocalName(rPrMarks, "sz");
    if (szElMarks) szElMarks.setAttribute("w:val", "22");
    else rPrMarks.appendChild(createEl(xmlDoc, "sz", { val: "22" }));

    rMarks.appendChild(rPrMarks);
    rMarks.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, ` (${count} × ${marks} = ${count * marks} marks)`));
    p.appendChild(rMarks);

    return p;
  }

  static createQuestionXml(xmlDoc, q, globalNum, baseRPr, basePPr) {
    const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'unicode');
    const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'unicode');
    const choicesList = q.choices || q.choicesM || q.options || null;

    const nodes = [];
    const p = createEl(xmlDoc, "p");
    const pPr = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
    p.appendChild(pPr);

    let indEl = getFirstChildByLocalName(pPr, "ind");
    if (indEl) {
      indEl.setAttribute("w:left", "480");
      indEl.setAttribute("w:hanging", "480");
    } else {
      pPr.appendChild(createEl(xmlDoc, "ind", { left: "480", hanging: "480" }));
    }

    let spacingEl = getFirstChildByLocalName(pPr, "spacing");
    if (spacingEl) {
      spacingEl.setAttribute("w:after", "120");
    } else {
      pPr.appendChild(createEl(xmlDoc, "spacing", { after: "120", line: "240", lineRule: "auto" }));
    }

    if (!getFirstChildByLocalName(pPr, "keepNext")) pPr.appendChild(createEl(xmlDoc, "keepNext"));
    if (!getFirstChildByLocalName(pPr, "keepLines")) pPr.appendChild(createEl(xmlDoc, "keepLines"));

    let tabsEl = getFirstChildByLocalName(pPr, "tabs");
    if (!tabsEl) {
      tabsEl = createEl(xmlDoc, "tabs");
      pPr.appendChild(tabsEl);
    }
    tabsEl.appendChild(createEl(xmlDoc, "tab", { val: "right", pos: "9000" }));

    const rNum = createEl(xmlDoc, "r");
    const rPrNum = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bEl = getFirstChildByLocalName(rPrNum, "b");
    if (!bEl) rPrNum.appendChild(createEl(xmlDoc, "b"));
    rNum.appendChild(rPrNum);
    rNum.appendChild(createEl(xmlDoc, "t", {}, `Q${globalNum}. `));
    p.appendChild(rNum);

    const rText = createEl(xmlDoc, "r");
    if (baseRPr) rText.appendChild(baseRPr.cloneNode(true));
    rText.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, questionText));
    p.appendChild(rText);

    const rTab = createEl(xmlDoc, "r");
    rTab.appendChild(createEl(xmlDoc, "tab"));
    p.appendChild(rTab);

    const rMarks = createEl(xmlDoc, "r");
    const rPrMarks = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bElMarks = getFirstChildByLocalName(rPrMarks, "b");
    if (!bElMarks) rPrMarks.appendChild(createEl(xmlDoc, "b"));
    rMarks.appendChild(rPrMarks);
    rMarks.appendChild(createEl(xmlDoc, "t", {}, `[${q.marks}]`));
    p.appendChild(rMarks);

    nodes.push(p);

    if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
      choicesList.forEach((opt, optIdx) => {
        const pOpt = createEl(xmlDoc, "p");
        const pPrOpt = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
        pOpt.appendChild(pPrOpt);

        let indOptEl = getFirstChildByLocalName(pPrOpt, "ind");
        if (indOptEl) {
          indOptEl.setAttribute("w:left", "480");
          indOptEl.removeAttribute("w:hanging");
        } else {
          pPrOpt.appendChild(createEl(xmlDoc, "ind", { left: "480" }));
        }

        let spacingOptEl = getFirstChildByLocalName(pPrOpt, "spacing");
        if (spacingOptEl) {
          spacingOptEl.setAttribute("w:after", "60");
        } else {
          pPrOpt.appendChild(createEl(xmlDoc, "spacing", { after: "60", line: "240", lineRule: "auto" }));
        }

        if (!getFirstChildByLocalName(pPrOpt, "keepLines")) pPrOpt.appendChild(createEl(xmlDoc, "keepLines"));
        if (optIdx < choicesList.length - 1 && !getFirstChildByLocalName(pPrOpt, "keepNext")) {
          pPrOpt.appendChild(createEl(xmlDoc, "keepNext"));
        }

        const rOpt = createEl(xmlDoc, "r");
        if (baseRPr) rOpt.appendChild(baseRPr.cloneNode(true));
        const cleanOpt = parseLatexToText(opt, 'unicode');
        rOpt.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, `(${"abcd"[optIdx]}) ${cleanOpt}`));
        pOpt.appendChild(rOpt);

        nodes.push(pOpt);
      });
    }



    return nodes;
  }

  /* =========================================================================
     Vector Renderers (PDF)
     ========================================================================= */
  static async renderSectionHeaderToPdf(layoutState, title, count, marks, fontBold, fontSize) {
    const { contentWidth, leftMargin, bottomMargin, lineHeight } = layoutState;
    const headerText = `${title} (${count} × ${marks} = ${count * marks} marks)`;
    const headerLines = wrapText(sanitizeText(headerText), contentWidth, fontBold, fontSize + 1);
    
    layoutState.currentY -= 12; // Spacing before section
    
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
    
    layoutState.currentY -= 6; // Spacing after section title
  }

  static async renderQuestionToPdf(layoutState, q, globalNum, font, fontBold, fontSize) {
    const { contentWidth, leftMargin, lineHeight } = layoutState;
    
    const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'ascii');
    const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'ascii');
    const choicesList = q.choices || q.choicesM || q.options || null;

    const numText = `Q${globalNum}. `;
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



    // Draw first line of question
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

    // Draw rest of lines
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

    // Draw Options
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
        layoutState.currentY -= 3; // spacing option
      }
    }


    
    layoutState.currentY -= 6; // spacing question
  }
}
