import { useState } from 'react';

/**
 * BaseImageUploader Component
 * Reusable Drag & Drop image uploader component with size/type validation.
 */
export default function BaseImageUploader({ label, value, onChange, maxMb = 5 }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);

  const processFile = (file) => {
    if (!file) return;

    // Validate file size (max 5 MB)
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File size exceeds the maximum limit of ${maxMb} MB.`);
      return;
    }

    // Validate MIME types (PNG, JPG, JPEG, SVG)
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validMimes.includes(file.type)) {
      setError('Invalid file format. Only PNG, JPG, JPEG, and SVG are supported.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
  };

  const elementId = `file-${label.replace(/\s+/g, '')}`;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="field-label">{label}</div>
      
      {error && (
        <div style={{ color: 'var(--red)', fontSize: '11.5px', marginBottom: '8px', fontWeight: '600' }}>
          ⚠️ {error}
        </div>
      )}

      {value ? (
        <div style={{
          border: '1.5px solid var(--border)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--card)'
        }}>
          <img src={value} alt={`${label} Preview`} style={{
            maxWidth: '60px',
            maxHeight: '60px',
            objectFit: 'contain',
            borderRadius: '6px',
            background: '#f1f0f5',
            padding: '4px'
          }} />
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <label 
              className="btn btn-ghost" 
              style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', margin: 0 }}
            >
              Replace
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--red)', color: 'var(--red)', margin: 0 }} 
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`uploader-dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: '10px',
            padding: '20px 14px',
            textAlign: 'center',
            background: isDragOver ? 'var(--green-soft)' : 'var(--card)',
            cursor: 'pointer',
            transition: 'all 0.12s ease'
          }}
          onClick={() => document.getElementById(elementId).click()}
        >
          <input
            id={elementId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '22px', marginBottom: '4px' }}>📤</div>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ink-soft)' }}>
            Drag &amp; Drop or <span style={{ color: 'var(--green)' }}>Browse</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', marginTop: '2px' }}>
            PNG, JPG, JPEG, SVG up to {maxMb}MB
          </div>
        </div>
      )}
    </div>
  );
}
