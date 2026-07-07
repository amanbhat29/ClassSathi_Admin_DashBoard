import { useRef } from 'react';
import { usePaperTemplate } from '../contexts/PaperTemplateContext';

/**
 * UploadedFileCard Component
 * Displays the detailed metadata of the uploaded DOCX or PDF template
 * and provides primary template controls.
 */
export default function UploadedFileCard({
  file,
  onRemove,
  onFileSelect
}) {
  const fileInputRef = useRef(null);
  const { validationStatus } = usePaperTemplate();

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const isPdf = file.type === 'pdf' || file.name.endsWith('.pdf');
  const isReady = validationStatus?.ready;

  return (
    <div className="file-card">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".docx,.pdf"
        style={{ display: 'none' }}
      />
      
      <div className="file-card-header">
        <div className="file-card-icon" style={{ fontSize: '32px' }} aria-hidden="true">
          {isPdf ? '📕' : '📄'}
        </div>
        <div className="file-card-details">
          <div className="file-card-name" title={file.name} style={{ fontSize: '15.5px', fontWeight: '800' }}>
            {file.name}
          </div>
          <div className="file-card-meta" style={{ marginTop: '6px' }}>
            <span><b>Type:</b> {isPdf ? 'Portable Document Format (pdf)' : 'Microsoft Word (docx)'}</span>
            <span><b>Pages:</b> {file.pages} {file.pages === 1 ? 'Page' : 'Pages'}</span>
            <span><b>Size:</b> {file.size}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-mute)', marginTop: '4px' }}>
            Uploaded at {file.uploadTime}
          </div>
        </div>
      </div>

      <div className="file-card-status-container">
        <div 
          className={`file-status-badge ${isReady ? 'ready' : 'error'}`}
          style={{
            backgroundColor: isReady ? '#e6fcf5' : '#fff5f5',
            color: isReady ? '#2f9e44' : '#e03131',
            borderColor: isReady ? '#c3fae8' : '#ffc9c9'
          }}
        >
          <span style={{ fontSize: '12px' }}>{isReady ? '✓' : '✗'}</span>{' '}
          {isReady 
            ? (isPdf ? 'PDF Template Ready' : 'Word Template Ready') 
            : (isPdf ? 'PDF Template Invalid' : 'Word Template Invalid')
          }
        </div>
        <div style={{ fontSize: '11px', color: isReady ? 'var(--ink-soft)' : 'var(--red)', marginLeft: '4px', marginTop: '2px', fontWeight: '600' }}>
          {isReady ? 'Waiting for Question Paper Generation' : 'Fix compatibility issues to generate paper'}
        </div>
      </div>

      <div className="file-card-actions">
        <button
          type="button"
          className="file-btn file-btn-outline"
          onClick={handleReplaceClick}
          title="Choose a different document template"
        >
          Replace Template
        </button>
        <button
          type="button"
          className="file-btn file-btn-danger-outline"
          onClick={onRemove}
          title="Remove template file"
        >
          Remove Template
        </button>
      </div>
    </div>
  );
}
