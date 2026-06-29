import html2pdf from 'html2pdf.js';

/**
 * Generates a high-quality PDF of the specified element using html2pdf.js and jsPDF.
 * Adds professional centered page numbers at the bottom of each page.
 * Returns a Promise that resolves to a PDF Blob.
 *
 * @param {string} elementId - The DOM ID of the element to export.
 * @param {string} filename - The name of the generated PDF file.
 * @returns {Promise<Blob>} Resolves with the generated PDF Blob
 */
export function generatePDF(elementId, filename = 'exam-paper.pdf', options = {}) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[generatePDF] Element with ID "${elementId}" not found.`);
    return Promise.reject(new Error(`Element with ID "${elementId}" not found.`));
  }

  // Add the CSS helper class to body to toggle visibility and layout styles for PDF printing
  document.body.classList.add('is-generating-pdf');

  const opt = {
    margin: [15, 15, 15, 15], // Top, Left, Bottom, Right margin in mm
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2, // Higher scale for crisp text rendering
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
      avoid: ['.q-row', '.paper-section-title']
    }
  };

  return html2pdf()
    .from(element)
    .set(opt)
    .toPdf()
    .get('pdf')
    .then((pdf) => {
      const totalPages = pdf.internal.getNumberOfPages();
      const themeRgbMap = {
        green: [47, 158, 68],
        blue: [59, 118, 246],
        purple: [112, 72, 232],
        orange: [242, 163, 60],
        red: [224, 49, 49]
      };
      const themeColor = options.themeColor || 'green';
      const rgb = themeRgbMap[themeColor] || [139, 139, 147];

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(rgb[0], rgb[1], rgb[2]); // Dynamic theme color for page numbers
        pdf.setFont('helvetica', 'normal');

        const pageText = `Page ${i} of ${totalPages}`;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Place the page number in the center of the bottom margin (10mm from bottom edge)
        pdf.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    })
    .output('blob') // Compile and output as binary Blob
    .then((blob) => {
      console.log(`[generatePDF] Blob successfully created: size=${blob.size} bytes`);
      return blob;
    })
    .catch((err) => {
      console.error('[generatePDF] Error during PDF generation:', err);
      throw err;
    })
    .finally(() => {
      // Clean up body styling class
      document.body.classList.remove('is-generating-pdf');
    });
}

/**
 * Downloads a generated PDF Blob.
 *
 * @param {Blob} blob - The generated PDF Blob.
 * @param {string} filename - The name of the file to save.
 */
export function downloadPDF(blob, filename = 'exam-paper.pdf') {
  if (!blob) {
    console.error('[downloadPDF] Blob is null or undefined.');
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revoke Object URL to release memory after download triggers
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Prints a generated PDF Blob inside a hidden iframe to prevent printing the page.
 *
 * @param {Blob} blob - The generated PDF Blob.
 */
export function printPDF(blob) {
  if (!blob) {
    console.error('[printPDF] Blob is null or undefined.');
    return;
  }
  const url = URL.createObjectURL(blob);

  // Check if browser is Safari (Safari blocks scripting inside PDF iframe window objects)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      alert('Please allow popups to print this document.');
    }
    return;
  }

  // Create a temporarily rendered iframe off-screen
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = 'none';
  iframe.src = url;
  
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    // Wait 500ms to ensure the PDF content is parsed and rendered by browser PDF viewer
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('[printPDF] Failed to trigger iframe printing, falling back to new window:', err);
        // Fallback: Open in new tab if iframe printing is blocked by security settings
        const newWindow = window.open(url, '_blank');
        if (newWindow) newWindow.focus();
      }
      
      // Cleanup after print dialog opens
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 2000);
    }, 500);
  };
}
