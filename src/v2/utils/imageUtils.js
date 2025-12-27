/**
 * Image utilities for map compression and processing
 */

// Maximum dimension (longest edge) before compression kicks in
const MAX_DIMENSION = 2000;

// JPEG quality for compression (0-1)
const COMPRESSION_QUALITY = 0.85;

/**
 * Compress an image if it exceeds the maximum dimension
 * Returns the compressed image data URL and scale information
 *
 * @param {string} dataUrl - The original image as a base64 data URL
 * @returns {Promise<{
 *   dataUrl: string,
 *   originalWidth: number,
 *   originalHeight: number,
 *   newWidth: number,
 *   newHeight: number,
 *   wasCompressed: boolean,
 *   scaleFactor: number
 * }>}
 */
export const compressImage = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      const longestEdge = Math.max(originalWidth, originalHeight);

      // If image is already small enough, return as-is
      if (longestEdge <= MAX_DIMENSION) {
        resolve({
          dataUrl,
          originalWidth,
          originalHeight,
          newWidth: originalWidth,
          newHeight: originalHeight,
          wasCompressed: false,
          scaleFactor: 1,
        });
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      const scaleFactor = MAX_DIMENSION / longestEdge;
      const newWidth = Math.round(originalWidth * scaleFactor);
      const newHeight = Math.round(originalHeight * scaleFactor);

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to JPEG for better compression (maps don't need transparency)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);

      resolve({
        dataUrl: compressedDataUrl,
        originalWidth,
        originalHeight,
        newWidth,
        newHeight,
        wasCompressed: true,
        scaleFactor,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
};

/**
 * Adjust milesPerPixel when an image is compressed
 * This maintains accurate real-world distances
 *
 * @param {number} originalMilesPerPixel - The user's original scale setting
 * @param {number} scaleFactor - The compression scale factor (newSize / originalSize)
 * @returns {number} - The adjusted milesPerPixel value
 */
export const adjustMilesPerPixel = (originalMilesPerPixel, scaleFactor) => {
  // If image was shrunk by half (scaleFactor = 0.5), each pixel now represents 2x the distance
  return originalMilesPerPixel / scaleFactor;
};

/**
 * Adjust a pin/marker position when an image is compressed
 *
 * @param {number} originalX - Original X position in pixels
 * @param {number} originalY - Original Y position in pixels
 * @param {number} scaleFactor - The compression scale factor
 * @returns {{ x: number, y: number }} - The adjusted position
 */
export const adjustPinPosition = (originalX, originalY, scaleFactor) => {
  return {
    x: Math.round(originalX * scaleFactor),
    y: Math.round(originalY * scaleFactor),
  };
};

/**
 * Format a compression notice message for the user
 *
 * @param {number} originalWidth
 * @param {number} originalHeight
 * @param {number} newWidth
 * @param {number} newHeight
 * @returns {string}
 */
export const getCompressionNotice = (originalWidth, originalHeight, newWidth, newHeight) => {
  return `Image compressed from ${originalWidth}×${originalHeight} to ${newWidth}×${newHeight}. Scale adjusted automatically.`;
};
