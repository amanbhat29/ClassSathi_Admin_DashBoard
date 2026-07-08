import JSZip from "jszip";

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const FOOTER_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer";
const FOOTER_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml";

function parseXml(xmlText) {
  return new DOMParser().parseFromString(xmlText, "text/xml");
}

function serializeXml(xmlDoc) {
  return new XMLSerializer().serializeToString(xmlDoc);
}

function getElementsByLocalName(node, localName) {
  return Array.from(node.getElementsByTagName("*")).filter((child) => child.localName === localName);
}

function createWordElement(xmlDoc, localName) {
  return xmlDoc.createElementNS(WORD_NS, `w:${localName}`);
}

function setWordAttr(node, localName, value) {
  node.setAttributeNS(WORD_NS, `w:${localName}`, value);
}

function createTextRun(xmlDoc, text) {
  const run = createWordElement(xmlDoc, "r");
  const textNode = createWordElement(xmlDoc, "t");
  textNode.textContent = text;
  run.appendChild(textNode);
  return run;
}

function createPageFieldRun(xmlDoc) {
  const runs = [];

  const beginRun = createWordElement(xmlDoc, "r");
  const beginChar = createWordElement(xmlDoc, "fldChar");
  setWordAttr(beginChar, "fldCharType", "begin");
  beginRun.appendChild(beginChar);
  runs.push(beginRun);

  const instrRun = createWordElement(xmlDoc, "r");
  const instr = createWordElement(xmlDoc, "instrText");
  instr.setAttribute("xml:space", "preserve");
  instr.textContent = " PAGE ";
  instrRun.appendChild(instr);
  runs.push(instrRun);

  const separateRun = createWordElement(xmlDoc, "r");
  const separateChar = createWordElement(xmlDoc, "fldChar");
  setWordAttr(separateChar, "fldCharType", "separate");
  separateRun.appendChild(separateChar);
  runs.push(separateRun);

  runs.push(createTextRun(xmlDoc, "1"));

  const endRun = createWordElement(xmlDoc, "r");
  const endChar = createWordElement(xmlDoc, "fldChar");
  setWordAttr(endChar, "fldCharType", "end");
  endRun.appendChild(endChar);
  runs.push(endRun);

  return runs;
}

function createFooterPageNumberParagraph(xmlDoc) {
  const paragraph = createWordElement(xmlDoc, "p");
  const pPr = createWordElement(xmlDoc, "pPr");
  const jc = createWordElement(xmlDoc, "jc");
  setWordAttr(jc, "val", "center");
  pPr.appendChild(jc);
  paragraph.appendChild(pPr);
  paragraph.appendChild(createTextRun(xmlDoc, "Page "));
  createPageFieldRun(xmlDoc).forEach((run) => paragraph.appendChild(run));
  return paragraph;
}

function hasPageField(xmlDoc) {
  return getElementsByLocalName(xmlDoc, "instrText").some((node) => /\bPAGE\b/i.test(node.textContent || ""));
}

function getNextFooterPath(zip) {
  const footerNumbers = Object.keys(zip.files)
    .map((name) => {
      const match = name.match(/^word\/footer(\d+)\.xml$/);
      return match ? Number(match[1]) : 0;
    })
    .filter(Boolean);
  const next = footerNumbers.length ? Math.max(...footerNumbers) + 1 : 1;
  return `word/footer${next}.xml`;
}

function getNextRelationshipId(relsDoc) {
  const ids = getElementsByLocalName(relsDoc, "Relationship")
    .map((rel) => rel.getAttribute("Id") || "")
    .map((id) => {
      const match = id.match(/^rId(\d+)$/);
      return match ? Number(match[1]) : 0;
    });
  const next = ids.length ? Math.max(...ids) + 1 : 1;
  return `rId${next}`;
}

async function ensureDocumentRelationships(zip) {
  const relsPath = "word/_rels/document.xml.rels";
  const relsText = zip.file(relsPath)
    ? await zip.file(relsPath).async("text")
    : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${REL_NS}"/>`;
  const relsDoc = parseXml(relsText);
  return { relsPath, relsDoc };
}

async function ensureContentType(zip, partName) {
  const contentTypesFile = zip.file("[Content_Types].xml");
  if (!contentTypesFile) return;

  const contentTypesDoc = parseXml(await contentTypesFile.async("text"));
  const overrideExists = getElementsByLocalName(contentTypesDoc, "Override").some(
    (node) => node.getAttribute("PartName") === partName
  );

  if (!overrideExists) {
    const override = contentTypesDoc.createElement("Override");
    override.setAttribute("PartName", partName);
    override.setAttribute("ContentType", FOOTER_CONTENT_TYPE);
    contentTypesDoc.documentElement.appendChild(override);
    zip.file("[Content_Types].xml", serializeXml(contentTypesDoc));
  }
}

function appendRelationship(relsDoc, id, target) {
  const relationship = relsDoc.createElementNS(REL_NS, "Relationship");
  relationship.setAttribute("Id", id);
  relationship.setAttribute("Type", FOOTER_REL_TYPE);
  relationship.setAttribute("Target", target);
  relsDoc.documentElement.appendChild(relationship);
}

function addFooterReferenceToSection(xmlDoc, sectPr, relationshipId) {
  const existingDefault = Array.from(sectPr.children).find(
    (child) => child.localName === "footerReference" && child.getAttributeNS(WORD_NS, "type") === "default"
  );
  if (existingDefault) return;

  const footerReference = createWordElement(xmlDoc, "footerReference");
  setWordAttr(footerReference, "type", "default");
  footerReference.setAttributeNS(OFFICE_REL_NS, "r:id", relationshipId);
  sectPr.insertBefore(footerReference, sectPr.firstChild);
}

async function appendPageNumberToExistingFooters(zip) {
  const footerPaths = Object.keys(zip.files).filter((name) => /^word\/footer\d+\.xml$/.test(name));

  for (const footerPath of footerPaths) {
    const footerDoc = parseXml(await zip.file(footerPath).async("text"));
    if (!hasPageField(footerDoc)) {
      footerDoc.documentElement.appendChild(createFooterPageNumberParagraph(footerDoc));
      zip.file(footerPath, serializeXml(footerDoc));
    }
  }
}

export async function addDocxPageNumbers(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) return arrayBuffer;

  await appendPageNumberToExistingFooters(zip);

  const documentDoc = parseXml(await documentFile.async("text"));
  const sections = getElementsByLocalName(documentDoc, "sectPr");
  if (!sections.length) {
    zip.file("word/document.xml", serializeXml(documentDoc));
    return await zip.generateAsync({ type: "arraybuffer" });
  }

  const sectionsWithoutFooter = sections.filter(
    (sectPr) => !Array.from(sectPr.children).some((child) => child.localName === "footerReference")
  );

  if (sectionsWithoutFooter.length) {
    const { relsPath, relsDoc } = await ensureDocumentRelationships(zip);
    const footerPath = getNextFooterPath(zip);
    const relationshipId = getNextRelationshipId(relsDoc);
    const footerDoc = parseXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="${WORD_NS}" xmlns:r="${OFFICE_REL_NS}"/>`);

    footerDoc.documentElement.appendChild(createFooterPageNumberParagraph(footerDoc));
    zip.file(footerPath, serializeXml(footerDoc));
    appendRelationship(relsDoc, relationshipId, footerPath.replace(/^word\//, ""));
    zip.file(relsPath, serializeXml(relsDoc));
    await ensureContentType(zip, `/${footerPath}`);

    sectionsWithoutFooter.forEach((sectPr) => addFooterReferenceToSection(documentDoc, sectPr, relationshipId));
  }

  zip.file("word/document.xml", serializeXml(documentDoc));
  return await zip.generateAsync({ type: "arraybuffer" });
}

export function addPdfPageNumbers(pdf) {
  const totalPages = pdf.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(90, 90, 90);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.text(`Page ${i}`, pageWidth / 2, pageHeight - 25, { align: "center" });
  }
}
