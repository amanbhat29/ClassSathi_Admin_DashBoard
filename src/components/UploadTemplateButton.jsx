

/**
 * UploadTemplateButton Component
 * Outlined action button to open the template settings modal.
 * Designed to fit ClassSaathi dashboard design system.
 */
export default function UploadTemplateButton({ onClick }) {
  return (
    <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={onClick}
        style={{
          borderColor: 'var(--green)',
          color: 'var(--green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
          fontWeight: '700',
          borderRadius: '10px',
          padding: '10px 16px',
          fontSize: '13px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--green-soft)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--card)';
        }}
      >
        <span>📄</span> Paper Template
      </button>
    </div>
  );
}
