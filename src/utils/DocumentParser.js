/**
 * DocumentParser Service
 * Detects the document type (docx or pdf) of a given file.
 */
export const DocumentParser = {
  detectType(file) {
    if (!file) return null;
    const name = file.name || '';
    const extension = name.split('.').pop().toLowerCase();
    
    if (extension === 'docx') {
      return 'docx';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    
    // Fallback: check mime type if extension matches
    if (file.type === 'application/pdf') {
      return 'pdf';
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'docx';
    }
    
    return null;
  }
};
export default DocumentParser;
