/**
 * ImageUploadCard.jsx
 *
 * Unified card component for image uploading. Supports drag-and-drop,
 * file validation (max 10MB), instant processing, and previews.
 */

import { useState } from 'react';
import { processImage } from '../utils/imageProcessing';
import ImagePreview from './ImagePreview';

export default function ImageUploadCard({ label, value, type, onChange, maxMb = 10 }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);

  const handleProcessFile = async (file) => {
    if (!file) return;

    // Validate size (max 10 MB per specs)
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File size exceeds the limit of ${maxMb} MB.`);
      return;
    }

    // Validate format
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setError('Invalid file format. Supported: PNG, JPG, JPEG, SVG, WEBP.');
      return;
    }

    try {
      setError(null);
      // Run through shared image optimization (cropping/compression/resizing)
      const { dataUrl } = await processImage(file, type);
      onChange(dataUrl);
    } catch (err) {
      console.error('[ImageUploadCard] Processing error:', err);
      setError(err.message || 'Failed to process image.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
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
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  const elementId = `file-card-${label.replace(/\s+/g, '')}`;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="field-label">{label}</div>
      
      {error && (
        <div style={{ color: 'var(--red)', fontSize: '11.5px', marginBottom: '8px', fontWeight: '600' }}>
          ⚠️ {error}
        </div>
      )}

      {value ? (
        <ImagePreview 
          label={label} 
          value={value} 
          onRemove={handleRemove} 
          onFileSelect={handleFileChange} 
        />
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
            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '22px', marginBottom: '4px' }}>📤</div>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ink-soft)' }}>
            Drag &amp; Drop or <span style={{ color: 'var(--green)' }}>Browse</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', marginTop: '2px' }}>
            PNG, JPG, JPEG, SVG, WEBP up to {maxMb}MB
          </div>
        </div>
      )}
    </div>
  );
}
