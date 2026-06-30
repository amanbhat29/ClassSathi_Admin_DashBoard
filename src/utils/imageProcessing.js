/**
 * imageProcessing.js
 *
 * Shared image processing utility for Form Template and Word Template modes.
 * Implements border cropping (autocrop), resizing, compression, and transparency preservation.
 */

/**
 * Scans image pixel data to find the bounding box of non-white, non-transparent pixels.
 */
export function getCropBoundingBox(canvas, ctx) {
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Pixel is non-empty if it is not solid white and not fully transparent
      const isWhite = r > 242 && g > 242 && b > 242;
      const isTransparent = a < 15;

      if (!isWhite && !isTransparent) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasContent = true;
      }
    }
  }

  // Add 2px safety padding around the crop box if content exists
  if (hasContent) {
    minX = Math.max(0, minX - 2);
    minY = Math.max(0, minY - 2);
    maxX = Math.min(width - 1, maxX + 2);
    maxY = Math.min(height - 1, maxY + 2);
    return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1, hasContent: true };
  }

  return { minX: 0, minY: 0, width, height, hasContent: false };
}

/**
 * Classifies the image into logo, stamp, or signature based on name or aspect ratio.
 */
export function classifyImage(file, width, height) {
  const name = file.name.toLowerCase();
  
  if (name.includes('logo') || name.includes('emblem') || name.includes('crest') || name.includes('school')) {
    return 'logo';
  }
  if (name.includes('sig') || name.includes('sign') || name.includes('auth') || name.includes('write')) {
    return 'signature';
  }
  if (name.includes('stamp') || name.includes('seal') || name.includes('round') || name.includes('official')) {
    return 'stamp';
  }

  const ratio = width / height;
  if (ratio > 2.0) {
    return 'signature';
  }
  if (ratio >= 0.7 && ratio <= 1.4) {
    return 'stamp'; // default fallback for square-ish image is stamp
  }
  return 'logo'; // fallback
}

/**
 * Optimizes, crops, and resizes an image file based on its type.
 * Returns a Promise resolving to { type, dataUrl, width, height }.
 */
export function processImage(file, targetType = null) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Autocrop margins
        const crop = getCropBoundingBox(canvas, ctx);
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        cropCanvas.width = crop.width;
        cropCanvas.height = crop.height;
        cropCtx.drawImage(
          canvas,
          crop.minX,
          crop.minY,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        // Determine image classification if not forced
        const type = targetType || classifyImage(file, crop.width, crop.height);

        // Standard recommended sizing constraints
        let targetWidth = crop.width;
        let targetHeight = crop.height;

        if (type === 'logo') {
          // Logo height constraint: 60-80px (we target 72px)
          targetHeight = 72;
          targetWidth = Math.round((crop.width * 72) / crop.height);
        } else if (type === 'signature') {
          // Signature width constraint: 120-160px (we target 140px)
          targetWidth = 140;
          targetHeight = Math.round((crop.height * 140) / crop.width);
        } else if (type === 'stamp') {
          // Stamp width constraint: 70-90px (we target 80px)
          targetWidth = 80;
          targetHeight = Math.round((crop.height * 80) / crop.width);
        }

        // Draw scaled final canvas
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(cropCanvas, 0, 0, targetWidth, targetHeight);

        // Compress and preserve transparent PNG formats
        const usePng = type === 'signature' || type === 'stamp' || file.type === 'image/png' || file.type === 'image/svg+xml';
        const dataUrl = usePng 
          ? finalCanvas.toDataURL('image/png')
          : finalCanvas.toDataURL('image/jpeg', 0.85);

        resolve({
          type,
          dataUrl,
          width: targetWidth,
          height: targetHeight
        });
      };

      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
