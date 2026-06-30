/**
 * ImagePreview.jsx
 *
 * Renders a simple image thumbnail preview with a replacement input trigger and a remove button.
 */



export default function ImagePreview({ label, value, onRemove, onFileSelect }) {
  if (!value) return null;

  return (
    <div style={{
      border: '1.5px solid var(--border)',
      borderRadius: '10px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--card)'
    }}>
      <img 
        src={value} 
        alt={`${label} Preview`} 
        style={{
          maxWidth: '60px',
          maxHeight: '60px',
          objectFit: 'contain',
          borderRadius: '6px',
          background: '#f1f0f5',
          padding: '4px'
        }} 
      />
      <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
        <label 
          className="btn btn-ghost" 
          style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', margin: 0 }}
        >
          Replace
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
            onChange={onFileSelect} 
            style={{ display: 'none' }} 
          />
        </label>
        <button 
          type="button" 
          className="btn btn-ghost" 
          style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--red)', color: 'var(--red)', margin: 0 }} 
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
