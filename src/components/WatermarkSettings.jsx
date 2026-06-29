

/**
 * WatermarkSettings Component
 * Provides a watermark activation checkbox, standard text selectors, and an opacity slider.
 */
export default function WatermarkSettings({ enabled, text, opacity, onFieldChange }) {
  const PRESETS = ['DRAFT', 'SAMPLE', 'CONFIDENTIAL', 'PREVIEW'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
        <input
          type="checkbox"
          checked={enabled || false}
          onChange={(e) => onFieldChange('watermarkEnabled', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--green)' }}
        />
        Enable Watermark
      </label>

      {enabled && (
        <>
          <div>
            <div className="field-label" style={{ marginTop: 0 }}>Watermark Text</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${text === t ? 'selected' : ''}`}
                  onClick={() => onFieldChange('watermarkText', t)}
                  style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="field-label" style={{ marginTop: 0 }}>
              Opacity <span className="field-why">— {Math.round(opacity * 100)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={opacity || 0.1}
                onChange={(e) => onFieldChange('watermarkOpacity', Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--green)' }}
                aria-label="Watermark opacity slider"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
