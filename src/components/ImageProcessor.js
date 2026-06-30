/**
 * ImageProcessor.js
 *
 * Wrapper/facade matching the requested React architecture.
 * Delegates image optimization tasks to the shared imageProcessing utility.
 */

import { processImage } from '../utils/imageProcessing';

export const ImageProcessor = {
  /**
   * Processes a file by auto-cropping, resizing, and compressing it.
   * @param {File} file - Uploaded raw file
   * @param {string} type - 'logo' | 'stamp' | 'signature'
   * @returns {Promise<Object>} Resolves to { type, dataUrl, width, height }
   */
  process: async (file, type) => {
    return processImage(file, type);
  }
};

export default ImageProcessor;
