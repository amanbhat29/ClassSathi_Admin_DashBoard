/**
 * LayoutEngine Class
 * Responsible for estimating element heights and font spacing configurations.
 */
export class LayoutEngine {
  /**
   * Helper to estimate text lines based on width limits and font size.
   */
  static estimateLines(text, width, fontSize) {
    if (!text) return 0;
    const charWidth = fontSize * 0.48; // average width factor for sans-serif
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

  /**
   * Estimates height of a section header block.
   */
  static getSectionHeaderHeight(title, marksLabel, contentWidth) {
    const lines = this.estimateLines(`${title} (${marksLabel})`, contentWidth, 12.5);
    return lines * 16 + 24; // 16pt line height + 24pt vertical margins
  }

  /**
   * Estimates height of a single question block (including options, padding, and marks).
   */
  static getQuestionHeight(q, globalQNum, contentWidth) {
    const numWidth = 32;   // width of 'Q1. ' label
    const marksWidth = 24; // width of '[5]' label
    
    // First line wraps tightly around question number and marks.
    // Subsequent lines wrap with hanging indentation.
    const firstLineMax = contentWidth - numWidth - marksWidth - 15;
    const restLinesMax = contentWidth - 24;
    
    const words = q.text ? q.text.split(' ') : [];
    let lines = 0;
    let lineLength = 0;
    let isFirstLine = true;
    
    let charWidth = 10.5 * 0.48;
    let firstLineLimitChars = Math.floor(firstLineMax / charWidth);
    let restLinesLimitChars = Math.floor(restLinesMax / charWidth);

    for (const word of words) {
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
    
    // MCQ Options
    let optHeight = 0;
    if (q.type === 'mcq' && q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        const prefix = `(${"abcd"[idx]}) `;
        const optLines = this.estimateLines(prefix + opt, contentWidth - 24, 10.5);
        optHeight += optLines * 14 + 3; // 14pt line height + 3pt option spacing
      });
    }
    
    return qTextHeight + optHeight + 8; // height + spacing after question
  }
}

export default LayoutEngine;
