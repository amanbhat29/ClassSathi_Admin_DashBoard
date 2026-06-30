import { createContext, useContext, useState } from 'react';

const TemplateContext = createContext(null);

const DEFAULT_TEMPLATE = {
  schoolName: "Delhi Public School, Dwarka",
  schoolAddress: "Sector 3, Phase I, Dwarka, New Delhi",
  phone: "+91-11-25074472",
  email: "dpsdwarka@gmail.com",
  website: "www.dpsdwarka.com",
  academicYear: "2026–27",
  logo: null,
  stamp: null,
  signature: null,
  teacherSignature: null,
  headerTemplate: null,
  footerTemplate: null,
  footerText: "Confidential Examination Paper",
  footerAlignment: "center",
  watermarkEnabled: false,
  watermarkText: "CONFIDENTIAL",
  watermarkOpacity: 0.1,
  themeColor: "green",
  instructions: [
    "All questions are compulsory unless stated otherwise.",
    "The question paper consists of four sections — A, B, C and D.",
    "Internal choices have been provided in some questions. Attempt only one of the alternatives in such questions.",
    "Use of calculators is not permitted.",
    "Please write down the serial number of the question before attempting it."
  ],
  examName: "HALF YEARLY EXAMINATION",
  grade: "Grade 10",
  subject: "Science",
  duration: "3 Hours",
  totalMarks: "100"
};

export function TemplateProvider({ children }) {
  // Lazily initialize state from localStorage to avoid calling setState inside useEffect
  const [template, setTemplate] = useState(() => {
    try {
      const stored = localStorage.getItem('cs_paper_template');
      if (stored) {
        return { ...DEFAULT_TEMPLATE, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.error('[TemplateContext] Error loading template:', err);
    }
    return DEFAULT_TEMPLATE;
  });

  const [templateMode, setTemplateModeState] = useState(() => {
    try {
      return localStorage.getItem('cs_template_mode') || 'form';
    } catch {
      return 'form';
    }
  });

  const setTemplateMode = (mode) => {
    setTemplateModeState(mode);
    try {
      localStorage.setItem('cs_template_mode', mode);
    } catch (err) {
      console.error('[TemplateContext] Error saving template mode:', err);
    }
  };

  const updateTemplateField = (field, value) => {
    setTemplate((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveTemplate = (customTemplate = null) => {
    try {
      const toSave = customTemplate || template;
      localStorage.setItem('cs_paper_template', JSON.stringify(toSave));
      if (customTemplate) {
        setTemplate(customTemplate);
      }
    } catch (err) {
      console.error('[TemplateContext] Error saving template:', err);
    }
  };

  const resetTemplate = () => {
    try {
      localStorage.removeItem('cs_paper_template');
      setTemplate(DEFAULT_TEMPLATE);
    } catch (err) {
      console.error('[TemplateContext] Error resetting template:', err);
    }
  };

  return (
    <TemplateContext.Provider
      value={{
        template,
        templateMode,
        setTemplateMode,
        updateTemplateField,
        saveTemplate,
        resetTemplate,
        DEFAULT_TEMPLATE
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}
