import { createContext, useContext, useState } from 'react';
import { TemplateStorage } from '../utils/TemplateStorage';

const PaperTemplateContext = createContext(null);

// Fallback metadata to ensure the existing HTML-based Preview and PDF generator
// in Step 3 does not crash when no custom DOCX template is uploaded or processed.
const DEFAULT_PREVIEW_TEMPLATE = {
  schoolName: "Delhi Public School, Dwarka",
  schoolAddress: "Sector 3, Phase I, Dwarka, New Delhi",
  phone: "+91-11-25074472",
  email: "dpsdwarka@gmail.com",
  website: "www.dpsdwarka.com",
  academicYear: "2026–27",
  logo: null,
  stamp: null,
  signature: null,
  headerTemplate: null,
  footerTemplate: null,
  footerText: "Confidential Examination Paper",
  footerAlignment: "center",
  watermarkEnabled: false,
  watermarkText: "CONFIDENTIAL",
  watermarkOpacity: 0.1,
  themeColor: "green"
};

export function PaperTemplateProvider({ children }) {
  // Load initial state from TemplateStorage — wrapped in try/catch to survive corrupted data
  const [uploadedFile, setUploadedFile] = useState(() => {
    try { return TemplateStorage.getMetadata(); } catch (e) { console.error('[PaperTemplateContext] Failed to load metadata:', e); return null; }
  });
  const [templateBinary, setTemplateBinary] = useState(() => {
    try { return TemplateStorage.getBinary(); } catch (e) { console.error('[PaperTemplateContext] Failed to load binary:', e); return null; }
  });
  const [validationStatus, setValidationStatus] = useState(() => {
    try { return TemplateStorage.getValidation(); } catch (e) { console.error('[PaperTemplateContext] Failed to load validation:', e); return null; }
  });
  const [generatedPreview, setGeneratedPreview] = useState(() => {
    try { return TemplateStorage.getGeneratedDocx(); } catch (e) { console.error('[PaperTemplateContext] Failed to load preview:', e); return null; }
  });
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Action: Uploads and stores the template metadata, raw base64, and validation status report.
   */
  const uploadTemplate = (fileMetadata, base64Data, valStatus) => {
    setIsUploading(true);
    // Add visual delay for upload loader feedback
    setTimeout(() => {
      try {
        TemplateStorage.setMetadata(fileMetadata);
        TemplateStorage.setBinary(base64Data);
        TemplateStorage.setValidation(valStatus);

        setUploadedFile(fileMetadata);
        setTemplateBinary(base64Data);
        setValidationStatus(valStatus);
      } catch (err) {
        console.error('[PaperTemplateContext] Error saving uploaded template:', err);
      } finally {
        setIsUploading(false);
      }
    }, 800);
  };

  /**
   * Action: Removes the template and clears all stored items in state & localStorage.
   */
  const removeTemplate = () => {
    try {
      TemplateStorage.clearAll();

      setUploadedFile(null);
      setTemplateBinary(null);
      setValidationStatus(null);
      setGeneratedPreview(null);
    } catch (err) {
      console.error('[PaperTemplateContext] Error removing template:', err);
    }
  };

  /**
   * Action: Saves base64 of generated DOCX preview.
   */
  const saveGeneratedPreview = (base64Data) => {
    try {
      TemplateStorage.setGeneratedDocx(base64Data);
      setGeneratedPreview(base64Data);
    } catch (err) {
      console.error('[PaperTemplateContext] Error saving generated preview:', err);
    }
  };

  /**
   * Action: Clears the generated preview binary.
   */
  const clearGeneratedPreview = () => {
    try {
      localStorage.removeItem('cs_paper_generated_docx');
      setGeneratedPreview(null);
    } catch (err) {
      console.error('[PaperTemplateContext] Error clearing generated preview:', err);
    }
  };

  return (
    <PaperTemplateContext.Provider
      value={{
        // State
        uploadedFile,
        templateBinary,
        validationStatus,
        generatedPreview,
        isUploading,
        template: DEFAULT_PREVIEW_TEMPLATE, // For backwards compatibility with Step 3 HTML preview

        // Actions
        uploadTemplate,
        removeTemplate,
        saveGeneratedPreview,
        clearGeneratedPreview
      }}
    >
      {children}
    </PaperTemplateContext.Provider>
  );
}

export function usePaperTemplate() {
  const context = useContext(PaperTemplateContext);
  if (!context) {
    throw new Error('usePaperTemplate must be used within a PaperTemplateProvider');
  }
  return context;
}
