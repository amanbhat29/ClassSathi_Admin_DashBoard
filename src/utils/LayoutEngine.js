import { parseLatexToText } from './latex';

/**
 * LayoutEngine Service
 * Measures content heights and paginates questions to prevent overlaps and orphans.
 */
export const LayoutEngine = {
  /**
   * Paginates questions and section headers into pages.
   * Establishes printable heights and reserves signature block spacing on the last page.
   * 
   * @param {Array} questions - The generated questions.
   * @param {Array} qtypes - The question type configurations.
   * @param {Object} payload - Metadata payload (examName, grade, subject, schoolName, address, etc.)
   * @returns {Array} List of pages, where each page is an array of items to render.
   */
  paginate(questions, qtypes, payload, options = {}) {
    const pageWidth = 595.28;  // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const topMargin = 55;      // 55pt margin
    const bottomMargin = 55;   // 55pt margin
    const leftMargin = 55;
    const rightMargin = 55;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Total printable height per page
    const maxContentHeight = pageHeight - topMargin - bottomMargin;
    
    // Spacing heights (in points)
    const isPdfTemplate = options.isPdfTemplate;
    const placeholderOffset = options.placeholderOffset || topMargin;

    const headerHeight = isPdfTemplate
      ? Math.max(topMargin, placeholderOffset)
      : (payload.headerTemplate ? 140 : 110); // First page header details
    const footerHeight = 40;  // Normal page numbering footer height
    const reservedSignatureHeight = 135; // Principal & Stamp signature block
    
    const pages = [[]];
    let currentPageIndex = 0;
    let currentY = headerHeight; // Page 1 starts with the header height occupied
    
    const getQuestionsByType = (typeId) => questions.filter(q => q.type === typeId);
    const sectionIds = ["mcq", "vsa", "sa", "la"];
    
    // Group sections and questions in sequence
    const flowItems = [];
    const SECTION_NAMES = {
      mcq: "Section A — Multiple Choice Questions",
      vsa: "Section B — Very Short Answer Questions",
      sa: "Section C — Short Answer Questions",
      la: "Section D — Long Answer Questions"
    };

    sectionIds.forEach(secId => {
      const secQuestions = getQuestionsByType(secId);
      if (secQuestions.length === 0) return;
      
      const qtConf = qtypes.find(qt => qt.id === secId) || { count: secQuestions.length, marks: secQuestions[0].marks };
      const title = `${SECTION_NAMES[secId] || secId.toUpperCase()}`;
      const marksLabel = `${qtConf.count} × ${qtConf.marks} = ${qtConf.count * qtConf.marks} marks`;
      
      flowItems.push({
        type: 'section_header',
        title: title,
        marksLabel: marksLabel,
        secId: secId
      });
      
      secQuestions.forEach(q => {
        flowItems.push({
          type: 'question',
          q: q
        });
      });
    });
    
    // Estimates text line counts based on font size and widths
    function estimateLines(text, width, fontSize) {
      if (!text) return 0;
      const charWidth = fontSize * 0.48; // average width factor
      const charsPerLine = Math.floor(width / charWidth) || 1;
      const words = text.split(' ');
      let lines = 0;
      let lineLength = 0;
      
      for (const word of words) {
        if (lineLength + word.length > charsPerLine) {
          lines++;
          lineLength = word.length;
        } else {
          lineLength += word.length + 1;
        }
      }
      if (lineLength > 0) lines++;
      return Math.max(1, lines);
    }
    
    // Estimates height of a flow item
    function getItemHeight(item, qNum) {
      if (item.type === 'section_header') {
        const lines = estimateLines(`${item.title} (${item.marksLabel})`, contentWidth, 16.5);
        return lines * 20 + 64; // 20pt line height + 64pt vertical spacing/margins
      }
      
      const q = item.q;
      const questionText = parseLatexToText(q.questionTxt || q.questionTxtM || q.text || '', 'unicode');
      const questionDesc = parseLatexToText(q.questionDescription || q.questionDescriptionM || q.description || '', 'unicode');
      const choicesList = q.choices || q.choicesM || q.options || null;
      
      const numWidth = 32; // Estimated width for 'Q1. ' label
      
      // Two-column layout width calculation (Question column takes 86%)
      const questionColWidth = contentWidth * 0.86;
      
      const firstLineMax = questionColWidth - numWidth;
      
      let charWidth = 10.5 * 0.48;
      let firstLineLimitChars = Math.floor(firstLineMax / charWidth);
      let restLinesLimitChars = Math.floor((questionColWidth - 24) / charWidth);
      
      let lines = 0;
      let lineLength = 0;
      let isFirstLine = true;
      
      for (const word of wordsList(questionText)) {
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
      
      const qTextHeight = Math.max(1, lines) * 14; // 14pt line height
      
      // Options height
      let optHeight = 0;
      if (q.type === 'mcq' && choicesList && choicesList.length > 0) {
        choicesList.forEach((opt, idx) => {
          const cleanOpt = parseLatexToText(opt, 'unicode');
          const prefix = `(${"abcd"[idx]}) `;
          const optLines = estimateLines(prefix + cleanOpt, questionColWidth - 24, 10.5);
          optHeight += optLines * 14 + 3; // 14pt line height + 3pt option gap
        });
      }

      return qTextHeight + optHeight + 3; // 3pt margin bottom after question
    }
    
    function wordsList(str) {
      return str ? str.split(' ') : [];
    }

    let globalQNum = 0;
    
    // Flow items page by page
    for (let i = 0; i < flowItems.length; i++) {
      const item = flowItems[i];
      if (item.type === 'question') {
        globalQNum++;
      }
      
      const height = getItemHeight(item, globalQNum);
      const isLastItem = i === flowItems.length - 1;
      
      // We check if this item fits on the current page.
      // If it is the last item, we must ALSO fit the signature block on the same page!
      let spaceNeeded = height;
      if (isLastItem) {
        spaceNeeded += reservedSignatureHeight;
      }
      
      let pageBreakRequired = false;
      
      if (item.type === 'section_header') {
        // Prevent orphaned section headers: check if header + next question fits
        const nextQItem = flowItems[i + 1];
        let nextQHeight = 0;
        if (nextQItem && nextQItem.type === 'question') {
          nextQHeight = getItemHeight(nextQItem, globalQNum + 1);
        }
        
        let totalHeaderGroupHeight = height + nextQHeight;
        if (isLastItem || (i + 1 === flowItems.length - 1)) {
          totalHeaderGroupHeight += reservedSignatureHeight;
        }
        
        if (currentY + totalHeaderGroupHeight > maxContentHeight) {
          pageBreakRequired = true;
        }
      } else {
        if (currentY + spaceNeeded > maxContentHeight) {
          pageBreakRequired = true;
        }
      }
      
      if (pageBreakRequired) {
        // Create new page
        pages.push([]);
        currentPageIndex++;
        currentY = 0; // Fresh page has 0 header occupied
        
        pages[currentPageIndex].push(item);
        currentY += height;
      } else {
        pages[currentPageIndex].push(item);
        currentY += height;
      }
    }
    
    // Safety check: if the very last page grew too large, append a separate signatures page
    const finalPage = pages[currentPageIndex];
    if (currentY + reservedSignatureHeight > maxContentHeight) {
      pages.push([]); // blank signature page
    }
    
    return pages;
  }
};

export default LayoutEngine;
