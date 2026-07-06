/**
 * TemplateStorage Utility
 * Manages localStorage synchronization for templates, validations, and previews.
 */
export const TemplateStorage = {
  getMetadata() {
    try {
      const stored = localStorage.getItem('cs_paper_template_docx');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("[TemplateStorage] Error reading metadata:", e);
      return null;
    }
  },

  setMetadata(data) {
    try {
      localStorage.setItem('cs_paper_template_docx', JSON.stringify(data));
    } catch (e) {
      console.error("[TemplateStorage] Error saving metadata:", e);
    }
  },

  getBinary() {
    try {
      return localStorage.getItem('cs_paper_template_binary') || null;
    } catch (e) {
      console.error("[TemplateStorage] Error reading template binary:", e);
      return null;
    }
  },

  setBinary(base64) {
    try {
      localStorage.setItem('cs_paper_template_binary', base64);
    } catch (e) {
      console.error("[TemplateStorage] Error saving template binary:", e);
    }
  },

  getValidation() {
    try {
      const stored = localStorage.getItem('cs_paper_template_validation');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("[TemplateStorage] Error reading validation:", e);
      return null;
    }
  },

  setValidation(status) {
    try {
      localStorage.setItem('cs_paper_template_validation', JSON.stringify(status));
    } catch (e) {
      console.error("[TemplateStorage] Error saving validation:", e);
    }
  },

  getGeneratedDocx() {
    try {
      return localStorage.getItem('cs_paper_generated_docx') || null;
    } catch (e) {
      console.error("[TemplateStorage] Error reading generated DOCX:", e);
      return null;
    }
  },

  setGeneratedDocx(base64) {
    try {
      localStorage.setItem('cs_paper_generated_docx', base64);
    } catch (e) {
      console.error("[TemplateStorage] Error saving generated DOCX:", e);
    }
  },

  clearAll() {
    try {
      localStorage.removeItem('cs_paper_template_docx');
      localStorage.removeItem('cs_paper_template_binary');
      localStorage.removeItem('cs_paper_template_validation');
      localStorage.removeItem('cs_paper_generated_docx');
    } catch (e) {
      console.error("[TemplateStorage] Error clearing storage:", e);
    }
  }
};
