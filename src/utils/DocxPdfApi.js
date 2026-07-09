const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

function base64ToBlob(base64, mimeType) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function convertGeneratedDocxToPdf(generatedDocxBase64, examName, options = {}) {
  if (!generatedDocxBase64) {
    throw new Error('Generated DOCX is missing. Generate the paper before exporting PDF.');
  }

  const docxBlob = base64ToBlob(
    generatedDocxBase64,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  const formData = new FormData();
  formData.append('file', docxBlob, 'generated-paper.docx');
  formData.append('examName', examName || 'Exam Paper');

  const response = await fetch(`${API_BASE_URL}/api/convert/docx-to-pdf`, {
    method: 'POST',
    body: formData,
    signal: options.signal
  });

  if (!response.ok) {
    let message = 'PDF conversion failed. Please try again.';
    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
    } catch {
      // Keep the stable fallback message if the server did not return JSON.
    }
    throw new Error(message);
  }

  const pdfBlob = await response.blob();
  if (!pdfBlob.size) {
    throw new Error('PDF conversion returned an empty file.');
  }

  return pdfBlob;
}
