import { GRADES, SUBJECTS, CURRICULUM } from '../data/curriculum';


export default function Step1WhatToTest({
  grade,
  subject,
  selectedChapters,
  onPickGrade,
  onPickSubject,
  onToggleChapter,
  onSelectAllChapters,
  onClearChapters,
  onNext
}) {
  const chaptersList = (grade && subject && CURRICULUM[subject] && CURRICULUM[subject][grade]) || [];

  const handleSelectAll = () => {
    onSelectAllChapters(chaptersList);
  };

  return (
    <section id="step1">
      <div className="card card-accent">
        <div className="card-body">
          <div className="card-label">STEP 1</div>
          <div className="card-title">What do you want to test?</div>
          <div className="card-hint">
            Pick the class, subject and chapters this paper should cover. That's all that's required — everything in Step 2 has ready-made defaults.
          </div>

          <div className="field-label" style={{ marginTop: '18px' }}>Grade / Class</div>
          <div className="chip-row" id="gradeRow">
            {GRADES.map((g) => {
              const isSelected = grade === g;
              return (
                <button
                  key={g}
                  type="button"
                  className={`chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => onPickGrade(g)}
                >
                  <span className="chip-check">✓</span>Grade {g}
                </button>
              );
            })}
          </div>

          <div className="field-label">Subject</div>
          <div className="chip-row" id="subjectRow">
            {SUBJECTS.map((s) => {
              const isSelected = subject === s;
              return (
                <button
                  key={s}
                  type="button"
                  className={`chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => onPickSubject(s)}
                >
                  <span className="chip-check">✓</span>{s}
                </button>
              );
            })}
          </div>

          <div className="field-label">
            Chapters <span className="field-why">— tap to select, choose as many as you like</span>
          </div>
          
          <div id="chapterArea">
            {!grade || !subject ? (
              <div className="empty-note">Select a grade and subject first, and the chapters will appear here.</div>
            ) : (
              <div className="chip-row">
                {chaptersList.map((ch) => {
                  const isSelected = selectedChapters.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => onToggleChapter(ch)}
                    >
                      <span className="chip-check">✓</span>{ch}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {grade && subject && (
            <div id="chapterTools" style={{ marginTop: '8px' }}>
              <button type="button" className="chip-link" onClick={handleSelectAll}>Select all</button>
              <button type="button" className="chip-link" onClick={onClearChapters}>Clear</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="step-footer">
        <span></span>
        <button
          type="button"
          className="btn btn-primary"
          id="toStep2"
          onClick={onNext}
          disabled={!grade || !subject || selectedChapters.length === 0}
        >
          Next: Paper structure →
        </button>
      </div>
    </section>
  );
}
