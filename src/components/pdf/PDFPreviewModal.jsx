import { useMemo, useEffect } from 'react';
import PDFViewer from './PDFViewer';
import '../../styles/pdf.css';

/**
 * PDFPreviewModal Component
 * Renders the modal overlay, container, and manages the PDF Object URL lifecycle.
 *
 * @param {boolean} isOpen - Determines modal visibility.
 * @param {Blob} blob - The generated PDF Blob.
 * @param {string} examName - The title of the exam.
 * @param {Function} onClose - Handler to close the preview modal.
 * @param {Function} onDownload - Handler to download the PDF.
 * @param {Function} onPrint - Handler to print the PDF.
 */
export default function PDFPreviewModal({ isOpen, blob, examName, onClose, onDownload }) {
  const fileUrl = useMemo(() => {
    if (isOpen && blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  }, [isOpen, blob]);

  useEffect(() => {
    if (fileUrl) {
      // Prevent scrolling on the main page while preview is open
      document.body.style.overflow = 'hidden';

      return () => {
        // Revoke Object URL to release memory when modal is closed or unmounted
        URL.revokeObjectURL(fileUrl);
        document.body.style.overflow = '';
      };
    }
  }, [fileUrl]);

  if (!isOpen) return null;

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div 
        className="pdf-modal-container" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        <div className="pdf-viewer-content">
          {fileUrl ? (
            <PDFViewer
              fileUrl={fileUrl}
              examName={examName}
              onDownload={onDownload}
              onClose={onClose}
            />
          ) : (
            <div className="pdf-viewer-loading">
              <div className="loading-spin"></div>
              <div>Rendering preview layout…</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
