/**
 * PlaceholderGuide Component
 * Information box explaining the template placeholder requirement
 * and rendering a realistic visual Word page mockup.
 */
export default function PlaceholderGuide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Title block */}
      <div className="info-box" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '4px solid var(--orange)', color: 'var(--ink-soft)' }}>
        <div className="info-box-title" style={{ color: 'var(--orange)', fontSize: '14.5px' }}>
          <span>💡</span> Placeholder Requirement
        </div>
        <div style={{ fontSize: '13px', marginTop: '6px' }}>
          Your uploaded template must contain the following placeholder where generated questions will be injected.
        </div>

        {/* Word Document Mockup */}
        <div className="word-page">
          <div className="word-page-header">DELHI PUBLIC SCHOOL</div>
          <div className="word-page-subheader">MID TERM EXAMINATION</div>
          
          <div className="word-page-section-title">SECTION A</div>
          <div className="word-page-placeholder-box">
            {"{{QUESTION_PAPER}}"}
          </div>
          
          <div className="word-page-footer">
            <span>Teacher Signature</span>
            <span>Principal Signature</span>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', marginTop: '12px', lineHeight: '1.45' }}>
          The generated question paper will replace this placeholder run while preserving all surrounding styles and formatting.
        </div>
      </div>

      {/* Phase 2 Note Box */}
      <div className="phase2-note-box" role="note">
        <span style={{ fontSize: '16px', lineHeight: 1 }} aria-hidden="true">ℹ️</span>
        <div>
          <div className="phase2-note-title">Phase 2</div>
          <div>
            The uploaded Word template will be parsed and the placeholder will automatically be replaced with generated questions while preserving all existing formatting, headers, footers, logos and branding.
          </div>
        </div>
      </div>

    </div>
  );
}
