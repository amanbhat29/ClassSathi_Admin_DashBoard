export function sanitizeFilename(input, fallback = 'Exam_Paper') {
  const value = String(input || fallback)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);

  return value || fallback;
}

export function pdfFilename(examName) {
  return `${sanitizeFilename(examName, 'Exam_Paper')}.pdf`;
}
