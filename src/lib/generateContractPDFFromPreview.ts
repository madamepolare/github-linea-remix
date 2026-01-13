// Générateur PDF qui reproduit exactement la preview des contrats
// Utilise les mêmes données et structure que ContractPreviewPanel

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { isArchitectureContractType } from '@/lib/moeContractDefaults';
import { isCommunicationContractType } from '@/lib/communicationContractDefaults';
import { buildMOEContractDataFromDocument } from '@/lib/moeContractBuilder';
import { buildCommunicationContractDataFromDocument } from '@/lib/communicationContractBuilder';
import { MOEContractData, MOE_PROJECT_TYPES, MOE_FEE_METHODS } from '@/lib/moeContractConfig';
import { CommunicationContractData } from '@/lib/generateCommunicationContractPDF';
import { AgencyPDFInfo, loadImageAsBase64 } from '@/lib/pdfUtils';

interface PDFContext {
  pdf: jsPDF;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  y: number;
  logoBase64: string | null;
  signatureBase64: string | null;
}

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '-';
  // Use simple formatting to avoid special Unicode spaces that render as "/" in PDF
  const formatted = value.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
  return `${formatted} €`;
}

function formatDatePDF(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

function formatClauseTitle(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function addNewPageIfNeeded(ctx: PDFContext, neededSpace: number): void {
  if (ctx.y + neededSpace > ctx.pageHeight - ctx.margin - 20) {
    ctx.pdf.addPage();
    ctx.y = ctx.margin;
  }
}

function drawSectionTitle(ctx: PDFContext, title: string): void {
  addNewPageIfNeeded(ctx, 20);
  ctx.pdf.setFontSize(10);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setTextColor(100, 100, 100);
  ctx.pdf.text(title.toUpperCase(), ctx.margin, ctx.y);
  ctx.y += 2;
  ctx.pdf.setDrawColor(200, 200, 200);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin + ctx.contentWidth, ctx.y);
  ctx.y += 6;
  ctx.pdf.setTextColor(0, 0, 0);
}

function drawInfoRow(ctx: PDFContext, label: string, value?: string | number | null): void {
  if (!value && value !== 0) return;
  ctx.pdf.setFontSize(9);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setTextColor(100, 100, 100);
  ctx.pdf.text(label, ctx.margin, ctx.y);
  ctx.pdf.setTextColor(50, 50, 50);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(String(value), ctx.margin + 60, ctx.y);
  ctx.y += 5;
}

export async function generateContractPDFFromPreview(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo?: AgencyPDFInfo | null,
  contractTypeCode?: string | null
): Promise<Blob> {
  // Determine contract type
  const code = (contractTypeCode || '').toUpperCase();
  const fallback = (document.project_type || '').toString().toUpperCase();
  const isMOE = isArchitectureContractType(code || fallback);
  const isCOM = isCommunicationContractType(code || fallback);

  // Build contract data
  let moe: MOEContractData | null = null;
  let com: CommunicationContractData | null = null;

  if (isMOE) {
    moe = buildMOEContractDataFromDocument(document as any, lines, agencyInfo as any);
  } else if (isCOM) {
    com = buildCommunicationContractDataFromDocument(document as any, lines, agencyInfo as any);
  }

  // Initialize PDF
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  // Load images
  let logoBase64: string | null = null;
  let signatureBase64: string | null = null;

  if (agencyInfo?.logo_url) {
    try {
      logoBase64 = await loadImageAsBase64(agencyInfo.logo_url);
    } catch (e) {
      console.warn('Could not load logo:', e);
    }
  }

  if (agencyInfo?.signature_url) {
    try {
      signatureBase64 = await loadImageAsBase64(agencyInfo.signature_url);
    } catch (e) {
      console.warn('Could not load signature:', e);
    }
  }

  const ctx: PDFContext = {
    pdf,
    margin,
    pageWidth,
    pageHeight,
    contentWidth,
    y: margin,
    logoBase64,
    signatureBase64,
  };

  // ===== HEADER =====
  let headerY = margin;

  // Logo - preserve aspect ratio
  if (logoBase64) {
    try {
      // Get image dimensions to preserve aspect ratio
      const img = new Image();
      img.src = logoBase64;
      const maxWidth = 40;
      const maxHeight = 20;
      
      // Calculate dimensions preserving aspect ratio
      let logoWidth = maxWidth;
      let logoHeight = maxHeight;
      
      if (img.width && img.height) {
        const ratio = img.width / img.height;
        if (ratio > maxWidth / maxHeight) {
          // Image is wider, constrain by width
          logoWidth = maxWidth;
          logoHeight = maxWidth / ratio;
        } else {
          // Image is taller, constrain by height
          logoHeight = maxHeight;
          logoWidth = maxHeight * ratio;
        }
      }
      
      pdf.addImage(logoBase64, 'PNG', margin, headerY, logoWidth, logoHeight);
    } catch (e) {
      console.warn('Could not add logo image');
    }
  } else if (agencyInfo?.name) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(agencyInfo.name, margin, headerY + 8);
  }

  // Agency info under logo
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  let agencyY = headerY + 18;
  if (agencyInfo?.address) {
    pdf.text(agencyInfo.address, margin, agencyY);
    agencyY += 3.5;
  }
  if (agencyInfo?.postal_code || agencyInfo?.city) {
    pdf.text(`${agencyInfo.postal_code || ''} ${agencyInfo.city || ''}`.trim(), margin, agencyY);
    agencyY += 3.5;
  }
  if (agencyInfo?.phone) {
    pdf.text(`Tél: ${agencyInfo.phone}`, margin, agencyY);
    agencyY += 3.5;
  }
  if (agencyInfo?.email) {
    pdf.text(agencyInfo.email, margin, agencyY);
    agencyY += 3.5;
  }
  if (agencyInfo?.siret) {
    pdf.text(`SIRET: ${agencyInfo.siret}`, margin, agencyY);
    agencyY += 3.5;
  }

  // Title (right side)
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('CONTRAT', pageWidth - margin, headerY + 8, { align: 'right' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const ref = moe?.reference || com?.reference || document.document_number || 'BROUILLON';
  pdf.text(ref, pageWidth - margin, headerY + 14, { align: 'right' });

  const dateStr = formatDatePDF(moe?.date || com?.date || document.created_at) || format(new Date(), 'd MMMM yyyy', { locale: fr });
  pdf.setFontSize(8);
  pdf.text(dateStr, pageWidth - margin, headerY + 19, { align: 'right' });

  ctx.y = Math.max(agencyY, headerY + 25) + 10;

  // ===== PARTIES =====
  if (moe) {
    drawSectionTitle(ctx, 'Parties');
    
    const colWidth = contentWidth / 2 - 5;
    const startY = ctx.y;

    // MOA
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, startY, colWidth, 35, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text('MAÎTRE D\'OUVRAGE (CLIENT)', margin + 3, startY + 5);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(moe.moa.name, margin + 3, startY + 12);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    let moaY = startY + 17;
    if (moe.moa.address) { pdf.text(moe.moa.address, margin + 3, moaY); moaY += 4; }
    if (moe.moa.city) { pdf.text(moe.moa.city, margin + 3, moaY); moaY += 4; }
    if (moe.moa.phone) { pdf.text(`Tél: ${moe.moa.phone}`, margin + 3, moaY); moaY += 4; }
    if (moe.moa.email) { pdf.text(moe.moa.email, margin + 3, moaY); }

    // MOE
    const moeX = margin + colWidth + 10;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(moeX, startY, colWidth, 35, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text('MAÎTRE D\'ŒUVRE (ARCHITECTE)', moeX + 3, startY + 5);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(moe.moe.name, moeX + 3, startY + 12);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    let moeInfoY = startY + 17;
    if (moe.moe.address) { pdf.text(moe.moe.address, moeX + 3, moeInfoY); moeInfoY += 4; }
    if (moe.moe.postal_code || moe.moe.city) { pdf.text(`${moe.moe.postal_code || ''} ${moe.moe.city || ''}`.trim(), moeX + 3, moeInfoY); moeInfoY += 4; }
    if (moe.moe.phone) { pdf.text(`Tél: ${moe.moe.phone}`, moeX + 3, moeInfoY); moeInfoY += 4; }
    if (moe.moe.email) { pdf.text(moe.moe.email, moeX + 3, moeInfoY); }

    ctx.y = startY + 40;
  }

  if (com) {
    drawSectionTitle(ctx, 'Parties');
    
    const colWidth = contentWidth / 2 - 5;
    const startY = ctx.y;

    // Client
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, startY, colWidth, 35, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text('CLIENT', margin + 3, startY + 5);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(com.client.name, margin + 3, startY + 12);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    let clientY = startY + 17;
    if (com.client.address) { pdf.text(com.client.address, margin + 3, clientY); clientY += 4; }
    if (com.client.city) { pdf.text(`${com.client.postal_code || ''} ${com.client.city}`.trim(), margin + 3, clientY); clientY += 4; }
    if (com.client.phone) { pdf.text(`Tél: ${com.client.phone}`, margin + 3, clientY); clientY += 4; }
    if (com.client.email) { pdf.text(com.client.email, margin + 3, clientY); }

    // Agency
    const agX = margin + colWidth + 10;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(agX, startY, colWidth, 35, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text('AGENCE', agX + 3, startY + 5);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(com.agency.name, agX + 3, startY + 12);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    let agInfoY = startY + 17;
    if (com.agency.address) { pdf.text(com.agency.address, agX + 3, agInfoY); agInfoY += 4; }
    if (com.agency.city) { pdf.text(`${com.agency.postal_code || ''} ${com.agency.city}`.trim(), agX + 3, agInfoY); agInfoY += 4; }
    if (com.agency.phone) { pdf.text(`Tél: ${com.agency.phone}`, agX + 3, agInfoY); agInfoY += 4; }
    if (com.agency.email) { pdf.text(com.agency.email, agX + 3, agInfoY); }

    ctx.y = startY + 40;
  }

  // ===== PROJECT =====
  drawSectionTitle(ctx, 'Projet');
  
  const projectName = moe?.project.name || com?.project.name || document.title || 'Projet sans titre';
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(projectName, margin, ctx.y);
  ctx.y += 6;

  const description = moe?.project.additional_notes || com?.project.description || document.description;
  if (description) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    const descLines = pdf.splitTextToSize(description, contentWidth);
    pdf.text(descLines, margin, ctx.y);
    ctx.y += descLines.length * 4 + 4;
  }

  if (moe) {
    drawInfoRow(ctx, 'Adresse:', moe.project.address);
    drawInfoRow(ctx, 'Ville:', moe.project.city);
    drawInfoRow(ctx, 'Type de projet:', MOE_PROJECT_TYPES[moe.project.project_type] || moe.project.project_type);
    if (moe.project.project_surface) drawInfoRow(ctx, 'Surface projet:', `${moe.project.project_surface} m²`);
    if (moe.project.budget_travaux) drawInfoRow(ctx, 'Budget travaux:', formatCurrency(moe.project.budget_travaux));
    ctx.y += 4;
    
    // Fee mode
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Mode de calcul des honoraires : ', margin, ctx.y);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(MOE_FEE_METHODS[moe.fee_calculation_method] || moe.fee_calculation_method, margin + 55, ctx.y);
    ctx.y += 8;
  }

  if (com) {
    if (com.project.budget) drawInfoRow(ctx, 'Budget:', formatCurrency(com.project.budget));
    if (com.daily_rate) drawInfoRow(ctx, 'Taux journalier:', formatCurrency(com.daily_rate));
    ctx.y += 4;
  }

  // ===== PHASES =====
  addNewPageIfNeeded(ctx, 50);
  drawSectionTitle(ctx, moe ? 'Phases de mission' : 'Phases');

  const phases = moe ? moe.mission_phases : com?.phases || [];
  const phaseRows = phases.map((p: any) => [
    p.code,
    p.name,
    p.is_included ? '✓' : p.is_optional ? '(option)' : '—',
    `${Math.round((p.percentage || 0) * 100) / 100}%`
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Code', 'Intitulé', 'Inclus', '%']],
    body: phaseRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 20 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'right' }
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // ===== HONORAIRES / PRESTATIONS =====
  addNewPageIfNeeded(ctx, 50);
  drawSectionTitle(ctx, moe ? 'Détail des honoraires' : 'Détail des prestations');

  const items = moe ? moe.honoraires : com?.prestations || [];
  const itemRows = items.map((item: any) => [
    item.name + (item.is_offered ? ' (offert)' : '') + (item.is_optional ? ' (option)' : ''),
    String(item.quantity),
    formatCurrency(item.amount_ht)
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Désignation', 'Qté', 'Montant HT']],
    body: itemRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
    columnStyles: {
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' }
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // ===== TOTAUX =====
  addNewPageIfNeeded(ctx, 35);
  
  const totalHT = moe?.total_ht || com?.total_ht || 0;
  const tvaRate = moe?.tva_rate || com?.tva_rate || 0.2;
  const tvaAmount = moe?.tva_amount || com?.tva_amount || 0;
  const totalTTC = moe?.total_ttc || com?.total_ttc || 0;

  const totalsX = pageWidth - margin - 65;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(totalsX, ctx.y, 65, 28, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);
  pdf.text('Total HT', totalsX + 3, ctx.y + 6);
  pdf.text(formatCurrency(totalHT), totalsX + 62, ctx.y + 6, { align: 'right' });
  
  pdf.setTextColor(100, 100, 100);
  pdf.text(`TVA (${(tvaRate * 100).toFixed(0)}%)`, totalsX + 3, ctx.y + 12);
  pdf.text(formatCurrency(tvaAmount), totalsX + 62, ctx.y + 12, { align: 'right' });
  
  pdf.setDrawColor(50, 50, 50);
  pdf.line(totalsX + 3, ctx.y + 16, totalsX + 62, ctx.y + 16);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Total TTC', totalsX + 3, ctx.y + 24);
  pdf.text(formatCurrency(totalTTC), totalsX + 62, ctx.y + 24, { align: 'right' });

  ctx.y += 35;

  // ===== PAYMENT SCHEDULE =====
  addNewPageIfNeeded(ctx, 50);
  drawSectionTitle(ctx, 'Échéancier de paiement');

  const schedule = (moe || com)?.payment_schedule || [];
  const scheduleRows = schedule.map((s: any) => {
    const amount = (s.percentage / 100) * totalHT;
    return [s.stage || '', s.phase_code || '', s.description || '', `${s.percentage}%`, formatCurrency(amount)];
  });

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Étape', 'Phase', 'Description', '%', 'Montant']],
    body: scheduleRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
    columnStyles: {
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // ===== INSURANCE (MOE) =====
  if (moe && (moe.insurance_company || moe.insurance_policy_number)) {
    addNewPageIfNeeded(ctx, 20);
    drawSectionTitle(ctx, 'Assurance professionnelle');
    drawInfoRow(ctx, 'Compagnie:', moe.insurance_company);
    drawInfoRow(ctx, 'N° Police:', moe.insurance_policy_number);
    ctx.y += 4;
  }

  // ===== CLAUSES =====
  const clauses = (moe || com)?.clauses || {};
  const clauseEntries = Object.entries(clauses);

  if (clauseEntries.length > 0) {
    addNewPageIfNeeded(ctx, 30);
    drawSectionTitle(ctx, 'Clauses contractuelles');

    for (const [key, value] of clauseEntries) {
      addNewPageIfNeeded(ctx, 25);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(formatClauseTitle(key), margin, ctx.y);
      ctx.y += 5;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const clauseLines = pdf.splitTextToSize(String(value || ''), contentWidth - 5);
      
      for (const line of clauseLines) {
        addNewPageIfNeeded(ctx, 5);
        pdf.text(line, margin + 3, ctx.y);
        ctx.y += 4;
      }
      ctx.y += 4;
    }
  }

  // ===== SIGNATURE =====
  addNewPageIfNeeded(ctx, 50);
  ctx.y += 10;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, ctx.y, margin + contentWidth, ctx.y);
  ctx.y += 10;

  const colW = contentWidth / 2;
  
  // Client signature
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Le Client', margin, ctx.y);
  pdf.setFontSize(7);
  pdf.text('Date et signature précédée de "Bon pour accord"', margin, ctx.y + 5);
  pdf.setDrawColor(150, 150, 150);
  pdf.line(margin, ctx.y + 25, margin + 60, ctx.y + 25);

  // Agency signature
  pdf.setFontSize(9);
  pdf.text('L\'Agence / L\'Architecte', pageWidth - margin - 60, ctx.y);
  
  if (signatureBase64) {
    try {
      // Preserve signature aspect ratio
      const sigImg = new Image();
      sigImg.src = signatureBase64;
      const sigMaxWidth = 45;
      const sigMaxHeight = 22;
      
      let sigWidth = sigMaxWidth;
      let sigHeight = sigMaxHeight;
      
      if (sigImg.width && sigImg.height) {
        const sigRatio = sigImg.width / sigImg.height;
        if (sigRatio > sigMaxWidth / sigMaxHeight) {
          sigWidth = sigMaxWidth;
          sigHeight = sigMaxWidth / sigRatio;
        } else {
          sigHeight = sigMaxHeight;
          sigWidth = sigMaxHeight * sigRatio;
        }
      }
      
      pdf.addImage(signatureBase64, 'PNG', pageWidth - margin - sigWidth, ctx.y + 8, sigWidth, sigHeight);
    } catch (e) {
      console.warn('Could not add signature');
    }
  }

  // ===== FOOTER on all pages =====
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150, 150, 150);
    
    let footerText = agencyInfo?.name || '';
    if (agencyInfo?.siret) footerText += ` - SIRET: ${agencyInfo.siret}`;
    if (agencyInfo?.vat_number) footerText += ` - TVA: ${agencyInfo.vat_number}`;
    
    pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return pdf.output('blob');
}
