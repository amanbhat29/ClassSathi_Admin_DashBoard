import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import PDFToolbar from './PDFToolbar';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Import viewer styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

/**
 * PDFViewer Component
 * Renders the PDF Document using @react-pdf-viewer/core.
 * Customizes the defaultLayoutPlugin to render a unified enterprise toolbar.
 *
 * @param {string} fileUrl - The object URL of the PDF Blob.
 * @param {string} examName - The title of the examination document.
 * @param {Function} onPrint - Handler for the print action.
 * @param {Function} onDownload - Handler for the download action.
 * @param {Function} onClose - Handler to close the preview modal.
 */
export default function PDFViewer({ fileUrl, examName, onDownload, onClose }) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // Disable sidebar tabs (bookmarks, thumbnails, search)
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => (
          <PDFToolbar
            slots={slots}
            examName={examName}
            onDownload={onDownload}
            onClose={onClose}
          />
        )}
      </Toolbar>
    ),
  });

  return (
    <Worker workerUrl={pdfjsWorker}>
      <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
    </Worker>
  );
}
