/**
 * TemplateHeader.jsx
 *
 * Renders the top school header block (logo cell + school details).
 * Supports inline editing and direct logo file uploads when editable.
 */

import { useRef } from 'react';
import { processImage } from '../utils/imageProcessing';
import EditableField from './EditableField';

export default function TemplateHeader({ 
  logo,
  schoolName,
  schoolAddress,
  phone,
  email,
  website,
  onFieldChange,
  isEditable = true,
  themeColors
}) {
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl } = await processImage(file, 'logo');
      onFieldChange('logo', dataUrl);
    } catch (err) {
      alert(err.message || 'Failed to process logo image.');
    }
    e.target.value = ''; // Reset input
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation(); // Prevent file picker opening
    onFieldChange('logo', null);
  };

  return (
    <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse', marginBottom: '12px' }}>
      <tbody>
        <tr>
          {/* Logo Cell */}
          <td 
            style={{ 
              width: '100px', 
              border: 'none', 
              padding: '4px', 
              verticalAlign: 'middle', 
              textAlign: 'center',
              borderRight: `1px dashed ${themeColors.primary}40`,
              position: 'relative'
            }}
          >
            {logo ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={logo} 
                  alt="School Logo" 
                  style={{ maxHeight: '72px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto', imageRendering: 'crisp-edges' }} 
                />
                {isEditable && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'var(--red)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                    }}
                    title="Remove Logo"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              isEditable ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--ink-mute)',
                    border: '1.5px dashed var(--border)',
                    borderRadius: '6px',
                    padding: '12px 6px',
                    cursor: 'pointer',
                    background: '#fcfcfd',
                    transition: 'all 0.12s ease'
                  }}
                  title="Upload School Logo"
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  📸 Upload<br/>Logo
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#8a8b90' }}>[ School Logo ]</span>
              )
            )}
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
          </td>

          {/* School Details Cell */}
          <td style={{ border: 'none', padding: '4px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
            <div style={{ margin: '0 auto' }}>
              <EditableField
                value={schoolName}
                onChange={(val) => onFieldChange('schoolName', val)}
                placeholder="Enter School Name"
                isEditable={isEditable}
                style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#1c1c21',
                  textAlign: 'center',
                  display: 'block',
                  margin: '0 auto 2px',
                  width: '100%',
                  fontFamily: 'sans-serif'
                }}
              />
              <EditableField
                value={schoolAddress}
                onChange={(val) => onFieldChange('schoolAddress', val)}
                placeholder="Enter School Address"
                isEditable={isEditable}
                style={{
                  fontSize: '11.5px',
                  color: 'var(--ink-mute)',
                  textAlign: 'center',
                  display: 'block',
                  margin: '0 auto 2px',
                  width: '100%'
                }}
              />
              <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', display: 'block', textAlign: 'center', width: '100%' }}>
                <span>Tel: </span>
                <EditableField
                  value={phone}
                  onChange={(val) => onFieldChange('phone', val)}
                  placeholder="Phone"
                  isEditable={isEditable}
                  style={{ display: 'inline', margin: '0 2px' }}
                />
                <span> · Email: </span>
                <EditableField
                  value={email}
                  onChange={(val) => onFieldChange('email', val)}
                  placeholder="Email"
                  isEditable={isEditable}
                  style={{ display: 'inline', margin: '0 2px' }}
                />
                <span> · Website: </span>
                <EditableField
                  value={website}
                  onChange={(val) => onFieldChange('website', val)}
                  placeholder="Website"
                  isEditable={isEditable}
                  style={{ display: 'inline', margin: '0 2px' }}
                />
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
