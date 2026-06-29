
/**
 * PDFToolbar Component
 * Renders the toolbar above the viewer inside the PDF preview container.
 * Combines native react-pdf-viewer slots with custom document actions.
 */
export default function PDFToolbar({ slots, examName, onDownload, onClose }) {
  const {
    CurrentPageLabel,
    GoToNextPage,
    GoToPreviousPage,
    NumberOfPages,
    ZoomIn,
    ZoomOut,
  } = slots;

  return (
    <div className="pdf-toolbar-container" style={{ width: '100%' }}>
      <div className="pdf-toolbar-title" title={examName}>
        {examName}
      </div>
      <div className="pdf-toolbar-controls">
        {/* Page navigation controls */}
        <div className="pdf-toolbar-nav-group">
          <GoToPreviousPage />
          <span className="pdf-toolbar-pages">
            Page <CurrentPageLabel /> of <NumberOfPages />
          </span>
          <GoToNextPage />
        </div>

        {/* Zoom controls */}
        <div className="pdf-toolbar-zoom-group">
          <ZoomOut />
          <ZoomIn />
        </div>

        {/* Action controls */}
        <button 
          type="button" 
          className="pdf-btn pdf-btn-primary" 
          onClick={onDownload}
          title="Download PDF"
        >
          📥 Download PDF
        </button>
        <button 
          type="button" 
          className="pdf-btn pdf-btn-danger" 
          onClick={onClose}
          title="Close PDF preview"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
