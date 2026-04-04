/**
 * Client-side coloring page generator using Canvas image processing.
 * Converts an illustration to a coloring page by extracting edges
 * and converting to black outlines on white background.
 */

export async function generateColoringPageClientSide(imageUrl: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // Create canvas for processing
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  // Step 1: Convert to grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Step 2: Apply Gaussian blur (3x3) to reduce noise
  const blurred = new Float32Array(w * h);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * w + (x + dx)] * kernel[ki++];
        }
      }
      blurred[y * w + x] = sum / kernelSum;
    }
  }

  // Step 3: Sobel edge detection
  const edges = new Float32Array(w * h);
  let maxEdge = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -blurred[(y - 1) * w + (x - 1)] + blurred[(y - 1) * w + (x + 1)] +
        -2 * blurred[y * w + (x - 1)] + 2 * blurred[y * w + (x + 1)] +
        -blurred[(y + 1) * w + (x - 1)] + blurred[(y + 1) * w + (x + 1)];
      const gy =
        -blurred[(y - 1) * w + (x - 1)] - 2 * blurred[(y - 1) * w + x] - blurred[(y - 1) * w + (x + 1)] +
        blurred[(y + 1) * w + (x - 1)] + 2 * blurred[(y + 1) * w + x] + blurred[(y + 1) * w + (x + 1)];
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * w + x] = magnitude;
      if (magnitude > maxEdge) maxEdge = magnitude;
    }
  }

  // Step 4: Threshold and create coloring page (black outlines on white)
  const threshold = maxEdge * 0.12; // Lower threshold = more lines
  const output = ctx.createImageData(w, h);
  const outPixels = output.data;

  for (let i = 0; i < w * h; i++) {
    const isEdge = edges[i] > threshold;
    const val = isEdge ? 0 : 255; // Black edges on white background
    outPixels[i * 4] = val;
    outPixels[i * 4 + 1] = val;
    outPixels[i * 4 + 2] = val;
    outPixels[i * 4 + 3] = 255;
  }

  ctx.putImageData(output, 0, 0);

  // Step 5: Thicken lines by applying a dilation pass
  const thickened = ctx.getImageData(0, 0, w, h);
  const thickPixels = new Uint8ClampedArray(thickened.data);
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // If any neighbor is black, make this pixel black (dilate)
      let hasBlackNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (outPixels[((y + dy) * w + (x + dx)) * 4] === 0) {
            hasBlackNeighbor = true;
            break;
          }
        }
        if (hasBlackNeighbor) break;
      }
      if (hasBlackNeighbor) {
        const idx = (y * w + x) * 4;
        thickPixels[idx] = 0;
        thickPixels[idx + 1] = 0;
        thickPixels[idx + 2] = 0;
      }
    }
  }
  
  thickened.data.set(thickPixels);
  ctx.putImageData(thickened, 0, 0);

  return canvas.toDataURL('image/png');
}
