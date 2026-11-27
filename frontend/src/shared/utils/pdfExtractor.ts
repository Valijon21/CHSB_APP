import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Extracts plain text from a PDF file (File, ArrayBuffer or Uint8Array).
 * Iterates through all pages, extracts text items, and preserves structure.
 */
export async function extractTextFromPdf(input: File | ArrayBuffer | Uint8Array): Promise<string> {
  let arrayBuffer: ArrayBuffer;

  if (typeof File !== 'undefined' && input instanceof File) {
    arrayBuffer = await input.arrayBuffer();
  } else if (input instanceof Uint8Array) {
    arrayBuffer = input.buffer as ArrayBuffer;
  } else {
    arrayBuffer = input as ArrayBuffer;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const pagesText: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by line
    let lastY: number | null = null;
    const pageLines: string[] = [];
    let currentLine = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        const text = item.str;
        const transform = item.transform;
        const y = transform ? transform[5] : null;

        // If vertical position changed noticeably, consider it a new line
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = text;
        } else {
          currentLine += (currentLine ? ' ' : '') + text;
        }
        lastY = y;
      }
    }

    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    pagesText.push(pageLines.join('\n'));
  }

  return pagesText.join('\n\n');
}
