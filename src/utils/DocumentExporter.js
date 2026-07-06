/**
 * DocumentExporter Service
 * Standardizes downloads and file saving for generated documents.
 */
export const DocumentExporter = {
  /**
   * Downloads a generated Word Document (.docx).
   */
  downloadDocx(arrayBuffer, filename) {
    if (!arrayBuffer) {
      console.error("[DocumentExporter] Cannot download: DOCX arrayBuffer is empty.");
      return;
    }
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    this._saveFile(blob, filename || "Exam_Paper.docx");
  },

  /**
   * Downloads a generated PDF Document (.pdf).
   */
  downloadPdf(blobOrArrayBuffer, filename) {
    if (!blobOrArrayBuffer) {
      console.error("[DocumentExporter] Cannot download: PDF content is empty.");
      return;
    }
    const blob = blobOrArrayBuffer instanceof ArrayBuffer
      ? new Blob([blobOrArrayBuffer], { type: "application/pdf" })
      : blobOrArrayBuffer;

    this._saveFile(blob, filename || "Exam_Paper.pdf");
  },

  /**
   * Helper to trigger native browser save-file dialog.
   */
  _saveFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke object URL after download is triggered
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
};

export default DocumentExporter;
