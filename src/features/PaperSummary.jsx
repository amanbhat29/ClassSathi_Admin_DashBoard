import {
  calculateTotals,
  calculateHotsCount,
  isStep1Complete,
  getDifficultyLabel
} from '../utils/helpers';

export default function PaperSummary({
  grade,
  subject,
  selectedChapters,
  qtypes = [],
  difficulty = 'balanced',
  hots = 30,
  maxMarks = 50
}) {
  const step1Done = isStep1Complete(grade, subject, selectedChapters);
  const { totalQuestions, totalMarks } = calculateTotals(qtypes);
  const hotsCount = calculateHotsCount(totalQuestions, hots);
  const diffLabel = getDifficultyLabel(difficulty);

  return (
    <aside>
      <div className="card card-accent orange">
        <div className="card-body">
          <div className="card-label">PAPER SUMMARY</div>
          
          <div className="summary-stat">
            <span className="summary-key">Class</span>
            <span className="summary-val">{grade ? `Grade ${grade}` : '—'}</span>
          </div>
          
          <div className="summary-stat">
            <span className="summary-key">Subject</span>
            <span className="summary-val">{subject || '—'}</span>
          </div>
          
          <div className="summary-stat">
            <span className="summary-key">Chapters</span>
            <span className="summary-val">
              {selectedChapters.length > 0 ? `${selectedChapters.length} selected` : '—'}
            </span>
          </div>
          
          <div className="summary-stat">
            <span className="summary-key">Questions</span>
            <span className="summary-val">{totalQuestions || '—'}</span>
          </div>
          
          <div className="summary-stat">
            <span className="summary-key">HOTS questions</span>
            <span className="summary-val">
              {totalQuestions ? `${hotsCount} (${hots}%)` : '—'}
            </span>
          </div>
          
          <div className="summary-stat">
            <span className="summary-key">Difficulty</span>
            <span className="summary-val">{diffLabel}</span>
          </div>
          
          {!step1Done ? (
            <div className="marks-check warn">
              Finish Step 1 to unlock the paper structure.
            </div>
          ) : totalMarks === maxMarks ? (
            <div className="marks-check ok">
              ✓ Perfect — questions add up to exactly <b>{maxMarks} marks</b>.
            </div>
          ) : (
            <div className="marks-check warn">
              ⚠️ Questions add up to <b>{totalMarks} marks</b>, but maximum marks is <b>{maxMarks}</b>. Adjust the counts or the maximum marks.
            </div>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="card-label">💡 TIP</div>
          <div className="card-hint">
            A good exam usually keeps <b>60–75%</b> of marks on familiar, textbook-style questions and the rest on higher-order thinking. The default settings follow this pattern.
          </div>
        </div>
      </div>
    </aside>
  );
}
