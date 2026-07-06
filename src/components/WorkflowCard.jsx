import { usePaperTemplate } from '../contexts/PaperTemplateContext';

/**
 * WorkflowCard Component
 * Displays instructions about the template generation workflow,
 * dynamically highlighting the current active and completed steps.
 */
export default function WorkflowCard() {
  const { uploadedFile } = usePaperTemplate();

  const steps = [
    "Upload your school's Word Template",
    "Configure the Question Paper",
    "Click Generate Paper",
    "Questions will automatically be inserted into your uploaded template",
    "Preview",
    "Download PDF"
  ];

  return (
    <div className="how-it-works-card">
      <div className="how-it-works-title">How this works</div>
      
      {/* Current Step Banner with Green Accent */}
      {uploadedFile && (
        <div style={{
          backgroundColor: '#e6fcf5',
          border: '1px solid #c3fae8',
          color: '#0ca678',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: '700',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span style={{ fontSize: '14px', display: 'inline-flex' }}>🟢</span>
          <span>Current Step: Template Ready</span>
        </div>
      )}

      <ol className="how-it-works-list">
        {steps.map((text, idx) => {
          let isCompleted = false;
          let isActive = false;

          if (uploadedFile) {
            if (idx === 0) isCompleted = true;
            if (idx === 1) isActive = true;
          } else {
            if (idx === 0) isActive = true;
          }

          return (
            <li 
              key={idx} 
              className="how-it-works-item"
              style={{
                opacity: (isCompleted || isActive) ? 1 : 0.5,
                transition: 'opacity 0.25s ease'
              }}
            >
              <span 
                className="how-it-works-number"
                style={{
                  backgroundColor: isCompleted ? '#e6fcf5' : (isActive ? 'var(--blue-soft)' : 'var(--border)'),
                  color: isCompleted ? 'var(--green)' : (isActive ? 'var(--blue)' : 'var(--ink-mute)'),
                  border: isCompleted ? '1px solid #c3fae8' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {isCompleted ? '✓' : idx + 1}
              </span>
              <span style={{
                color: isCompleted ? 'var(--ink-soft)' : (isActive ? 'var(--ink)' : 'var(--ink-mute)'),
                fontWeight: isActive ? '700' : '500',
                transition: 'all 0.25s ease'
              }}>
                {text}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
