/**
 * TemplateInfoCard Component
 * Displays template file details: Name, Type, Pages, Size, Upload Time, Status.
 */
export default function TemplateInfoCard({ file }) {
  if (!file) return null;

  return (
    <div className="info-card">
      <div className="info-card-title">Template Information</div>
      <div className="info-card-grid">
        <span className="info-grid-label">Template Name</span>
        <span className="info-grid-value" title={file.name}>{file.name}</span>

        <span className="info-grid-label">File Type</span>
        <span className="info-grid-value">DOCX</span>

        <span className="info-grid-label">Pages</span>
        <span className="info-grid-value">{file.pages} {file.pages === 1 ? 'Page' : 'Pages'}</span>

        <span className="info-grid-label">File Size</span>
        <span className="info-grid-value">{file.size}</span>

        <span className="info-grid-label">Upload Date</span>
        <span className="info-grid-value">Uploaded Today</span>

        <span className="info-grid-label">Status</span>
        <span className="info-grid-value ready">Template Ready</span>
      </div>
    </div>
  );
}
