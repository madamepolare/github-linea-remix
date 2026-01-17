// Simple 1-page PDF generator for quotes (devis)
// Clean, professional design with proper margins and typography

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { AgencyPDFInfo, loadImageAsBase64 } from './pdfUtils';
import { formatCurrencyPDF } from './pdfFonts';

export async function generateQuotePDFSimple(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo?: AgencyPDFInfo | null
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Load logo if available
  const logoBase64 = agencyInfo?.logo_url 
    ? await loadImageAsBase64(agencyInfo.logo_url) 
    : null;

  // Consistent 20mm margins
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  let y = margin;

  // === HEADER ===
  
  // Logo - preserve aspect ratio
  if (logoBase64) {
    try {
      const maxLogoWidth = 45;
      const maxLogoHeight = 30;
      pdf.addImage(logoBase64, 'AUTO', margin, y, maxLogoWidth, maxLogoHeight, undefined, 'FAST');
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  // Agency info (right side)
  if (agencyInfo?.name) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text(agencyInfo.name, pageWidth - margin, y, { align: 'right' });
    y += 5;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    
    if (agencyInfo.address) {
      pdf.text(agencyInfo.address, pageWidth - margin, y + 5, { align: 'right' });
    }
    if (agencyInfo.postal_code || agencyInfo.city) {
      pdf.text(`${agencyInfo.postal_code || ''} ${agencyInfo.city || ''}`.trim(), pageWidth - margin, y + 10, { align: 'right' });
    }
    if (agencyInfo.phone) {
      pdf.text(`Tél: ${agencyInfo.phone}`, pageWidth - margin, y + 15, { align: 'right' });
    }
    if (agencyInfo.email) {
      pdf.text(agencyInfo.email, pageWidth - margin, y + 20, { align: 'right' });
    }
  }

  y = margin + 40;

  // Document title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text(document.document_type === 'quote' ? 'DEVIS' : 'PROPOSITION', margin, y);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  pdf.text(`N° ${document.document_number || 'BROUILLON'}`, margin, y + 6);
  pdf.text(`Date: ${format(new Date(document.created_at || new Date()), 'd MMMM yyyy', { locale: fr })}`, margin, y + 11);

  y += 25;

  // === CLIENT INFO ===
  if (document.client_company || document.client_contact) {
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, y, contentWidth, 25, 'F');
    
    y += 6;
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text('CLIENT', margin + 4, y);
    y += 5;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30);
    pdf.text(document.client_company?.name || document.client_contact?.name || '', margin + 4, y);
    
    if (document.client_contact?.name && document.client_company?.name) {
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(document.client_contact.name, margin + 4, y);
    }
    
    y += 20;
  }

  // === PROJECT INFO ===
  y += 5;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text(document.title || 'Projet sans titre', margin, y);
  y += 5;

  if (document.description) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80);
    const descLines = pdf.splitTextToSize(document.description, contentWidth);
    descLines.slice(0, 2).forEach((line: string) => {
      pdf.text(line, margin, y);
      y += 4;
    });
  }

  // Project details inline
  const projectDetails: string[] = [];
  if (document.project_address) projectDetails.push(`📍 ${document.project_address}`);
  if (document.project_surface) projectDetails.push(`📐 ${document.project_surface} m²`);
  if (document.construction_budget) projectDetails.push(`💰 Budget: ${formatCurrencyPDF(document.construction_budget)}`);
  
  if (projectDetails.length > 0) {
    y += 3;
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(projectDetails.join('  •  '), margin, y);
  }

  y += 12;

  // === LINES TABLE ===
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  
  const tableData = includedLines.map(line => [
    line.pricing_ref || line.phase_code || '-',
    line.phase_name || 'Prestation',
    line.quantity?.toString() || '1',
    line.unit_price ? formatCurrencyPDF(line.unit_price) : '-',
    formatCurrencyPDF(line.amount || 0)
  ]);

  // Add discounts
  discountLines.forEach(line => {
    tableData.push([
      '',
      `Remise: ${line.phase_name || 'Remise'}`,
      '',
      '',
      `-${formatCurrencyPDF(Math.abs(line.amount || 0))}`
    ]);
  });

  autoTable(pdf, {
    startY: y,
    head: [['Réf.', 'Désignation', 'Qté', 'P.U.', 'Montant HT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 30,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 85 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Style discount rows
      if (data.row.raw && (data.row.raw as string[])[1]?.toString().startsWith('Remise')) {
        data.cell.styles.textColor = [180, 50, 50];
        data.cell.styles.fontStyle = 'italic';
      }
    }
  });

  y = (pdf as any).lastAutoTable.finalY + 8;

  // === TOTALS ===
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const tvaRate = (document.vat_rate || 20) / 100;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;

  const totalsX = pageWidth - margin - 60;
  
  pdf.setFontSize(9);
  pdf.setTextColor(60);
  pdf.text('Total HT', totalsX, y);
  pdf.setTextColor(30);
  pdf.text(formatCurrencyPDF(totalHT), pageWidth - margin, y, { align: 'right' });
  y += 5;

  pdf.setTextColor(100);
  pdf.text(`TVA (${(document.vat_rate || 20)}%)`, totalsX, y);
  pdf.text(formatCurrencyPDF(tvaAmount), pageWidth - margin, y, { align: 'right' });
  y += 6;

  pdf.setDrawColor(30);
  pdf.line(totalsX, y, pageWidth - margin, y);
  y += 5;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('Total TTC', totalsX, y);
  pdf.text(formatCurrencyPDF(totalTTC), pageWidth - margin, y, { align: 'right' });

  y += 15;

  // === PAYMENT TERMS ===
  if (document.payment_terms) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text('Conditions de paiement', margin, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(80);
    const paymentLines = pdf.splitTextToSize(document.payment_terms, contentWidth);
    paymentLines.slice(0, 3).forEach((line: string) => {
      pdf.text(line, margin, y);
      y += 4;
    });
    y += 4;
  }

  // Validity
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text(`Ce devis est valable ${document.validity_days || 30} jours.`, margin, y);

  // === SIGNATURE AREA ===
  y = pageHeight - 55;
  
  pdf.setFontSize(8);
  pdf.setTextColor(60);
  pdf.text('Date et signature du client', margin, y);
  pdf.text('Bon pour accord', margin, y + 4);
  
  pdf.setDrawColor(180);
  pdf.rect(margin, y + 8, 60, 25);

  // Agency signature
  if (agencyInfo?.signature_url) {
    const signatureBase64 = await loadImageAsBase64(agencyInfo.signature_url);
    if (signatureBase64) {
      try {
        pdf.addImage(signatureBase64, 'PNG', pageWidth - margin - 50, y + 5, 45, 22);
      } catch (e) {
        console.error('Error adding signature:', e);
      }
    }
  }

  // === FOOTER ===
  y = pageHeight - 15;
  pdf.setFontSize(7);
  pdf.setTextColor(130);
  
  const footerParts = [agencyInfo?.name];
  if (agencyInfo?.siret) footerParts.push(`SIRET: ${agencyInfo.siret}`);
  if (agencyInfo?.vat_number) footerParts.push(`TVA: ${agencyInfo.vat_number}`);
  
  pdf.text(footerParts.filter(Boolean).join(' - '), pageWidth / 2, y, { align: 'center' });

  return pdf.output('blob');
}
