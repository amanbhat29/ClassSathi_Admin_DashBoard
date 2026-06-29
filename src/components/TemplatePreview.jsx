

/**
 * TemplatePreview Component
 * Renders a miniature scaled preview of the customized exam paper.
 */
export default function TemplatePreview({ template }) {
  const themeMap = {
    green: { primary: '#2f9e44', soft: '#d8f5d3' },
    blue: { primary: '#3b76f6', soft: '#dce8fd' },
    purple: { primary: '#7048e8', soft: '#e9defa' },
    orange: { primary: '#f2a33c', soft: '#fdf3d1' },
    red: { primary: '#e03131', soft: '#fde3e0' }
  };

  const themeColors = themeMap[template.themeColor] || themeMap.green;

  // Construct watermark background
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" opacity="${template.watermarkOpacity}">
      <text x="50%" y="50%" fill="#999999" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(-45 60 60)">
        ${template.watermarkText}
      </text>
    </svg>
  `;
  const watermarkStyle = template.watermarkEnabled
    ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")` }
    : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="field-label" style={{ marginTop: 0 }}>Live Preview</div>
      <div 
        style={{
          flex: 1,
          border: '1.5px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          background: '#ffffff',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '400px',
          ...watermarkStyle
        }}
      >
        {/* Custom Header or Default Header */}
        {template.headerTemplate ? (
          <div style={{ width: '100%', marginBottom: '10px' }}>
            <img 
              src={template.headerTemplate} 
              alt="Custom Header" 
              style={{ width: '100%', maxHeight: '60px', objectFit: 'contain' }} 
            />
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            borderBottom: `2px solid ${themeColors.primary}`,
            paddingBottom: '8px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {template.logo && (
              <img 
                src={template.logo} 
                alt="Logo" 
                style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
              />
            )}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#1c1c21' }}>
                {template.schoolName || 'School Name'}
              </div>
              <div style={{ fontSize: '7.5px', color: 'var(--ink-mute)', marginTop: '2px' }}>
                {template.schoolAddress || 'Address details'}
              </div>
              <div style={{ fontSize: '7.5px', color: 'var(--ink-mute)' }}>
                {template.phone && `Tel: ${template.phone}`} {template.email && `· Email: ${template.email}`}
              </div>
            </div>
          </div>
        )}

        {/* Paper title card */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', color: themeColors.primary }}>
            HALF YEARLY EXAMINATION {template.academicYear}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: 'var(--ink-soft)', marginTop: '4px', fontWeight: '600' }}>
            <span>Time Allowed: 3 Hours</span>
            <span>Max Marks: 100</span>
          </div>
        </div>

        {/* Sample questions rendering */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.85, zIndex: 1 }}>
          <div style={{
            fontSize: '8px',
            fontWeight: '800',
            textTransform: 'uppercase',
            background: themeColors.soft,
            color: themeColors.primary,
            padding: '3px 6px',
            borderRadius: '4px'
          }}>
            Section A — MCQs
          </div>
          <div style={{ fontSize: '8px', color: 'var(--ink)' }}>
            <b>Q1.</b> What is the structural unit of the nervous system?
          </div>
          <div style={{ fontSize: '7.5px', color: 'var(--ink-soft)', display: 'grid', gridTemplateColumns: '1fr 1fr', paddingLeft: '8px', gap: '2px' }}>
            <span>(a) Neuron</span>
            <span>(b) Nephron</span>
            <span>(c) Axon</span>
            <span>(d) Dendrite</span>
          </div>
        </div>

        {/* Custom Footer or Default signatures */}
        {template.footerTemplate ? (
          <div style={{ width: '100%', marginTop: '10px' }}>
            <img 
              src={template.footerTemplate} 
              alt="Custom Footer" 
              style={{ width: '100%', maxHeight: '40px', objectFit: 'contain' }} 
            />
          </div>
        ) : (
          <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--border)', paddingTop: '8px', zIndex: 1 }}>
            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                {template.stamp && (
                  <img 
                    src={template.stamp} 
                    alt="Seal" 
                    style={{ width: '32px', height: '32px', objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} 
                  />
                )}
                <div style={{ fontSize: '6px', borderTop: '0.5px solid var(--border)', width: '60px', paddingTop: '2px', color: 'var(--ink-mute)' }}>
                  School Seal
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                {template.signature && (
                  <img 
                    src={template.signature} 
                    alt="Sig" 
                    style={{ height: '18px', objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} 
                  />
                )}
                <div style={{ fontSize: '6px', borderTop: '0.5px solid var(--border)', width: '60px', paddingTop: '2px', color: 'var(--ink-mute)' }}>
                  Principal
                </div>
              </div>
            </div>

            {/* Custom footer alignment */}
            <div style={{
              fontSize: '7px',
              color: 'var(--ink-mute)',
              textAlign: template.footerAlignment || 'center',
              fontWeight: '500'
            }}>
              {template.footerText || 'Confidential Examination Paper'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
