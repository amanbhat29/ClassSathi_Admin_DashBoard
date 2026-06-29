/**
 * Utility functions for summary calculations, validations, print triggers,
 * and formatting settings.
 */

/**
 * Calculates total question count and mark sums for the given qtypes config.
 * @param {Array} qtypes List of question types
 * @returns {Object} { totalQuestions, totalMarks }
 */
export function calculateTotals(qtypes = []) {
  const totalQuestions = qtypes.reduce((sum, q) => sum + Number(q.count || 0), 0);
  const totalMarks = qtypes.reduce((sum, q) => sum + (Number(q.count || 0) * Number(q.marks || 0)), 0);
  return { totalQuestions, totalMarks };
}

/**
 * Calculates number of HOTS questions based on total questions and target hots ratio.
 * @param {number} totalQuestions Total number of questions
 * @param {number} hotsPercentage Target hots ratio (0-100)
 * @returns {number} HOTS questions count
 */
export function calculateHotsCount(totalQuestions, hotsPercentage) {
  return Math.round(totalQuestions * (hotsPercentage / 100));
}

/**
 * Validates if the requirements for Step 1 are satisfied.
 * @param {number|null} grade Grade value
 * @param {string|null} subject Subject label
 * @param {Array} selectedChapters Chapters selected
 * @returns {boolean} Step 1 completion status
 */
export function isStep1Complete(grade, subject, selectedChapters = []) {
  return !!(grade && subject && selectedChapters && selectedChapters.length > 0);
}

/**
 * Map of difficulty key-values.
 */
const DIFFICULTY_LABELS = {
  easy: 'Easy',
  balanced: 'Balanced',
  challenging: 'Challenging'
};

/**
 * Formats a difficulty key into its presentable capitalized string.
 * @param {string} difficulty Difficulty key
 * @returns {string} Presentation string
 */
export function getDifficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] || 'Balanced';
}


