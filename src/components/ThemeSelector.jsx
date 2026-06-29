

/**
 * ThemeSelector Component
 * Renders color buttons to set the theme of headings, borders, and page elements.
 */
export default function ThemeSelector({ activeTheme, onChange }) {
  const THEMES = [
    { name: 'green', color: '#2f9e44', label: '🟢 Green' },
    { name: 'blue', color: '#3b76f6', label: '🔵 Blue' },
    { name: 'purple', color: '#7048e8', label: '🟣 Purple' },
    { name: 'orange', color: '#f2a33c', label: '🟠 Orange' },
    { name: 'red', color: '#e03131', label: '🔴 Red' }
  ];

  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="field-label" style={{ marginTop: 0 }}>Theme Color</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {THEMES.map((t) => {
          const isSelected = activeTheme === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => onChange(t.name)}
              style={{
                border: isSelected ? `2.5px solid ${t.color}` : '1.5px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 4px',
                background: isSelected ? `${t.color}15` : 'var(--card)',
                color: isSelected ? t.color : 'var(--ink-soft)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.12s ease',
                fontWeight: isSelected ? '800' : '600',
                fontSize: '11px'
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {t.name === 'green' && '🟢'}
                {t.name === 'blue' && '🔵'}
                {t.name === 'purple' && '🟣'}
                {t.name === 'orange' && '🟠'}
                {t.name === 'red' && '🔴'}
              </span>
              <span style={{ textTransform: 'capitalize' }}>{t.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
