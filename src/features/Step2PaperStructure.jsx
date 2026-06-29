import { useState } from 'react';
import { SKILLS, BLOOMS } from '../data/curriculum';
import { calculateTotals, calculateHotsCount } from '../utils/helpers';
import UploadTemplateButton from '../components/UploadTemplateButton';
import UploadTemplateModal from '../components/UploadTemplateModal';

export default function Step2PaperStructure({
  examName,
  maxMarks,
  duration,
  qtypes = [],
  difficulty,
  hots,
  selectedSkills = [],
  selectedBlooms = [],
  onUpdateField,
  onUpdateQType,
  onToggleSkill,
  onToggleBloom,
  onBack,
  onGenerate
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const { totalQuestions, totalMarks } = calculateTotals(qtypes);
  const hotsCount = calculateHotsCount(totalQuestions, hots);


  const handleInputChange = (field, val) => {
    let finalVal = val;
    if (field === 'maxMarks') {
      finalVal = Math.max(0, parseInt(val || 0, 10));
    }
    onUpdateField(field, finalVal);
  };

  const handleQTypeChange = (index, field, val) => {
    const numericVal = Math.max(0, parseInt(val || 0, 10));
    onUpdateQType(index, field, numericVal);
  };

  return (
    <section id="step2">
      <div className="card card-accent blue">
        <div className="card-body">
          <div className="card-label">STEP 2</div>
          <div className="card-title">Paper structure</div>
          <div className="card-hint">
            We've filled in a typical exam pattern. Change anything you like — the marks total updates automatically on the right.
          </div>

          <div className="field-label" style={{ marginTop: '18px' }}>Exam name &amp; basics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <input
              className="input"
              id="examName"
              value={examName}
              onChange={(e) => handleInputChange('examName', e.target.value)}
              aria-label="Exam name"
            />
            <input
              className="input"
              id="maxMarks"
              type="number"
              min="5"
              max="200"
              value={maxMarks}
              onChange={(e) => handleInputChange('maxMarks', e.target.value)}
              aria-label="Maximum marks"
              title="Maximum marks"
            />
            <select
              className="input"
              id="duration"
              value={duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              aria-label="Duration"
            >
              <option>1 hour</option>
              <option>1½ hours</option>
              <option>2 hours</option>
              <option>2½ hours</option>
              <option>3 hours</option>
            </select>
          </div>
          <div className="card-hint" style={{ marginTop: '6px' }}>
            Exam name · Maximum marks · Time allowed
          </div>

          <div className="field-label" style={{ marginTop: '20px' }}>How many questions of each type?</div>
          <table className="qtype-table">
            <thead>
              <tr>
                <th>Question type</th>
                <th style={{ width: '90px' }}>How many</th>
                <th style={{ width: '110px' }}>Marks each</th>
                <th style={{ width: '70px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody id="qtypeBody">
              {qtypes.map((q, index) => (
                <tr key={q.id}>
                  <td>
                    <div className="qtype-name">{q.name}</div>
                    <div className="qtype-eg">{q.eg}</div>
                  </td>
                  <td>
                    <input
                      className="input small"
                      type="number"
                      min="0"
                      max="40"
                      value={q.count}
                      onChange={(e) => handleQTypeChange(index, 'count', e.target.value)}
                      aria-label={`Number of ${q.name}`}
                    />
                  </td>
                  <td>
                    <input
                      className="input small"
                      type="number"
                      min="1"
                      max="20"
                      value={q.marks}
                      onChange={(e) => handleQTypeChange(index, 'marks', e.target.value)}
                      aria-label={`Marks per ${q.name}`}
                    />{' '}
                    <span className="qtype-marks">mk</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {q.count * q.marks}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="row-total">Paper total</td>
                <td className="row-total" id="totQ">
                  {totalQuestions} questions
                </td>
                <td></td>
                <td className="row-total" style={{ textAlign: 'right' }} id="totM">
                  {totalMarks} marks
                </td>
              </tr>
            </tfoot>
          </table>

          <UploadTemplateButton onClick={() => setIsTemplateOpen(true)} />

          <UploadTemplateModal
            isOpen={isTemplateOpen}
            onClose={() => setIsTemplateOpen(false)}
          />

          <div className="field-label" style={{ marginTop: '20px' }}>Overall difficulty</div>
          <div className="diff-row" id="diffRow">
            <button
              type="button"
              className={`diff-card ${difficulty === 'easy' ? 'selected' : ''}`}
              onClick={() => handleInputChange('difficulty', 'easy')}
            >
              <div className="diff-name">🟢 Easy</div>
              <div className="diff-desc">Confidence-building. Mostly direct questions from the textbook.</div>
            </button>
            <button
              type="button"
              className={`diff-card ${difficulty === 'balanced' ? 'selected' : ''}`}
              onClick={() => handleInputChange('difficulty', 'balanced')}
            >
              <div className="diff-name">🟡 Balanced</div>
              <div className="diff-desc">A healthy mix — like a typical school exam. Recommended.</div>
            </button>
            <button
              type="button"
              className={`diff-card ${difficulty === 'challenging' ? 'selected' : ''}`}
              onClick={() => handleInputChange('difficulty', 'challenging')}
            >
              <div className="diff-name">🔴 Challenging</div>
              <div className="diff-desc">Stretches strong students with more application &amp; reasoning.</div>
            </button>
          </div>

          <div className="field-label" style={{ marginTop: '20px' }}>
            Thinking-skill mix <span className="field-why">— how many "why &amp; how" questions?</span>
          </div>
          <div className="slider-wrap">
            <input
              type="range"
              id="hotsSlider"
              min="0"
              max="60"
              step="5"
              value={hots}
              onChange={(e) => handleInputChange('hots', Number(e.target.value))}
              aria-label="Percentage of higher-order thinking questions"
            />
            <div className="slider-value" id="hotsVal">{hots}%</div>
          </div>
          <div className="hots-explain" id="hotsExplain">
            About <b>{hotsCount} of {totalQuestions} questions</b> will be higher-order thinking (HOTS) — questions that ask students to apply, analyse or evaluate, not just recall. The rest will be familiar, textbook-style (LOTS).
          </div>

          {/* Advanced collapsible */}
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="adv-toggle"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              id="advBtn"
            >
              <span>
                ⚙️ Advanced options{' '}
                <span className="field-why">
                  (optional — Bloom's taxonomy &amp; specific skills)
                </span>
              </span>
              <span id="advArrow">{isAdvancedOpen ? '▴' : '▾'}</span>
            </button>
            <div className={`adv-body ${isAdvancedOpen ? 'open' : ''}`} id="advBody">
              <div className="field-label">
                Specific skills to test{' '}
                <span className="field-why">— leave blank to let us decide</span>
              </div>
              <div className="chip-row" id="skillRow">
                {SKILLS.map((s) => {
                  const isSelected = selectedSkills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => onToggleSkill(s)}
                    >
                      <span className="chip-check">✓</span>{s}
                    </button>
                  );
                })}
              </div>
              
              <div className="field-label" style={{ marginTop: '16px' }}>
                Bloom's taxonomy emphasis
              </div>
              <div className="chip-row" id="bloomRow">
                {BLOOMS.map((b) => {
                  const isSelected = selectedBlooms.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => onToggleBloom(b)}
                    >
                      <span className="chip-check">✓</span>{b}
                    </button>
                  );
                })}
              </div>
              <div className="card-hint" style={{ marginTop: '8px' }}>
                By default the Bloom's mix is set automatically from your difficulty and thinking-skill choices above. Selecting levels here tells the generator to emphasise them.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="step-footer">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-green" onClick={onGenerate}>
          ✨ Generate paper
        </button>
      </div>
    </section>
  );
}
