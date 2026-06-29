import { useState, useEffect } from 'react';
import { calculateTotals } from '../utils/helpers';
import { useGeneratePDF } from '../hooks/useGeneratePDF';
import PDFPreviewModal from '../components/pdf/PDFPreviewModal';
import { useTemplate } from '../context/TemplateContext';

const SECTION_NAMES = {
  mcq: "Section A — Multiple Choice Questions",
  vsa: "Section B — Very Short Answer Questions",
  sa: "Section C — Short Answer Questions",
  la: "Section D — Long Answer Questions"
};

export default function Step3PreviewPrint({
  isLoading,
  examName,
  duration,
  subject,
  grade,
  selectedChapters = [],
  qtypes = [],
  questions = [],
  onBack,
  onRegenerateAll,
  onRedoQuestion
}) {
  const { totalMarks } = calculateTotals(qtypes);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { template } = useTemplate();

  const {
    pdfBlob,
    isGenerating,
    generate,
    download,
    clearBlob
  } = useGeneratePDF();

  // Clear PDF Blob when questions list changes to force regeneration of new content
  useEffect(() => {
    clearBlob();
  }, [questions, clearBlob]);

  const handlePrint = async () => {
    if (isGenerating) return;
    if (pdfBlob) {
      setIsPreviewOpen(true);
      return;
    }

    try {
      const docName = `${examName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Paper.pdf`;
      await generate('paperRoot', docName, { themeColor: template.themeColor });
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };


  // Group questions by type and keep track of global index
  const getQuestionsByType = (typeId) => {
    return questions
      .map((q, globalIndex) => ({ ...q, globalIndex }))
      .filter((q) => q.type === typeId);
  };

  if (isLoading) {
    return (
      <section id="step3">
        <div className="loading" id="loadingBox">
          <div className="loading-spin"></div>
          <div className="loading-text">Preparing your question paper…</div>
          <div className="loading-sub">Balancing chapters, difficulty and thinking skills</div>
        </div>
      </section>
    );
  }

  // Calculate global question numbers
  let globalQNum = 0;

  return (
    <section id="step3">
      <div id="previewBox">
        <div className="gen-note">
          <div>
            ✅ Paper ready. Don't like a question? Press <b>↻</b> beside it to swap it for another. The small tags under each question are visible to you only — they won't print.
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#1c3d80' }}>
            📄 <b>Programmatic PDF generation active:</b> Clicking "Print / Save as PDF" will directly export a clean, high-resolution A4 document with correct page margins and automatic page numbers.
          </div>
        </div>
        
        <div className="preview-bar">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Change structure
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onRegenerateAll}>
              ↻ Regenerate all
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handlePrint} 
              disabled={isGenerating}
            >
              {isGenerating ? '⌛ Generating PDF...' : '🖨️ Print / Save as PDF'}
            </button>
          </div>
        </div>

        {(() => {
          const watermarkSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" opacity="${template.watermarkOpacity}">
              <text x="50%" y="50%" fill="#cccccc" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(-45 90 90)">
                ${template.watermarkText}
              </text>
            </svg>
          `;
          const watermarkStyle = template.watermarkEnabled
            ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(watermarkSvg)}")` }
            : {};
          
          return (
            <div 
              className={`paper theme-${template.themeColor}`} 
              id="paperRoot" 
              style={{ position: 'relative', overflow: 'hidden', ...watermarkStyle }}
            >
              {template.headerTemplate ? (
                <div className="paper-custom-header" style={{ width: '100%', marginBottom: '14px' }}>
                  <img 
                    src={template.headerTemplate} 
                    alt="Custom Header" 
                    style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', display: 'block' }} 
                  />
                  <div className="paper-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, borderBottom: `2px solid var(--paper-theme, var(--green))`, paddingBottom: '8px' }}>
                    <span>Time allowed: {duration}</span>
                    <span>Maximum marks: {totalMarks}</span>
                  </div>
                </div>
              ) : (
                <div className="paper-head">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
                    {template.logo && (
                      <img 
                        src={template.logo} 
                        className="paper-logo" 
                        alt="Logo" 
                        style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                      />
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div className="paper-school">{template.schoolName || 'Delhi Public School, Dwarka'}</div>
                      {template.schoolAddress && (
                        <div style={{ fontSize: '11px', color: 'var(--ink-mute)', marginTop: '2px', fontWeight: '500' }}>
                          {template.schoolAddress}
                        </div>
                      )}
                      {(template.phone || template.email || template.website) && (
                        <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', fontWeight: '500' }}>
                          {template.phone && `Tel: ${template.phone}`} {template.email && `· Email: ${template.email}`} {template.website && `· Web: ${template.website}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="paper-exam" style={{ borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
                    {examName} · {subject} · Grade {grade} (Academic Year {template.academicYear})
                  </div>
                  <div className="paper-meta">
                    <span>Time allowed: {duration}</span>
                    <span>Maximum marks: {totalMarks}</span>
                  </div>
                </div>
              )}

              <div className="paper-instructions">
                <b>General instructions:</b> All questions are compulsory. Marks for each question are shown on the right. Write neatly and show your working where needed. Chapters covered: {selectedChapters.join(', ')}.
              </div>

              {qtypes.map((qt) => {
                const sectionQuestions = getQuestionsByType(qt.id);
                if (sectionQuestions.length === 0) return null;

                return (
                  <div key={qt.id} className="paper-section">
                    <div className="paper-section-title">
                      <span>{SECTION_NAMES[qt.id] || qt.name}</span>
                      <span>
                        {qt.count} × {qt.marks} = {qt.count * qt.marks} marks
                      </span>
                    </div>

                    {sectionQuestions.map((q) => {
                      globalQNum++;
                      return (
                        <div key={q.globalIndex} className="q-row">
                          <div className="q-num">Q{globalQNum}.</div>
                          <div className="q-text">
                            {q.text}
                            {q.options && (
                              <div className="q-opts">
                                {q.options.map((opt, optIdx) => (
                                  <span key={optIdx}>
                                    ({"abcd"[optIdx]}) {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="q-tags">
                              <span className={`q-tag ${q.hots ? 'hots' : 'lots'}`}>
                                {q.hots ? 'HOTS' : 'LOTS'} · {q.level}
                              </span>
                              <span className="q-tag chapter">{q.chapter}</span>
                            </div>
                          </div>
                          <div className="q-marks">[{q.marks}]</div>
                          <button
                            type="button"
                            className="q-redo"
                            title="Replace this question"
                            onClick={() => onRedoQuestion(q.globalIndex)}
                          >
                            ↻
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Signatures & Seal Seal */}
              {template.footerTemplate ? (
                <div className="paper-custom-footer" style={{ width: '100%', marginTop: '30px' }}>
                  <img 
                    src={template.footerTemplate} 
                    alt="Custom Footer" 
                    style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', display: 'block' }} 
                  />
                </div>
              ) : (
                <div className="paper-footer" style={{ marginTop: '40px', borderTop: '1.5px dashed var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', padding: '0 20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      {template.stamp && (
                        <img 
                          src={template.stamp} 
                          className="paper-seal" 
                          alt="Seal" 
                          style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} 
                        />
                      )}
                      <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', width: '120px', paddingTop: '4px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                        School Seal / Stamp
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      {template.signature && (
                        <img 
                          src={template.signature} 
                          className="paper-signature" 
                          alt="Signature" 
                          style={{ height: '36px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} 
                        />
                      )}
                      <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', width: '120px', paddingTop: '4px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                        Principal
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: 'var(--ink-mute)',
                    textAlign: template.footerAlignment || 'center',
                    fontWeight: '600',
                    marginTop: '8px'
                  }}>
                    {template.footerText || 'Confidential Examination Paper'}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        blob={pdfBlob}
        examName={examName}
        onClose={handleClosePreview}
        onDownload={() => download(`${examName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Paper.pdf`)}
      />
    </section>
  );
}
