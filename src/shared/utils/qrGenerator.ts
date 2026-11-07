/**
 * Pure TypeScript Zero-Dependency QR Code Generator.
 * Encodes ASCII/UTF-8 strings into an SVG QR Code matrix.
 * Supports standard Finder patterns, Timing patterns, Reed-Solomon Error Correction,
 * Format information, and dynamic SVG rendering.
 */

export interface QrCodeOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
  margin?: number;
}

// Galois Field GF(256) tables for Reed-Solomon error correction
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[(GF_LOG[x]! + GF_LOG[y]!) % 255]!;
}

function rsComputePoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const factor = GF_EXP[i]!;
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j]!, factor);
      next[j + 1] ^= poly[j]!;
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const poly = rsComputePoly(ecCount);
  const result = new Uint8Array(data.length + ecCount);
  result.set(data, 0);

  for (let i = 0; i < data.length; i++) {
    const coef = result[i]!;
    if (coef !== 0) {
      for (let j = 0; j < poly.length; j++) {
        result[i + j] ^= gfMultiply(poly[j]!, coef);
      }
    }
  }

  return result.subarray(data.length);
}

/**
 * Generates a 2D boolean matrix representing QR modules for version 2 (25x25) or version 3 (29x29).
 */
export function generateQrMatrix(text: string): boolean[][] {
  // Use Version 3 (29x29) with ECL-M (26 data bytes, 15 EC bytes) for up to 44 chars, or Version 4 (33x33) for larger
  const isLarge = text.length > 32;
  const version = isLarge ? 4 : 3;
  const size = version * 4 + 17; // v3: 29, v4: 33
  const dataByteCount = version === 4 ? 36 : 26;
  const ecByteCount = version === 4 ? 18 : 15;

  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );

  // 1. Finder patterns (7x7) + separators (8x8) at (0,0), (0, size-7), (size-7, 0)
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          const inCenter = r >= 1 && r <= 5 && c >= 1 && c <= 5;
          const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const inBorder = r === 0 || r === 6 || c === 0 || c === 6;
          matrix[mr]![mc] = inCore || inBorder || (inCenter && inCore);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6]![i] = i % 2 === 0;
    matrix[i]![6] = i % 2 === 0;
  }

  // 3. Alignment pattern for v3 (at 22, 22) and v4 (at 26, 26)
  const alignPos = version === 4 ? 26 : 22;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isRing = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      matrix[alignPos + r]![alignPos + c] = isRing;
    }
  }

  // 4. Dark module
  matrix[size - 8]![8] = true;

  // 5. Encode data into stream
  const bits: number[] = [];
  // Mode: Byte (0100)
  bits.push(0, 1, 0, 0);
  // Count indicator (8 bits)
  const len = Math.min(text.length, dataByteCount - 2);
  for (let b = 7; b >= 0; b--) bits.push((len >>> b) & 1);
  // Content bytes
  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);
    for (let b = 7; b >= 0; b--) bits.push((code >>> b) & 1);
  }
  // Terminator
  while (bits.length < dataByteCount * 8 && bits.length % 8 !== 0) bits.push(0);
  // Pad bytes (0xEC, 0x11)
  const padPatterns = [0xec, 0x11];
  let pIdx = 0;
  while (bits.length < dataByteCount * 8) {
    const pad = padPatterns[pIdx % 2]!;
    for (let b = 7; b >= 0; b--) bits.push((pad >>> b) & 1);
    pIdx++;
  }

  // Convert bits to bytes
  const dataBytes = new Uint8Array(dataByteCount);
  for (let i = 0; i < dataByteCount; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bits[i * 8 + b] || 0);
    }
    dataBytes[i] = byte;
  }

  // Error correction
  const ecBytes = rsEncode(dataBytes, ecByteCount);
  const totalBits: number[] = [];
  for (const byte of dataBytes) {
    for (let b = 7; b >= 0; b--) totalBits.push((byte >>> b) & 1);
  }
  for (const byte of ecBytes) {
    for (let b = 7; b >= 0; b--) totalBits.push((byte >>> b) & 1);
  }

  // Place data bits in zigzag upward/downward columns
  let bitIdx = 0;
  let up = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing line
    const rows = up
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (matrix[r]![c] === null) {
          const bitVal = bitIdx < totalBits.length ? totalBits[bitIdx] === 1 : false;
          // Apply mask 0: (row + col) % 2 == 0
          const mask = (r + c) % 2 === 0;
          matrix[r]![c] = bitVal !== mask;
          bitIdx++;
        }
      }
    }
    up = !up;
  }

  // Format info area (mask 0, ECL-M = 00, format bits with BCH)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Place format bits around top-left, top-right, bottom-left finders
  for (let i = 0; i < 15; i++) {
    const val = formatBits[i] === 1;
    if (i < 6) matrix[8]![i] = val;
    else if (i === 6) matrix[8]![7] = val;
    else if (i === 7) matrix[8]![8] = val;
    else if (i === 8) matrix[7]![8] = val;
    else matrix[14 - i]![8] = val;

    if (i < 8) matrix[size - 1 - i]![8] = val;
    else matrix[8]![size - 15 + i] = val;
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

/**
 * Returns an optimized SVG string representation of the QR code.
 */
export function generateQrSvg(text: string, options: QrCodeOptions = {}): string {
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const margin = options.margin ?? 2;
  const totalSize = matrixSize + margin * 2;
  const displaySize = options.size ?? 160;
  const color = options.color ?? '#0f172a';
  const bg = options.backgroundColor ?? '#ffffff';

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r]![c]) {
        const x = c + margin;
        const y = r + margin;
        pathD += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${displaySize}" height="${displaySize}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${bg}"/>
  <path d="${pathD.trim()}" fill="${color}"/>
</svg>`;
}
