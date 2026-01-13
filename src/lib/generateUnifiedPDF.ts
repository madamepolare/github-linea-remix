// Unified PDF Generator with configurable blocks

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  PDFBlockConfig, 
  PDFRenderContext, 
  getBlocksForDocumentType,
  PDFDocumentConfig
} from './pdfBlockTypes';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  formatFullAddress,
  formatLegalInfo,
  addPDFFooter
} from './pdfUtils';
import { QuoteLine, QuoteDocument, DocumentType } from '@/types/quoteTypes';
import { CommercialDocument, CommercialDocumentPhase, PROJECT_TYPE_LABELS, FEE_MODE_LABELS } from './commercialTypes';

// ============= Main Generator =============

export async function generateUnifiedPDF(
  document: Partial<QuoteDocument> | Partial<CommercialDocument>,
  lines: QuoteLine[],
  total: number,
  agencyInfo?: AgencyPDFInfo,
  pdfConfig?: PDFDocumentConfig | null,
  documentType?: DocumentType
): Promise<Blob> {
  const docType = documentType || (document as any).document_type || 'quote';
  const blocks = getBlocksForDocumentType(pdfConfig, docType);
  
  // Determine orientation based on document type
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Load images
  const logoBase64 = agencyInfo?.logo_url 
    ? await loadImageAsBase64(agencyInfo.logo_url) 
    : null;
  const signatureBase64 = agencyInfo?.signature_url 
    ? await loadImageAsBase64(agencyInfo.signature_url) 
    : null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const context: PDFRenderContext = {
    document,
    lines,
    agencyInfo,
    logoBase64,
    signatureBase64,
    total,
    formatCurrency,
  };

  // Convert QuoteLines to phases if needed (for backward compatibility)
  const phases: CommercialDocumentPhase[] = lines.map(line => ({
    id: line.id,
    document_id: line.document_id || '',
    phase_code: line.phase_code || '',
    phase_name: line.phase_name,
    phase_description: line.phase_description,
    percentage_fee: line.percentage_fee || 0,
    amount: line.amount,
    is_included: line.is_included,
    deliverables: line.deliverables || [],
    start_date: line.start_date,
    end_date: line.end_date,
    sort_order: line.sort_order,
    created_at: '',
    updated_at: '',
  }));
  
  context.phases = phases;

  // Render blocks based on document type
  let y = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Track if we need pagination helper
  const addPageIfNeeded = (requiredSpace: number = 30): boolean => {
    if (y + requiredSpace > pageHeight - 30) {
      addPDFFooter(pdf, agencyInfo);
      pdf.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Render each block
  for (const block of blocks) {
    switch (block.block_type) {
      case 'cover':
        y = renderCoverBlock(pdf, context, margin, pageWidth, pageHeight, docType);
        if (docType === 'contract') {
          pdf.addPage();
          y = 20;
        }
        break;
        
      case 'header':
        y = renderHeaderBlock(pdf, context, margin, pageWidth, y);
        break;
        
      case 'client':
        addPageIfNeeded(40);
        y = renderClientBlock(pdf, context, margin, contentWidth, y);
        break;
        
      case 'project':
        addPageIfNeeded(50);
        y = renderProjectBlock(pdf, context, margin, contentWidth, y);
        break;
        
      case 'lines':
      case 'phases':
        addPageIfNeeded(80);
        y = renderLinesBlock(pdf, context, margin, pageWidth, y, addPageIfNeeded);
        break;
        
      case 'totals':
        addPageIfNeeded(40);
        y = renderTotalsBlock(pdf, context, margin, pageWidth, y, false);
        break;
        
      case 'payment':
        addPageIfNeeded(50);
        y = renderPaymentBlock(pdf, context, margin, contentWidth, y);
        break;
        
      case 'conditions':
        addPageIfNeeded(40);
        y = renderConditionsBlock(pdf, context, margin, contentWidth, y, addPageIfNeeded);
        break;
        
      case 'signatures':
        addPageIfNeeded(80);
        y = renderSignaturesBlock(pdf, context, margin, pageWidth, contentWidth, y);
        break;
    }
  }

  // Add footer to all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addPDFFooter(pdf, agencyInfo);
  }

  return pdf.output('blob');
}

// ============= Block Renderers =============

function renderCoverBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  docType: DocumentType
): number {
  const { document, agencyInfo, logoBase64, total, formatCurrency } = ctx;
  
  // Logo
  let y = 30;
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, y, 30, 30);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  y = 75;
  
  // Document type label
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  
  const typeLabels: Record<DocumentType, string> = {
    quote: 'DEVIS',
    contract: 'CONTRAT DE MAÎTRISE D\'ŒUVRE'
  };
  pdf.text(typeLabels[docType], margin, y);

  y += 20;
  
  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text((document as any).title || 'Projet', margin, y);

  y += 15;
  
  // Location
  const location = [(document as any).project_address, (document as any).project_city].filter(Boolean).join(', ');
  if (location) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80);
    pdf.text(location, margin, y);
  }

  // Client & date
  pdf.setFontSize(10);
  pdf.setTextColor(60);
  pdf.text('POUR', margin, pageHeight - 40);
  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.text((document as any).client_company?.name || 'Client', margin, pageHeight - 30);

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(format(new Date(), 'dd MMMM yyyy', { locale: fr }), pageWidth - margin, pageHeight - 35, { align: 'right' });
  
  if (agencyInfo?.name) {
    pdf.setFontSize(12);
    pdf.setTextColor(60);
    pdf.text(agencyInfo.name, pageWidth - margin, pageHeight - 25, { align: 'right' });
  }

  return pageHeight;
}

function renderHeaderBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  pageWidth: number,
  y: number
): number {
  const { document, agencyInfo, logoBase64 } = ctx;

  // Logo
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, y - 2, 20, 20);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  const textStartX = logoBase64 ? margin + 25 : margin;
  
  // Agency name
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(agencyInfo?.name || 'Agence', textStartX, y + 5);
  
  // Agency contact
  if (agencyInfo) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    const contactParts = [];
    if (agencyInfo.address) contactParts.push(formatFullAddress(agencyInfo));
    if (agencyInfo.phone) contactParts.push(agencyInfo.phone);
    if (contactParts.length > 0) {
      pdf.text(contactParts.join(' • '), textStartX, y + 10);
    }
  }

  // Document type on right
  const docType = (document as any).document_type || 'quote';
  const typeLabels: Record<string, string> = { quote: 'DEVIS', contract: 'CONTRAT', proposal: 'PROPOSITION' };
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(typeLabels[docType] || 'DOCUMENT', pageWidth - margin, y + 5, { align: 'right' });
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  pdf.text(`N° ${(document as any).document_number || 'N/A'}`, pageWidth - margin, y + 12, { align: 'right' });
  pdf.text(format(new Date(), 'dd MMMM yyyy', { locale: fr }), pageWidth - margin, y + 17, { align: 'right' });

  return y + 25;
}

function renderClientBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  contentWidth: number,
  y: number
): number {
  const { document } = ctx;
  const colWidth = contentWidth / 2 - 5;

  pdf.setDrawColor(220);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Client
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  pdf.text('CLIENT', margin, y);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);
  pdf.setFontSize(10);
  pdf.text((document as any).client_company?.name || 'Non défini', margin, y + 5);
  
  if ((document as any).client_contact?.name) {
    pdf.setFontSize(9);
    pdf.text((document as any).client_contact.name, margin, y + 10);
  }

  return y + 18;
}

function renderProjectBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  contentWidth: number,
  y: number
): number {
  const { document } = ctx;
  const colWidth = contentWidth / 2 - 5;

  // Project info on right side
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  pdf.text('PROJET', margin + colWidth + 10, y - 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);
  pdf.setFontSize(10);
  pdf.text((document as any).title || 'Sans titre', margin + colWidth + 10, y - 7);
  
  pdf.setFontSize(9);
  const location = [(document as any).project_address, (document as any).project_city].filter(Boolean).join(', ');
  if (location) pdf.text(location, margin + colWidth + 10, y - 2);

  pdf.setDrawColor(220);
  pdf.line(margin, y, margin + contentWidth, y);
  
  return y + 6;
}

function renderLinesBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  pageWidth: number,
  y: number,
  addPageIfNeeded: (space: number) => boolean
): number {
  const { lines, total, formatCurrency } = ctx;

  const includedLines = lines.filter(l => l.is_included);
  const totalAmount = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  
  const tableData = includedLines.map(line => {
    return [
      line.phase_code || '',
      line.phase_name,
      line.quantity ? `${line.quantity} ${line.unit || ''}` : '-',
      line.unit_price ? formatCurrency(line.unit_price) : '-',
      formatCurrency(line.amount || 0)
    ];
  });

  autoTable(pdf, {
    startY: y,
    head: [['Réf.', 'Désignation', 'Quantité', 'Prix unit.', 'Montant HT']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: [60, 60, 60], 
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: 30,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.1
  });

  return (pdf as any).lastAutoTable.finalY + 4;
}

function renderTotalsBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  pageWidth: number,
  y: number,
  isLandscape: boolean
): number {
  const { total, formatCurrency } = ctx;
  
  const TVA = total * 0.2;
  const TTC = total + TVA;

  if (isLandscape) {
    // Summary cards for proposal
    const summaryCardWidth = 80;
    const summaryCards = [
      { label: 'TOTAL HT', value: formatCurrency(total), color: [30, 30, 35] },
      { label: 'TVA (20%)', value: formatCurrency(TVA), color: [50, 50, 55] },
      { label: 'TOTAL TTC', value: formatCurrency(TTC), color: [60, 130, 200] }
    ];
    
    const startX = (pageWidth - (summaryCardWidth * 3 + 20 * 2)) / 2;
    
    summaryCards.forEach((card, i) => {
      const x = startX + (summaryCardWidth + 20) * i;
      
      pdf.setFillColor(card.color[0], card.color[1], card.color[2]);
      pdf.roundedRect(x, y, summaryCardWidth, 50, 4, 4, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(180);
      pdf.text(card.label, x + summaryCardWidth / 2, y + 18, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255);
      pdf.text(card.value, x + summaryCardWidth / 2, y + 36, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
    });
    
    return y + 60;
  } else {
    // Standard totals
    pdf.setDrawColor(220);
    pdf.line(pageWidth - margin - 60, y, pageWidth - margin, y);
    y += 5;
    
    pdf.setFontSize(9);
    pdf.setTextColor(60);
    pdf.text('Total HT', pageWidth - margin - 60, y);
    pdf.setTextColor(0);
    pdf.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });
    
    y += 5;
    pdf.setTextColor(60);
    pdf.text('TVA (20%)', pageWidth - margin - 60, y);
    pdf.setTextColor(0);
    pdf.text(formatCurrency(TVA), pageWidth - margin, y, { align: 'right' });
    
    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Total TTC', pageWidth - margin - 60, y);
    pdf.text(formatCurrency(TTC), pageWidth - margin, y, { align: 'right' });
    
    return y + 10;
  }
}

function renderPaymentBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  contentWidth: number,
  y: number
): number {
  const { document, total, formatCurrency } = ctx;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('CONDITIONS DE PAIEMENT', margin, y);
  y += 8;

  const paymentTerms = (document as any).payment_terms || 'Selon contrat';
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(60);
  const termLines = pdf.splitTextToSize(paymentTerms, contentWidth);
  termLines.forEach((line: string) => {
    pdf.text(line, margin, y);
    y += 4;
  });

  // Validity
  y += 5;
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text(`Document valable ${(document as any).validity_days || 30} jours`, margin, y);

  return y + 10;
}

function renderConditionsBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  contentWidth: number,
  y: number,
  addPageIfNeeded: (space: number) => boolean
): number {
  const { document } = ctx;
  const conditions = (document as any).general_conditions;
  
  if (!conditions) return y;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('CONDITIONS GÉNÉRALES', margin, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(60);
  
  const conditionLines = pdf.splitTextToSize(conditions, contentWidth);
  conditionLines.forEach((line: string) => {
    addPageIfNeeded(6);
    pdf.text(line, margin, y);
    y += 4;
  });

  return y + 5;
}

function renderSignaturesBlock(
  pdf: jsPDF,
  ctx: PDFRenderContext,
  margin: number,
  pageWidth: number,
  contentWidth: number,
  y: number
): number {
  const { document, agencyInfo, signatureBase64 } = ctx;

  y += 5;
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text('Bon pour accord, date et signature :', margin, y);

  y += 5;
  
  // Client signature box
  pdf.setDrawColor(180);
  pdf.rect(margin, y, 70, 25);

  // Agency signature (on the right)
  if (signatureBase64) {
    pdf.setFontSize(9);
    pdf.setTextColor(60);
    pdf.text('L\'architecte :', pageWidth - margin - 60, y - 5);
    try {
      pdf.addImage(signatureBase64, 'PNG', pageWidth - margin - 60, y, 50, 20);
    } catch (e) {
      console.error('Error adding signature:', e);
    }
  } else if (agencyInfo?.name) {
    pdf.setFontSize(9);
    pdf.setTextColor(60);
    pdf.text(agencyInfo.name, pageWidth - margin, y + 10, { align: 'right' });
  }

  return y + 30;
}

// ============= Legacy Compatibility Wrappers =============

export async function generateQuotePDFUnified(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number,
  agencyInfo?: AgencyPDFInfo,
  pdfConfig?: PDFDocumentConfig | null
): Promise<Blob> {
  const lines: QuoteLine[] = phases.map((p, i) => ({
    id: p.id,
    document_id: p.document_id,
    phase_code: p.phase_code,
    phase_name: p.phase_name,
    phase_description: p.phase_description,
    line_type: 'phase' as const,
    quantity: 1,
    unit: 'forfait',
    unit_price: p.amount,
    amount: p.amount,
    percentage_fee: p.percentage_fee,
    billing_type: 'one_time' as const,
    is_optional: !p.is_included,
    is_included: p.is_included,
    deliverables: p.deliverables,
    sort_order: p.sort_order,
  }));
  
  return generateUnifiedPDF(document, lines, total, agencyInfo, pdfConfig, 'quote');
}

export async function generateContractPDFUnified(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number,
  agencyInfo?: AgencyPDFInfo,
  pdfConfig?: PDFDocumentConfig | null
): Promise<Blob> {
  const lines: QuoteLine[] = phases.map((p, i) => ({
    id: p.id,
    document_id: p.document_id,
    phase_code: p.phase_code,
    phase_name: p.phase_name,
    phase_description: p.phase_description,
    line_type: 'phase' as const,
    quantity: 1,
    unit: 'forfait',
    unit_price: p.amount,
    amount: p.amount,
    percentage_fee: p.percentage_fee,
    billing_type: 'one_time' as const,
    is_optional: !p.is_included,
    is_included: p.is_included,
    deliverables: p.deliverables,
    sort_order: p.sort_order,
  }));
  
  return generateUnifiedPDF(document, lines, total, agencyInfo, pdfConfig, 'contract');
}

