const T = {
  remember: [
    c => `Define the key term introduced in the chapter “${c}”.`,
    c => `State two important facts you learned in “${c}”.`,
    c => `Fill in the blank: The main idea of “${c}” is ________.`,
    c => `Name the most important concept covered in “${c}”.`
  ],
  understand: [
    c => `Explain, in your own words, the main concept of “${c}”.`,
    c => `Describe how the ideas in “${c}” are connected to what you learned earlier.`,
    c => `Give one example from daily life that relates to “${c}”.`,
    c => `Why is “${c}” important to study? Explain briefly.`
  ],
  apply: [
    c => `Solve a problem of your teacher's choice based on “${c}”, showing all steps.`,
    c => `Using what you learned in “${c}”, work out the answer to the situation described by your teacher.`,
    c => `Apply the method from “${c}” to a new example and show your working.`,
    c => `The temperature of a wire of length \\(L\\) is increased by \\(\\Delta T\\). If the tension in the wire is \\(F\\), find the fractional change in its area \\(\\frac{\\Delta A}{A}\\).`
  ],
  analyse: [
    c => `Compare and contrast the two main ideas presented in “${c}”. Support your answer with reasons.`,
    c => `What would happen if the key condition discussed in “${c}” were changed? Justify your answer.`,
    c => `Identify the cause-and-effect relationship explained in “${c}” and analyse it with an example.`
  ],
  evaluate: [
    c => `Do you agree with the conclusion presented in “${c}”? Give reasons for and against, then state your view.`,
    c => `Evaluate which method discussed in “${c}” is most effective, and defend your choice.`
  ],
  create: [
    c => `Design your own example or model that demonstrates the concept from “${c}”, and explain how it works.`,
    c => `Create a short real-life scenario where the idea from “${c}” must be used, and solve it.`
  ]
};

const MCQ_T = [
  c => ({
    text: `Which of the following best describes the main concept of “${c}”?`,
    options: ["The first definition given in the chapter", "A related but different idea", "The concept explained with its key property", "None of these"]
  }),
  c => ({
    text: `Identify the correct statement about “${c}”.`,
    options: ["Statement based on the chapter's main rule", "A common misconception", "An unrelated fact", "A partially correct statement"]
  }),
  c => ({
    text: `In “${c}”, which option is an example of the key idea?`,
    options: ["A textbook example", "A counter-example", "An unrelated case", "A trick option"]
  }),
  c => ({
    text: `The temperature of a wire is changed. Find the tension in the wire.`,
    options: ["\\(10^3\\) N", "\\(10^4\\) N", "\\(10^5\\) N", "\\(10^9\\) N"]
  })
];

const LOTS_LEVELS = ["remember", "understand"];
const HOTS_LEVELS = ["apply", "analyse", "evaluate", "create"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function countRemaining(order, current, idx) {
  let n = 0;
  let passed = false;
  order.forEach(qt => {
    if (qt === current) {
      n += qt.count - idx - 1;
      passed = true;
    } else if (passed) {
      n += Number(qt.count);
    }
  });
  return n;
}

function makeQuestion(type, hots, chapter, difficulty, blooms = [], skills = []) {
  if (type === "mcq" && !hots) {
    const m = pick(MCQ_T)(chapter);
    return { type, text: m.text, options: m.options, level: "Understand", hots: false, chapter };
  }
  
  let pool;
  if (hots) {
    pool = blooms.filter(b => HOTS_LEVELS.includes(b.toLowerCase()));
    pool = pool.length ? pool.map(b => b.toLowerCase()) : HOTS_LEVELS;
    if (difficulty === "challenging") {
      pool = pool.filter(l => l !== "apply").length ? pool.filter(l => l !== "apply") : pool;
    }
  } else {
    pool = blooms.filter(b => LOTS_LEVELS.includes(b.toLowerCase()));
    pool = pool.length ? pool.map(b => b.toLowerCase()) : LOTS_LEVELS;
    if (difficulty === "easy") {
      pool = ["remember", "remember", "understand"];
    }
  }
  
  const level = pick(pool);
  let text = pick(T[level])(chapter);
  
  if (skills.length && Math.random() < 0.5) {
    const skillHints = {
      "Diagram / picture based": " Draw a neat, labelled diagram to support your answer.",
      "Data interpretation": " Present your answer with the help of a small table or data.",
      "Application in daily life": " Relate your answer to a real-life situation.",
      "Map / chart reading": " Mark or refer to the relevant map/chart in your answer.",
      "Creative writing": " Write your answer creatively in your own words.",
      "Reasoning & logic": " Give logical reasons for each step.",
      "Problem solving": " Show every step of your working.",
      "Memory & recall": ""
    };
    text += skillHints[pick(skills)] || "";
  }
  
  return { type, text, level: level[0].toUpperCase() + level.slice(1), hots, chapter };
}

export function generateQuestionsOffline({ qtypes, hots, chapters, difficulty, blooms, skills }) {
  const questions = [];
  const tq = qtypes.reduce((sum, q) => sum + Number(q.count || 0), 0);
  let hotsLeft = Math.round(tq * hots / 100);

  let ci = 0;
  const nextChapter = () => chapters[(ci++) % chapters.length];

  const order = [...qtypes].sort((a, b) => b.marks - a.marks);
  const bank = {};

  order.forEach(qt => {
    bank[qt.id] = [];
    for (let i = 0; i < qt.count; i++) {
      const useHots = hotsLeft > 0 && (qt.id !== "mcq" || hotsLeft > countRemaining(order, qt, i));
      if (useHots) hotsLeft--;
      bank[qt.id].push({
        ...makeQuestion(qt.id, useHots, nextChapter(), difficulty, blooms, skills),
        marks: qt.marks
      });
    }
  });

  qtypes.forEach(qt => {
    questions.push(...(bank[qt.id] || []));
  });

  return questions;
}

export function generateSingleQuestion(type, hots, chapter, difficulty, blooms, skills, marks) {
  return {
    ...makeQuestion(type, hots, chapter, difficulty, blooms, skills),
    marks
  };
}
