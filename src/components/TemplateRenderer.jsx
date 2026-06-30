/**
 * TemplateRenderer.jsx
 *
 * Orchestrator component for rendering structured, paginated exam papers.
 * Integrates TemplateHeader, TemplateExamDetails, and TemplateFooter dynamically.
 * Computes page segments using paginateQuestions for true screen-to-print parity.
 */

import { paginateQuestions } from '../utils/paginationEngine';
import TemplateHeader from './TemplateHeader';
import TemplateExamDetails from './TemplateExamDetails';
import TemplateFooter from './TemplateFooter';
import EditableField from './EditableField';

const themeMap = {
  green: { primary: '#2f9e44', soft: '#d8f5d3' },
  blue: { primary: '#3b76f6', soft: '#dce8fd' },
  purple: { primary: '#7048e8', soft: '#e9defa' },
  orange: { primary: '#f2a33c', soft: '#fdf3d1' },
  red: { primary: '#e03131', soft: '#fde3e0' }
};

export default function TemplateRenderer({
  template,
  questions = [],
  qtypes = [],
  examName = "HALF YEARLY EXAMINATION",
  grade = "Grade 10",
  subject = "Science",
  duration = "3 Hours",
  totalMarks = "100",
  isEditable = false,
  onFieldChange,
  onExamFieldChange,
  onRedoQuestion
}) {
  const themeColors = themeMap[template.themeColor] || themeMap.green;

  // Construct watermark style background
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" opacity="${template.watermarkOpacity}">
      <text x="50%" y="50%" fill="#cccccc" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(-45 90 90)">
        ${template.watermarkText}
      </text>
    </svg>
  `;
  const watermarkStyle = template.watermarkEnabled
    ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")` }
    : {};

  // Compute pagination segments
  const pages = paginateQuestions(questions, qtypes, template);
  const instructions = template.instructions || [];

  return (
    <div className="template-renderer-container" style={{ width: '100%' }}>
      {pages.map((page, pIdx) => (
        <div
          key={pIdx}
          className={`paper word-paper theme-${template.themeColor}`}
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: '#ffffff',
            width: '100%',
            maxWidth: '680px',
            minHeight: '960px',
            margin: '24px auto',
            padding: '48px 56px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: '#1c1c21',
            lineHeight: '1.6',
            ...watermarkStyle
          }}
        >
          {/* 1. Header (School logo + School Info) */}
          {page.isFirst && (
            <TemplateHeader
              logo={template.logo}
              schoolName={template.schoolName}
              schoolAddress={template.schoolAddress}
              phone={template.phone}
              email={template.email}
              website={template.website}
              onFieldChange={onFieldChange}
              isEditable={isEditable}
              themeColors={themeColors}
            />
          )}

          {/* 2. Exam Details Banner Card */}
          {page.isFirst && (
            <TemplateExamDetails
              examName={examName}
              academicYear={template.academicYear}
              grade={grade}
              subject={subject}
              duration={duration}
              totalMarks={totalMarks}
              onFieldChange={(field, val) => {
                if (field === 'academicYear') {
                  onFieldChange('academicYear', val);
                } else {
                  onExamFieldChange && onExamFieldChange(field, val);
                }
              }}
              isEditable={isEditable}
              themeColors={themeColors}
            />
          )}

          {/* 3. Instructions (Custom list) */}
          {page.isFirst && (
            <div 
              style={{ 
                borderBottom: `2px solid ${themeColors.primary}`, 
                paddingBottom: '8px', 
                marginBottom: '12px', 
                textAlign: 'left' 
              }}
            >
              <strong style={{ fontSize: '13.5px', display: 'block', marginBottom: '4px', color: '#1c1c21' }}>
                General Instructions:
              </strong>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#222' }}>
                {instructions.map((inst, index) => (
                  <li key={index} style={{ marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <EditableField
                        value={inst}
                        onChange={(val) => {
                          const copy = [...instructions];
                          copy[index] = val;
                          onFieldChange('instructions', copy);
                        }}
                        placeholder={`Instruction ${index + 1}`}
                        isEditable={isEditable}
                        style={{ flex: 1 }}
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = instructions.filter((_, i) => i !== index);
                            onFieldChange('instructions', copy);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--red)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            padding: '0 4px',
                            fontWeight: 'bold'
                          }}
                          title="Remove instruction"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => {
                    onFieldChange('instructions', [...instructions, "New instruction guideline text"]);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--green)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '4px 0',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  ➕ Add Instruction
                </button>
              )}
            </div>
          )}

          {/* 4. Questions Body Container */}
          <div 
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              zIndex: 1,
              textAlign: 'left'
            }}
          >
            {page.questions.map((q, qIdx) => (
              <div key={qIdx}>
                {/* Section Header Card banner */}
                {q.showSectionHeader && (
                  <div
                    className="preview-section-header"
                    style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      background: themeColors.soft,
                      color: themeColors.primary,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{q.showSectionHeader.name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                      {q.showSectionHeader.count} × {q.showSectionHeader.marks} = {q.showSectionHeader.count * q.showSectionHeader.marks} marks
                    </span>
                  </div>
                )}

                {/* Question Item Row */}
                <div
                  className="q-item-row"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#1c1c21',
                    lineHeight: '1.6',
                    position: 'relative',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', minWidth: '28px', textAlign: 'left' }}>
                    Q{q.globalIndex}.
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ textAlign: 'left' }}>{q.text}</div>
                    
                    {/* MCQ Options layout grid */}
                    {q.options && q.options.length > 0 && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '4px',
                          marginTop: '6px',
                          paddingLeft: '12px',
                          fontSize: '12px',
                          color: '#555'
                        }}
                      >
                        {q.options.map((opt, optIdx) => (
                          <span key={optIdx}>
                            ({"abcd"[optIdx]}) {opt}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta labels (hots/lots tags) shown only in non-print mode */}
                    {!isEditable && (
                      <div className="q-tags" style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span className={`q-tag ${q.hots ? 'hots' : 'lots'}`} style={{ fontSize: '9px', fontWeight: 'bold' }}>
                          {q.hots ? 'HOTS' : 'LOTS'} · {q.level}
                        </span>
                        <span className="q-tag chapter" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                          {q.chapter}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Question Marks Column */}
                  <div style={{ fontWeight: 'bold', minWidth: '32px', textAlign: 'right', color: '#1c1c21' }}>
                    [{q.marks}]
                  </div>

                  {/* Swap button (shown in Step 3 Preview mode only) */}
                  {!isEditable && onRedoQuestion && (
                    <button
                      type="button"
                      className="q-redo"
                      onClick={() => onRedoQuestion(q.globalIndex - 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--green)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0 4px',
                        marginLeft: '6px',
                        alignSelf: 'flex-start',
                        display: 'inline-block'
                      }}
                      title="Replace this question"
                    >
                      ↻
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 5. Footer Layout */}
          <TemplateFooter
            stamp={template.stamp}
            signature={template.signature}
            teacherSignature={template.teacherSignature}
            footerText={template.footerText}
            pageNum={page.pageNum}
            totalPages={pages.length}
            isLast={page.isLast}
            isEditable={isEditable}
            onFieldChange={onFieldChange}
          />
        </div>
      ))}
    </div>
  );
}
