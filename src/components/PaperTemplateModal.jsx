import { useEffect } from 'react';
import { usePaperTemplate } from '../contexts/PaperTemplateContext';
import TemplateUploader from './TemplateUploader';
import WorkflowCard from './WorkflowCard';
import NextStepCard from './NextStepCard';

// Styles: Import base pdf.css first, then PaperTemplate.css to ensure overrides take priority
import '../styles/pdf.css';
import '../styles/PaperTemplate.css';

/**
 * PaperTemplateModal Component
 * Fullscreen overlay showcasing template upload, validation, and workflow state.
 */
export default function PaperTemplateModal({ isOpen, onClose }) {
  const { uploadedFile } = usePaperTemplate();

  // Block/unblock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const timelineSteps = [
    { title: "Upload Template", desc: "Drag & Drop or select your school's DOCX or PDF template" },
    { title: "Template Loaded", desc: "Successfully loaded template structure and styling data" },
    { title: "Template Ready", desc: "Validation passed. Template is ready for formatting injection" },
    { title: "Generate Paper", desc: "Configure questions and marks on the ClassSaathi dashboard" },
    { title: "Insert Questions", desc: "Questions will be inserted into the template replacing placeholders" },
    { title: "Preview", desc: "Review styling, margins, and page breaks prior to printing" },
    { title: "Download Paper", desc: "Export and print high fidelity layout documents" }
  ];

  // Calculate dynamic stepper timeline states: completed = green tick, active = green pulsing outline, pending = grey clock
  const getStepStatus = (index) => {
    if (!uploadedFile) {
      if (index === 0) return 'active';
      return 'pending';
    } else {
      if (index < 2) return 'completed';
      if (index === 2) return 'active';
      return 'pending';
    }
  };

  return (
    <div 
      className="pdf-modal-overlay" 
      style={{ zIndex: 3000, background: 'rgba(20, 20, 30, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="template-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="template-modal-header">
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ink)' }}>
              Upload Document Template
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Upload your school's Microsoft Word template (.docx) or PDF template (.pdf). The generated question paper will later be inserted into this template automatically.
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={onClose}
            style={{ fontSize: '15px', padding: '6px 12px', borderRadius: '8px' }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Two Column Layout */}
        <div className="template-modal-content">
          
          {/* Left Column: Scrollable Template Upload area, validations, and guides */}
          <div className="template-modal-left">
            <TemplateUploader />
          </div>

          {/* Right Column: Scrollable instructions and workflow timelines */}
          <div className="template-modal-right">
            
            {/* Show Next Step Callout if file is successfully uploaded */}
            {uploadedFile && <NextStepCard />}
            
            {/* Timeline Stepper */}
            <div className="timeline-card">
              <div className="timeline-title">Workflow Timeline</div>
              <div className="timeline-stepper">
                {timelineSteps.map((step, idx) => {
                  const status = getStepStatus(idx);
                  return (
                    <div key={idx} className={`timeline-step ${status}`}>
                      <div className="timeline-node">
                        {status === 'completed' ? '✓' : (status === 'active' ? idx + 1 : '🕒')}
                      </div>
                      <div className="timeline-step-content">
                        <div className="timeline-step-title">{step.title}</div>
                        <div className="timeline-step-desc">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How it works Info Card */}
            <WorkflowCard />

          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="template-modal-footer">
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={onClose}
            style={{ fontSize: '13px', padding: '8px 20px', fontWeight: '700' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
