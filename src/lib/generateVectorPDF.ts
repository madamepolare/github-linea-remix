/**
 * Vector PDF Generator
 * 
 * Génère des PDFs vectoriels (texte sélectionnable, zoom infini sans pixelisation)
 * en utilisant jsPDF directement au lieu de html2canvas.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo } from './quoteTemplateVariables';
import { loadImageAsBase64 } from './pdfUtils';

// Color themes for PDF
const PDF_COLOR_THEMES: Record<string, { primary: [number, number, number]; accent: [number, number, number] }> = {
  default: { primary: [26, 26, 26], accent: [124, 58, 237] },
  ocean: { primary: [3, 105, 161], accent: [14, 165, 233] },
  forest: { primary: [22, 101, 52], accent: [34, 197, 94] },
  sunset: { primary: [194, 65, 12], accent: [236, 72, 153] },
  purple: { primary: [124, 58, 237], accent: [168, 85, 247] },
  rose: { primary: [190, 18, 60], accent: [244, 114, 182] },
};

interface VectorPDFContext {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  y: number;
  pageNumber: number;
  totalPages: number;
  themeColors: { primary: [number, number, number]; accent: [number, number, number] };
  logoBase64: string | null;
  document: Partial<QuoteDocument>;
  agencyInfo: AgencyInfo | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

/**
 * Draw the header section (agency info + document title)
 */
function drawHeader(ctx: VectorPDFContext): number {
  const { pdf, pageWidth, margin, agencyInfo, document, logoBase64 } = ctx;
  let y = margin;

  // Logo
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, y, 22, 22);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  const textX = logoBase64 ? margin + 27 : margin;

  // Agency name
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(agencyInfo?.name || 'Agence', textX, y + 5);

  // Agency legal form
  if (agencyInfo?.forme_juridique) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    let legalText = agencyInfo.forme_juridique;
    if (agencyInfo.capital_social) {
      legalText += ` — Capital ${formatCurrency(agencyInfo.capital_social)}`;
    }
    pdf.text(legalText, textX, y + 10);
  }

  // Agency address
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  const addressParts: string[] = [];
  if (agencyInfo?.address) addressParts.push(agencyInfo.address);
  if (agencyInfo?.postal_code || agencyInfo?.city) {
    addressParts.push([agencyInfo.postal_code, agencyInfo.city].filter(Boolean).join(' '));
  }
  if (addressParts.length > 0) {
    pdf.text(addressParts.join(', '), textX, y + 14);
  }

  // Agency contact
  const contactParts: string[] = [];
  if (agencyInfo?.phone) contactParts.push(`Tél. ${agencyInfo.phone}`);
  if (agencyInfo?.email) contactParts.push(agencyInfo.email);
  if (contactParts.length > 0) {
    pdf.text(contactParts.join(' • '), textX, y + 18);
  }

  // SIRET / TVA
  const fiscalParts: string[] = [];
  if (agencyInfo?.siret) fiscalParts.push(`SIRET ${agencyInfo.siret}`);
  if (agencyInfo?.vat_number) fiscalParts.push(`TVA ${agencyInfo.vat_number}`);
  if (agencyInfo?.rcs_city) fiscalParts.push(`RCS ${agencyInfo.rcs_city}`);
  if (fiscalParts.length > 0) {
    pdf.setFontSize(6);
    pdf.setTextColor(120);
    pdf.text(fiscalParts.join(' • '), textX, y + 22);
  }

  // Document type (right side)
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...ctx.themeColors.primary);
  pdf.text('DEVIS', pageWidth - margin, y + 6, { align: 'right' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  pdf.text(`N° ${document.document_number || 'Brouillon'}`, pageWidth - margin, y + 13, { align: 'right' });

  // Document title
  if (document.title) {
    pdf.setFontSize(9);
    pdf.setTextColor(80);
    const titleLines = pdf.splitTextToSize(document.title, 70);
    pdf.text(titleLines, pageWidth - margin, y + 19, { align: 'right' });
  }

  return y + 30;
}

/**
 * Draw info grid (Client + Contact + Interlocuteur)
 */
function drawInfoGrid(ctx: VectorPDFContext, startY: number): number {
  const { pdf, pageWidth, margin, contentWidth, document, agencyInfo } = ctx;
  let y = startY;

  // Separator line
  pdf.setDrawColor(220);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  const colWidth = contentWidth / 3 - 4;
  const col1X = margin;
  const col2X = margin + colWidth + 6;
  const col3X = margin + (colWidth + 6) * 2;

  // Column 1: Client
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  pdf.text('CLIENT', col1X, y);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(document.client_company?.name || 'Non défini', col1X, y + 5);

  // Column 2: Contact
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  pdf.text('CONTACT', col2X, y);

  if (document.client_contact?.name) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0);
    pdf.text(document.client_contact.name, col2X, y + 5);
    if (document.client_contact?.email) {
      pdf.setFontSize(8);
      pdf.setTextColor(80);
      pdf.text(document.client_contact.email, col2X, y + 10);
    }
  } else {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(120);
    pdf.text('Non renseigné', col2X, y + 5);
  }

  // Column 3: Your contact / Public market
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  if (document.is_public_market) {
    pdf.text('MARCHÉ PUBLIC', col3X, y);
    if (document.market_reference) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0);
      pdf.text(`Réf. ${document.market_reference}`, col3X, y + 5);
    }
  } else {
    pdf.text('VOTRE INTERLOCUTEUR', col3X, y);
    // Use agency name as fallback
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80);
    pdf.text(agencyInfo?.name || '—', col3X, y + 5);
  }

  y += 18;

  // Project location if exists
  if (document.project_address || document.project_city) {
    pdf.setDrawColor(230);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100);
    pdf.text("LIEU D'EXÉCUTION", margin, y);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0);
    const location = [document.project_address, document.postal_code, document.project_city]
      .filter(Boolean)
      .join(', ');
    pdf.text(location, margin, y + 5);

    if (document.project_surface) {
      pdf.setFontSize(8);
      pdf.setTextColor(80);
      pdf.text(`Surface : ${document.project_surface} m²`, margin, y + 10);
      y += 5;
    }

    y += 10;
  }

  // Final separator
  pdf.setDrawColor(220);
  pdf.line(margin, y, pageWidth - margin, y);

  return y + 6;
}

/**
 * Draw the pricing table
 */
function drawPricingTable(ctx: VectorPDFContext, lines: QuoteLine[], startY: number): number {
  const { pdf, margin, themeColors } = ctx;

  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'group');
  const optionalLines = lines.filter(l => !l.is_included || l.is_optional);

  // Main table
  const tableData = includedLines.map(line => [
    line.phase_code || '',
    line.phase_name,
    line.quantity > 1 ? `${line.quantity} ${line.unit || ''}`.trim() : '',
    formatCurrency(line.amount)
  ]);

  autoTable(pdf, {
    startY: startY,
    head: [['Réf.', 'Désignation', 'Qté', 'Montant HT']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: themeColors.primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
      cellPadding: 3,
      lineColor: [235, 235, 235],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', textColor: themeColors.primary },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Add description as subtext if available
      if (data.section === 'body' && data.column.index === 1) {
        const line = includedLines[data.row.index];
        if (line?.phase_description) {
          data.cell.text = [line.phase_name];
        }
      }
    }
  });

  let y = (pdf as any).lastAutoTable.finalY + 5;

  // Options section
  if (optionalLines.length > 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100);
    pdf.text('Options (non incluses)', margin, y + 3);
    y += 5;

    const optionData = optionalLines.map(line => [
      line.phase_code || '',
      line.phase_name,
      formatCurrency(line.amount)
    ]);

    autoTable(pdf, {
      startY: y,
      body: optionData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 8,
        textColor: [100, 100, 100],
        cellPadding: 2,
        fontStyle: 'italic'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  return y;
}

/**
 * Draw totals section
 */
function drawTotals(ctx: VectorPDFContext, total: number, startY: number): number {
  const { pdf, pageWidth, margin, themeColors, document } = ctx;
  let y = startY;

  const vatRate = document.vat_rate ?? 20;
  const tva = total * (vatRate / 100);
  const ttc = total + tva;

  const totalsX = pageWidth - margin - 65;

  // Background box
  pdf.setFillColor(248, 248, 248);
  pdf.roundedRect(totalsX - 5, y - 2, 70, 32, 2, 2, 'F');

  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text('Total HT', totalsX, y + 5);
  pdf.setTextColor(0);
  pdf.text(formatCurrency(total), pageWidth - margin, y + 5, { align: 'right' });

  y += 8;
  pdf.setTextColor(80);
  pdf.text(`TVA (${vatRate}%)`, totalsX, y + 5);
  pdf.setTextColor(0);
  pdf.text(formatCurrency(tva), pageWidth - margin, y + 5, { align: 'right' });

  y += 10;
  pdf.setDrawColor(...themeColors.primary);
  pdf.setLineWidth(0.5);
  pdf.line(totalsX, y, pageWidth - margin, y);

  y += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...themeColors.primary);
  pdf.text('Total TTC', totalsX, y + 2);
  pdf.text(formatCurrency(ttc), pageWidth - margin, y + 2, { align: 'right' });

  return y + 15;
}

/**
 * Draw validity and signature section
 */
function drawSignatureSection(ctx: VectorPDFContext, startY: number): number {
  const { pdf, pageWidth, margin, document } = ctx;
  let y = startY;

  // Validity
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  const validityText = `Devis valable ${document.validity_days || 30} jours à compter de sa date d'émission.`;
  pdf.text(validityText, margin, y);

  if (document.payment_terms) {
    y += 4;
    pdf.text(`Conditions de paiement : ${document.payment_terms}`, margin, y);
  }

  y += 12;

  // Signature box
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text('Bon pour accord, date et signature :', margin, y);

  y += 3;
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, 70, 28);

  // Mention
  pdf.setFontSize(7);
  pdf.setTextColor(120);
  pdf.text('Lu et approuvé', margin + 2, y + 26);

  return y + 35;
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(pdf: jsPDF): void {
  const totalPages = pdf.getNumberOfPages();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    const text = `${i} / ${totalPages}`;
    const textWidth = pdf.getTextWidth(text);
    pdf.text(text, (pageWidth - textWidth) / 2, pageHeight - 10);
  }
}

/**
 * Check if we need a new page and add one if necessary
 */
function checkPageBreak(ctx: VectorPDFContext, neededHeight: number): void {
  const { pdf, pageHeight, margin } = ctx;
  const maxY = pageHeight - 20; // Leave room for footer

  if (ctx.y + neededHeight > maxY) {
    pdf.addPage();
    ctx.pageNumber++;
    // Redraw header on new page
    ctx.y = drawHeader(ctx);
    ctx.y = drawInfoGrid(ctx, ctx.y);
  }
}

/**
 * Main function to generate vector PDF
 */
export async function downloadVectorPdf(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme | null,
  filename?: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Determine theme colors
  const themeId = theme?.name?.toLowerCase() || 'default';
  const themeColors = PDF_COLOR_THEMES[themeId] || PDF_COLOR_THEMES.default;

  // Load logo
  let logoBase64: string | null = null;
  if (agencyInfo?.logo_url) {
    logoBase64 = await loadImageAsBase64(agencyInfo.logo_url);
  }

  // Create context
  const ctx: VectorPDFContext = {
    pdf,
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
    y: margin,
    pageNumber: 1,
    totalPages: 1,
    themeColors,
    logoBase64,
    document,
    agencyInfo
  };

  // Draw sections
  ctx.y = drawHeader(ctx);
  ctx.y = drawInfoGrid(ctx, ctx.y);

  // Calculate total
  const total = lines
    .filter(l => l.is_included && l.line_type !== 'group')
    .reduce((sum, l) => sum + l.amount, 0);

  ctx.y = drawPricingTable(ctx, lines, ctx.y);
  ctx.y = drawTotals(ctx, total, ctx.y);
  ctx.y = drawSignatureSection(ctx, ctx.y);

  // Add page numbers
  addPageNumbers(pdf);

  // Save
  const pdfFilename = filename || `Devis_${document.document_number || 'brouillon'}`;
  pdf.save(`${pdfFilename}.pdf`);
}
