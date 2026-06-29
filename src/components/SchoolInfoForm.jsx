

/**
 * SchoolInfoForm Component
 * Inputs for School Name, Address, Contact details, Academic Year, and Custom Footer text/alignment.
 */
export default function SchoolInfoForm({ values, onFieldChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label className="field-label" style={{ marginTop: 0 }}>School Name</label>
        <input
          type="text"
          className="input"
          value={values.schoolName || ''}
          onChange={(e) => onFieldChange('schoolName', e.target.value)}
          placeholder="e.g. Delhi Public School"
        />
      </div>

      <div>
        <label className="field-label" style={{ marginTop: 0 }}>School Address</label>
        <input
          type="text"
          className="input"
          value={values.schoolAddress || ''}
          onChange={(e) => onFieldChange('schoolAddress', e.target.value)}
          placeholder="Address, Sector, City"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label className="field-label" style={{ marginTop: 0 }}>Phone Number</label>
          <input
            type="text"
            className="input"
            value={values.phone || ''}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            placeholder="+91-11-..."
          />
        </div>
        <div>
          <label className="field-label" style={{ marginTop: 0 }}>Email ID</label>
          <input
            type="email"
            className="input"
            value={values.email || ''}
            onChange={(e) => onFieldChange('email', e.target.value)}
            placeholder="school@mail.com"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label className="field-label" style={{ marginTop: 0 }}>Website URL</label>
          <input
            type="text"
            className="input"
            value={values.website || ''}
            onChange={(e) => onFieldChange('website', e.target.value)}
            placeholder="www.school.com"
          />
        </div>
        <div>
          <label className="field-label" style={{ marginTop: 0 }}>Academic Year</label>
          <input
            type="text"
            className="input"
            value={values.academicYear || ''}
            onChange={(e) => onFieldChange('academicYear', e.target.value)}
            placeholder="2026–27"
          />
        </div>
      </div>

      <div>
        <label className="field-label" style={{ marginTop: 0 }}>Footer Text</label>
        <input
          type="text"
          className="input"
          value={values.footerText || ''}
          onChange={(e) => onFieldChange('footerText', e.target.value)}
          placeholder="e.g. Confidential Examination Paper"
        />
      </div>

      <div>
        <label className="field-label" style={{ marginTop: 0 }}>Footer Alignment</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              type="button"
              className={`chip ${values.footerAlignment === align ? 'selected' : ''}`}
              onClick={() => onFieldChange('footerAlignment', align)}
              style={{ flex: 1, textTransform: 'capitalize', padding: '6px 12px', borderRadius: '8px' }}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
