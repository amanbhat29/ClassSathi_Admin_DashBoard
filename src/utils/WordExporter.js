/**
 * WordExporter Utility
 * Triggers native browser downloads for generated DOCX arrayBuffers.
 */
export const WordExporter = {
  download(arrayBuffer, filename = 'Generated_Question_Paper.docx') {
    if (!arrayBuffer) {
      console.warn("[WordExporter] Cannot download: ArrayBuffer is empty.");
      return;
    }
    
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke reference
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
};
