/**
 * Native Vector PDF Generator
 * 
 * Génère un PDF 100% vectoriel avec jsPDF + autoTable,
 * fidèle au design du template HTML mais sans rasterisation.
 * Respecte toutes les propriétés du thème (couleurs, styles, etc.)
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
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

// Theme-aware styling
interface PDFThemeConfig {
  // Colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  headerBg: string;
  tableHeaderBg: string;
  border: string;
  
  // Typography
  headingFont: string;
  bodyFont: string;
  headingSizePt: number;
  bodySizePt: number;
  
  // Layout
  headerStyle: 'classic' | 'modern' | 'minimal' | 'centered';
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  logoSizeMm: number;
  
  // Table
  tableBorderStyle: 'solid' | 'dashed' | 'none';
  tableStripeRows: boolean;
  
  // Footer
  footerStyle: 'simple' | 'detailed' | 'minimal';
  showSignatureArea: boolean;
}

function getThemeConfig(theme?: QuoteTheme): PDFThemeConfig {
  const parseSize = (size?: string, defaultPt: number = 10): number => {
    if (!size) return defaultPt;
    const num = parseFloat(size);
    if (isNaN(num)) return defaultPt;
    if (size.includes('px')) return Math.round(num * 0.75);
    return num;
  };
  
  const logoSizeMap: Record<string, number> = { small: 20, medium: 30, large: 40 };
  
  return {
    primary: theme?.primary_color || '#1a1a1a',
    secondary: theme?.secondary_color || '#666666',
    accent: theme?.accent_color || '#2563eb',
    background: theme?.background_color || '#ffffff',
    headerBg: theme?.header_bg_color || theme?.background_color || '#ffffff',
    tableHeaderBg: theme?.table_header_bg || '#f8f8f8',
    border: '#e5e5e5',
    headingFont: 'helvetica',
    bodyFont: 'helvetica',
    headingSizePt: parseSize(theme?.heading_size, 18),
    bodySizePt: parseSize(theme?.body_size, 8),
    headerStyle: theme?.header_style || 'classic',
    showLogo: theme?.show_logo ?? true,
    logoPosition: theme?.logo_position || 'left',
    logoSizeMm: logoSizeMap[theme?.logo_size || 'medium'] || 30,
    tableBorderStyle: theme?.table_border_style || 'solid',
    tableStripeRows: theme?.table_stripe_rows ?? false,
    footerStyle: theme?.footer_style || 'detailed',
    showSignatureArea: theme?.show_signature_area ?? true,
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
  const cfg = getThemeConfig(theme || undefined);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = MARGIN_TOP;

  // ===== HEADER =====
  y = drawHeader(doc, document, agencyInfo, cfg, y);
  
  // ===== INFO GRID =====
  y = drawInfoGrid(doc, document, cfg, y);

  // ===== DATES ROW =====
  y = drawDatesRow(doc, document, cfg, y);

  // ===== CONTEXT/INTRO (header_text) =====
  if (document.header_text) {
    y = drawContextSection(doc, document.header_text, cfg, y);
  }

  // ===== PRICING TABLE =====
  y = drawPricingTable(doc, lines, cfg, y);

  // ===== OPTIONS =====
  const optionalLines = lines.filter(l => !l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  if (optionalLines.length > 0) {
    y = drawOptionsSection(doc, optionalLines, cfg, y);
  }

  // ===== TOTALS =====
  y = drawTotals(doc, document, lines, cfg, y);

  // ===== PAYMENT TERMS =====
  if (document.payment_terms) {
    y = drawPaymentSection(doc, document.payment_terms, cfg, y);
  }

  // ===== SPECIAL CONDITIONS =====
  if (document.special_conditions) {
    y = drawConditionsSection(doc, document.special_conditions, cfg, y);
  }

  // ===== SIGNATURE =====
  if (cfg.showSignatureArea) {
    y = drawSignatureSection(doc, document, agencyInfo, cfg, y);
  }

  // ===== FOOTER =====
  drawFooter(doc, agencyInfo, cfg);

  // ===== PAGE NUMBERS =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(cfg.secondary));
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
  cfg: PDFThemeConfig,
  startY: number
): number {
  let y = startY;

  // Header background if not white
  if (cfg.headerBg !== '#ffffff' && cfg.headerBg !== cfg.background) {
    doc.setFillColor(...hexToRgb(cfg.headerBg));
    doc.rect(0, 0, A4_WIDTH, 50, 'F');
  }

  // Determine layout based on headerStyle
  const isModern = cfg.headerStyle === 'modern';
  const isMinimal = cfg.headerStyle === 'minimal';
  const isCentered = cfg.headerStyle === 'centered';

  if (isCentered) {
    // Centered layout
    doc.setFontSize(cfg.headingSizePt);
    doc.setTextColor(...hexToRgb(cfg.primary));
    doc.setFont(cfg.headingFont, 'bold');
    doc.text(agencyInfo?.name || '', A4_WIDTH / 2, y + 8, { align: 'center' });
    y += 12;
    
    doc.setFontSize(cfg.bodySizePt + 2);
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setTextColor(...hexToRgb(cfg.secondary));
    doc.text(`DEVIS N° ${document.document_number || 'Brouillon'}`, A4_WIDTH / 2, y + 5, { align: 'center' });
    y += 10;
    
    if (document.title) {
      doc.setFontSize(cfg.bodySizePt);
      const splitTitle = doc.splitTextToSize(document.title, 120);
      doc.text(splitTitle, A4_WIDTH / 2, y + 3, { align: 'center' });
      y += splitTitle.length * 4;
    }
  } else {
    // Classic/Modern/Minimal - Agency info on left, document on right
    
    // Agency name
    doc.setFontSize(isMinimal ? cfg.bodySizePt + 2 : 12);
    doc.setTextColor(...hexToRgb(cfg.primary));
    doc.setFont(cfg.headingFont, 'bold');
    doc.text(agencyInfo?.name || '', MARGIN_LEFT, y + 5);

    if (!isMinimal && agencyInfo?.forme_juridique) {
      doc.setFontSize(cfg.bodySizePt);
      doc.setFont(cfg.bodyFont, 'normal');
      doc.setTextColor(...hexToRgb(cfg.secondary));
      y += 4;
      let legalText = agencyInfo.forme_juridique;
      if (agencyInfo.capital_social) {
        legalText += ` — Capital ${formatCurrency(agencyInfo.capital_social)}`;
      }
      doc.text(legalText, MARGIN_LEFT, y + 5);
    }

    // Agency address (skip in minimal)
    if (!isMinimal) {
      y += 5;
      doc.setFontSize(cfg.bodySizePt - 1);
      doc.setTextColor(...hexToRgb(cfg.secondary));
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
      doc.setFontSize(cfg.bodySizePt - 1.5);
      const fiscalLines = [
        agencyInfo?.siret ? `SIRET ${agencyInfo.siret}` : null,
        agencyInfo?.vat_number ? `TVA ${agencyInfo.vat_number}` : null,
        agencyInfo?.rcs_city ? `RCS ${agencyInfo.rcs_city}` : null,
        agencyInfo?.code_naf ? `NAF ${agencyInfo.code_naf}` : null,
      ].filter(Boolean);
      if (fiscalLines.length > 0) {
        doc.text(fiscalLines.join(' — '), MARGIN_LEFT, y + 5);
      }
    }

    // Document title (right side)
    const rightX = A4_WIDTH - MARGIN_RIGHT;
    let rightY = startY;

    doc.setFontSize(cfg.bodySizePt);
    doc.setFont(cfg.headingFont, 'bold');
    doc.setTextColor(...hexToRgb(cfg.accent));
    doc.text('DEVIS', rightX, rightY + 5, { align: 'right' });

    rightY += 7;
    doc.setFontSize(cfg.headingSizePt);
    doc.setFont(cfg.headingFont, 'bold');
    doc.setTextColor(...hexToRgb(cfg.primary));
    doc.text(`N° ${document.document_number || 'Brouillon'}`, rightX, rightY + 5, { align: 'right' });

    rightY += 8;
    doc.setFontSize(cfg.bodySizePt + 1);
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setTextColor(...hexToRgb(cfg.secondary));
    const title = document.title || '';
    if (title) {
      const splitTitle = doc.splitTextToSize(title, 60);
      doc.text(splitTitle, rightX, rightY + 5, { align: 'right' });
    }

    y = Math.max(y, rightY) + 10;
  }

  // Bottom border (styled based on theme)
  if (cfg.tableBorderStyle !== 'none') {
    doc.setDrawColor(...hexToRgb(isModern ? cfg.accent : cfg.primary));
    doc.setLineWidth(isModern ? 1 : 0.5);
    if (cfg.tableBorderStyle === 'dashed') {
      doc.setLineDashPattern([2, 2], 0);
    }
    doc.line(MARGIN_LEFT, y + 5, A4_WIDTH - MARGIN_RIGHT, y + 5);
    doc.setLineDashPattern([], 0);
  }

  return y + 12;
}

function drawInfoGrid(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  cfg: PDFThemeConfig,
  startY: number
): number {
  let y = startY;

  // Background box
  doc.setFillColor(...hexToRgb(cfg.tableHeaderBg));
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 30, 2, 2, 'F');

  const colWidth = CONTENT_WIDTH / 3;

  // CLIENT
  doc.setFontSize(cfg.bodySizePt - 2);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  doc.text('CLIENT', MARGIN_LEFT + 5, y + 5);

  doc.setFontSize(cfg.bodySizePt + 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text(document.client_company?.name || '', MARGIN_LEFT + 5, y + 11);

  // CONTACT
  doc.setFontSize(cfg.bodySizePt - 2);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  doc.text('CONTACT', MARGIN_LEFT + colWidth + 5, y + 5);

  doc.setFontSize(cfg.bodySizePt + 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text(document.client_contact?.name || '', MARGIN_LEFT + colWidth + 5, y + 11);

  if (document.client_contact?.email) {
    doc.setFontSize(cfg.bodySizePt - 1);
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setTextColor(...hexToRgb(cfg.secondary));
    doc.text(document.client_contact.email, MARGIN_LEFT + colWidth + 5, y + 16);
  }

  // VOTRE INTERLOCUTEUR or MARCHÉ PUBLIC
  doc.setFontSize(cfg.bodySizePt - 2);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  
  if (document.is_public_market) {
    doc.text('MARCHÉ PUBLIC', MARGIN_LEFT + colWidth * 2 + 5, y + 5);
    
    doc.setFillColor(...hexToRgb(cfg.accent));
    doc.roundedRect(MARGIN_LEFT + colWidth * 2 + 5, y + 8, 28, 5, 1, 1, 'F');
    doc.setFontSize(5.5);
    doc.setFont(cfg.bodyFont, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('MARCHÉ PUBLIC', MARGIN_LEFT + colWidth * 2 + 7, y + 11.5);
    
    if (document.market_reference) {
      doc.setFontSize(cfg.bodySizePt - 1);
      doc.setFont(cfg.bodyFont, 'normal');
      doc.setTextColor(...hexToRgb(cfg.secondary));
      doc.text(`Réf. ${document.market_reference}`, MARGIN_LEFT + colWidth * 2 + 5, y + 20);
    }
  } else {
    doc.text('VOTRE INTERLOCUTEUR', MARGIN_LEFT + colWidth * 2 + 5, y + 5);
  }

  return y + 35;
}

function drawDatesRow(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  cfg: PDFThemeConfig,
  startY: number
): number {
  let y = startY;

  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setTextColor(...hexToRgb(cfg.secondary));

  let x = MARGIN_LEFT;

  // Date d'émission
  doc.setFont(cfg.bodyFont, 'normal');
  doc.text('Émis le', x, y);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text(formatDate(document.created_at) || formatDate(new Date().toISOString()), x + 15, y);
  x += 60;

  // Validité
  if (document.validity_days || document.valid_until) {
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setTextColor(...hexToRgb(cfg.secondary));
    doc.text('Valable jusqu\'au', x, y);
    doc.setFont(cfg.bodyFont, 'bold');
    doc.setTextColor(...hexToRgb(cfg.primary));
    
    const validityDate = document.valid_until 
      ? formatDate(document.valid_until)
      : formatDate(new Date(Date.now() + (document.validity_days || 30) * 24 * 60 * 60 * 1000).toISOString());
    doc.text(validityDate, x + 30, y);
  }

  // Border bottom
  y += 6;
  if (cfg.tableBorderStyle !== 'none') {
    doc.setDrawColor(...hexToRgb(cfg.border));
    doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, y, A4_WIDTH - MARGIN_RIGHT, y);
  }

  return y + 8;
}

function drawContextSection(
  doc: jsPDF,
  text: string,
  cfg: PDFThemeConfig,
  startY: number
): number {
  let y = startY;

  // Left accent border
  doc.setFillColor(...hexToRgb(cfg.accent));
  doc.rect(MARGIN_LEFT, y, 1.5, 15, 'F');

  // Background
  doc.setFillColor(254, 254, 254);
  doc.rect(MARGIN_LEFT + 1.5, y, CONTENT_WIDTH - 1.5, 15, 'F');

  // Title
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text('OBJET', MARGIN_LEFT + 5, y + 5);

  // Text
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'normal');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  const splitText = doc.splitTextToSize(text, CONTENT_WIDTH - 10);
  doc.text(splitText.slice(0, 3), MARGIN_LEFT + 5, y + 10);

  return y + 22;
}

function drawPricingTable(
  doc: jsPDF,
  lines: QuoteLine[],
  cfg: PDFThemeConfig,
  startY: number
): number {
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');

  // Section title
  doc.setFontSize(cfg.bodySizePt + 1);
  doc.setFont(cfg.headingFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text('DÉTAIL DES PRESTATIONS', MARGIN_LEFT, startY);

  const tableData = includedLines
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(line => [
      `${line.phase_code ? `${line.phase_code} — ` : ''}${line.phase_name || ''}${line.phase_description ? `\n${line.phase_description}` : ''}`,
      `${line.quantity || 1} ${line.unit || 'forfait'}`,
      formatCurrency(line.amount),
    ]);

  // Determine line width based on border style
  const lineWidth = cfg.tableBorderStyle === 'none' ? 0 : 0.1;

  autoTable(doc, {
    startY: startY + 5,
    head: [['Désignation', 'Quantité', 'Montant HT']],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: cfg.bodySizePt,
      cellPadding: 3,
      textColor: hexToRgb(cfg.secondary),
      lineColor: hexToRgb(cfg.border),
      lineWidth: lineWidth,
    },
    headStyles: {
      fillColor: hexToRgb(cfg.tableHeaderBg),
      textColor: hexToRgb(cfg.secondary),
      fontStyle: 'bold',
      fontSize: cfg.bodySizePt - 2,
    },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH * 0.55, textColor: hexToRgb(cfg.primary) },
      1: { cellWidth: CONTENT_WIDTH * 0.2, halign: 'center' },
      2: { cellWidth: CONTENT_WIDTH * 0.25, halign: 'right', fontStyle: 'bold', textColor: hexToRgb(cfg.primary) },
    },
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    tableWidth: CONTENT_WIDTH,
    alternateRowStyles: cfg.tableStripeRows ? { fillColor: [250, 250, 250] } : undefined,
    didDrawCell: (data) => {
      if (cfg.tableBorderStyle === 'dashed' && data.row.index >= 0) {
        doc.setLineDashPattern([1, 1], 0);
      }
    },
  });

  doc.setLineDashPattern([], 0);

  return (doc as any).lastAutoTable.finalY + 8;
}

function drawOptionsSection(
  doc: jsPDF,
  options: QuoteLine[],
  cfg: PDFThemeConfig,
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
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('OPTIONS (NON INCLUSES)', MARGIN_LEFT + 5, y + 5);

  y += 10;

  // Options list
  doc.setFontSize(cfg.bodySizePt - 1);
  options.forEach(opt => {
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setTextColor(...hexToRgb(cfg.secondary));
    doc.text(opt.phase_name || '', MARGIN_LEFT + 5, y);
    
    doc.setFont(cfg.bodyFont, 'bold');
    doc.setTextColor(...hexToRgb(cfg.primary));
    doc.text(formatCurrency(opt.amount), A4_WIDTH - MARGIN_RIGHT - 5, y, { align: 'right' });
    
    y += 5;
  });

  return y + 5;
}

function drawTotals(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  cfg: PDFThemeConfig,
  startY: number
): number {
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
  doc.setFillColor(...hexToRgb(cfg.tableHeaderBg));
  doc.roundedRect(boxX, y, boxWidth, totalDiscount > 0 ? 38 : 30, 2, 2, 'F');

  const rowHeight = 5;
  const labelX = boxX + 5;
  const valueX = boxX + boxWidth - 5;
  y += 6;

  // Discount row
  if (totalDiscount > 0) {
    doc.setFontSize(cfg.bodySizePt - 1);
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setTextColor(...hexToRgb(cfg.secondary));
    doc.text('Sous-total HT', labelX, y);
    doc.text(formatCurrency(subtotal), valueX, y, { align: 'right' });
    y += rowHeight;

    doc.setTextColor(185, 28, 28);
    doc.text('Remise', labelX, y);
    doc.text(`-${formatCurrency(totalDiscount)}`, valueX, y, { align: 'right' });
    y += rowHeight + 2;
  }

  // Total HT
  doc.setDrawColor(...hexToRgb(cfg.primary));
  doc.setLineWidth(0.4);
  doc.line(labelX, y - 1, valueX, y - 1);

  doc.setFontSize(cfg.bodySizePt + 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text('Total HT', labelX, y + 3);
  doc.text(formatCurrency(totalHT), valueX, y + 3, { align: 'right' });
  y += rowHeight + 3;

  // TVA
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'normal');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  doc.text(`TVA ${vatRate}%`, labelX, y);
  doc.text(formatCurrency(tvaAmount), valueX, y, { align: 'right' });
  y += rowHeight;

  // Total TTC
  doc.setDrawColor(...hexToRgb(cfg.border));
  doc.setLineWidth(0.2);
  doc.line(labelX, y - 1, valueX, y - 1);

  doc.setFontSize(cfg.bodySizePt + 3);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text('Total TTC', labelX, y + 4);
  doc.text(formatCurrency(totalTTC), valueX, y + 4, { align: 'right' });

  return y + 15;
}

function drawPaymentSection(
  doc: jsPDF,
  paymentTerms: string,
  cfg: PDFThemeConfig,
  startY: number
): number {
  let y = startY;

  // Background
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 15, 2, 2, 'F');

  // Title
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('MODALITÉS DE PAIEMENT', MARGIN_LEFT + 5, y + 5);

  // Text
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'normal');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  const splitText = doc.splitTextToSize(paymentTerms, CONTENT_WIDTH - 10);
  doc.text(splitText.slice(0, 2), MARGIN_LEFT + 5, y + 10);

  return y + 20;
}

function drawConditionsSection(
  doc: jsPDF,
  conditions: string,
  cfg: PDFThemeConfig,
  startY: number
): number {
  let y = startY;

  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text('CONDITIONS PARTICULIÈRES', MARGIN_LEFT, y);

  y += 5;
  doc.setFontSize(cfg.bodySizePt - 1);
  doc.setFont(cfg.bodyFont, 'normal');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  const splitText = doc.splitTextToSize(conditions, CONTENT_WIDTH);
  doc.text(splitText.slice(0, 3), MARGIN_LEFT, y);

  return y + splitText.slice(0, 3).length * 3 + 10;
}

function drawSignatureSection(
  doc: jsPDF,
  document: Partial<QuoteDocument>,
  agencyInfo: AgencyInfo | null,
  cfg: PDFThemeConfig,
  startY: number
): number {
  // Check if we need a new page
  if (startY > A4_HEIGHT - 60) {
    doc.addPage();
    startY = MARGIN_TOP;
  }

  let y = startY;

  // Top border
  if (cfg.tableBorderStyle !== 'none') {
    doc.setDrawColor(...hexToRgb(cfg.border));
    doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, y, A4_WIDTH - MARGIN_RIGHT, y);
  }

  y += 10;

  const boxWidth = (CONTENT_WIDTH - 20) / 2;

  // Agency box (left)
  doc.setFontSize(cfg.bodySizePt - 2);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  doc.text('L\'ENTREPRISE', MARGIN_LEFT + boxWidth / 2, y, { align: 'center' });
  
  y += 4;
  doc.setFontSize(cfg.bodySizePt);
  doc.setFont(cfg.bodyFont, 'normal');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text(agencyInfo?.name || '', MARGIN_LEFT + boxWidth / 2, y, { align: 'center' });

  // Client box (right) with dashed border
  const clientBoxX = MARGIN_LEFT + boxWidth + 20;
  doc.setDrawColor(...hexToRgb(cfg.border));
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(clientBoxX, startY + 5, boxWidth, 30, 2, 2, 'S');
  doc.setLineDashPattern([], 0);

  doc.setFontSize(cfg.bodySizePt - 2);
  doc.setFont(cfg.bodyFont, 'bold');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  doc.text('LE CLIENT', clientBoxX + boxWidth / 2, startY + 10, { align: 'center' });

  doc.setFontSize(cfg.bodySizePt);
  doc.setFont(cfg.bodyFont, 'normal');
  doc.setTextColor(...hexToRgb(cfg.primary));
  doc.text(document.client_company?.name || '', clientBoxX + boxWidth / 2, startY + 16, { align: 'center' });

  doc.setFontSize(cfg.bodySizePt - 2);
  doc.setFont(cfg.bodyFont, 'italic');
  doc.setTextColor(...hexToRgb(cfg.secondary));
  doc.text('Bon pour accord — Date et signature', clientBoxX + boxWidth / 2, startY + 30, { align: 'center' });

  return y + 30;
}

function drawFooter(
  doc: jsPDF,
  agencyInfo: AgencyInfo | null,
  cfg: PDFThemeConfig
): void {
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    const y = A4_HEIGHT - MARGIN_BOTTOM + 5;

    if (cfg.footerStyle === 'minimal') {
      // Minimal: just agency name and year
      doc.setFontSize(cfg.bodySizePt - 1);
      doc.setFont(cfg.bodyFont, 'normal');
      doc.setTextColor(...hexToRgb(cfg.secondary));
      doc.text(`${agencyInfo?.name || ''} — ${new Date().getFullYear()}`, A4_WIDTH / 2, y, { align: 'center' });
    } else if (cfg.footerStyle === 'simple') {
      // Simple: name + year on left
      doc.setFontSize(cfg.bodySizePt);
      doc.setFont(cfg.bodyFont, 'bold');
      doc.setTextColor(...hexToRgb(cfg.primary));
      doc.text(agencyInfo?.name || '', MARGIN_LEFT, y);
      doc.setFont(cfg.bodyFont, 'normal');
      doc.setTextColor(...hexToRgb(cfg.secondary));
      doc.text(`— ${new Date().getFullYear()}`, MARGIN_LEFT + doc.getTextWidth(agencyInfo?.name || '') + 2, y);
    } else {
      // Detailed: full footer
      doc.setFontSize(cfg.bodySizePt);
      doc.setFont(cfg.bodyFont, 'bold');
      doc.setTextColor(...hexToRgb(cfg.primary));
      doc.text(agencyInfo?.name || '', MARGIN_LEFT, y);
      
      doc.setFontSize(cfg.bodySizePt - 1);
      doc.setFont(cfg.bodyFont, 'normal');
      doc.setTextColor(...hexToRgb(cfg.secondary));
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
        doc.setFontSize(cfg.bodySizePt - 2);
        doc.text(legalParts.join(' — '), A4_WIDTH / 2, y + 5, { align: 'center' });
      }
    }
  }
}
