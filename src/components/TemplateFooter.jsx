/**
 * TemplateFooter.jsx
 *
 * Renders the bottom exam footer:
 *  - On the last page: renders a table with Teacher's Signature, School Stamp/Seal, and Principal Signature.
 *  - On every page: renders the confidential text and dynamic page numbers.
 * Supports inline editing of text and image uploader pickers when editable.
 */

import { useRef } from 'react';
import { processImage } from '../utils/imageProcessing';
import EditableField from './EditableField';

export default function TemplateFooter({
  stamp,
  signature,
  teacherSignature,
  footerText,
  pageNum,
  totalPages,
  isLast = false,
  isEditable = true,
  onFieldChange
}) {
  const stampInputRef = useRef(null);
  const sigInputRef = useRef(null);
  const teacherSigInputRef = useRef(null);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl } = await processImage(file, type);
      onFieldChange(type, dataUrl);
    } catch (err) {
      alert(err.message || `Failed to process ${type} image.`);
    }
    e.target.value = ''; // Reset input
  };

  const handleRemoveImage = (e, type) => {
    e.stopPropagation(); // Prevent file picker opening
    onFieldChange(type, null);
  };

  return (
    <div style={{ marginTop: 'auto', width: '100%', pt: '12px' }}>
      {/* 1. Signature & Seal Area (rendered only on the last page) */}
      {isLast && (
        <table 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            marginTop: '24px', 
            marginBottom: '16px',
            border: 'none'
          }}
        >
          <tbody>
            <tr>
              {/* Teacher Signature */}
              <td 
                style={{ 
                  border: '1px solid #d0cfd5', 
                  padding: '12px', 
                  width: '33.33%', 
                  textAlign: 'center', 
                  verticalAlign: 'bottom', 
                  fontWeight: 'bold',
                  fontSize: '12px',
                  height: '75px',
                  position: 'relative'
                }}
              >
                {teacherSignature ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px' }}>
                    <img 
                      src={teacherSignature} 
                      alt="Teacher Signature" 
                      style={{ maxHeight: '42px', maxWidth: '120px', objectFit: 'contain', display: 'block', margin: '0 auto', imageRendering: 'crisp-edges' }} 
                    />
                    {isEditable && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(e, 'teacherSignature')}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'var(--red)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                        }}
                        title="Remove Teacher Signature"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  isEditable ? (
                    <div 
                      onClick={() => teacherSigInputRef.current?.click()}
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--ink-mute)',
                        border: '1.5px dashed var(--border)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        background: '#fcfcfd',
                        display: 'inline-block',
                        marginBottom: '4px',
                        fontWeight: 'normal',
                        transition: 'all 0.12s ease'
                      }}
                      title="Upload Teacher Signature"
                    >
                      ✍️ Signature
                    </div>
                  ) : (
                    <div style={{ minHeight: '30px' }} />
                  )
                )}
                <input 
                  type="file"
                  ref={teacherSigInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={(e) => handleImageUpload(e, 'teacherSignature')}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'block' }}>Teacher's Signature</div>
              </td>

              {/* School Stamp Seal */}
              <td 
                style={{ 
                  border: '1px solid #d0cfd5', 
                  padding: '12px', 
                  width: '33.33%', 
                  textAlign: 'center', 
                  verticalAlign: 'bottom', 
                  fontWeight: 'bold',
                  fontSize: '12px',
                  height: '75px',
                  position: 'relative'
                }}
              >
                {stamp ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px' }}>
                    <img 
                      src={stamp} 
                      alt="School Seal" 
                      style={{ maxHeight: '60px', maxWidth: '60px', objectFit: 'contain', display: 'block', margin: '0 auto', imageRendering: 'crisp-edges' }} 
                    />
                    {isEditable && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(e, 'stamp')}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'var(--red)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                        }}
                        title="Remove Stamp"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  isEditable ? (
                    <div 
                      onClick={() => stampInputRef.current?.click()}
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--ink-mute)',
                        border: '1.5px dashed var(--border)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        background: '#fcfcfd',
                        display: 'inline-block',
                        marginBottom: '4px',
                        fontWeight: 'normal',
                        transition: 'all 0.12s ease'
                      }}
                      title="Upload Stamp/Seal"
                    >
                      📤 Seal
                    </div>
                  ) : (
                    <div style={{ minHeight: '30px' }} />
                  )
                )}
                <input 
                  type="file"
                  ref={stampInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={(e) => handleImageUpload(e, 'stamp')}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'block' }}>School Seal / Stamp</div>
              </td>

              {/* Principal Signature */}
              <td 
                style={{ 
                  border: '1px solid #d0cfd5', 
                  padding: '12px', 
                  width: '33.33%', 
                  textAlign: 'center', 
                  verticalAlign: 'bottom', 
                  fontWeight: 'bold',
                  fontSize: '12px',
                  height: '75px',
                  position: 'relative'
                }}
              >
                {signature ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px' }}>
                    <img 
                      src={signature} 
                      alt="Principal Signature" 
                      style={{ maxHeight: '42px', maxWidth: '120px', objectFit: 'contain', display: 'block', margin: '0 auto', imageRendering: 'crisp-edges' }} 
                    />
                    {isEditable && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(e, 'signature')}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'var(--red)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                        }}
                        title="Remove Signature"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  isEditable ? (
                    <div 
                      onClick={() => sigInputRef.current?.click()}
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--ink-mute)',
                        border: '1.5px dashed var(--border)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        background: '#fcfcfd',
                        display: 'inline-block',
                        marginBottom: '4px',
                        fontWeight: 'normal',
                        transition: 'all 0.12s ease'
                      }}
                      title="Upload Signature"
                    >
                      ✍️ Signature
                    </div>
                  ) : (
                    <div style={{ minHeight: '30px' }} />
                  )
                )}
                <input 
                  type="file"
                  ref={sigInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={(e) => handleImageUpload(e, 'signature')}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'block' }}>Principal's Signature</div>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* 2. Confidential Text and Centered Page Number */}
      <div 
        style={{ 
          borderTop: '1px dashed #d0cfd5', 
          paddingTop: '6px', 
          textAlign: 'center', 
          fontSize: '11px',
          color: '#555',
          fontFamily: 'sans-serif'
        }}
      >
        <EditableField
          value={footerText}
          onChange={(val) => onFieldChange('footerText', val)}
          placeholder="Confidential Examination Paper"
          isEditable={isEditable}
          style={{
            fontStyle: 'italic',
            textAlign: 'center',
            display: 'block',
            margin: '0 auto 2px',
            width: '100%',
            fontWeight: 'normal'
          }}
        />
        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--ink-mute)', marginTop: '2px' }}>
          Page {pageNum} of {totalPages}
        </div>
      </div>
    </div>
  );
}
