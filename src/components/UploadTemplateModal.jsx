import { useState, useEffect } from 'react';
import { useTemplate } from '../context/TemplateContext';
import SchoolInfoForm from './SchoolInfoForm';
import '../styles/pdf.css';
import LogoUploader from './LogoUploader';
import StampUploader from './StampUploader';
import SignatureUploader from './SignatureUploader';
import HeaderUploader from './HeaderUploader';
import FooterUploader from './FooterUploader';
import WatermarkSettings from './WatermarkSettings';
import ThemeSelector from './ThemeSelector';
import TemplatePreview from './TemplatePreview';

/**
 * UploadTemplateModal Component
 * Fullscreen layout modal offering school info, custom styling, watermarks, stamps, and logos.
 */
export default function UploadTemplateModal({ isOpen, onClose }) {
  const { template, saveTemplate, resetTemplate, DEFAULT_TEMPLATE } = useTemplate();
  
  // Local state to allow modifications before clicking Save
  const [localTemplate, setLocalTemplate] = useState(template);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync state when modal is opened
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setLocalTemplate(template);
    }
  }

  // Manage body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setLocalTemplate((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    saveTemplate(localTemplate);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to restore default template settings?')) {
      resetTemplate();
      setLocalTemplate(DEFAULT_TEMPLATE);
    }
  };

  return (
    <div 
      className="pdf-modal-overlay" 
      style={{ zIndex: 3000, background: 'rgba(20, 20, 30, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="template-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="template-modal-header">
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--ink)' }}>
              📄 Paper Template Settings
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink-mute)', marginTop: '2px' }}>
              Customize headers, logos, signatures, stamp seals, watermarks, and print layouts
            </div>
          </div>
        </div>

        {/* Modal Content - Two Column Layout */}
        <div className="template-modal-content">
          {/* Left Column - Form controls (Scrollable) */}
          <div className="template-modal-left">
            {/* Theme selector */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-body">
                <ThemeSelector
                  activeTheme={localTemplate.themeColor}
                  onChange={(color) => handleFieldChange('themeColor', color)}
                />
              </div>
            </div>

            {/* School details */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-body">
                <div className="card-label">SCHOOL INFORMATION</div>
                <SchoolInfoForm 
                  values={localTemplate} 
                  onFieldChange={handleFieldChange} 
                />
              </div>
            </div>

            {/* Uploads - Logo / Seal / Signatures */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-body">
                <div className="card-label">LOGOS &amp; VERIFICATIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <LogoUploader
                    value={localTemplate.logo}
                    onChange={(val) => handleFieldChange('logo', val)}
                  />
                  <StampUploader
                    value={localTemplate.stamp}
                    onChange={(val) => handleFieldChange('stamp', val)}
                  />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <SignatureUploader
                    value={localTemplate.signature}
                    onChange={(val) => handleFieldChange('signature', val)}
                  />
                </div>
              </div>
            </div>

            {/* Custom Full Images (Header/Footer) */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-body">
                <div className="card-label">CUSTOM HEADER &amp; FOOTER IMAGES</div>
                <div className="card-hint" style={{ marginBottom: '14px' }}>
                  Upload full-width header/footer design sheets. These replace standard School Details/Signatures entirely if uploaded.
                </div>
                <HeaderUploader
                  value={localTemplate.headerTemplate}
                  onChange={(val) => handleFieldChange('headerTemplate', val)}
                />
                <FooterUploader
                  value={localTemplate.footerTemplate}
                  onChange={(val) => handleFieldChange('footerTemplate', val)}
                />
              </div>
            </div>

            {/* Watermark panel */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-body">
                <div className="card-label">SECURITY &amp; BRANDING WATERMARK</div>
                <WatermarkSettings
                  enabled={localTemplate.watermarkEnabled}
                  text={localTemplate.watermarkText}
                  opacity={localTemplate.watermarkOpacity}
                  onFieldChange={handleFieldChange}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="template-modal-right">
            <div className="template-preview-wrapper">
              <TemplatePreview template={localTemplate} />
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="template-modal-footer">
          <div>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={handleReset}
              style={{ fontSize: '12.5px', padding: '8px 16px' }}
            >
              Reset Defaults
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose}
              style={{ fontSize: '12.5px', padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-green" 
              onClick={handleSave}
              style={{ fontSize: '12.5px', padding: '8px 18px', background: 'var(--green)' }}
            >
              ✓ Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
