import PizZip from 'pizzip';
import { DocxParser } from './DocxParser';

/**
 * WordParser Service
 * Handles low-level structure loading and xml parsing for Microsoft Word (.docx) templates.
 */
export const WordParser = {
  /**
   * Parses the zip archive from ArrayBuffer.
   */
  parseDocx(arrayBuffer) {
    try {
      return new PizZip(arrayBuffer);
    } catch (err) {
      throw new Error(`Failed to parse DOCX zip: ${err.message}`);
    }
  },

  /**
   * Reads document XML text and parses to DOM Document.
   */
  parseDocumentXml(zip) {
    const text = DocxParser.readText(zip, "word/document.xml");
    if (!text) {
      throw new Error("Missing word/document.xml. Not a valid Microsoft Word template.");
    }
    const xmlDoc = DocxParser.parseXml(text);
    if (!xmlDoc) {
      throw new Error("Corrupted DOCX structure: Failed to parse XML.");
    }
    return xmlDoc;
  },

  /**
   * Counts occurrences of the target placeholder.
   */
  countPlaceholders(xmlDoc, placeholder = "{{QUESTION_PAPER}}") {
    const paragraphs = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "p") : xmlDoc.getElementsByTagName("w:p");
    let count = 0;
    
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
      
      let idx = pText.indexOf(placeholder);
      while (idx !== -1) {
        count++;
        idx = pText.indexOf(placeholder, idx + 1);
      }
    }
    
    return count;
  }
};

export default WordParser;
