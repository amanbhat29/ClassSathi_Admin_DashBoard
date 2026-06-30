/**
 * HeaderLogo.jsx
 *
 * Renders the school logo image with standard layout classes or the default text placeholder.
 */



export default function HeaderLogo({ value }) {
  if (!value) {
    return <span style={{ color: '#8a8b90' }}>[ School Logo ]</span>;
  }

  return (
    <img 
      src={value} 
      className="logo-img" 
      alt="School Logo" 
      style={{
        maxHeight: '80px',
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        margin: '0 auto',
        imageRendering: 'crisp-edges'
      }} 
    />
  );
}
