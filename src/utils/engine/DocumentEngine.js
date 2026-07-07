import { TemplateParser } from './TemplateParser';
import { parseLatexToText } from '../latex';
import { QuestionRenderer, sanitizeText } from './QuestionRenderer';

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
}

export default DocumentEngine;
