import { useTemplateUpload } from '../hooks/useTemplateUpload';
import UploadArea from './UploadArea';
import UploadedFileCard from './UploadedFileCard';
import TemplateInfoCard from './TemplateInfoCard';
import ValidationCard from './ValidationCard';
import PlaceholderGuide from './PlaceholderGuide';

/**
 * TemplateUploader Component
 * Orchestrates upload states (empty, uploading spinner, cards stack)
 * and feeds the validator utility state.
 */
export default function TemplateUploader() {
  const {
    isDragging,
    isUploading,
    error,
    uploadedFile,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleRemove,
    handleDownloadOriginal
  } = useTemplateUpload();

  if (isUploading) {
    return (
      <div className="uploader-loading-container" role="status" aria-live="polite">
        <div className="uploader-spinner"></div>
        <div>
          <div className="uploader-loading-title">Uploading Template...</div>
          <div className="uploader-loading-subtitle" style={{ marginTop: '4px' }}>
            Reading document layout and scanning for placeholders
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && (
        <div className="upload-error-box" role="alert">
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {uploadedFile ? (
        <>
          <UploadedFileCard
            file={uploadedFile}
            onRemove={handleRemove}
            onFileSelect={handleFileSelect}
            onDownloadOriginal={handleDownloadOriginal}
          />
          <TemplateInfoCard file={uploadedFile} />
          <ValidationCard />
          <PlaceholderGuide />
        </>
      ) : (
        <>
          <UploadArea
            isDragging={isDragging}
            handleDragEnter={handleDragEnter}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleFileSelect={handleFileSelect}
          />
          <PlaceholderGuide />
        </>
      )}
    </div>
  );
}
