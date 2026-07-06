import { useRef } from 'react';

/**
 * UploadArea Component
 * Large drag-and-drop zone that handles both docx and pdf files.
 */
export default function UploadArea({
  isDragging,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect
}) {
  const fileInputRef = useRef(null);

  const handleBrowseClick = (e) => {
    e.stopPropagation(); // Avoid triggering dropzone clicks
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
      role="button"
      tabIndex={0}
      aria-label="No template uploaded yet. Drag and drop template here, or click to browse files"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".docx,.pdf"
        style={{ display: 'none' }}
      />
      
      <div className="upload-icon" style={{ fontSize: '56px', marginBottom: '8px' }} aria-hidden="true">
        📄
      </div>
      
      <div>
        <div className="upload-title" style={{ fontSize: '17px', fontWeight: '800' }}>
          No template uploaded yet.
        </div>
        <div className="upload-subtitle" style={{ fontSize: '13px', marginTop: '6px', color: 'var(--ink-soft)', padding: '0 20px', lineHeight: '1.4' }}>
          Upload your school's Microsoft Word template (.docx) or PDF template (.pdf) to begin.
        </div>
      </div>
      
      <div className="upload-divider" style={{ width: '40%', margin: '12px auto' }}>or</div>
      
      <button 
        type="button" 
        className="upload-browse-btn"
        onClick={handleBrowseClick}
        style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px' }}
      >
        Browse Files
      </button>
      
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Supported Formats
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '6px' }}>
          <span className="upload-format-tag">.docx</span>
          <span className="upload-format-tag" style={{ backgroundColor: '#fff0f6', color: '#d6336c', borderColor: '#ffdeeb' }}>.pdf</span>
        </div>
      </div>
    </div>
  );
}
