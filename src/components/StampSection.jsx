/**
 * StampSection.jsx
 *
 * Renders the school stamp image inside the seal cell.
 */



export default function StampSection({ value }) {
  if (!value) {
    return (
      <div style={{ color: 'var(--ink-soft)' }}>
        <br/><br/>School Seal / Stamp
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <img 
        src={value} 
        className="stamp-img" 
        alt="School Seal" 
        style={{
          maxHeight: '70px',
          maxWidth: '70px',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto 4px',
          imageRendering: 'crisp-edges'
        }} 
      />
      <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 'bold' }}>
        School Seal / Stamp
      </div>
    </div>
  );
}
