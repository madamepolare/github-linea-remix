/**
 * Native Vector PDF Generator
 * 
 * Génère un PDF 100% vectoriel avec jsPDF + autoTable,
 * fidèle au design du template HTML mais sans rasterisation.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo } from './quoteTemplateVariables';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN_LEFT = 12;
const MARGIN_RIGHT = 12;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 18;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Colors (from theme or defaults)
interface PDFColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  tableHeaderBg: string;
  border: string;
}

function getColors(theme?: QuoteTheme): PDFColors {
  return {
    primary: theme?.primary_color || '#1a1a1a',
    secondary: theme?.secondary_color || '#666666',
    accent: theme?.accent_color || '#2563eb',
    background: theme?.background_color || '#ffffff',
    tableHeaderBg: theme?.table_header_bg || '#f8f8f8',
    border: '#e5e5e5',
  };
}

// Helpers
function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Génère et télécharge un PDF vectoriel natif
 */
export async function downloadNativeVectorPdf(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme | null,
  filename?: string
): Promise<void> {
  const colors = getColors(theme || undefined);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = MARGIN_TOP;

  // ===== TOPBAR (optional) =====
  // Skipped for now - can be added via theme settings

  // ===== HEADER =====
  y = drawHeader(doc, document, agencyInfo, colors, y);
  
  // ===== INFO GRID =====
  y = drawInfoGrid(doc, document, colors, y);

  // ===== DATES ROW =====
  y = drawDatesRow(doc, document, colors, y);

  // ===== CONTEXT/INTRO (header_text) =====
  if (document.header_text) {
    y = drawContextSection(doc, document.header_text, colors, y);
  }

  // ===== PRICING TABLE =====
  y = drawPricingTable(doc, lines, colors, y);

  // ===== OPTIONS =====
  const optionalLines = lines.filter(l => !l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  if (optionalLines.length > 0) {
    y = drawOptionsSection(doc, optionalLines, colors, y);
  }

  // ===== TOTALS =====
  y = drawTotals(doc, document, lines, colors, y);

  // ===== PAYMENT TERMS =====
  if (document.payment_terms) {
    y = drawPaymentSection(doc, document.payment_terms, colors, y);
  }

  // ===== SPECIAL CONDITIONS =====
  if (document.special_conditions) {
    y = drawConditionsSection(doc, document.special_conditions, colors, y);
  }

  // ===== SIGNATURE =====
  y = drawSignatureSection(doc, document, agencyInfo, colors, y);

  // ===== FOOTER =====
  drawFooter(doc, agencyInfo, colors);

  // ===== PAGE NUMBERS =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(colors.secondary));
    doc.text(`${i} / ${totalPages}`, A4_WIDTH / 2, A4_HEIGHT - 8, { align: 'center' });
  }

  // Download
  const pdfFilename = filename 
    ? `${filename.replace(/[^a-zA-Z0-9_\-\s]/g, '_')}.pdf` 
    : `Devis_${document.document_number || 'brouillon'}.pdf`;
  doc.save(pdfFilename);
}

// ===== DRAW FUNCTIONS =====

function drawHeader(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  agencyInfo: AgencyInfo | null,
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  // Agency info (left side)
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.setFont('helvetica', 'bold');
  doc.text(agencyInfo?.name || '', MARGIN_LEFT, y + 5);

  if (agencyInfo?.forme_juridique) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(colors.secondary));
    y += 4;
    let legalText = agencyInfo.forme_juridique;
    if (agencyInfo.capital_social) {
      legalText += ` — Capital ${formatCurrency(agencyInfo.capital_social)}`;
    }
    doc.text(legalText, MARGIN_LEFT, y + 5);
  }

  // Agency address
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb(colors.secondary));
  const addressLines = [
    agencyInfo?.address,
    [agencyInfo?.postal_code, agencyInfo?.city].filter(Boolean).join(' '),
    agencyInfo?.phone ? `Tél. ${agencyInfo.phone}` : null,
    agencyInfo?.email,
    agencyInfo?.website,
  ].filter(Boolean);
  addressLines.forEach((line) => {
    y += 3.5;
    doc.text(line as string, MARGIN_LEFT, y + 5);
  });

  // Fiscal info
  y += 4;
  doc.setFontSize(6.5);
  const fiscalLines = [
    agencyInfo?.siret ? `SIRET ${agencyInfo.siret}` : null,
    agencyInfo?.vat_number ? `TVA ${agencyInfo.vat_number}` : null,
    agencyInfo?.rcs_city ? `RCS ${agencyInfo.rcs_city}` : null,
    agencyInfo?.code_naf ? `NAF ${agencyInfo.code_naf}` : null,
  ].filter(Boolean);
  if (fiscalLines.length > 0) {
    doc.text(fiscalLines.join(' — '), MARGIN_LEFT, y + 5);
  }

  // Document title (right side)
  const rightX = A4_WIDTH - MARGIN_RIGHT;
  let rightY = startY;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text('DEVIS', rightX, rightY + 5, { align: 'right' });

  rightY += 7;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text(`N° ${document.document_number || 'Brouillon'}`, rightX, rightY + 5, { align: 'right' });

  rightY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.secondary));
  const title = document.title || '';
  if (title) {
    const splitTitle = doc.splitTextToSize(title, 60);
    doc.text(splitTitle, rightX, rightY + 5, { align: 'right' });
  }

  // Bottom border
  const maxY = Math.max(y, rightY) + 10;
  doc.setDrawColor(...hexToRgb(colors.primary));
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, maxY + 5, A4_WIDTH - MARGIN_RIGHT, maxY + 5);

  return maxY + 12;
}

function drawInfoGrid(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  // Background box
  doc.setFillColor(...hexToRgb(colors.tableHeaderBg));
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 30, 2, 2, 'F');

  const colWidth = CONTENT_WIDTH / 3;

  // CLIENT
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text('CLIENT', MARGIN_LEFT + 5, y + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text(document.client_company?.name || '', MARGIN_LEFT + 5, y + 11);

  // CONTACT
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text('CONTACT', MARGIN_LEFT + colWidth + 5, y + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text(document.client_contact?.name || '', MARGIN_LEFT + colWidth + 5, y + 11);

  if (document.client_contact?.email) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(colors.secondary));
    doc.text(document.client_contact.email, MARGIN_LEFT + colWidth + 5, y + 16);
  }

  // VOTRE INTERLOCUTEUR or MARCHÉ PUBLIC
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.secondary));
  
  if (document.is_public_market) {
    doc.text('MARCHÉ PUBLIC', MARGIN_LEFT + colWidth * 2 + 5, y + 5);
    
    doc.setFillColor(...hexToRgb(colors.accent));
    doc.roundedRect(MARGIN_LEFT + colWidth * 2 + 5, y + 8, 28, 5, 1, 1, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('MARCHÉ PUBLIC', MARGIN_LEFT + colWidth * 2 + 7, y + 11.5);
    
    if (document.market_reference) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...hexToRgb(colors.secondary));
      doc.text(`Réf. ${document.market_reference}`, MARGIN_LEFT + colWidth * 2 + 5, y + 20);
    }
  } else {
    doc.text('VOTRE INTERLOCUTEUR', MARGIN_LEFT + colWidth * 2 + 5, y + 5);
    // Author info would go here if available
  }

  return y + 35;
}

function drawDatesRow(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb(colors.secondary));

  let x = MARGIN_LEFT;

  // Date d'émission
  doc.setFont('helvetica', 'normal');
  doc.text('Émis le', x, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text(formatDate(document.created_at) || formatDate(new Date().toISOString()), x + 15, y);
  x += 60;

  // Validité
  if (document.validity_days || document.valid_until) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(colors.secondary));
    doc.text('Valable jusqu\'au', x, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    
    const validityDate = document.valid_until 
      ? formatDate(document.valid_until)
      : formatDate(new Date(Date.now() + (document.validity_days || 30) * 24 * 60 * 60 * 1000).toISOString());
    doc.text(validityDate, x + 30, y);
  }

  // Border bottom
  y += 6;
  doc.setDrawColor(...hexToRgb(colors.border));
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, A4_WIDTH - MARGIN_RIGHT, y);

  return y + 8;
}

function drawContextSection(
  doc: jsPDF,
  text: string,
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  // Left accent border
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(MARGIN_LEFT, y, 1.5, 15, 'F');

  // Background
  doc.setFillColor(254, 254, 254);
  doc.rect(MARGIN_LEFT + 1.5, y, CONTENT_WIDTH - 1.5, 15, 'F');

  // Title
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text('OBJET', MARGIN_LEFT + 5, y + 5);

  // Text
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.secondary));
  const splitText = doc.splitTextToSize(text, CONTENT_WIDTH - 10);
  doc.text(splitText.slice(0, 3), MARGIN_LEFT + 5, y + 10);

  return y + 22;
}

function drawPricingTable(
  doc: jsPDF,
  lines: QuoteLine[],
  colors: PDFColors,
  startY: number
): number {
  // Filter included lines only
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');

  // Section title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text('DÉTAIL DES PRESTATIONS', MARGIN_LEFT, startY);

  const tableData = includedLines
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(line => [
      `${line.phase_code ? `${line.phase_code} — ` : ''}${line.phase_name || ''}${line.phase_description ? `\n${line.phase_description}` : ''}`,
      `${line.quantity || 1} ${line.unit || 'forfait'}`,
      formatCurrency(line.amount),
    ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Désignation', 'Quantité', 'Montant HT']],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: hexToRgb(colors.secondary),
      lineColor: hexToRgb(colors.border),
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: hexToRgb(colors.tableHeaderBg),
      textColor: hexToRgb(colors.secondary),
      fontStyle: 'bold',
      fontSize: 6,
    },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH * 0.55, textColor: hexToRgb(colors.primary) },
      1: { cellWidth: CONTENT_WIDTH * 0.2, halign: 'center' },
      2: { cellWidth: CONTENT_WIDTH * 0.25, halign: 'right', fontStyle: 'bold', textColor: hexToRgb(colors.primary) },
    },
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    tableWidth: CONTENT_WIDTH,
  });

  return (doc as any).lastAutoTable.finalY + 8;
}

function drawOptionsSection(
  doc: jsPDF,
  options: QuoteLine[],
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  // Dashed border box
  doc.setDrawColor(217, 119, 6); // amber
  doc.setFillColor(255, 251, 235);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 8 + options.length * 6, 2, 2, 'FD');
  doc.setLineDashPattern([], 0);

  // Title
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('OPTIONS (NON INCLUSES)', MARGIN_LEFT + 5, y + 5);

  y += 10;

  // Options list
  doc.setFontSize(7);
  options.forEach(opt => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(colors.secondary));
    doc.text(opt.phase_name || '', MARGIN_LEFT + 5, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(formatCurrency(opt.amount), A4_WIDTH - MARGIN_RIGHT - 5, y, { align: 'right' });
    
    y += 5;
  });

  return y + 5;
}

function drawTotals(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  colors: PDFColors,
  startY: number
): number {
  // Calculate totals
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const vatRate = document.vat_rate ?? 20;
  const tvaAmount = totalHT * (vatRate / 100);
  const totalTTC = totalHT + tvaAmount;

  const boxWidth = 60;
  const boxX = A4_WIDTH - MARGIN_RIGHT - boxWidth;
  let y = startY;

  // Background
  doc.setFillColor(...hexToRgb(colors.tableHeaderBg));
  doc.roundedRect(boxX, y, boxWidth, totalDiscount > 0 ? 38 : 30, 2, 2, 'F');

  const rowHeight = 5;
  const labelX = boxX + 5;
  const valueX = boxX + boxWidth - 5;
  y += 6;

  // Discount row (if applicable)
  if (totalDiscount > 0) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(colors.secondary));
    doc.text('Sous-total HT', labelX, y);
    doc.text(formatCurrency(subtotal), valueX, y, { align: 'right' });
    y += rowHeight;

    doc.setTextColor(185, 28, 28);
    doc.text('Remise', labelX, y);
    doc.text(`-${formatCurrency(totalDiscount)}`, valueX, y, { align: 'right' });
    y += rowHeight + 2;
  }

  // Total HT
  doc.setDrawColor(...hexToRgb(colors.primary));
  doc.setLineWidth(0.4);
  doc.line(labelX, y - 1, valueX, y - 1);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text('Total HT', labelX, y + 3);
  doc.text(formatCurrency(totalHT), valueX, y + 3, { align: 'right' });
  y += rowHeight + 3;

  // TVA
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text(`TVA ${vatRate}%`, labelX, y);
  doc.text(formatCurrency(tvaAmount), valueX, y, { align: 'right' });
  y += rowHeight;

  // Total TTC
  doc.setDrawColor(...hexToRgb(colors.border));
  doc.setLineWidth(0.2);
  doc.line(labelX, y - 1, valueX, y - 1);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text('Total TTC', labelX, y + 4);
  doc.text(formatCurrency(totalTTC), valueX, y + 4, { align: 'right' });

  return y + 15;
}

function drawPaymentSection(
  doc: jsPDF,
  paymentTerms: string,
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  // Background
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 15, 2, 2, 'F');

  // Title
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('MODALITÉS DE PAIEMENT', MARGIN_LEFT + 5, y + 5);

  // Text
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.secondary));
  const splitText = doc.splitTextToSize(paymentTerms, CONTENT_WIDTH - 10);
  doc.text(splitText.slice(0, 2), MARGIN_LEFT + 5, y + 10);

  return y + 20;
}

function drawConditionsSection(
  doc: jsPDF,
  conditions: string,
  colors: PDFColors,
  startY: number
): number {
  let y = startY;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text('CONDITIONS PARTICULIÈRES', MARGIN_LEFT, y);

  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.secondary));
  const splitText = doc.splitTextToSize(conditions, CONTENT_WIDTH);
  doc.text(splitText.slice(0, 3), MARGIN_LEFT, y);

  return y + splitText.slice(0, 3).length * 3 + 10;
}

function drawSignatureSection(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  agencyInfo: AgencyInfo | null,
  colors: PDFColors,
  startY: number
): number {
  // Check if we need a new page
  if (startY > A4_HEIGHT - 60) {
    doc.addPage();
    startY = MARGIN_TOP;
  }

  let y = startY;

  // Top border
  doc.setDrawColor(...hexToRgb(colors.border));
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, A4_WIDTH - MARGIN_RIGHT, y);

  y += 10;

  const boxWidth = (CONTENT_WIDTH - 20) / 2;

  // Agency box (left)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text('L\'ENTREPRISE', MARGIN_LEFT + boxWidth / 2, y, { align: 'center' });
  
  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text(agencyInfo?.name || '', MARGIN_LEFT + boxWidth / 2, y, { align: 'center' });

  // Client box (right) with dashed border
  const clientBoxX = MARGIN_LEFT + boxWidth + 20;
  doc.setDrawColor(...hexToRgb(colors.border));
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(clientBoxX, startY + 5, boxWidth, 30, 2, 2, 'S');
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text('LE CLIENT', clientBoxX + boxWidth / 2, startY + 10, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb(colors.primary));
  doc.text(document.client_company?.name || '', clientBoxX + boxWidth / 2, startY + 16, { align: 'center' });

  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...hexToRgb(colors.secondary));
  doc.text('Bon pour accord — Date et signature', clientBoxX + boxWidth / 2, startY + 30, { align: 'center' });

  return y + 30;
}

function drawFooter(
  doc: jsPDF,
  agencyInfo: AgencyInfo | null,
  colors: PDFColors
): void {
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    const y = A4_HEIGHT - MARGIN_BOTTOM + 5;

    // Brand
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(agencyInfo?.name || '', MARGIN_LEFT, y);

    // Year
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(colors.secondary));
    doc.text(`— ${new Date().getFullYear()}`, MARGIN_LEFT + doc.getTextWidth(agencyInfo?.name || '') + 2, y);

    // Contact (right)
    const rightX = A4_WIDTH - MARGIN_RIGHT;
    let contactY = y - 4;
    
    if (agencyInfo?.phone) {
      doc.text(agencyInfo.phone, rightX, contactY, { align: 'right' });
      contactY += 3;
    }
    if (agencyInfo?.email) {
      doc.text(agencyInfo.email, rightX, contactY, { align: 'right' });
      contactY += 3;
    }
    if (agencyInfo?.website) {
      doc.text(agencyInfo.website, rightX, contactY, { align: 'right' });
    }

    // Legal line (center)
    const legalParts = [
      agencyInfo?.siret ? `SIRET: ${agencyInfo.siret}` : null,
      agencyInfo?.vat_number ? `TVA: ${agencyInfo.vat_number}` : null,
      agencyInfo?.capital_social ? `Capital: ${formatCurrency(agencyInfo.capital_social)}` : null,
      agencyInfo?.rcs_city ? `RCS ${agencyInfo.rcs_city}` : null,
    ].filter(Boolean);

    if (legalParts.length > 0) {
      doc.setFontSize(6);
      doc.text(legalParts.join(' — '), A4_WIDTH / 2, y + 5, { align: 'center' });
    }
  }
}
