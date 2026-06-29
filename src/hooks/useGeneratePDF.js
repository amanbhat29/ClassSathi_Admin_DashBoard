import { useState, useCallback } from 'react';
import { generatePDF, downloadPDF, printPDF } from '../utils/generatePDF';

/**
 * Custom React hook to manage programmatic PDF generation, downloading, and printing.
 * Saves the compiled Blob in state to avoid unnecessary re-generations.
 *
 * @returns {Object} PDF state and action functions
 */
export function useGeneratePDF() {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (elementId, filename, options = {}) => {
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await generatePDF(elementId, filename, options);
      setPdfBlob(blob);
      return blob;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const download = useCallback((filename = 'exam-paper.pdf') => {
    if (!pdfBlob) {
      console.warn('[useGeneratePDF] Cannot download: PDF Blob has not been generated yet.');
      return;
    }
    downloadPDF(pdfBlob, filename);
  }, [pdfBlob]);

  const print = useCallback(() => {
    if (!pdfBlob) {
      console.warn('[useGeneratePDF] Cannot print: PDF Blob has not been generated yet.');
      return;
    }
    printPDF(pdfBlob);
  }, [pdfBlob]);

  const clearBlob = useCallback(() => {
    setPdfBlob(null);
    setError(null);
  }, []);

  return {
    pdfBlob,
    isGenerating,
    error,
    generate,
    download,
    print,
    clearBlob
  };
}
export default useGeneratePDF;
