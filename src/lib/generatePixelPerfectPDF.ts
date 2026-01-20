/**
 * Pixel-Perfect PDF Generator
 * 
 * Capture le HTML rendu exactement comme l'aperçu via html2canvas,
 * puis l'exporte en PDF via jsPDF. Le résultat est identique à l'écran.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// A4 at 96 DPI (screen resolution)
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

/**
 * Generate a pixel-perfect PDF from HTML string
 * The HTML is rendered in a hidden iframe, captured with html2canvas,
 * then each page is added to a jsPDF document.
 */
export async function downloadPixelPerfectPdf(
  htmlContent: string,
  filename: string = 'document'
): Promise<void> {
  console.log('[PDF] Starting pixel-perfect PDF generation...');

  // Create a hidden container for rendering
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${A4_WIDTH_PX}px;
    background: white;
    z-index: -9999;
  `;
  document.body.appendChild(container);

  // Create iframe to render HTML
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: ${A4_WIDTH_PX}px;
    border: none;
    background: white;
  `;
  container.appendChild(iframe);

  // Wait for iframe to be ready and write HTML
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
    // Fallback timeout
    setTimeout(resolve, 100);
  });

  // Wait for content to render (fonts, images, etc.)
  await new Promise(resolve => setTimeout(resolve, 500));

  // Get the actual content height
  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc || !iframeDoc.body) {
    document.body.removeChild(container);
    throw new Error('Failed to render HTML content');
  }

  const contentHeight = iframeDoc.body.scrollHeight;
  iframe.style.height = `${contentHeight}px`;
  
  console.log('[PDF] Content height:', contentHeight);

  // Wait a bit more after height adjustment
  await new Promise(resolve => setTimeout(resolve, 200));

  // Capture the entire content with html2canvas
  const canvas = await html2canvas(iframeDoc.body, {
    width: A4_WIDTH_PX,
    height: contentHeight,
    scale: 2, // Higher resolution for crisp output
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  console.log('[PDF] Canvas captured:', canvas.width, 'x', canvas.height);

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate how many pages we need
  const scaleFactor = A4_WIDTH_MM / A4_WIDTH_PX;
  const contentHeightMM = contentHeight * scaleFactor;
  const pageCount = Math.ceil(contentHeightMM / A4_HEIGHT_MM);

  console.log('[PDF] Pages needed:', pageCount);

  // Create a temporary canvas for each page slice
  const pageHeightPx = A4_HEIGHT_PX * 2; // Scale factor of 2
  const pageWidthPx = A4_WIDTH_PX * 2;

  for (let page = 0; page < pageCount; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    // Calculate the slice of the canvas to use for this page
    const sourceY = page * pageHeightPx;
    const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

    if (sourceHeight <= 0) continue;

    // Create a canvas for this page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pageWidthPx;
    pageCanvas.height = pageHeightPx;
    const ctx = pageCanvas.getContext('2d');

    if (!ctx) continue;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

    // Draw the slice from the main canvas
    ctx.drawImage(
      canvas,
      0, sourceY,           // Source position
      canvas.width, sourceHeight, // Source size
      0, 0,                 // Destination position
      pageWidthPx, sourceHeight  // Destination size
    );

    // Add to PDF
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  }

  // Clean up
  document.body.removeChild(container);

  // Download
  pdf.save(`${filename}.pdf`);
  console.log('[PDF] Download complete');
}

/**
 * Alternative: Generate PDF directly from an iframe element
 * Use this when the iframe is already rendered in the DOM
 */
export async function downloadPdfFromIframe(
  iframe: HTMLIFrameElement,
  filename: string = 'document'
): Promise<void> {
  console.log('[PDF] Generating PDF from existing iframe...');

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc || !iframeDoc.body) {
    throw new Error('Cannot access iframe content');
  }

  const contentHeight = iframeDoc.body.scrollHeight;
  console.log('[PDF] Content height:', contentHeight);

  // Capture with html2canvas
  const canvas = await html2canvas(iframeDoc.body, {
    width: A4_WIDTH_PX,
    height: contentHeight,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  console.log('[PDF] Canvas captured:', canvas.width, 'x', canvas.height);

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate pages
  const scaleFactor = A4_WIDTH_MM / A4_WIDTH_PX;
  const contentHeightMM = contentHeight * scaleFactor;
  const pageCount = Math.ceil(contentHeightMM / A4_HEIGHT_MM);

  console.log('[PDF] Pages needed:', pageCount);

  const pageHeightPx = A4_HEIGHT_PX * 2;
  const pageWidthPx = A4_WIDTH_PX * 2;

  for (let page = 0; page < pageCount; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    const sourceY = page * pageHeightPx;
    const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

    if (sourceHeight <= 0) continue;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pageWidthPx;
    pageCanvas.height = pageHeightPx;
    const ctx = pageCanvas.getContext('2d');

    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

    ctx.drawImage(
      canvas,
      0, sourceY,
      canvas.width, sourceHeight,
      0, 0,
      pageWidthPx, sourceHeight
    );

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  }

  pdf.save(`${filename}.pdf`);
  console.log('[PDF] Download complete');
}
