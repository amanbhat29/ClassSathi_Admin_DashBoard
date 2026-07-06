import { LayoutEngine } from './LayoutEngine';

/**
 * PaginationEngine Class
 * Operates on layout state to divide content items into pages under margin constraints.
 */
export class PaginationEngine {
  /**
   * Paginates flat flow items into discrete pages.
   */
  static paginate(questions, qtypes, payload) {
    const pageWidth = 595.28;  // A4 dimensions in points
    const pageHeight = 841.89;
    const topMargin = 54;
    const bottomMargin = 54;
    const leftMargin = 54;
    const rightMargin = 54;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    const maxContentHeight = pageHeight - topMargin - bottomMargin;
    const headerHeight = payload.headerTemplate ? 140 : 110;
    const reservedSignatureHeight = 135; 
    
    const pages = [[]];
    let currentPageIndex = 0;
    let currentY = headerHeight; // Start with first page header height occupied
    
    const getQuestionsByType = (typeId) => questions.filter(q => q.type === typeId);
    const sectionIds = ["mcq", "vsa", "sa", "la"];
    
    // 1. Build linear sequence of section titles and question blocks
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
        title,
        marksLabel,
        secId
      });
      
      secQuestions.forEach(q => {
        flowItems.push({
          type: 'question',
          q
        });
      });
    });
    
    let globalQNum = 0;

    // 2. Distribute items page-by-page
    for (let i = 0; i < flowItems.length; i++) {
      const item = flowItems[i];
      if (item.type === 'question') {
        globalQNum++;
      }
      
      const isLastItem = i === flowItems.length - 1;
      let height = 0;
      
      if (item.type === 'section_header') {
        height = LayoutEngine.getSectionHeaderHeight(item.title, item.marksLabel, contentWidth);
      } else {
        height = LayoutEngine.getQuestionHeight(item.q, globalQNum, contentWidth);
      }
      
      let spaceNeeded = height;
      if (isLastItem) {
        spaceNeeded += reservedSignatureHeight;
      }
      
      let pageBreakRequired = false;
      
      if (item.type === 'section_header') {
        // Orphan header check: ensure header + first question fit together
        const nextQItem = flowItems[i + 1];
        let nextQHeight = 0;
        if (nextQItem && nextQItem.type === 'question') {
          nextQHeight = LayoutEngine.getQuestionHeight(nextQItem.q, globalQNum + 1, contentWidth);
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
        pages.push([]);
        currentPageIndex++;
        currentY = 0; // New page resets content Y
        
        pages[currentPageIndex].push(item);
        currentY += height;
      } else {
        pages[currentPageIndex].push(item);
        currentY += height;
      }
    }
    
    // Safety check: if last page has no space for signatures, push block to an extra page
    if (currentY + reservedSignatureHeight > maxContentHeight) {
      pages.push([]);
    }
    
    return pages;
  }
}

export default PaginationEngine;
