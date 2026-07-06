import { useEffect, useRef, useState } from 'react';
import * as docx from 'docx-preview';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the pdfjs worker url
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

/**
 * DocumentPreview Component
 * Renders DOCX using docx-preview, or PDF page-by-page onto canvas elements.
 * Unifies the visual preview layout, borders, shadows, and spacing.
 */
export default function DocumentPreview({ type, base64 }) {
  const docxContainerRef = useRef(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. DOCX Renderer Effect
  useEffect(() => {
    if (type !== 'docx' || !base64 || !docxContainerRef.current) return;

    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      docxContainerRef.current.innerHTML = '';
      docx.renderAsync(arrayBuffer, docxContainerRef.current, null, {
        className: "docx-rendered",
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        experimental: true,
        useBase64URL: true
      })
      .catch((err) => {
        console.error("[DocumentPreview] docx-preview failed:", err);
        setError("Failed to render Word template preview.");
      });
    } catch (err) {
      console.error("[DocumentPreview] DOCX base64 decode failed:", err);
      setError("Failed to decode generated Word preview binary.");
    }
  }, [type, base64]);

  // 2. PDF Renderer Effect (Draws onto high-resolution canvas elements)
  useEffect(() => {
    if (type !== 'pdf' || !base64) return;

    let isMounted = true;
    setPdfLoading(true);
    setError(null);

    async function loadAndRenderPdf() {
      try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjs.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        const pageList = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          pageList.push(i);
        }
        setPdfPages(pageList);
        setPdfLoading(false);

        // Force react to draw divs and mount canvas elements before page render starts
        setTimeout(async () => {
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            if (!isMounted) return;
            try {
              const page = await pdf.getPage(pageNum);
              const canvas = document.getElementById(`pdf-page-canvas-${pageNum}`);
              if (!canvas) continue;

              const context = canvas.getContext('2d');
              const viewport = page.getViewport({ scale: 1.5 }); // High-res rendering

              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              await page.render(renderContext).promise;
            } catch (pageErr) {
              console.error(`[DocumentPreview] Failed to render PDF page ${pageNum}:`, pageErr);
            }
          }
        }, 100);

      } catch (err) {
        console.error("[DocumentPreview] PDF rendering failed:", err);
        if (isMounted) {
          setError(err.message || "Failed to load and render PDF pages.");
          setPdfLoading(false);
        }
      }
    }

    loadAndRenderPdf();

    return () => {
      isMounted = false;
    };
  }, [type, base64]);

  if (error) {
    return (
      <div style={{ color: 'var(--red)', padding: '32px 16px', textAlign: 'center', fontWeight: '700', background: 'var(--card)', border: '1.5px dashed var(--border)', borderRadius: '12px' }}>
        ⚠️ {error}
      </div>
    );
  }

  if (type === 'pdf' && pdfLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', gap: '12px' }}>
        <div className="uploader-spinner"></div>
        <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: '600' }}>Converting PDF pages for preview…</div>
      </div>
    );
  }

  if (type === 'docx') {
    return (
      <div 
        ref={docxContainerRef} 
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
      />
    );
  }

  if (type === 'pdf') {
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
        {pdfPages.map(num => (
          <div 
            key={num} 
            className="docx-rendered" 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: '#fff',
              padding: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              boxSizing: 'border-box',
              width: '816px',
              height: '1154px',
              border: '1px solid #ddd'
            }}
          >
            <canvas 
              id={`pdf-page-canvas-${num}`} 
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block' 
              }} 
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
