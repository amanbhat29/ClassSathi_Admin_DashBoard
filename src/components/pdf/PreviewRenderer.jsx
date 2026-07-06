import { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import { usePaperTemplate } from '../../contexts/PaperTemplateContext';

/**
 * PreviewRenderer Component
 * Converts the generated DOCX binary string to HTML using Mammoth,
 * applies structural post-processing to avoid splitting questions/options,
 * and renders a high-fidelity preview with headers, logos, and footers.
 */
export default function PreviewRenderer({ docxBase64, examName, duration, subject, grade }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { template, uploadedFile, validationStatus } = usePaperTemplate();

  useEffect(() => {
    if (!docxBase64) return;

    setIsLoading(true);
    setError(null);

    try {
      // Decode Base64 string to ArrayBuffer
      const binaryString = atob(docxBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // Convert DOCX to HTML using Mammoth
      mammoth.convertToHtml({ arrayBuffer })
        .then((result) => {
          let rawHtml = result.value;
          
          // Post-process HTML to group questions and options and prevent orphans
          const cleanHtml = postProcessHtml(rawHtml);
          setHtmlContent(cleanHtml);
        })
        .catch((err) => {
          console.error("[PreviewRenderer] Mammoth conversion error:", err);
          setError("Failed to parse Word document content for preview.");
        })
        .finally(() => {
          setIsLoading(false);
        });

    } catch (err) {
      console.error("[PreviewRenderer] Base64 decode error:", err);
      setError("Failed to read generated document binary.");
      setIsLoading(false);
    }
  }, [docxBase64]);

  /**
   * Post-processes Mammoth HTML using a bulletproof DOM reconstruction technique.
   * Wraps question text and options into break-resistant containers,
   * adds classes to section headers to prevent splits, and formats options.
   */
  const postProcessHtml = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
    const container = doc.body.firstChild;
    if (!container) return htmlString;

    const children = Array.from(container.children);
    const newContainer = doc.createElement('div');
    newContainer.className = 'mammoth-processed-content';

    // 1. Identify option tables and style them (horizontal MCQ column alignment)
    const tables = container.getElementsByTagName('table');
    for (let t = 0; t < tables.length; t++) {
      const table = tables[t];
      const cells = table.getElementsByTagName('td');
      if (cells.length === 4) {
        const textA = cells[0].textContent.trim();
        const textB = cells[1].textContent.trim();
        if (textA.startsWith('(a)') && textB.startsWith('(b)')) {
          table.className = 'q-opts-table';
          table.setAttribute('border', '0');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.border = 'none';
          table.style.margin = '4px 0 12px 0';
          for (let c = 0; c < cells.length; c++) {
            cells[c].style.border = 'none';
            cells[c].style.padding = '4px 8px';
            cells[c].style.width = '25%';
            cells[c].style.verticalAlign = 'top';
            cells[c].style.fontSize = '13px';
          }
        }
      }
    }

    let i = 0;
    while (i < children.length) {
      const el = children[i];
      const text = el.textContent.trim();

      // Format section headers (e.g. Section A...)
      if (/^section\s+[a-d]/i.test(text) || text.toLowerCase().startsWith("section")) {
        el.className = "paper-section-title";
        el.style.breakAfter = "avoid";
        el.style.pageBreakAfter = "avoid";
        newContainer.appendChild(el);
        i++;
        continue;
      }

      // Locate question paragraphs (e.g. Q1., Q2.)
      const qMatch = text.match(/^Q\d+\./);
      if (qMatch) {
        const block = doc.createElement('div');
        block.className = 'q-row';
        block.style.breakInside = 'avoid';
        block.style.pageBreakInside = 'avoid';
        block.style.marginBottom = '12px';

        const qPara = el;
        qPara.className = 'q-text';

        // Align marks to the right in the HTML preview using floats
        const marksMatch = qPara.innerHTML.match(/\s*\[(\d+)\]$/);
        if (marksMatch) {
          qPara.innerHTML = qPara.innerHTML.replace(/\s*\[(\d+)\]$/, `<span class="preview-q-marks" style="float: right; font-weight: bold; margin-left: 8px;">[$1]</span>`);
        }

        block.appendChild(qPara);

        // Consume all subsequent elements that belong to this question (options table, etc.)
        let nextIndex = i + 1;
        while (nextIndex < children.length) {
          const nextEl = children[nextIndex];
          const nextText = nextEl.textContent.trim();

          // Stop if we hit the next question or section title
          if (/^Q\d+\./.test(nextText) || /^section/i.test(nextText)) {
            break;
          }

          block.appendChild(nextEl);
          nextIndex++;
        }

        newContainer.appendChild(block);
        i = nextIndex;
      } else {
        // Append normal text or tables directly to the container
        newContainer.appendChild(el);
        i++;
      }
    }

    return newContainer.innerHTML;
  };

  if (isLoading) {
    return (
      <div className="preview-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', gap: '12px' }}>
        <div className="uploader-spinner"></div>
        <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: '600' }}>Converting document for preview…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'var(--red)', padding: '24px', textAlign: 'center', fontWeight: '600', background: 'var(--red-soft)', borderRadius: '12px', border: '1px dashed #ffc9c9' }}>
        ⚠️ {error}
      </div>
    );
  }

  const isCustomTemplate = !!(uploadedFile && validationStatus?.ready && docxBase64);

  // If a custom template is loaded and verified, the template governs all layout elements.
  // We strictly output only the Mammoth converted document body.
  if (isCustomTemplate) {
    return (
      <div 
        className="paper custom-template-preview" 
        id="paperRoot" 
        style={{ 
          position: 'relative', 
          backgroundColor: '#ffffff', 
          color: '#000000',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          padding: '20mm 15mm',
          minHeight: '297mm', // A4 Page standard height
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="mammoth-content" 
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>
    );
  }

  // Fallback layout when template mode is not active
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" opacity="${template.watermarkOpacity}">
      <text x="50%" y="50%" fill="#cccccc" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(-45 90 90)">
        ${template.watermarkText}
      </text>
    </svg>
  `;
  const watermarkStyle = template.watermarkEnabled
    ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(watermarkSvg)}")` }
    : {};

  return (
    <div 
      className={`paper theme-${template.themeColor}`} 
      id="paperRoot" 
      style={{ position: 'relative', overflow: 'hidden', padding: '20mm 15mm', ...watermarkStyle }}
    >
      {/* 1. School Header Block */}
      {template.headerTemplate ? (
        <div className="paper-custom-header" style={{ width: '100%', marginBottom: '14px' }}>
          <img 
            src={template.headerTemplate} 
            alt="Custom Header" 
            style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', display: 'block' }} 
          />
          <div className="paper-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, borderBottom: `2px solid var(--paper-theme, var(--green))`, paddingBottom: '8px' }}>
            <span>Time allowed: {duration}</span>
            <span>Maximum marks: {payloadMaxMarks(htmlContent) || 50}</span>
          </div>
        </div>
      ) : (
        <div className="paper-head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
            {template.logo && (
              <img 
                src={template.logo} 
                className="paper-logo" 
                alt="Logo" 
                style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
              />
            )}
            <div style={{ textAlign: 'center' }}>
              <div className="paper-school">{template.schoolName || 'Delhi Public School, Dwarka'}</div>
              {template.schoolAddress && (
                <div style={{ fontSize: '11px', color: 'var(--ink-mute)', marginTop: '2px', fontWeight: '500' }}>
                  {template.schoolAddress}
                </div>
              )}
              {(template.phone || template.email || template.website) && (
                <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', fontWeight: '500' }}>
                  {template.phone && `Tel: ${template.phone}`} {template.email && `· Email: ${template.email}`} {template.website && `· Web: ${template.website}`}
                </div>
              )}
            </div>
          </div>
          <div className="paper-exam" style={{ borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
            {examName} · {subject} · Grade {grade} (Academic Year {template.academicYear})
          </div>
          <div className="paper-meta">
            <span>Time allowed: {duration}</span>
            <span>Maximum marks: {payloadMaxMarks(htmlContent) || 50}</span>
          </div>
        </div>
      )}

      {/* 2. Converted Document Body (Mammoth HTML output) */}
      <div 
        className="mammoth-content" 
        style={{ marginTop: '16px', fontSize: '13px', lineHeight: '1.6', color: 'var(--ink)' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />

      {/* 3. Signatures & Seals Block */}
      {template.footerTemplate ? (
        <div className="paper-custom-footer" style={{ width: '100%', marginTop: '30px' }}>
          <img 
            src={template.footerTemplate} 
            alt="Custom Footer" 
            style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', display: 'block' }} 
          />
        </div>
      ) : (
        <div className="paper-footer" style={{ marginTop: '40px', borderTop: '1.5px dashed var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', padding: '0 20px' }}>
            <div style={{ textAlign: 'center' }}>
              {template.stamp && (
                <img 
                  src={template.stamp} 
                  className="paper-seal" 
                  alt="Seal" 
                  style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} 
                />
              )}
              <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', width: '120px', paddingTop: '4px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                School Seal / Stamp
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              {template.signature && (
                <img 
                  src={template.signature} 
                  className="paper-signature" 
                  alt="Signature" 
                  style={{ height: '36px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} 
                />
              )}
              <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', width: '120px', paddingTop: '4px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                Principal
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            color: 'var(--ink-mute)',
            textAlign: template.footerAlignment || 'center',
            fontWeight: '600',
            marginTop: '8px'
          }}>
            {template.footerText || 'Confidential Examination Paper'}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility to count marks from compiled HTML if possible
function payloadMaxMarks(html) {
  if (!html) return null;
  const match = html.match(/(\d+)\s*marks\)/g);
  if (match) {
    let sum = 0;
    match.forEach(m => {
      const digitMatch = m.match(/\d+/);
      if (digitMatch) {
        sum += parseInt(digitMatch[0], 10);
      }
    });
  }
  return null;
}
