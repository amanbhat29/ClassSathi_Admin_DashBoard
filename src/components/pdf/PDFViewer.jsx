/**
 * PDFViewer Component
 * Renders the generated PDF using the browser's native PDF viewer.
 *
 * @param {string} fileUrl - The object URL of the PDF Blob.
 * @param {string} examName - The title of the examination document.
 * @param {Function} onDownload - Handler for the download action.
 * @param {Function} onClose - Handler to close the preview modal.
 */
export default function PDFViewer({ fileUrl, examName, onDownload, onClose }) {
  return (
    <div className="pdf-native-viewer">
      <div className="pdf-toolbar-container">
        <div className="pdf-toolbar-title">{examName || 'Generated Question Paper'}</div>
        <div className="pdf-toolbar-controls">
          <button type="button" className="pdf-btn pdf-btn-primary" onClick={onDownload}>
            Download PDF
          </button>
          <button type="button" className="pdf-btn pdf-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <iframe
        className="pdf-native-frame"
        src={fileUrl}
        title={examName || 'Generated PDF preview'}
      />
    </div>
  );
}
