import { usePaperTemplate } from '../contexts/PaperTemplateContext';

/**
 * ValidationCard Component
 * Displays the dynamic Template Compatibility Report for both DOCX and PDF templates.
 */
export default function ValidationCard() {
  const { validationStatus } = usePaperTemplate();

  if (!validationStatus) {
    return (
      <div className="validation-card">
        <div className="validation-title">Template Compatibility Report</div>
        <div style={{ fontSize: '13px', color: 'var(--ink-mute)', textAlign: 'center', padding: '12px' }}>
          No template uploaded.
        </div>
      </div>
    );
  }

  const report = validationStatus;
  const isPdf = report.type === 'pdf';

  // Build the list of checklist items dynamically based on XML/PDF checks
  const items = [];

  if (isPdf) {
    // 1. Valid PDF File
    items.push({
      id: "pdf",
      label: "Valid PDF Template Structure",
      status: report.isValidPdf ? "ok" : "error",
      subText: !report.isValidPdf ? "The file is not a valid PDF file." : null
    });

    // 2. Readable / Not Encrypted
    items.push({
      id: "encryption",
      label: "Readable and Decryptable",
      status: (report.readable && report.notEncrypted) ? "ok" : "error",
      subText: !report.notEncrypted ? "The PDF is password protected and cannot be modified." : (!report.readable ? "Failed to read text or structure from PDF." : null)
    });

    // 3. Placeholder Found
    if (report.placeholderFound) {
      items.push({
        id: "placeholder",
        label: "{{QUESTION_PAPER}} Placeholder Found",
        status: "ok"
      });
    } else {
      items.push({
        id: "placeholder",
        label: "Missing {{QUESTION_PAPER}} placeholder",
        status: "error",
        subText: "Add the exact text {{QUESTION_PAPER}} to direct where questions must be spliced."
      });
    }

    // 4. File Size
    items.push({
      id: "size",
      label: "Template File Size (Under 5 MB)",
      status: report.sizeOk ? "ok" : "error",
      subText: !report.sizeOk ? "PDF exceeds 5 MB. Please compress or optimize the file." : null
    });
  } else {
    // DOCX Mode (Preserves existing checks exactly)
    items.push({
      id: "docx",
      label: "Valid DOCX Template",
      status: report.isValidDocx ? "ok" : "error",
      subText: !report.isValidDocx ? "The file is not a valid zip container or has an invalid XML schema." : null
    });

    if (report.unsupportedTextBox) {
      items.push({
        id: "textbox",
        label: "Unsupported text box found",
        status: "warning",
        subText: "Floating text boxes may overlap generated question boundaries."
      });
    }

    if (report.placeholderCount === 1) {
      items.push({
        id: "placeholder",
        label: "{{QUESTION_PAPER}} Placeholder Found",
        status: "ok"
      });
    } else if (report.placeholderCount === 0) {
      items.push({
        id: "placeholder",
        label: "Missing {{QUESTION_PAPER}} placeholder",
        status: "error",
        subText: "Add the exact text {{QUESTION_PAPER}} to direct where questions must be spliced."
      });
    } else {
      items.push({
        id: "placeholder",
        label: `Multiple {{QUESTION_PAPER}} placeholders (${report.placeholderCount}) found`,
        status: "error",
        subText: "Word template contains duplicate insertion tags. Only one is allowed."
      });
    }
  }

  // Common: Template Ready Status
  items.push({
    id: "ready",
    label: report.ready ? "Template Ready" : "Template Not Ready",
    status: report.ready ? "ok" : "error",
    subText: !report.ready ? "Fix the validation errors above to enable paper generation." : null
  });

  return (
    <div className="validation-card" style={{ animation: 'scaleIn 0.3s ease-out' }}>
      <div className="validation-title" style={{ fontSize: '14.5px', fontWeight: '800', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
        Template Compatibility Report
      </div>
      <div className="validation-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="validation-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="validation-label-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                
                {/* Status Icons */}
                {item.status === "ok" && (
                  <span className="validation-icon-ok" style={{
                    color: '#2f9e44',
                    backgroundColor: '#e6fcf5',
                    border: '1px solid #c3fae8',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}>✓</span>
                )}
                
                {item.status === "warning" && (
                  <span className="validation-icon-warning" style={{
                    color: '#f08c00',
                    backgroundColor: '#fff9db',
                    border: '1px solid #ffe3e3',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}>⚠</span>
                )}

                {item.status === "error" && (
                  <span className="validation-icon-error" style={{
                    color: '#e03131',
                    backgroundColor: '#fff5f5',
                    border: '1px solid #ffc9c9',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '800'
                  }}>✗</span>
                )}

                {/* Item Label */}
                <span style={{ 
                  fontSize: '13px',
                  fontWeight: '600',
                  color: item.status === "error" ? 'var(--red)' : 'var(--ink)'
                }}>
                  {item.label}
                </span>
              </div>

              {/* Badges */}
              {item.status === "ok" && (
                <span className="validation-badge-ok">Passed</span>
              )}
              {item.status === "warning" && (
                <span className="validation-badge-pending" style={{ color: '#f08c00', backgroundColor: '#fff9db', borderColor: '#ffe0b2' }}>Warning</span>
              )}
              {item.status === "error" && (
                <span className="validation-badge-error" style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: 'var(--red)',
                  backgroundColor: 'var(--red-soft)',
                  border: '1px solid #ffc9c9',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>Failed</span>
              )}
            </div>
            
            {/* Help Text / Details */}
            {item.subText && (
              <div style={{
                fontSize: '11px',
                color: item.status === "error" ? 'var(--red)' : 'var(--ink-soft)',
                marginLeft: '30px',
                lineHeight: '1.4',
                fontWeight: '500'
              }}>
                {item.subText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
