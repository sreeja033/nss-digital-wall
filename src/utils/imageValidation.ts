/**
 * Image Validation and Perceptual Hashing Utilities for Community Report Submissions
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  imageHash?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

// Allowed MIME types and file extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

// Minimum file size: 4 KB (rejects 0-byte, truncated, or trivial blank files)
const MIN_FILE_SIZE_BYTES = 4096;
// Maximum file size: 15 MB
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
// Minimum pixel resolution: 150 x 150 px
const MIN_DIMENSION = 150;

/**
 * Validates an uploaded File against type, size, corruption, and minimum resolution constraints.
 * Also computes an average perceptual hash for duplicate detection.
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  // 1. File Type Validation
  const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const mimeAllowed = file.type ? ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) : false;
  const extAllowed = ALLOWED_EXTENSIONS.includes(fileExt);

  if (!mimeAllowed && !extAllowed) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, PNG, WebP, and HEIC photos are accepted.',
    };
  }

  // 2. File Size Validation
  if (file.size < MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'The photo file is too small or appears corrupt. Please upload a clear photo of the issue (minimum 4 KB).',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Photo is too large (maximum 15 MB). Please select a smaller photo or compress it.',
    };
  }

  // 3. Image Loading & Resolution Validation
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        resolve({
          valid: false,
          error: `Photo resolution is too low (${img.naturalWidth}×${img.naturalHeight}px). Please provide a photo of at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
        });
        return;
      }

      // Check for completely blank/solid-color image & compute hash
      try {
        const hashResult = computePerceptualHashFromImage(img);
        if (hashResult.isBlank) {
          resolve({
            valid: false,
            error: 'The image appears completely blank or uniform. Please upload a real photograph of the problem.',
          });
          return;
        }

        resolve({
          valid: true,
          imageHash: hashResult.hash,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeBytes: file.size,
        });
      } catch (err) {
        // If canvas fails (e.g. security/tainted), accept valid image
        resolve({
          valid: true,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeBytes: file.size,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Unable to decode image file. It may be corrupt or an unsupported variant. Please try another image.',
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Computes a perceptual hash from an image data URL or public URL.
 */
export async function computeImageHashFromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const res = computePerceptualHashFromImage(img);
        resolve(res.hash);
      } catch {
        resolve(simpleStringHash(url));
      }
    };

    img.onerror = () => {
      resolve(simpleStringHash(url));
    };

    img.src = url;
  });
}

/**
 * Computes a 64-bit difference hash (dHash) and checks if the image is essentially a flat single color.
 * Scales down to 9x8 grayscale canvas for difference comparisons.
 */
function computePerceptualHashFromImage(img: HTMLImageElement): { hash: string; isBlank: boolean } {
  const canvas = document.createElement('canvas');
  const width = 9;
  const height = 8;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { hash: simpleStringHash(img.src), isBlank: false };
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Convert to grayscale luminance
  const grays: number[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grays.push(gray);
    sum += gray;
  }

  // Calculate standard deviation to detect blank / single-color images
  const mean = sum / grays.length;
  let variance = 0;
  for (const g of grays) {
    variance += (g - mean) ** 2;
  }
  const stdDev = Math.sqrt(variance / grays.length);
  const isBlank = stdDev < 1.8; // Very little variance across pixels indicates a blank canvas

  // Compute 64-bit difference hash (compare each pixel with the pixel to its right)
  let hashBits = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const left = grays[y * width + x];
      const right = grays[y * width + (x + 1)];
      hashBits += left > right ? '1' : '0';
    }
  }

  // Convert binary string to hexadecimal
  let hex = '';
  for (let i = 0; i < hashBits.length; i += 4) {
    const chunk = hashBits.slice(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }

  return { hash: hex || '0000000000000000', isBlank };
}

/**
 * Calculates Hamming distance between two hex hashes.
 */
export function hammingDistance(hex1: string, hex2: string): number {
  if (!hex1 || !hex2 || hex1.length !== hex2.length) return 999;
  let dist = 0;
  for (let i = 0; i < hex1.length; i++) {
    const v1 = parseInt(hex1[i], 16);
    const v2 = parseInt(hex2[i], 16);
    let xor = v1 ^ v2;
    while (xor > 0) {
      if (xor & 1) dist++;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * Simple fallback string hash
 */
function simpleStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
}
