/**
 * paginationEngine.js
 *
 * Programmatic pagination budget scanner. Segments questions and section title banners
 * into discrete A4 pages (budgeting for headers, footers, and signatures) so that print layout
 * is 100% stable, identical to screen previews, and prevents vertical clipping.
 */

export const DUMMY_QUESTIONS = [
  {
    text: "What is the structural and functional unit of the nervous system?",
    type: "mcq",
    options: ["Neuron", "Nephron", "Axon", "Dendrite"],
    level: "Easy",
    chapter: "Control and Coordination",
    marks: 1,
    globalIndex: 1
  },
  {
    text: "State the law of conservation of energy and write its mathematical representation.",
    type: "vsa",
    level: "Medium",
    chapter: "Work and Energy",
    marks: 2,
    globalIndex: 2
  },
  {
    text: "Explain the process of double circulation in human beings and describe why it is necessary.",
    type: "sa",
    level: "Hard",
    chapter: "Life Processes",
    marks: 3,
    globalIndex: 3
  },
  {
    text: "Draw a neat labeled diagram of the human eye. Explain the functions of the Retina, Cornea, and Pupil in detail.",
    type: "la",
    level: "Medium",
    chapter: "Human Eye and Colorful World",
    marks: 5,
    globalIndex: 4
  }
];

export const DUMMY_QTYPES = [
  { id: "mcq", name: "Section A — Multiple Choice Questions", count: 1, marks: 1 },
  { id: "vsa", name: "Section B — Very Short Answer Questions", count: 1, marks: 2 },
  { id: "sa", name: "Section C — Short Answer Questions", count: 1, marks: 3 },
  { id: "la", name: "Section D — Long Answer Questions", count: 1, marks: 5 }
];

const SECTION_NAMES = {
  mcq: "Section A — Multiple Choice Questions",
  vsa: "Section B — Very Short Answer Questions",
  sa: "Section C — Short Answer Questions",
  la: "Section D — Long Answer Questions"
};

/**
 * Splits questions and headers into A4 page configurations.
 * @param {Array} questions - Generated questions list
 * @param {Array} qtypes - Selected question types / structure
 * @param {Object} template - Active template options
 * @returns {Array} List of page objects
 */
export function paginateQuestions(questions = [], qtypes = []) {
  const activeQuestions = questions.length > 0 ? questions : DUMMY_QUESTIONS;
  const activeQTypes = qtypes.length > 0 ? qtypes : DUMMY_QTYPES;

  const pages = [];
  let currentPage = [];
  
  // Height constants (corresponds to CSS pixels at standard printing resolution)
  const PAGE_HEIGHT = 920;           // Total available printable height inside padding
  const HEADER_HEIGHT = 160;          // A4 header (logo + school info)
  const EXAM_HEADER_HEIGHT = 70;      // Title, subject, marks metadata card
  const INSTRUCTIONS_HEIGHT = 110;    // Guidelines block
  const SIGNATURES_HEIGHT = 120;      // Seal stamp & signature block
  const SECTION_HEADER_HEIGHT = 45;   // Section Title banner (Pill card)

  // First page holds header, title details, and instructions
  const firstPageBudget = PAGE_HEIGHT - HEADER_HEIGHT - EXAM_HEADER_HEIGHT - INSTRUCTIONS_HEIGHT;
  
  let pageNum = 1;
  let remainingBudget = firstPageBudget;

  // Group questions by their respective section types
  const sections = activeQTypes.map(qt => ({
    id: qt.id,
    name: SECTION_NAMES[qt.id] || qt.name,
    count: qt.count,
    marks: qt.marks,
    questions: activeQuestions
      .map((q, globalIndex) => ({ ...q, globalIndex: globalIndex + 1 }))
      .filter(q => q.type === qt.id)
  })).filter(s => s.questions.length > 0);

  sections.forEach((section) => {
    let sectionHeaderAdded = false;

    section.questions.forEach((q) => {
      // Estimate height of the question text
      let qHeight = 35; // base padding and line height
      const charCount = q.text.length;
      qHeight += Math.floor(charCount / 70) * 16; // Wrap lines estimation

      // Estimate MCQ options grid height
      if (q.options && q.options.length > 0) {
        qHeight += Math.ceil(q.options.length / 2) * 20; // 2 column layout
      }
      
      qHeight += 16; // Margins and spacing offsets

      let requiredHeight = qHeight;
      if (!sectionHeaderAdded) {
        requiredHeight += SECTION_HEADER_HEIGHT;
      }

      // If budget exceeded, push to a new page
      if (remainingBudget - requiredHeight < 0) {
        pages.push({
          pageNum,
          questions: currentPage,
          isFirst: pageNum === 1,
          isLast: false
        });

        pageNum++;
        currentPage = [];
        remainingBudget = PAGE_HEIGHT;

        if (!sectionHeaderAdded) {
          remainingBudget -= SECTION_HEADER_HEIGHT;
        }
      } else {
        if (!sectionHeaderAdded) {
          remainingBudget -= SECTION_HEADER_HEIGHT;
        }
      }

      currentPage.push({
        ...q,
        showSectionHeader: !sectionHeaderAdded ? section : null
      });

      sectionHeaderAdded = true;
      remainingBudget -= qHeight;
    });
  });

  // Verify signature block fitting budget
  if (remainingBudget - SIGNATURES_HEIGHT < 0) {
    pages.push({
      pageNum,
      questions: currentPage,
      isFirst: pageNum === 1,
      isLast: false
    });

    pageNum++;
    pages.push({
      pageNum,
      questions: [],
      isFirst: false,
      isLast: true
    });
  } else {
    pages.push({
      pageNum,
      questions: currentPage,
      isFirst: pageNum === 1,
      isLast: true
    });
  }

  return pages;
}
