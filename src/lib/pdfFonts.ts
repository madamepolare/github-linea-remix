// Font loader for jsPDF - Inter font embedded
// This provides the system typography for PDF generation

import jsPDF from 'jspdf';

// Inter font is not natively supported by jsPDF, so we use Helvetica as a close alternative
// For true Inter support, we would need to embed the font file as base64
// Using Helvetica-like styling to approximate Inter's clean look

export const PDF_FONTS = {
  // Primary font for body text (Inter-like)
  primary: 'helvetica',
  // Monospace for codes and technical content
  mono: 'courier'
} as const;

export const PDF_COLORS = {
  // Text colors (matching index.css design system)
  text: {
    primary: [10, 10, 10] as [number, number, number],      // --foreground: 0 0% 4%
    secondary: [102, 102, 102] as [number, number, number], // --text-secondary: 0 0% 40%
    muted: [140, 140, 140] as [number, number, number],     // --text-muted: 0 0% 55%
    light: [180, 180, 180] as [number, number, number],     // For subtle elements
  },
  // Background and accent
  accent: [139, 92, 246] as [number, number, number],       // --accent (violet)
  success: [40, 167, 69] as [number, number, number],
  warning: [255, 159, 10] as [number, number, number],
  // Table
  tableHeader: [40, 40, 40] as [number, number, number],
  tableAlt: [250, 250, 250] as [number, number, number],
} as const;

export const PDF_STYLES = {
  // Font sizes in points
  fontSize: {
    h1: 24,
    h2: 16,
    h3: 12,
    h4: 10,
    body: 9,
    small: 8,
    tiny: 7,
  },
  // Spacing in mm
  spacing: {
    section: 12,
    paragraph: 6,
    line: 4,
  },
  // Margins
  margin: {
    page: 20,
    content: 15,
  }
} as const;

/**
 * Apply consistent text styling to PDF
 */
export function setTextStyle(
  pdf: jsPDF, 
  style: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'tiny',
  weight: 'normal' | 'bold' = 'normal',
  color: 'primary' | 'secondary' | 'muted' | 'light' = 'primary'
) {
  const sizes = PDF_STYLES.fontSize;
  const colors = PDF_COLORS.text;
  
  pdf.setFont(PDF_FONTS.primary, weight);
  pdf.setFontSize(sizes[style]);
  pdf.setTextColor(...colors[color]);
}

/**
 * Render a section title with consistent styling
 */
export function renderSectionTitle(
  pdf: jsPDF, 
  title: string, 
  y: number, 
  margin: number = 20
): number {
  setTextStyle(pdf, 'h3', 'bold', 'primary');
  pdf.text(title, margin, y);
  return y + 10;
}

/**
 * Render body paragraph text with auto line wrap
 */
export function renderParagraph(
  pdf: jsPDF, 
  text: string, 
  y: number, 
  contentWidth: number,
  margin: number = 20,
  style: 'body' | 'small' = 'body'
): number {
  setTextStyle(pdf, style, 'normal', 'secondary');
  const lines = pdf.splitTextToSize(text, contentWidth);
  lines.forEach((line: string) => {
    pdf.text(line, margin, y);
    y += PDF_STYLES.spacing.line;
  });
  return y;
}

/**
 * Add page paraphes (initials box) at bottom of page
 */
export function addPageParaphes(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number = 20,
  moeLabel: string = 'MOE',
  moaLabel: string = 'MOA'
) {
  setTextStyle(pdf, 'tiny', 'normal', 'muted');
  pdf.text(`Paraphe ${moeLabel} ____________`, margin, pageHeight - 15);
  pdf.text(`Paraphe ${moaLabel} ____________`, pageWidth - margin - 45, pageHeight - 15);
}

/**
 * Format currency in French locale
 */
export function formatCurrencyPDF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Check if we need a new page and add one if necessary
 */
export function checkPageBreak(
  pdf: jsPDF,
  y: number,
  requiredSpace: number,
  pageHeight: number,
  addParaphes: boolean = true,
  pageWidth?: number,
  margin?: number
): { y: number; newPage: boolean } {
  if (y + requiredSpace > pageHeight - 30) {
    if (addParaphes && pageWidth && margin) {
      addPageParaphes(pdf, pageWidth, pageHeight, margin);
    }
    pdf.addPage();
    return { y: 20, newPage: true };
  }
  return { y, newPage: false };
}
