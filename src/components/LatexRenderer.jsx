import { parseLatexToHtml } from '../utils/latex';

/**
 * LatexRenderer Component
 * Safely parses and renders strings containing mixed plain text and LaTeX math formulas (e.g. \( 10^4 \))
 * using KaTeX with correct math formatting and stylesheets.
 */
export default function LatexRenderer({ text = '', className = '', style = {} }) {
  const htmlContent = parseLatexToHtml(text);

  return (
    <span
      className={`latex-renderer-span ${className}`}
      style={{ display: 'inline', ...style }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
