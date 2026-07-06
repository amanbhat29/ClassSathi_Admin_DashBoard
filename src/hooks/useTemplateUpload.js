import { useState, useCallback } from 'react';
import { usePaperTemplate } from '../contexts/PaperTemplateContext';
import { validateTemplate, TemplateValidator } from '../utils/templateValidator';

/**
 * useTemplateUpload Hook
 * Standardizes dragging, dropping, reading, and validating uploaded templates.
 * Supports both DOCX and PDF formats asynchronously.
 */
export function useTemplateUpload() {
  const { uploadTemplate, removeTemplate, uploadedFile, isUploading } = usePaperTemplate();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file) => {
    setError(null);
    const validation = validateTemplate(file);
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }

    // Size limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds the 5 MB limit. Please upload a compressed template.");
      return false;
    }

    // Format file size
    const sizeInBytes = file.size;
    let sizeString = '';
    if (sizeInBytes < 1024 * 1024) {
      sizeString = `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      sizeString = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    const now = new Date();
    const uploadTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                       ' on ' + 
                       now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        
        // 1. Convert ArrayBuffer to Base64
        let binaryString = "";
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        const chunkSize = 65536;
        for (let i = 0; i < len; i += chunkSize) {
          const subArray = bytes.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, subArray);
        }
        const base64 = btoa(binaryString);

        // 2. Validate template and compile report asynchronously
        const report = await TemplateValidator.validate(arrayBuffer, file.name, file.size);

        if (report.errors.length > 0) {
          setError(`Validation Error: ${report.errors[0]}`);
        } else if (report.warnings.length > 0) {
          console.warn("[useTemplateUpload] Template contains warnings:", report.warnings);
        }

        // Determine page count
        let pages = 0;
        if (report.type === 'pdf') {
          pages = report.pages || 1;
        } else if (report.type === 'docx') {
          pages = 1; // Fallback default page count for DOCX preview
        }

        // 3. Save metadata, base64 and report status in context
        uploadTemplate({
          name: file.name,
          type: report.type,
          size: sizeString,
          pages: pages,
          uploadTime: uploadTime
        }, base64, report);

      } catch (err) {
        console.error("[useTemplateUpload] Failed to process template file:", err);
        setError(err.message || "Corrupted file structure: Failed to parse uploaded template.");
      }
    };

    reader.onerror = (err) => {
      console.error("[useTemplateUpload] FileReader error:", err);
      setError("Failed to read file contents.");
    };

    reader.readAsArrayBuffer(file);
    return true;
  }, [uploadTemplate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
      e.target.value = '';
    }
  }, [processFile]);

  const handleRemove = useCallback(() => {
    setError(null);
    removeTemplate();
  }, [removeTemplate]);

  // Download original template helper
  const handleDownloadOriginal = useCallback(() => {
    const binaryKey = localStorage.getItem('cs_paper_template_binary');
    const metadataKey = localStorage.getItem('cs_paper_template_docx');
    if (!binaryKey || !metadataKey) return;
    
    const meta = JSON.parse(metadataKey);
    const binaryString = atob(binaryKey);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const mimeType = meta.name.endsWith('.pdf') ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = meta.name || (meta.name.endsWith('.pdf') ? 'template.pdf' : 'template.docx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, []);

  return {
    isDragging,
    isUploading,
    error,
    setError,
    uploadedFile,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleRemove,
    handleDownloadOriginal,
    processFile
  };
}

export default useTemplateUpload;
