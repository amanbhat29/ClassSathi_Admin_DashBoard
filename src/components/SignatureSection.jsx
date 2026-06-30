/**
 * SignatureSection.jsx
 *
 * Renders the Principal's Signature image inside the signature cell.
 */



export default function SignatureSection({ value }) {
  if (!value) {
    return (
      <div style={{ color: 'var(--ink-soft)' }}>
        <br/><br/>Principal's Signature
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <img 
        src={value} 
        className="signature-img" 
        alt="Principal Signature" 
        style={{
          maxHeight: '48px',
          maxWidth: '150px',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto 4px',
          imageRendering: 'crisp-edges'
        }} 
      />
      <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 'bold' }}>
        Principal's Signature
      </div>
    </div>
  );
}
