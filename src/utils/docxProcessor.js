import JSZip from 'jszip';

// WordprocessingML Namespace URI
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/**
 * Creates a new OpenXML element with w: prefix.
 */
function createEl(xmlDoc, tagName, attrs = {}) {
  const el = xmlDoc.createElementNS(W_NS, "w:" + tagName);
  for (const [key, val] of Object.entries(attrs)) {
    if (key.includes(':')) {
      el.setAttribute(key, val);
    } else {
      el.setAttribute("w:" + key, val);
    }
  }
  return el;
}

/**
 * Helper to get children by tag name ignoring namespaces/prefixes.
 */
function getChildrenByLocalName(parent, localName) {
  if (!parent) return [];
  return Array.from(parent.children).filter(child => child.localName === localName);
}

/**
 * Helper to get the first child by tag name.
 */
function getFirstChildByLocalName(parent, localName) {
  if (!parent) return null;
  return Array.from(parent.children).find(child => child.localName === localName) || null;
}

/**
 * Helper to get paragraph text content.
 */
function getParagraphText(p) {
  const rList = getChildrenByLocalName(p, "r");
  let text = "";
  for (const r of rList) {
    const tList = getChildrenByLocalName(r, "t");
    for (const t of tList) {
      text += t.textContent || "";
    }
  }
  return text;
}

/**
 * 1. WordTemplateParser
 * Handles JSZip container extraction and serialization.
 */
export const WordTemplateParser = {
  async parseDocx(arrayBuffer) {
    return await JSZip.loadAsync(arrayBuffer);
  },

  async readDocumentXml(zip) {
    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) {
      throw new Error("Could not find word/document.xml in the DOCX package.");
    }
    const docXmlText = await docXmlFile.async("text");
    const parser = new DOMParser();
    return parser.parseFromString(docXmlText, "text/xml");
  },

  writeDocumentXml(zip, xmlDoc) {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    zip.file("word/document.xml", xmlString);
  },

  async generateDocx(zip) {
    return await zip.generateAsync({ type: "arraybuffer" });
  }
};

/**
 * 2. PlaceholderProcessor
 * Locates, counts, and extracts metadata from placeholders.
 */
export const PlaceholderProcessor = {
  countPlaceholders(xmlDoc) {
    const paragraphs = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "p") : xmlDoc.getElementsByTagName("w:p");
    let count = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const pText = getParagraphText(paragraphs[i]);
      let idx = pText.indexOf("{{QUESTION_PAPER}}");
      while (idx !== -1) {
        count++;
        idx = pText.indexOf("{{QUESTION_PAPER}}", idx + 1);
      }
    }
    return count;
  },

  findPlaceholderParagraph(xmlDoc) {
    const paragraphs = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "p") : xmlDoc.getElementsByTagName("w:p");
    for (let i = 0; i < paragraphs.length; i++) {
      const pText = getParagraphText(paragraphs[i]);
      if (pText.includes("{{QUESTION_PAPER}}")) {
        return paragraphs[i];
      }
    }
    return null;
  },

  getPlaceholderRunPr(placeholderP) {
    if (!placeholderP) return null;
    const runs = getChildrenByLocalName(placeholderP, "r");
    for (const r of runs) {
      const rPr = getFirstChildByLocalName(r, "rPr");
      if (rPr) {
        return rPr.cloneNode(true);
      }
    }
    return null;
  }
};

/**
 * 3. QuestionInjector
 * Formats and splices questions into OpenXML structure.
 */
export const QuestionInjector = {
  createSectionHeader(xmlDoc, title, count, marks, baseRPr) {
    const p = createEl(xmlDoc, "p");
    const pPr = createEl(xmlDoc, "pPr");
    p.appendChild(pPr);

    // Spacing before = 360 (18pt), after = 120 (6pt)
    const spacing = createEl(xmlDoc, "spacing", { before: "360", after: "120", line: "240", lineRule: "auto" });
    pPr.appendChild(spacing);
    pPr.appendChild(createEl(xmlDoc, "keepNext"));

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
    
    // Remove bold if present
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

  createQuestionNodes(xmlDoc, q, globalNum, baseRPr) {
    const nodes = [];

    // 1. Question Paragraph
    const p = createEl(xmlDoc, "p");
    const pPr = createEl(xmlDoc, "pPr");
    p.appendChild(pPr);

    // Indentation: hanging indent of 480 (0.33 in)
    pPr.appendChild(createEl(xmlDoc, "ind", { left: "480", hanging: "480" }));
    pPr.appendChild(createEl(xmlDoc, "spacing", { after: "120", line: "240", lineRule: "auto" }));
    pPr.appendChild(createEl(xmlDoc, "keepNext"));

    // Tabs: Right aligned tab stop at 9000 dxas (approx 6.25 inches) for marks
    const tabs = createEl(xmlDoc, "tabs");
    tabs.appendChild(createEl(xmlDoc, "tab", { val: "right", pos: "9000" }));
    pPr.appendChild(tabs);

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
    rText.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, q.text));
    p.appendChild(rText);

    // Run: Difficulty level/chapter labels
    const rTags = createEl(xmlDoc, "r");
    const rPrTags = createEl(xmlDoc, "rPr");
    rPrTags.appendChild(createEl(xmlDoc, "color", { val: "888888" }));
    rPrTags.appendChild(createEl(xmlDoc, "sz", { val: "18" })); // 9pt
    rTags.appendChild(rPrTags);
    rTags.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, ` [${q.hots ? 'HOTS' : 'LOTS'} · ${q.level} · ${q.chapter}]`));
    p.appendChild(rTags);

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
    if (q.type === 'mcq' && q.options && q.options.length > 0) {
      const pOpts = createEl(xmlDoc, "p");
      const pPrOpts = createEl(xmlDoc, "pPr");
      pOpts.appendChild(pPrOpts);

      pPrOpts.appendChild(createEl(xmlDoc, "ind", { left: "480" }));
      pPrOpts.appendChild(createEl(xmlDoc, "spacing", { after: "180", line: "240", lineRule: "auto" }));

      // Tab stops for options layout (4 columns)
      const tabsOpts = createEl(xmlDoc, "tabs");
      tabsOpts.appendChild(createEl(xmlDoc, "tab", { val: "left", pos: "2250" }));
      tabsOpts.appendChild(createEl(xmlDoc, "tab", { val: "left", pos: "4500" }));
      tabsOpts.appendChild(createEl(xmlDoc, "tab", { val: "left", pos: "6750" }));
      pPrOpts.appendChild(tabsOpts);

      q.options.forEach((opt, optIdx) => {
        if (optIdx > 0) {
          const rTab = createEl(xmlDoc, "r");
          rTab.appendChild(createEl(xmlDoc, "tab"));
          pOpts.appendChild(rTab);
        }

        const rOpt = createEl(xmlDoc, "r");
        if (baseRPr) rOpt.appendChild(baseRPr.cloneNode(true));
        rOpt.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, `(${"abcd"[optIdx]}) ${opt}`));
        pOpts.appendChild(rOpt);
      });

      nodes.push(pOpts);
    }

    return nodes;
  },

  inject(xmlDoc, questions, qtypes) {
    const placeholderP = PlaceholderProcessor.findPlaceholderParagraph(xmlDoc);
    if (!placeholderP) {
      throw new Error("Could not find {{QUESTION_PAPER}} placeholder in document.");
    }

    const parent = placeholderP.parentNode;
    const baseRPr = PlaceholderProcessor.getPlaceholderRunPr(placeholderP);
    const pPr = getFirstChildByLocalName(placeholderP, "pPr");

    // Check surrounding text
    const fullText = getParagraphText(placeholderP);
    const placeholderStr = "{{QUESTION_PAPER}}";
    const placeholderIndex = fullText.indexOf(placeholderStr);

    // 1. Text before placeholder in the same paragraph
    if (placeholderIndex > 0) {
      const beforeText = fullText.substring(0, placeholderIndex);
      const beforeP = createEl(xmlDoc, "p");
      if (pPr) beforeP.appendChild(pPr.cloneNode(true));
      const r = createEl(xmlDoc, "r");
      if (baseRPr) r.appendChild(baseRPr.cloneNode(true));
      r.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, beforeText));
      beforeP.appendChild(r);
      parent.insertBefore(beforeP, placeholderP);
    }

    // 2. Inject generated sections and questions
    const SECTION_NAMES = {
      mcq: "Section A — Multiple Choice Questions",
      vsa: "Section B — Very Short Answer Questions",
      sa: "Section C — Short Answer Questions",
      la: "Section D — Long Answer Questions"
    };

    // Group questions by type
    const getQuestionsByType = (typeId) => questions.filter((q) => q.type === typeId);
    
    let globalQNum = 0;
    
    // Process sections in standard order
    const sectionIds = ["mcq", "vsa", "sa", "la"];
    sectionIds.forEach(secId => {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) return;

      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      
      // Insert Section Header
      const headerP = this.createSectionHeader(
        xmlDoc,
        SECTION_NAMES[secId] || secId.toUpperCase(),
        qtConf.count,
        qtConf.marks,
        baseRPr
      );
      parent.insertBefore(headerP, placeholderP);

      // Insert Questions
      secQuestions.forEach(q => {
        globalQNum++;
        const qNodes = this.createQuestionNodes(xmlDoc, q, globalQNum, baseRPr);
        qNodes.forEach(node => parent.insertBefore(node, placeholderP));
      });
    });

    // 3. Text after placeholder in the same paragraph
    const afterIndex = placeholderIndex + placeholderStr.length;
    if (afterIndex < fullText.length) {
      const afterText = fullText.substring(afterIndex);
      const afterP = createEl(xmlDoc, "p");
      if (pPr) afterP.appendChild(pPr.cloneNode(true));
      const r = createEl(xmlDoc, "r");
      if (baseRPr) r.appendChild(baseRPr.cloneNode(true));
      r.appendChild(createEl(xmlDoc, "t", { "xml:space": "preserve" }, afterText));
      afterP.appendChild(r);
      parent.insertBefore(afterP, placeholderP);
    }

    // 4. Remove original placeholder paragraph
    parent.removeChild(placeholderP);
  }
};

/**
 * 5. TemplateGenerator
 * Main orchestrator of the pipeline.
 */
export const TemplateGenerator = {
  async generatePaper(docxArrayBuffer, questions, qtypes) {
    // 1. Load JSZip
    const zip = await WordTemplateParser.parseDocx(docxArrayBuffer);
    
    // 2. Read Document XML
    const xmlDoc = await WordTemplateParser.readDocumentXml(zip);

    // 3. Locate & count placeholders
    const placeholderCount = PlaceholderProcessor.countPlaceholders(xmlDoc);
    if (placeholderCount === 0) {
      throw new Error("Zero placeholders detected. The template must contain exactly one {{QUESTION_PAPER}} placeholder.");
    } else if (placeholderCount > 1) {
      throw new Error(`Multiple placeholders (${placeholderCount}) detected. The template must contain exactly one {{QUESTION_PAPER}} placeholder.`);
    }

    // 4. Inject questions
    QuestionInjector.inject(xmlDoc, questions, qtypes);

    // 5. Serialize XML back to zip
    WordTemplateParser.writeDocumentXml(zip, xmlDoc);

    // 6. Generate new DOCX binary arrayBuffer
    return await WordTemplateParser.generateDocx(zip);
  }
};
