import { DocxParser } from './DocxParser';

/**
 * PlaceholderEngine Utility
 * Replaces or normalizes placeholders in document files.
 */
export const PlaceholderEngine = {
  /**
   * Normalizes the {{QUESTION_PAPER}} tag to {@QUESTION_PAPER} in the document.
   * Strips split runs inside that paragraph and places a single clean run.
   * Returns base run properties (style) for style inheritance.
   */
  normalizePlaceholder(zip) {
    const docXmlText = DocxParser.readText(zip, "word/document.xml");
    if (!docXmlText) return null;

    const xmlDoc = DocxParser.parseXml(docXmlText);
    const paragraphs = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "p") : xmlDoc.getElementsByTagName("w:p");
    
    let foundP = null;
    let baseRPr = null;
    let basePPr = null;

    // 1. Locate paragraph containing the placeholder
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const rList = Array.from(p.children).filter(child => child.localName === "r");
      let pText = "";
      for (const r of rList) {
        const tList = Array.from(r.children).filter(child => child.localName === "t");
        for (const t of tList) {
          pText += t.textContent || "";
        }
      }

      if (pText.includes("{{QUESTION_PAPER}}")) {
        foundP = p;
        // Extract paragraph properties for style inheritance
        const pPrNode = Array.from(p.children).find(c => c.localName === "pPr");
        if (pPrNode) {
          basePPr = pPrNode.cloneNode(true);
        }
        // Extract baseline run properties for styling inheritance
        for (const r of rList) {
          const rPr = Array.from(r.children).find(c => c.localName === "rPr");
          if (rPr) {
            baseRPr = rPr.cloneNode(true);
            break;
          }
        }
        break;
      }
    }

    if (!foundP) return null;

    // 2. Reconstruct the placeholder paragraph
    // Remove all child elements that are not pPr (paragraph properties)
    const children = Array.from(foundP.children);
    for (const child of children) {
      if (child.localName !== "pPr") {
        foundP.removeChild(child);
      }
    }

    // Create a new run containing the {@QUESTION_PAPER} tag
    const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const rNode = xmlDoc.createElementNS(W_NS, "w:r");
    
    if (baseRPr) {
      rNode.appendChild(baseRPr);
    }
    
    const tNode = xmlDoc.createElementNS(W_NS, "w:t");
    tNode.textContent = "{@QUESTION_PAPER}";
    rNode.appendChild(tNode);
    foundP.appendChild(rNode);

    // 3. Save changes back to document XML
    const serializer = new XMLSerializer();
    const newXmlString = serializer.serializeToString(xmlDoc);
    zip.file("word/document.xml", newXmlString);

    return { baseRPr, basePPr }; // Expose baseline styles to apply to generated questions
  }
};
