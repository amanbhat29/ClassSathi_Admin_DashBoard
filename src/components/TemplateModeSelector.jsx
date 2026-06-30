/**
 * TemplateModeSelector.jsx
 *
 * Pill-shaped radio toggle that lets the user switch between
 * "Form Template" and "Word Template" editing modes.
 *
 * Props
 * ─────
 *  activeMode : 'form' | 'word'
 *  onChange   : (mode: string) => void
 */



// ── Style helpers ───────────────────────────────────────────────────

const wrapperStyle = {
  display: 'inline-flex',
  gap: 4,
  padding: 4,
  background: '#f1f0f5',
  borderRadius: 10,
};

const buttonBase = {
  padding: '8px 20px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.15s ease',
};

const activeStyle = {
  ...buttonBase,
  background: 'white',
  color: 'var(--green)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const inactiveStyle = {
  ...buttonBase,
  background: 'transparent',
  color: 'var(--ink-mute)',
};

// ── Component ───────────────────────────────────────────────────────

const modes = [
  { key: 'form', label: '📝 Form Template' },
  { key: 'word', label: '📄 Word Template' },
];

export default function TemplateModeSelector({ activeMode, onChange }) {
  return (
    <div style={wrapperStyle}>
      {modes.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          style={activeMode === key ? activeStyle : inactiveStyle}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
