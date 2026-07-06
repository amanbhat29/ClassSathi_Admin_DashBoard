import html2pdf from 'html2pdf.js';

/**
 * PdfExporter Utility
 * Configures html2pdf.js for exporting preview pages to PDF.
 */
export const PdfExporter = {
  async export(elementId, filename = 'Generated_Question_Paper.pdf') {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found.`);
    }

    // Toggle printable view
    document.body.classList.add('is-generating-pdf');

    const opt = {
      margin: [0, 0, 0, 0], // Use zero margin so pre-styled preview sheets map exactly
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.q-row-wrapper', '.q-row', '.paper-section-title']
      }
    };

    try {
      const pdfBlob = await html2pdf()
        .from(element)
        .set(opt)
        .toPdf()
        .get('pdf')
        .output('blob');
        
      return pdfBlob;
    } finally {
      document.body.classList.remove('is-generating-pdf');
    }
  }
};
