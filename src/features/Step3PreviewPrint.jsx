import { useState, useEffect, useCallback } from 'react';
import { calculateTotals } from '../utils/helpers';
import { useGeneratePDF } from '../hooks/useGeneratePDF';
import PDFPreviewModal from '../components/pdf/PDFPreviewModal';
import { usePaperTemplate as useTemplate } from '../contexts/PaperTemplateContext';
import DocumentPreview from '../components/pdf/DocumentPreview';
import LayoutEngine from '../utils/LayoutEngine';
import LatexRenderer from '../components/LatexRenderer';

// Section display names keyed by question type ID
const SECTION_NAMES = {
  mcq: "Section A — Multiple Choice Questions",
  vsa: "Section B — Very Short Answer Questions",
  sa: "Section C — Short Answer Questions",
  la: "Section D — Long Answer Questions"
};

export default function Step3PreviewPrint({
  isLoading,
  examName,
  duration,
  subject,
  grade,
  selectedChapters = [],
  qtypes = [],
  questions = [],
  onBack,
  onRegenerateAll,
  onRedoQuestion
}) {
  const safeQtypes = Array.isArray(qtypes) ? qtypes : [];
  
  // Temporary test questions for verification
  const TEST_QUESTIONS = [
    {
      "_id": "696a1f25b06ccbc2d8b532d7",
      "answer": 1,
      "authorizedCreatorName": "Centum_Taghive",
      "chapterId": "6937b0b81fd08c1b5a43753d",
      "choices": [
          "\\(10^3\\,\\) \\(N\\,\\)",
          "\\(10^4\\,\\) \\(N\\,\\)",
          "\\(10^5\\,\\) \\(N\\,\\)",
          "\\(10^9\\,\\) \\(N\\,\\)"
      ],
      "choicesM": [
          "\\(10^3\\,\\) \\(N\\,\\)",
          "\\(10^4\\,\\) \\(N\\,\\)",
          "\\(10^5\\,\\) \\(N\\,\\)",
          "\\(10^9\\,\\) \\(N\\,\\)"
      ],
      "choiceImgs": ["", "", "", ""],
      "choiceDescription": [],
      "choiceDescriptionM": [],
      "questionDescription": "\\(Force\\,\\) \\(developed\\,\\) \\(F\\,\\) \\(=\\,\\) \\(Y\\,\\) \\(A\\,\\) \\(\\alpha\\,\\) \\((\\Delta\\theta)\\,\\) \\(=\\,\\) \\(10^{11}\\,\\) \\(\\times\\,\\) \\(10^{-4}\\,\\) \\(\\times\\,\\) \\(10^{-5}\\,\\) \\(\\times\\,\\) \\(100\\,\\) \\(=\\,\\) \\(10^4\\,\\) \\(N\\,\\)",
      "questionDescriptionM": "\\(Force\\,\\) \\(developed\\,\\) \\(F\\,\\) \\(=\\,\\) \\(Y\\,\\) \\(A\\,\\) \\(\\alpha\\,\\) \\((\\Delta\\theta)\\,\\) \\(=\\,\\) \\(10^{11}\\,\\) \\(\\times\\,\\) \\(10^{-4}\\,\\) \\(\\times\\,\\) \\(10^{-5}\\,\\) \\(\\times\\,\\) \\(100\\,\\) \\(=\\,\\) \\(10^4\\,\\) \\(N\\,\\)",
      "questionTxt": "\\(The\\,\\) \\(temperature\\,\\) \\(of\\,\\) \\(a\\,\\) \\(wire\\,\\) \\(of\\,\\) \\(length\\,\\) \\(1\\,\\) \\(metre\\,\\) \\(and\\,\\) \\(area\\,\\) \\(of\\,\\) \\(cross-section\\,\\) \\(1\\,\\) \\(cm^2\\,\\) \\(is\\,\\) \\(increased\\,\\) \\(from\\,\\) \\(0°C\\,\\) \\(to\\,\\) \\(100°C.\\,\\) \\(If\\,\\) \\(the\\,\\) \\(rod\\,\\) \\(is\\,\\) \\(not\\,\\) \\(allowed\\,\\) \\(to\\,\\) \\(increase\\,\\) \\(in\\,\\) \\(length,\\,\\) \\(the\\,\\) \\(force\\,\\) \\(required\\,\\) \\(will\\,\\) \\(be\\,\\) \\(\\alpha\\,\\) \\(=\\,\\) \\(10^{-5}\\,\\) \\(/\\,\\) \\(^\\circ\\,\\) \\(C\\,\\) \\(and\\,\\) \\(Y\\,\\) \\(=\\,\\) \\(10^{11}\\,\\) \\(N\\,\\) \\(/\\,\\) \\(m^2\\,\\) \\(the\\,\\) \\(force\\,\\) \\(required\\,\\) \\(will\\,\\) \\(be\\,\\)",
      "questionTxtM": "\\(The\\,\\) \\(temperature\\,\\) \\(of\\,\\) \\(a\\,\\) \\(wire\\,\\) \\(of\\,\\) \\(length\\,\\) \\(1\\,\\) \\(metre\\,\\) \\(and\\,\\) \\(area\\,\\) \\(of\\,\\) \\(cross-section\\,\\) \\(1\\,\\) \\(cm^2\\,\\) \\(is\\,\\) \\(increased\\,\\) \\(from\\,\\) \\(0°C\\,\\) \\(to\\,\\) \\(100°C.\\,\\) \\(If\\,\\) \\(the\\,\\) \\(rod\\,\\) \\(is\\,\\) \\(not\\,\\) \\(allowed\\,\\) \\(to\\,\\) \\(increase\\,\\) \\(in\\,\\) \\(length,\\,\\) \\(the\\,\\) \\(force\\,\\) \\(required\\,\\) \\(will\\,\\) \\(be\\,\\) \\(\\alpha\\,\\) \\(=\\,\\) \\(10^{-5}\\,\\) \\(/\\,\\) \\(^\\circ\\,\\) \\(C\\,\\) \\(and\\,\\) \\(Y\\,\\) \\(=\\,\\) \\(10^{11}\\,\\) \\(N\\,\\) \\(/\\,\\) \\(m^2\\,\\) \\(the\\,\\) \\(force\\,\\) \\(required\\,\\) \\(will\\,\\) \\(be\\,\\)",
      "txtImg": "",
      "difficulty": 0,
      "questionMediaType": -1,
      "explanationImg": "",
      "isDelete": false,
      "skills": [],
      "skillName": [],
      "createdAt": "2026-01-16T11:34:09.652Z",
      "updatedAt": "2026-06-03T09:28:58.106Z",
      "bloomsLevelList": [],
      "point": 1,
      "type": "mcq",
      "marks": 1,
      "chapter": "Thermal Properties"
    },
    {
      "_id": "696a1f25aa0d0a2163eb2365",
      "answer": 2,
      "authorizedCreatorName": "Centum_Taghive",
      "chapterId": "6937b0b81fd08c1b5a43753d",
      "choices": [
          "\\(l\\,\\)",
          "\\(l^{-1}\\,\\)",
          "\\(A\\,\\)",
          "\\(A^{-1}\\,\\)"
      ],
      "choicesM": [
          "\\(l\\,\\)",
          "\\(l^{-1}\\,\\)",
          "\\(A\\,\\)",
          "\\(A^{-1}\\,\\)"
      ],
      "choiceImgs": ["", "", "", ""],
      "choiceDescription": [],
      "choiceDescriptionM": [],
      "questionDescription": "\\(F\\,\\) \\(=\\,\\) \\(Y\\,\\) \\(A\\,\\) \\(\\alpha\\,\\) \\(\\Delta\\,\\) \\(\\theta\\,\\) \\(;\\,\\) \\(\\therefore\\,\\) \\(F\\,\\) \\(\\propto\\,\\) \\(A\\,\\)",
      "questionDescriptionM": "\\(F = Y A \\alpha \\Delta \\theta;\\, F \\propto A\\)",
      "questionTxt": "\\(A\\,\\) \\(rod\\,\\) \\(of\\,\\) \\(length\\,\\) \\(l\\,\\) \\(and\\,\\) \\(area\\,\\) \\(of\\,\\) \\(cross-section\\,\\) \\(A\\,\\) \\(is\\,\\) \\(heated\\,\\) \\(from\\,\\) \\(0°C\\,\\) \\(to\\,\\) \\(100°C.\\,\\) \\(The\\,\\) \\(rod\\,\\) \\(is\\,\\) \\(so\\,\\) \\(placed\\,\\) \\(that\\,\\) \\(it\\,\\) \\(is\\,\\) \\(not\\,\\) \\(allowed\\,\\) \\(to\\,\\) \\(increase\\,\\) \\(in\\,\\) \\(length,\\,\\) \\(then\\,\\) \\(the\\,\\) \\(force\\,\\) \\(developed\\,\\) \\(is\\,\\) \\(proportional\\,\\) \\(to\\,\\)",
      "questionTxtM": "\\(A\\,\\) \\(rod\\,\\) \\(of\\,\\) \\(length\\,\\) \\(l\\,\\) \\(and\\,\\) \\(area\\,\\) \\(of\\,\\) \\(cross-section\\,\\) \\(A\\,\\) \\(is\\,\\) \\(heated\\,\\) \\(from\\,\\) \\(0°C\\,\\) \\(to\\,\\) \\(100°C.\\,\\) \\(The\\,\\) \\(rod\\,\\) \\(is\\,\\) \\(so\\,\\) \\(placed\\,\\) \\(that\\,\\) \\(it\\,\\) \\(is\\,\\) \\(not\\,\\) \\(allowed\\,\\) \\(to\\,\\) \\(increase\\,\\) \\(in\\,\\) \\(length,\\,\\) \\(then\\,\\) \\(the\\,\\) \\(force\\,\\) \\(developed\\,\\) \\(is\\,\\) \\(proportional\\,\\) \\(to\\,\\)",
      "txtImg": "",
      "difficulty": 0,
      "questionMediaType": -1,
      "explanationImg": "",
      "isDelete": false,
      "skills": [],
      "skillName": [],
      "createdAt": "2026-01-16T11:34:09.652Z",
      "updatedAt": "2026-05-03T05:39:20.572Z",
      "bloomsLevelList": [],
      "point": 1,
      "type": "mcq",
      "marks": 1,
      "chapter": "Thermal Properties"
    },
    {
      "_id": "696a1f25719be0240dea267a",
      "answer": 3,
      "authorizedCreatorName": "Centum_Taghive",
      "chapterId": "6937b0b81fd08c1b5a43753d",
      "choices": [
          "\\(1\\,\\) \\(\\times\\,\\) \\(10^{-2}\\,\\) \\(m^2\\,\\)",
          "\\(1.4\\,\\) \\(\\times\\,\\) \\(10^{-3}\\,\\) \\(m^2\\,\\)",
          "\\(3.5\\,\\) \\(\\times\\,\\) \\(10^{-3}\\,\\) \\(m^2\\,\\)",
          "\\(7.1\\,\\) \\(\\times\\,\\) \\(10^{-4}\\,\\) \\(m^2\\,\\)"
      ],
      "choicesM": [
          "\\(1\\,\\) \\(\\times\\,\\) \\(10^{-2}\\,\\) \\(m^2\\,\\)",
          "\\(1.4\\,\\) \\(\\times\\,\\) \\(10^{-3}\\,\\) \\(m^2\\,\\)",
          "\\(3.5\\,\\) \\(\\times\\,\\) \\(10^{-3}\\,\\) \\(m^2\\,\\)",
          "\\(7.1\\,\\) \\(\\times\\,\\) \\(10^{-4}\\,\\) \\(m^2\\,\\)"
      ],
      "choiceImgs": ["", "", "", ""],
      "choiceDescription": [],
      "choiceDescriptionM": [],
      "questionDescription": "\\(\\frac{YF/A}{strain}\\,\\) \\(\\Rightarrow\\,\\) \\(A\\,\\) \\(=\\,\\) \\(\\frac{F}{Y\\timesstrain}\\,\\) \\(=\\,\\) \\(\\frac{10^4}{7\\times10^9\\times0.002}\\,\\) \\(=\\,\\) \\(\\frac{1}{14}\\,\\) \\(\\times\\,\\) \\(10^{-2}\\,\\) \\(=\\,\\) \\(7.1\\,\\) \\(\\times\\,\\) \\(10^{-4}\\,\\) \\(m^2\\,\\)",
      "questionDescriptionM": "\\(\\frac{YF}{A \\, strain} \\Rightarrow A = \\frac{F}{Y \\times strain} = \\frac{10^{4}}{7 \\times 10^{9} \\times 0.002} = \\frac{1}{14} \\times 10^{-2} = 7.1 \\times 10^{-4} \\, m^{2}\\)",
      "questionTxt": "\\(An\\,\\) \\(aluminum\\,\\) \\(rod\\,\\) \\((Young's\\,\\) \\(modulus\\,\\) \\(=7\\,\\) \\(\\times\\,\\) \\(10^9\\,\\) \\(\\;\\,\\) \\(N\\,\\) \\(/\\,\\) \\(m^2)\\,\\) \\(has\\,\\) \\(a\\,\\) \\(breaking\\,\\) \\(strain\\,\\) \\(of\\,\\) \\(0.2%.\\,\\) \\(The\\,\\) \\(minimum\\,\\) \\(cross-sectional\\,\\) \\(area\\,\\) \\(of\\,\\) \\(the\\,\\) \\(rod\\,\\) \\(in\\,\\) \\(order\\,\\) \\(to\\,\\) \\(support\\,\\) \\(a\\,\\) \\(load\\,\\) \\(of\\,\\) \\(10^4\\,\\) \\(Newton's\\,\\) \\(is\\,\\)",
      "questionTxtM": "\\(An\\,\\) \\(aluminum\\,\\) \\(rod\\,\\) \\((Young's\\,\\) \\(modulus\\,\\) \\(=7\\,\\) \\(\\times\\,\\) \\(10^9\\,\\) \\(\\;\\,\\) \\(N\\,\\) \\(/\\,\\) \\(m^2)\\,\\) \\(has\\,\\) \\(a\\,\\) \\(breaking\\,\\) \\(strain\\,\\) \\(of\\,\\) \\(0.2%.\\,\\) \\(The\\,\\) \\(minimum\\,\\) \\(cross-sectional\\,\\) \\(area\\,\\) \\(of\\,\\) \\(the\\,\\) \\(rod\\,\\) \\(in\\,\\) \\(order\\,\\) \\(to\\,\\) \\(support\\,\\) \\(a\\,\\) \\(load\\,\\) \\(of\\,\\) \\(10^4\\,\\) \\(Newton's\\,\\) \\(is\\,\\)",
      "txtImg": "",
      "difficulty": 0,
      "questionMediaType": -1,
      "explanationImg": "",
      "isDelete": false,
      "skills": [],
      "skillName": [],
      "createdAt": "2026-01-16T11:34:09.652Z",
      "updatedAt": "2026-05-03T05:39:20.574Z",
      "bloomsLevelList": [],
      "point": 1,
      "type": "mcq",
      "marks": 1,
      "chapter": "Thermal Properties"
    }
  ];

  const safeQuestions = [...TEST_QUESTIONS, ...(Array.isArray(questions) ? questions : [])];
  const { totalMarks } = calculateTotals(safeQtypes);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { 
    template, 
    uploadedFile, 
    validationStatus, 
    templateBinary, 
    generatedPreview, 
    saveGeneratedPreview 
  } = useTemplate();

  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState(null);
  const [localPdfBlob, setLocalPdfBlob] = useState(null);
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

  const {
    pdfBlob,
    isGenerating,
    generate,
    clearBlob
  } = useGeneratePDF();

  // Clear PDF Blob when questions list changes to force regeneration of new content
  const clearBlobs = useCallback(() => {
    clearBlob();
    setLocalPdfBlob(null);
  }, [clearBlob]);

  useEffect(() => {
    clearBlobs();
  }, [questions, clearBlobs]);

  // Reactive Template Document Compiler (runs docxtemplater or pdf-lib insertion)
  useEffect(() => {
    let isMounted = true;
    
    // Only compile if template is ready (exactly 1 placeholder and valid structure)
    if (uploadedFile && validationStatus?.ready && templateBinary && safeQuestions.length > 0) {
      setDocxLoading(true);
      setDocxError(null);

      const timer = setTimeout(() => {
        const payload = {
          schoolName: template.schoolName,
          schoolAddress: template.schoolAddress,
          phone: template.phone,
          email: template.email,
          website: template.website,
          academicYear: template.academicYear,
          footerText: template.footerText,
          examName,
          duration,
          subject,
          grade,
          maxMarks: totalMarks,
          selectedChapters
        };

        const isPdf = uploadedFile.type === 'pdf';

        if (isPdf) {
          // Dynamic import of QuestionInjector to compile PDF Template
          import('../utils/QuestionInjector').then(async ({ QuestionInjector }) => {
            try {
              // Decode base64 to Uint8Array
              const binaryString = atob(templateBinary);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const modifiedBytes = await QuestionInjector.injectQuestionsPdf(
                bytes,
                safeQuestions,
                qtypes,
                validationStatus.placeholderDetails
              );

              // Convert back to Base64
              let modifiedBinaryString = "";
              const modifiedLen = modifiedBytes.byteLength;
              const chunkSize = 65536;
              for (let i = 0; i < modifiedLen; i += chunkSize) {
                const subArray = modifiedBytes.subarray(i, i + chunkSize);
                modifiedBinaryString += String.fromCharCode.apply(null, subArray);
              }
              const modifiedBase64 = btoa(modifiedBinaryString);

              if (isMounted) {
                saveGeneratedPreview(modifiedBase64);
              }
            } catch (err) {
              console.error("[Step3] PDF Template injection failed:", err);
              if (isMounted) {
                setDocxError(err.message || "Failed to inject questions into PDF template.");
              }
            } finally {
              if (isMounted) {
                setDocxLoading(false);
              }
            }
          });
        } else {
          // Dynamically import DocumentEngine to parse and compile DOCX DOM safely
          import('../utils/engine/DocumentEngine').then(async ({ DocumentEngine }) => {
            try {
              // Decode base64 template to arrayBuffer
              const binaryString = atob(templateBinary);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const modifiedArrayBuffer = await DocumentEngine.generateDocx(
                bytes.buffer,
                safeQuestions,
                qtypes
              );

              // Convert back to Base64
              let modifiedBinaryString = "";
              const modifiedBytes = new Uint8Array(modifiedArrayBuffer);
              const modifiedLen = modifiedBytes.byteLength;
              
              const chunkSize = 65536;
              for (let i = 0; i < modifiedLen; i += chunkSize) {
                const subArray = modifiedBytes.subarray(i, i + chunkSize);
                modifiedBinaryString += String.fromCharCode.apply(null, subArray);
              }
              const modifiedBase64 = btoa(modifiedBinaryString);

              if (isMounted) {
                saveGeneratedPreview(modifiedBase64);
              }
            } catch (err) {
              console.error("[Step3] Word Document compilation failed:", err);
              if (isMounted) {
                setDocxError(err.message || "Failed to inject questions or compile template variables.");
              }
            } finally {
              if (isMounted) {
                setDocxLoading(false);
              }
            }
          });
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        isMounted = false;
      };
    }
  }, [
    uploadedFile, 
    validationStatus, 
    templateBinary, 
    questions, 
    qtypes, 
    examName, 
    duration, 
    subject, 
    grade, 
    totalMarks, 
    selectedChapters, 
    template, 
    saveGeneratedPreview
  ]);

  const handlePrint = async () => {
    if (isGenerating || isGeneratingLocal) return;

    try {
      const { DocumentRenderer } = await import('../utils/DocumentRenderer');
      
      const fallbackTrigger = async () => {
        const docName = `${examName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Paper.pdf`;
        
        if (localPdfBlob) {
          setIsPreviewOpen(true);
          return;
        }

        setIsGeneratingLocal(true);
        const { PdfExporter } = await import('../utils/PdfExporter');
        const blob = await PdfExporter.export('paperRoot', docName);
        setLocalPdfBlob(blob);
        setIsPreviewOpen(true);
        setIsGeneratingLocal(false);
      };

      await DocumentRenderer.exportPdf(
        uploadedFile?.type,
        generatedPreview,
        examName,
        fallbackTrigger
      );
    } catch (err) {
      console.error("[Step3] PDF Generation failed:", err);
      setIsGeneratingLocal(false);
    }
  };

  const handleDownloadDocx = () => {
    const isCustom = !!(uploadedFile && validationStatus?.ready);
    if (isCustom && !generatedPreview) return;
    try {
      const payload = {
        schoolName: template.schoolName,
        schoolAddress: template.schoolAddress,
        phone: template.phone,
        email: template.email,
        website: template.website,
        academicYear: template.academicYear,
        footerText: template.footerText,
        examName,
        duration,
        subject,
        grade,
        maxMarks: totalMarks,
        selectedChapters
      };
      
      import('../utils/DocumentRenderer').then(({ DocumentRenderer }) => {
        DocumentRenderer.exportDocx(
          uploadedFile?.type,
          generatedPreview,
          safeQuestions,
          qtypes,
          payload
        );
      });
    } catch (err) {
      console.error("[Step3] Failed to export DOCX:", err);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const isCustomTemplate = !!(uploadedFile && validationStatus?.ready && generatedPreview);
  const isPdf = uploadedFile?.type === 'pdf';

  if (isLoading || docxLoading) {
    return (
      <section id="step3">
        <div className="loading" id="loadingBox">
          <div className="loading-spin"></div>
          <div className="loading-text">
            {docxLoading 
              ? (isPdf ? "Applying PDF template & formatting layout…" : "Applying Word template & formatting layout…") 
              : "Preparing your question paper…"
            }
          </div>
          <div className="loading-sub">
            {docxLoading 
              ? (isPdf ? "Drawing vector fonts, positioning placeholders and flowing questions page-by-page" : "Injecting OpenXML elements, replacing placeholders and formatting page breaks") 
              : "Balancing chapters, difficulty and thinking skills"
            }
          </div>
        </div>
      </section>
    );
  }

  if (docxError) {
    return (
      <section id="step3">
        <div className="gen-note" style={{ backgroundColor: 'var(--red-soft)', borderColor: '#ffc9c9', color: 'var(--red)', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', borderRadius: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>
            ⚠️ {isPdf ? "PDF Template Generation Failed" : "Word Template Generation Failed"}
          </div>
          <div style={{ fontSize: '13px' }}>{docxError}</div>
          <button type="button" className="btn btn-ghost" onClick={onBack} style={{ width: 'fit-content', marginTop: '8px', color: 'var(--red)', borderColor: 'var(--red)' }}>
            ← Back to structure
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="step3">
      <div id="previewBox">
        <div className="gen-note">
          <div>
            {isCustomTemplate ? (
              isPdf ? (
                <span><span>✅ </span><b>PDF Template Applied:</b> The exam paper has been inserted into your uploaded PDF template. Swapping a question (<b>↻</b>) below will automatically update the template document.</span>
              ) : (
                <span><span>✅ </span><b>Word Template Applied:</b> The exam paper has been inserted into your uploaded template. Swapping a question (<b>↻</b>) below will automatically update the template document.</span>
              )
            ) : (
              <span>✅ Paper ready. Don't like a question? Press <b>↻</b> beside it to swap it for another. The small tags under each question are visible to you only — they won't print.</span>
            )}
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#1c3d80' }}>
            📄 <b>Programmatic export active:</b> Clicking the action button will directly download the final document preserving the visual layout and styles.
          </div>
        </div>
        
        <div className="preview-bar">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Change structure
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onRegenerateAll}>
              ↻ Swap all
            </button>
            
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={handleDownloadDocx}
              style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}
            >
              💾 Download DOCX
            </button>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handlePrint} 
              disabled={isGenerating || isGeneratingLocal}
            >
              {isGenerating || isGeneratingLocal ? '⌛ Generating PDF...' : '🖨️ Print / Save as PDF'}
            </button>
          </div>
        </div>

        {isCustomTemplate ? (
          <DocumentPreview 
            type={uploadedFile.type} 
            base64={generatedPreview} 
          />
        ) : (
          (() => {
            const watermarkSvg = `
              <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" opacity="${template.watermarkOpacity}">
                <text x="50%" y="50%" fill="#cccccc" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(-45 90 90)">
                  ${template.watermarkText}
                </text>
              </svg>
            `;
            const watermarkStyle = template.watermarkEnabled
              ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(watermarkSvg)}")` }
              : {};

            const payload = {
              schoolName: template.schoolName,
              schoolAddress: template.schoolAddress,
              phone: template.phone,
              email: template.email,
              website: template.website,
              academicYear: template.academicYear,
              footerText: template.footerText,
              examName,
              duration,
              subject,
              grade,
              maxMarks: totalMarks,
              selectedChapters
            };
            
            // Generate mathematically paginated pages using LayoutEngine
            const paginatedPages = LayoutEngine.paginate(safeQuestions, safeQtypes, payload);
            
            let globalQIndex = 0;

            return (
              <div 
                id="paperRoot" 
                className="docx-preview-container" 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '20px' 
                }}
              >
                {paginatedPages.map((pageItems, pageIdx) => {
                  const isFirstPage = pageIdx === 0;
                  const isLastPage = pageIdx === paginatedPages.length - 1;

                  return (
                    <div 
                      key={pageIdx} 
                      className={`paper theme-${template.themeColor} docx-rendered`} 
                      style={{ 
                        position: 'relative', 
                        overflow: 'hidden', 
                        ...watermarkStyle,
                        width: '816px',
                        height: '1154px',
                        boxSizing: 'border-box',
                        padding: '20mm 15mm',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid #ddd'
                      }}
                    >
                      {/* Page Content Area */}
                      <div style={{ flex: 1 }}>
                        {isFirstPage && (
                          template.headerTemplate ? (
                            <div className="paper-custom-header" style={{ width: '100%', marginBottom: '14px' }}>
                              <img 
                                src={template.headerTemplate} 
                                alt="Custom Header" 
                                style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', display: 'block' }} 
                              />
                              <div className="paper-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, borderBottom: `2px solid var(--paper-theme, var(--green))`, paddingBottom: '8px' }}>
                                <span>Time allowed: {duration}</span>
                                <span>Maximum marks: {totalMarks}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="paper-head">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
                                {template.logo && (
                                  <img 
                                    src={template.logo} 
                                    className="paper-logo" 
                                    alt="Logo" 
                                    style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                                  />
                                )}
                                <div style={{ textAlign: 'center' }}>
                                  <div className="paper-school">{template.schoolName || 'Delhi Public School, Dwarka'}</div>
                                  {template.schoolAddress && (
                                    <div style={{ fontSize: '11px', color: 'var(--ink-mute)', marginTop: '2px', fontWeight: '500' }}>
                                      {template.schoolAddress}
                                    </div>
                                  )}
                                  {(template.phone || template.email || template.website) && (
                                    <div style={{ fontSize: '10.5px', color: 'var(--ink-mute)', fontWeight: '500' }}>
                                      {template.phone && `Tel: ${template.phone}`} {template.email && `· Email: ${template.email}`} {template.website && `· Web: ${template.website}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="paper-exam" style={{ borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
                                {examName} · {subject} · Grade {grade} (Academic Year {template.academicYear})
                              </div>
                              <div className="paper-meta">
                                <span>Time allowed: {duration}</span>
                                <span>Maximum marks: {totalMarks}</span>
                              </div>
                            </div>
                          )
                        )}

                        {isFirstPage && (
                          <div className="paper-instructions">
                            <b>General instructions:</b> All questions are compulsory. Marks for each question are shown on the right. Write neatly and show your working where needed. Chapters covered: {selectedChapters.join(', ')}.
                          </div>
                        )}

                        {pageItems.map((item, idx) => {
                          if (item.type === 'section_header') {
                            return (
                              <div key={idx} className="paper-section-title" style={{ marginTop: '14px', breakAfter: 'avoid' }}>
                                <span>{item.title}</span>
                                <span>{item.marksLabel}</span>
                              </div>
                            );
                          } else {
                            globalQIndex++;
                            const q = item.q;
                            // Retrieve the actual original index of the question to redo correctly
                            const originalIdx = safeQuestions.findIndex(sq => sq.id === q.id || (sq.text === q.text && sq.chapter === q.chapter));
                            const finalRedoIndex = originalIdx !== -1 ? originalIdx : globalQIndex - 1;
                            const questionText = q.questionTxt || q.questionTxtM || q.text || '';
                            const questionDesc = q.questionDescription || q.questionDescriptionM || q.description || '';
                            const choicesList = q.choices || q.choicesM || q.options || null;

                            return (
                              <div key={idx} className="q-row-wrapper">
                                <div className="q-row">
                                  <div className="q-num">Q{globalQIndex}.</div>
                                  <div className="q-text">
                                    <LatexRenderer text={questionText} />
                                    {choicesList && (
                                      <div className="q-opts">
                                        {choicesList.map((opt, optIdx) => (
                                          <span key={optIdx}>
                                            ({"abcd"[optIdx]}) <LatexRenderer text={opt} />
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="q-tags">
                                      <span className={`q-tag ${q.hots ? 'hots' : 'lots'}`}>
                                        {q.hots ? 'HOTS' : 'LOTS'} · {q.level}
                                      </span>
                                      <span className="q-tag chapter">{q.chapter}</span>
                                    </div>
                                  </div>
                                  <div className="q-marks">[{q.marks}]</div>
                                  <button
                                    type="button"
                                    className="q-redo"
                                    title="Replace this question"
                                    onClick={() => onRedoQuestion(finalRedoIndex)}
                                  >
                                    ↻
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>

                      {/* Footer signatures and seal area at the bottom of pages */}
                      {isLastPage ? (
                        template.footerTemplate ? (
                          <div className="paper-custom-footer" style={{ width: '100%', marginTop: '16px' }}>
                            <img 
                              src={template.footerTemplate} 
                              alt="Custom Footer" 
                              style={{ width: '100%', maxHeight: '70px', objectFit: 'contain', display: 'block' }} 
                            />
                          </div>
                        ) : (
                          <div className="paper-footer" style={{ marginTop: '16px', borderTop: '1.5px dashed var(--border)', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px', padding: '0 20px' }}>
                              <div style={{ textAlign: 'center' }}>
                                {template.stamp && (
                                  <img 
                                    src={template.stamp} 
                                    className="paper-seal" 
                                    alt="Seal" 
                                    style={{ width: '56px', height: '56px', objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} 
                                  />
                                )}
                                <div style={{ fontSize: '10.5px', borderTop: '1px solid var(--border)', width: '120px', paddingTop: '2px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                                  School Seal / Stamp
                                </div>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                {template.signature && (
                                  <img 
                                    src={template.signature} 
                                    className="paper-signature" 
                                    alt="Signature" 
                                    style={{ height: '32px', objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} 
                                  />
                                )}
                                <div style={{ fontSize: '10.5px', borderTop: '1px solid var(--border)', width: '120px', paddingTop: '2px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                                  Principal
                                </div>
                              </div>
                            </div>

                            <div style={{
                              fontSize: '11px',
                              color: 'var(--ink-mute)',
                              textAlign: template.footerAlignment || 'center',
                              fontWeight: '600',
                              marginTop: '4px',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span>{template.footerText || 'Confidential Examination Paper'}</span>
                              <span>Page {pageIdx + 1} of {paginatedPages.length}</span>
                            </div>
                          </div>
                        )
                      ) : (
                        <div 
                          className="paper-footer" 
                          style={{ 
                            fontSize: '11px',
                            color: 'var(--ink-mute)',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '6px',
                            fontWeight: '600',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '16px'
                          }}
                        >
                          <span>{template.footerText || 'Confidential Examination Paper'}</span>
                          <span>Page {pageIdx + 1} of {paginatedPages.length}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        blob={localPdfBlob || pdfBlob}
        examName={examName}
        onClose={handleClosePreview}
        onDownload={() => {
          const fileToDownload = localPdfBlob || pdfBlob;
          if (fileToDownload) {
            const url = URL.createObjectURL(fileToDownload);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${examName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Paper.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }
        }}
      />
    </section>
  );
}
