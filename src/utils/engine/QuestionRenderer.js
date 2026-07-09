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

export function sanitizeText(str, isHelvetica = false) {
  if (!str) return '';
  if (isHelvetica) {
    // Map non-ASCII Unicode characters to Helvetica-compatible or ASCII approximations
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
      // superscripts
      .replace(/⁰/g, "^0").replace(/¹/g, "^1").replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4")
      .replace(/⁵/g, "^5").replace(/⁶/g, "^6").replace(/⁷/g, "^7").replace(/⁸/g, "^8").replace(/⁹/g, "^9")
      .replace(/⁻/g, "^-").replace(/⁺/g, "^+").replace(/⁼/g, "^=").replace(/⁽/g, "^(").replace(/⁾/g, "^)")
      .replace(/ⁿ/g, "^n").replace(/ⁱ/g, "^i")
      // subscripts
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
      spacingEl.setAttribute("w:before", "480");
      spacingEl.setAttribute("w:after", "160");
    } else {
      pPr.appendChild(createEl(xmlDoc, "spacing", { before: "480", after: "160", line: "240", lineRule: "auto" }));
    }

    // Add right tab stop to paragraph properties for right-aligning the marks
    const tabs = createEl(xmlDoc, "tabs");
    tabs.appendChild(createEl(xmlDoc, "tab", { val: "right", pos: "9700" }));
    pPr.appendChild(tabs);

    if (!getFirstChildByLocalName(pPr, "keepNext")) {
      pPr.appendChild(createEl(xmlDoc, "keepNext"));
    }

    const rTitle = createEl(xmlDoc, "r");
    const rPrTitle = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    
    let bEl = getFirstChildByLocalName(rPrTitle, "b");
    if (!bEl) rPrTitle.appendChild(createEl(xmlDoc, "b"));
    
    let szEl = getFirstChildByLocalName(rPrTitle, "sz");
    if (szEl) szEl.setAttribute("w:val", "32");
    else rPrTitle.appendChild(createEl(xmlDoc, "sz", { val: "32" }));

    rTitle.appendChild(rPrTitle);
    rTitle.appendChild(createEl(xmlDoc, "t", {}, title));
    p.appendChild(rTitle);

    // Tab character run to push the marks to the right margin
    const rTab = createEl(xmlDoc, "r");
    rTab.appendChild(createEl(xmlDoc, "tab"));
    p.appendChild(rTab);

    const rMarks = createEl(xmlDoc, "r");
    const rPrMarks = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bElMarks = getFirstChildByLocalName(rPrMarks, "b");
    if (bElMarks) rPrMarks.removeChild(bElMarks);

    let szElMarks = getFirstChildByLocalName(rPrMarks, "sz");
    if (szElMarks) szElMarks.setAttribute("w:val", "22");
    else rPrMarks.appendChild(createEl(xmlDoc, "sz", { val: "22" }));

    rMarks.appendChild(rPrMarks);
    rMarks.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, `(${count} × ${marks} = ${count * marks} marks)`));
    p.appendChild(rMarks);

    return p;
  }

  static createQuestionXml(xmlDoc, q, globalNum, baseRPr, basePPr) {
    const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'unicode');
    const choicesList = q.choices || q.choicesM || q.options || null;

    const nodes = [];

    // Create a borderless table
    const tbl = createEl(xmlDoc, "tbl");
    const tblPr = createEl(xmlDoc, "tblPr");
    tbl.appendChild(tblPr);

    tblPr.appendChild(createEl(xmlDoc, "tblW", { w: "0", type: "auto" }));
    tblPr.appendChild(createEl(xmlDoc, "tblLayout", { type: "fixed" }));
    tblPr.appendChild(createEl(xmlDoc, "tblLook", {
      firstRow: "0",
      lastRow: "0",
      firstColumn: "0",
      lastColumn: "0",
      noHBand: "1",
      noVBand: "1"
    }));

    // Borderless properties
    const tblBorders = createEl(xmlDoc, "tblBorders");
    ["top", "left", "bottom", "right", "insideH", "insideV"].forEach(bName => {
      tblBorders.appendChild(createEl(xmlDoc, bName, { val: "none", sz: "0", space: "0", color: "auto" }));
    });
    tblPr.appendChild(tblBorders);

    // Margins zero
    const tblCellMar = createEl(xmlDoc, "tblCellMar");
    ["top", "left", "bottom", "right"].forEach(mName => {
      tblCellMar.appendChild(createEl(xmlDoc, mName, { w: "0", type: "dxa" }));
    });
    tblPr.appendChild(tblCellMar);

    const tblGrid = createEl(xmlDoc, "tblGrid");
    tblGrid.appendChild(createEl(xmlDoc, "gridCol", { w: "8350" }));
    tblGrid.appendChild(createEl(xmlDoc, "gridCol", { w: "1350" }));
    tbl.appendChild(tblGrid);

    const tr = createEl(xmlDoc, "tr");
    const trPr = createEl(xmlDoc, "trPr");
    trPr.appendChild(createEl(xmlDoc, "cantSplit"));
    tr.appendChild(trPr);
    tbl.appendChild(tr);

    // Left Cell (Question text and options)
    const tc1 = createEl(xmlDoc, "tc");
    const tcPr1 = createEl(xmlDoc, "tcPr");
    tcPr1.appendChild(createEl(xmlDoc, "tcW", { w: "8350", type: "dxa" }));
    tcPr1.appendChild(createEl(xmlDoc, "vAlign", { val: "top" }));
    tc1.appendChild(tcPr1);

    // Right Cell (Marks)
    const tc2 = createEl(xmlDoc, "tc");
    const tcPr2 = createEl(xmlDoc, "tcPr");
    tcPr2.appendChild(createEl(xmlDoc, "tcW", { w: "1350", type: "dxa" }));
    tcPr2.appendChild(createEl(xmlDoc, "vAlign", { val: "top" }));
    const tcMar2 = createEl(xmlDoc, "tcMar");
    tcMar2.appendChild(createEl(xmlDoc, "left", { w: "500", type: "dxa" }));
    tcPr2.appendChild(tcMar2);
    tc2.appendChild(tcPr2);

    tr.appendChild(tc1);
    tr.appendChild(tc2);

    // 1. Question Paragraph inside Left Cell
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

    if (!getFirstChildByLocalName(pPr, "keepNext")) pPr.appendChild(createEl(xmlDoc, "keepNext"));
    if (!getFirstChildByLocalName(pPr, "keepLines")) pPr.appendChild(createEl(xmlDoc, "keepLines"));

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

    tc1.appendChild(p);

    // 2. Options inside Left Cell
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

        tc1.appendChild(pOpt);
      });
    }

    // 3. Marks Paragraph inside Right Cell
    const pMarks = createEl(xmlDoc, "p");
    const pPrMarks = basePPr ? basePPr.cloneNode(true) : createEl(xmlDoc, "pPr");
    pMarks.appendChild(pPrMarks);

    // Match question spacing after
    let spacingMarksEl = getFirstChildByLocalName(pPrMarks, "spacing");
    if (spacingMarksEl) {
      spacingMarksEl.setAttribute("w:after", "120");
    } else {
      pPrMarks.appendChild(createEl(xmlDoc, "spacing", { after: "120", line: "240", lineRule: "auto" }));
    }

    const rMarks = createEl(xmlDoc, "r");
    const rPrMarksContent = baseRPr ? baseRPr.cloneNode(true) : createEl(xmlDoc, "rPr");
    let bElMarks = getFirstChildByLocalName(rPrMarksContent, "b");
    if (!bElMarks) rPrMarksContent.appendChild(createEl(xmlDoc, "b"));
    rMarks.appendChild(rPrMarksContent);
    rMarks.appendChild(createEl(xmlDoc, "t", {}, `[${q.marks}]`));
    pMarks.appendChild(rMarks);

    tc2.appendChild(pMarks);

    nodes.push(tbl);

    // Spacer paragraph after table to prevent merging and provide a tiny bottom margin
    const spacerP = createEl(xmlDoc, "p");
    const spacerPPr = createEl(xmlDoc, "pPr");
    spacerP.appendChild(spacerPPr);
    spacerPPr.appendChild(createEl(xmlDoc, "spacing", { before: "0", after: "40", line: "20", lineRule: "exact" }));
    
    const rPr = createEl(xmlDoc, "rPr");
    rPr.appendChild(createEl(xmlDoc, "sz", { val: "2" }));
    rPr.appendChild(createEl(xmlDoc, "szCs", { val: "2" }));
    spacerPPr.appendChild(rPr);
    
    spacerPPr.appendChild(createEl(xmlDoc, "keepLines"));

    nodes.push(spacerP);

    return nodes;
  }
}
