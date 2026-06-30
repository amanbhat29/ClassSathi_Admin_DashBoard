/**
 * useTemplateImages.js
 *
 * Custom React hook that unifies image state, processing, and placement
 * between the Form Template and the Word Template editor.
 */

import { useCallback } from 'react';
import { useTemplate } from '../context/TemplateContext';
import { processImage } from '../utils/imageProcessing';

// ── Predefined HTML template segments ──────────────────────────────
const LOGO_PLACEHOLDER = '[ School Logo ]';
const STAMP_PLACEHOLDER = 'School Seal / Stamp';
const SIGNATURE_PLACEHOLDER = "Principal's Signature";

export function useTemplateImages(editor = null) {
  const { template, updateTemplateField } = useTemplate();

  /**
   * Helper: places logo image inside the editor HTML.
   */
  const getHtmlWithLogo = useCallback((html, dataUrl) => {
    const imgHtml = `<img src="${dataUrl}" class="logo-img" style="max-height: 80px; width: auto; object-fit: contain; display: block; margin: 0 auto;" />`;
    
    const idRegex = /(<td[^>]*id="header-logo-cell"[^>]*>)([\s\S]*?)(<\/td>)/i;
    if (idRegex.test(html)) return html.replace(idRegex, `$1${imgHtml}$3`);

    const classRegex = /(<td[^>]*>)([\s\S]*?<img[^>]*class="logo-img"[\s\S]*?)(<\/td>)/i;
    if (classRegex.test(html)) return html.replace(classRegex, `$1${imgHtml}$3`);

    const textCellRegex = /(<td[^>]*>)([\s\S]*?\[\s*School\s+Logo\s*\][\s\S]*?)(<\/td>)/i;
    if (textCellRegex.test(html)) return html.replace(textCellRegex, `$1${imgHtml}$3`);

    const plainTextRegex = /\[\s*School\s+Logo\s*\]/i;
    if (plainTextRegex.test(html)) return html.replace(plainTextRegex, imgHtml);

    return html;
  }, []);

  /**
   * Helper: places signature image inside the editor HTML.
   */
  const getHtmlWithSignature = useCallback((html, dataUrl) => {
    const imgHtml = `<img src="${dataUrl}" class="signature-img" style="max-height: 48px; max-width: 150px; object-fit: contain; display: block; margin: 0 auto 4px;" /><br>${SIGNATURE_PLACEHOLDER}`;
    
    const idRegex = /(<td[^>]*id="signature-cell"[^>]*>)([\s\S]*?)(<\/td>)/i;
    if (idRegex.test(html)) return html.replace(idRegex, `$1${imgHtml}$3`);

    const classRegex = /(<td[^>]*>)([\s\S]*?<img[^>]*class="signature-img"[\s\S]*?)(<\/td>)/i;
    if (classRegex.test(html)) return html.replace(classRegex, `$1${imgHtml}$3`);

    const textCellRegex = /(<td[^>]*>)([\s\S]*?Principal(?:'s)?\s+Signature[\s\S]*?)(<\/td>)/i;
    if (textCellRegex.test(html)) return html.replace(textCellRegex, `$1${imgHtml}$3`);

    const plainTextRegex = /Principal(?:'s)?\s+Signature/i;
    if (plainTextRegex.test(html)) return html.replace(plainTextRegex, imgHtml);

    return html;
  }, []);

  /**
   * Helper: places stamp image inside the editor HTML.
   */
  const getHtmlWithStamp = useCallback((html, dataUrl) => {
    const imgHtml = `<img src="${dataUrl}" class="stamp-img" style="max-height: 70px; max-width: 70px; object-fit: contain; display: block; margin: 0 auto 4px;" /><br>${STAMP_PLACEHOLDER}`;
    
    const idRegex = /(<td[^>]*id="stamp-cell"[^>]*>)([\s\S]*?)(<\/td>)/i;
    if (idRegex.test(html)) return html.replace(idRegex, `$1${imgHtml}$3`);

    const classRegex = /(<td[^>]*>)([\s\S]*?<img[^>]*class="stamp-img"[\s\S]*?)(<\/td>)/i;
    if (classRegex.test(html)) return html.replace(classRegex, `$1${imgHtml}$3`);

    const textCellRegex = /(<td[^>]*>)([\s\S]*?(?:School\s+Seal|School\s+Stamp|Seal\s*\/|\bStamp\b)[\s\S]*?)(<\/td>)/i;
    if (textCellRegex.test(html)) return html.replace(textCellRegex, `$1${imgHtml}$3`);

    const plainTextRegex = /(?:School\s+Seal\s*\/|School\s+Seal|School\s+Stamp|\bStamp\b)/i;
    if (plainTextRegex.test(html)) return html.replace(plainTextRegex, imgHtml);

    return html;
  }, []);

  /**
   * Processes and uploads an image (Logo, Stamp, or Signature).
   */
  const uploadImage = useCallback(
    async (file, type) => {
      if (!file) return null;
      try {
        const { dataUrl } = await processImage(file, type);
        
        // 1. Sync globally to TemplateContext
        updateTemplateField(type, dataUrl);

        // 2. Sync to Editor if present
        if (editor) {
          const currentHtml = editor.getHTML();
          let updatedHtml = currentHtml;

          if (type === 'logo') {
            updatedHtml = getHtmlWithLogo(currentHtml, dataUrl);
          } else if (type === 'signature') {
            updatedHtml = getHtmlWithSignature(currentHtml, dataUrl);
          } else if (type === 'stamp') {
            updatedHtml = getHtmlWithStamp(currentHtml, dataUrl);
          }

          if (updatedHtml !== currentHtml) {
            editor.commands.setContent(updatedHtml);
          }
        }
        return dataUrl;
      } catch (err) {
        console.error('[useTemplateImages] Upload error:', err);
        throw err;
      }
    },
    [editor, updateTemplateField, getHtmlWithLogo, getHtmlWithSignature, getHtmlWithStamp]
  );

  /**
   * Removes an image and restores its text placeholder inside the editor.
   */
  const removeImage = useCallback(
    (type) => {
      // 1. Clear globally in TemplateContext
      updateTemplateField(type, null);

      // 2. Clear inside Editor if present
      if (editor) {
        const currentHtml = editor.getHTML();
        let updatedHtml = currentHtml;

        if (type === 'logo') {
          const logoCellRegex = /(<td[^>]*id="header-logo-cell"[^>]*>)([\s\S]*?)(<\/td>)/i;
          const logoClassRegex = /(<td[^>]*>)([\s\S]*?<img[^>]*class="logo-img"[\s\S]*?)(<\/td>)/i;
          
          if (logoCellRegex.test(currentHtml)) {
            updatedHtml = currentHtml.replace(logoCellRegex, `$1${LOGO_PLACEHOLDER}$3`);
          } else if (logoClassRegex.test(currentHtml)) {
            updatedHtml = currentHtml.replace(logoClassRegex, `$1${LOGO_PLACEHOLDER}$3`);
          }
        } else if (type === 'signature') {
          const sigCellRegex = /(<td[^>]*id="signature-cell"[^>]*>)([\s\S]*?)(<\/td>)/i;
          const sigClassRegex = /(<td[^>]*>)([\s\S]*?<img[^>]*class="signature-img"[\s\S]*?)(<\/td>)/i;
          const replText = `<br><br>${SIGNATURE_PLACEHOLDER}`;

          if (sigCellRegex.test(currentHtml)) {
            updatedHtml = currentHtml.replace(sigCellRegex, `$1${replText}$3`);
          } else if (sigClassRegex.test(currentHtml)) {
            updatedHtml = currentHtml.replace(sigClassRegex, `$1${replText}$3`);
          }
        } else if (type === 'stamp') {
          const stampCellRegex = /(<td[^>]*id="stamp-cell"[^>]*>)([\s\S]*?)(<\/td>)/i;
          const stampClassRegex = /(<td[^>]*>)([\s\S]*?<img[^>]*class="stamp-img"[\s\S]*?)(<\/td>)/i;
          const replText = `<br><br>${STAMP_PLACEHOLDER}`;

          if (stampCellRegex.test(currentHtml)) {
            updatedHtml = currentHtml.replace(stampCellRegex, `$1${replText}$3`);
          } else if (stampClassRegex.test(currentHtml)) {
            updatedHtml = currentHtml.replace(stampClassRegex, `$1${replText}$3`);
          }
        }

        if (updatedHtml !== currentHtml) {
          editor.commands.setContent(updatedHtml);
        }
      }
    },
    [editor, updateTemplateField]
  );

  /**
   * Synchronizes any existing TemplateContext images to the editor document cells.
   */
  const syncImagesToEditor = useCallback(() => {
    if (!editor) return;
    let html = editor.getHTML();
    let changed = false;

    if (template.logo && !html.includes('class="logo-img"')) {
      html = getHtmlWithLogo(html, template.logo);
      changed = true;
    }
    if (template.signature && !html.includes('class="signature-img"')) {
      html = getHtmlWithSignature(html, template.signature);
      changed = true;
    }
    if (template.stamp && !html.includes('class="stamp-img"')) {
      html = getHtmlWithStamp(html, template.stamp);
      changed = true;
    }

    if (changed) {
      editor.commands.setContent(html);
    }
  }, [editor, template, getHtmlWithLogo, getHtmlWithSignature, getHtmlWithStamp]);

  return {
    template,
    uploadImage,
    removeImage,
    syncImagesToEditor
  };
}

export default useTemplateImages;
