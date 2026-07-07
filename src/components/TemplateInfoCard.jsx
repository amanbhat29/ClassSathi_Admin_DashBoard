import { usePaperTemplate } from '../contexts/PaperTemplateContext';

/**
 * TemplateInfoCard Component
 * Displays template file details: Name, Type, Pages, Size, Upload Time, Status.
 */
export default function TemplateInfoCard({ file }) {
  const { validationStatus } = usePaperTemplate();
  if (!file) return null;

  const isReady = validationStatus?.ready;

  return (
    <div className="info-card">
      <div className="info-card-title">Template Information</div>
      <div className="info-card-grid">
        <span className="info-grid-label">Template Name</span>
        <span className="info-grid-value" title={file.name}>{file.name}</span>

        <span className="info-grid-label">File Type</span>
        <span className="info-grid-value">{file.type?.toUpperCase()}</span>

        <span className="info-grid-label">Pages</span>
        <span className="info-grid-value">{file.pages} {file.pages === 1 ? 'Page' : 'Pages'}</span>

        <span className="info-grid-label">File Size</span>
        <span className="info-grid-value">{file.size}</span>

        <span className="info-grid-label">Upload Date</span>
        <span className="info-grid-value">{file.uploadTime}</span>

        <span className="info-grid-label">Status</span>
        <span 
          className={`info-grid-value ${isReady ? 'ready' : 'error'}`}
          style={{ 
            color: isReady ? '#2f9e44' : '#e03131', 
            fontWeight: '700' 
          }}
        >
          {isReady ? 'Template Ready' : 'Template Not Ready'}
        </span>
      </div>
    </div>
  );
}
