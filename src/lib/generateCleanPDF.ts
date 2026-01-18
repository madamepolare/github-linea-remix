// Clean, professional PDF template for contracts and quotes
// Features: Cover page, refined typography, contract ID badge

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
}

// Clean currency formatting without special characters
function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '-';
  const formatted = value.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
  return `${formatted} €`;
}

function formatDatePDF(dateStr?: string): string {
  if (!dateStr) return format(new Date(), 'd MMMM yyyy', { locale: fr });
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

function formatClauseTitle(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function addNewPage(ctx: PDFContext): void {
  ctx.pdf.addPage();
  ctx.y = ctx.margin;
}

function checkPageBreak(ctx: PDFContext, needed: number): void {
  if (ctx.y + needed > ctx.pageHeight - ctx.margin - 15) {
    addNewPage(ctx);
  }
}

function drawSectionTitle(ctx: PDFContext, title: string): void {
  checkPageBreak(ctx, 15);
  ctx.pdf.setFontSize(8);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setTextColor(120, 120, 120);
  ctx.pdf.text(title.toUpperCase(), ctx.margin, ctx.y);
  ctx.y += 1.5;
  ctx.pdf.setDrawColor(220, 220, 220);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin + ctx.contentWidth, ctx.y);
  ctx.y += 6;
}

function drawLabelValue(ctx: PDFContext, label: string, value?: string | number | null, labelWidth: number = 45): void {
  if (!value && value !== 0) return;
  ctx.pdf.setFontSize(7);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setTextColor(130, 130, 130);
  ctx.pdf.text(label, ctx.margin, ctx.y);
  ctx.pdf.setTextColor(60, 60, 60);
  ctx.pdf.text(String(value), ctx.margin + labelWidth, ctx.y);
  ctx.y += 4;
}

// Draw cover page
function drawCoverPage(
  ctx: PDFContext,
  logoBase64: string | null,
  agencyInfo: AgencyPDFInfo | undefined | null,
  documentType: 'contract' | 'quote',
  documentNumber: string,
  documentDate: string,
  projectName: string,
  clientName: string
): void {
  const { pdf, margin, pageWidth, pageHeight, contentWidth } = ctx;
  
  // Background subtle gradient effect (light gray bottom)
  pdf.setFillColor(252, 252, 252);
  pdf.rect(0, pageHeight - 80, pageWidth, 80, 'F');
  
  // Logo centered at top
  if (logoBase64) {
    try {
      // Calculate centered position with aspect ratio preservation
      const maxWidth = 80;
      const maxHeight = 40;
      const x = (pageWidth - maxWidth) / 2;
      pdf.addImage(logoBase64, 'AUTO', x, margin + 20, maxWidth, maxHeight, undefined, 'FAST');
    } catch (e) {
      console.warn('Could not add logo');
    }
  } else if (agencyInfo?.name) {
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(agencyInfo.name, pageWidth / 2, margin + 40, { align: 'center' });
  }
  
  // Document type badge
  const badgeY = pageHeight / 2 - 30;
  pdf.setFillColor(245, 245, 245);
  const badgeWidth = 120;
  const badgeX = (pageWidth - badgeWidth) / 2;
  pdf.roundedRect(badgeX, badgeY, badgeWidth, 50, 3, 3, 'F');
  
  // Document type
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(50, 50, 50);
  const typeLabel = 'DEVIS';
  pdf.text(typeLabel, pageWidth / 2, badgeY + 20, { align: 'center' });
  
  // Document number - small gray badge
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(130, 130, 130);
  pdf.text(documentNumber, pageWidth / 2, badgeY + 32, { align: 'center' });
  
  // Date
  pdf.setFontSize(8);
  pdf.text(documentDate, pageWidth / 2, badgeY + 42, { align: 'center' });
  
  // Project name
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40, 40, 40);
  const projectLines = pdf.splitTextToSize(projectName, contentWidth - 40);
  let projectY = badgeY + 70;
  projectLines.slice(0, 2).forEach((line: string) => {
    pdf.text(line, pageWidth / 2, projectY, { align: 'center' });
    projectY += 7;
  });
  
  // Client name
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(clientName, pageWidth / 2, projectY + 5, { align: 'center' });
  
  // Agency info at bottom
  const footerY = pageHeight - 35;
  pdf.setFontSize(7);
  pdf.setTextColor(140, 140, 140);
  
  if (agencyInfo) {
    const parts: string[] = [];
    if (agencyInfo.name) parts.push(agencyInfo.name);
    if (agencyInfo.address) parts.push(agencyInfo.address);
    if (agencyInfo.postal_code || agencyInfo.city) {
      parts.push(`${agencyInfo.postal_code || ''} ${agencyInfo.city || ''}`.trim());
    }
    pdf.text(parts.join(' • '), pageWidth / 2, footerY, { align: 'center' });
    
    const parts2: string[] = [];
    if (agencyInfo.phone) parts2.push(`Tél: ${agencyInfo.phone}`);
    if (agencyInfo.email) parts2.push(agencyInfo.email);
    if (parts2.length > 0) {
      pdf.text(parts2.join(' • '), pageWidth / 2, footerY + 4, { align: 'center' });
    }
    
    const parts3: string[] = [];
    if (agencyInfo.siret) parts3.push(`SIRET: ${agencyInfo.siret}`);
    if (agencyInfo.vat_number) parts3.push(`TVA: ${agencyInfo.vat_number}`);
    if (parts3.length > 0) {
      pdf.text(parts3.join(' • '), pageWidth / 2, footerY + 8, { align: 'center' });
    }
  }
}

// Draw parties section (two columns)
function drawParties(
  ctx: PDFContext,
  leftTitle: string,
  leftParty: { name: string; address?: string; postal_code?: string; city?: string; phone?: string; email?: string; siret?: string },
  rightTitle: string,
  rightParty: { name: string; address?: string; postal_code?: string; city?: string; phone?: string; email?: string; siret?: string }
): void {
  const { pdf, margin, contentWidth } = ctx;
  
  drawSectionTitle(ctx, 'Parties');
  
  const colWidth = (contentWidth - 10) / 2;
  const startY = ctx.y;
  const boxHeight = 30;
  
  // Left party
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(margin, startY, colWidth, boxHeight, 2, 2, 'F');
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(140, 140, 140);
  pdf.text(leftTitle.toUpperCase(), margin + 4, startY + 5);
  
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  pdf.text(leftParty.name || '-', margin + 4, startY + 11);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  let leftY = startY + 16;
  if (leftParty.address) { pdf.text(leftParty.address, margin + 4, leftY); leftY += 3.5; }
  if (leftParty.city) { 
    pdf.text(`${leftParty.postal_code || ''} ${leftParty.city}`.trim(), margin + 4, leftY); 
    leftY += 3.5; 
  }
  if (leftParty.email) { pdf.text(leftParty.email, margin + 4, leftY); }
  
  // Right party
  const rightX = margin + colWidth + 10;
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(rightX, startY, colWidth, boxHeight, 2, 2, 'F');
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(140, 140, 140);
  pdf.text(rightTitle.toUpperCase(), rightX + 4, startY + 5);
  
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  pdf.text(rightParty.name || '-', rightX + 4, startY + 11);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  let rightY = startY + 16;
  if (rightParty.address) { pdf.text(rightParty.address, rightX + 4, rightY); rightY += 3.5; }
  if (rightParty.city) { 
    pdf.text(`${rightParty.postal_code || ''} ${rightParty.city}`.trim(), rightX + 4, rightY); 
    rightY += 3.5; 
  }
  if (rightParty.email) { pdf.text(rightParty.email, rightX + 4, rightY); }
  
  ctx.y = startY + boxHeight + 8;
}

// Draw totals box
function drawTotals(ctx: PDFContext, totalHT: number, tvaRate: number, tvaAmount: number, totalTTC: number): void {
  const { pdf, margin, pageWidth } = ctx;
  
  checkPageBreak(ctx, 35);
  
  const boxWidth = 70;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = ctx.y;
  
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(boxX, boxY, boxWidth, 30, 2, 2, 'F');
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Total HT', boxX + 4, boxY + 7);
  pdf.setTextColor(60, 60, 60);
  pdf.text(formatCurrency(totalHT), boxX + boxWidth - 4, boxY + 7, { align: 'right' });
  
  pdf.setTextColor(130, 130, 130);
  pdf.text(`TVA (${Math.round(tvaRate * 100)}%)`, boxX + 4, boxY + 13);
  pdf.text(formatCurrency(tvaAmount), boxX + boxWidth - 4, boxY + 13, { align: 'right' });
  
  pdf.setDrawColor(200, 200, 200);
  pdf.line(boxX + 4, boxY + 17, boxX + boxWidth - 4, boxY + 17);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40, 40, 40);
  pdf.text('Total TTC', boxX + 4, boxY + 25);
  pdf.text(formatCurrency(totalTTC), boxX + boxWidth - 4, boxY + 25, { align: 'right' });
  
  ctx.y = boxY + 35;
}

// Draw footer on all pages
function addFooters(pdf: jsPDF, agencyInfo: AgencyPDFInfo | undefined | null, startPage: number = 1): void {
  const totalPages = pdf.getNumberOfPages();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  for (let i = startPage; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(160, 160, 160);
    
    const footerParts: string[] = [];
    if (agencyInfo?.name) footerParts.push(agencyInfo.name);
    if (agencyInfo?.siret) footerParts.push(`SIRET: ${agencyInfo.siret}`);
    
    pdf.text(footerParts.join(' • '), pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.text(`${i}/${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }
}

// Main export function for contracts
export async function generateCleanContractPDF(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo?: AgencyPDFInfo | null,
  contractTypeCode?: string | null
): Promise<Blob> {
  const code = (contractTypeCode || '').toUpperCase();
  const fallback = (document.project_type || '').toString().toUpperCase();
  const isMOE = isArchitectureContractType(code || fallback);
  const isCOM = isCommunicationContractType(code || fallback);

  let moe: MOEContractData | null = null;
  let com: CommunicationContractData | null = null;

  if (isMOE) {
    moe = buildMOEContractDataFromDocument(document as any, lines, agencyInfo as any);
  } else if (isCOM) {
    com = buildCommunicationContractDataFromDocument(document as any, lines, agencyInfo as any);
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  // Load images
  let logoBase64: string | null = null;
  let signatureBase64: string | null = null;

  if (agencyInfo?.logo_url) {
    try { logoBase64 = await loadImageAsBase64(agencyInfo.logo_url); } catch {}
  }
  if (agencyInfo?.signature_url) {
    try { signatureBase64 = await loadImageAsBase64(agencyInfo.signature_url); } catch {}
  }

  const ctx: PDFContext = { pdf, margin, pageWidth, pageHeight, contentWidth, y: margin };

  // ===== COVER PAGE =====
  const projectName = moe?.project.name || com?.project.name || document.title || 'Projet';
  const clientName = moe?.moa.name || com?.client.name || document.client_company?.name || 'Client';
  const docNumber = moe?.reference || com?.reference || document.document_number || 'BROUILLON';
  const docDate = formatDatePDF(moe?.date || com?.date || document.created_at);

  drawCoverPage(ctx, logoBase64, agencyInfo, 'contract', docNumber, docDate, projectName, clientName);

  // ===== CONTENT PAGES =====
  addNewPage(ctx);

  // Parties
  if (moe) {
    drawParties(ctx, 'Maître d\'ouvrage', moe.moa, 'Maître d\'œuvre', {
      name: moe.moe.name,
      address: moe.moe.address,
      postal_code: moe.moe.postal_code,
      city: moe.moe.city,
      email: moe.moe.email
    });
  } else if (com) {
    drawParties(ctx, 'Client', com.client, 'Agence', com.agency);
  }

  // Project
  drawSectionTitle(ctx, 'Projet');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40, 40, 40);
  pdf.text(projectName, margin, ctx.y);
  ctx.y += 5;

  const description = moe?.project.additional_notes || com?.project.description || document.description;
  if (description) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const descLines = pdf.splitTextToSize(description, contentWidth);
    descLines.slice(0, 3).forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 3.5;
    });
    ctx.y += 2;
  }

  if (moe) {
    drawLabelValue(ctx, 'Adresse:', moe.project.address);
    drawLabelValue(ctx, 'Ville:', moe.project.city);
    drawLabelValue(ctx, 'Type:', MOE_PROJECT_TYPES[moe.project.project_type] || moe.project.project_type);
    if (moe.project.project_surface) drawLabelValue(ctx, 'Surface:', `${moe.project.project_surface} m²`);
    if (moe.project.budget_travaux) drawLabelValue(ctx, 'Budget travaux:', formatCurrency(moe.project.budget_travaux));
    ctx.y += 3;
    drawLabelValue(ctx, 'Mode de calcul:', MOE_FEE_METHODS[moe.fee_calculation_method] || moe.fee_calculation_method);
  }

  if (com) {
    if (com.project.budget) drawLabelValue(ctx, 'Budget:', formatCurrency(com.project.budget));
    if (com.daily_rate) drawLabelValue(ctx, 'Taux journalier:', formatCurrency(com.daily_rate));
  }

  ctx.y += 6;

  // Phases
  checkPageBreak(ctx, 40);
  drawSectionTitle(ctx, moe ? 'Phases de mission' : 'Phases');

  const phases = moe ? moe.mission_phases : com?.phases || [];
  const phaseRows = phases.map((p: any) => [
    p.code,
    p.name,
    p.is_included ? '✓' : p.is_optional ? '(opt)' : '—',
    `${Math.round((p.percentage || 0) * 100) / 100}%`
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Réf', 'Intitulé', '', '%']],
    body: phaseRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [60, 60, 60] },
    headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columnStyles: { 0: { cellWidth: 18 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 18, halign: 'right' } }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // Détail des phases avec descriptions et livrables
  const includedPhases = phases.filter((p: any) => p.is_included);
  if (includedPhases.length > 0) {
    checkPageBreak(ctx, 30);
    drawSectionTitle(ctx, 'Détail des phases');

    for (const phase of includedPhases) {
      checkPageBreak(ctx, 25);

      // Phase title
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(`${phase.code || ''} ${phase.code ? '- ' : ''}${phase.name}`, margin, ctx.y);
      ctx.y += 5;

      // Description
      if (phase.description) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        const descLines = pdf.splitTextToSize(phase.description, contentWidth - 5);
        for (const line of descLines) {
          checkPageBreak(ctx, 4);
          pdf.text(line, margin + 2, ctx.y);
          ctx.y += 3.5;
        }
        ctx.y += 1;
      }

      // Deliverables
      if (phase.deliverables && phase.deliverables.length > 0) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        for (const deliverable of phase.deliverables) {
          checkPageBreak(ctx, 4);
          pdf.text(`• ${deliverable}`, margin + 4, ctx.y);
          ctx.y += 3.5;
        }
      }

      ctx.y += 5;
    }
  }

  // Honoraires
  checkPageBreak(ctx, 40);
  drawSectionTitle(ctx, moe ? 'Détail des honoraires' : 'Prestations');

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
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [60, 60, 60] },
    headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columnStyles: { 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' } }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // Totals
  const totalHT = moe?.total_ht || com?.total_ht || 0;
  const tvaRate = moe?.tva_rate || com?.tva_rate || 0.2;
  const tvaAmount = moe?.tva_amount || com?.tva_amount || 0;
  const totalTTC = moe?.total_ttc || com?.total_ttc || 0;

  drawTotals(ctx, totalHT, tvaRate, tvaAmount, totalTTC);

  // Payment schedule
  checkPageBreak(ctx, 40);
  drawSectionTitle(ctx, 'Échéancier');

  const schedule = (moe || com)?.payment_schedule || [];
  const scheduleRows = schedule.map((s: any) => {
    const amount = (s.percentage / 100) * totalHT;
    return [s.stage || '', s.description || '', `${s.percentage}%`, formatCurrency(amount)];
  });

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Étape', 'Description', '%', 'Montant']],
    body: scheduleRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [60, 60, 60] },
    headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columnStyles: { 2: { cellWidth: 15, halign: 'right' }, 3: { cellWidth: 28, halign: 'right' } }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // Insurance (MOE)
  if (moe && (moe.insurance_company || moe.insurance_policy_number)) {
    checkPageBreak(ctx, 15);
    drawSectionTitle(ctx, 'Assurance professionnelle');
    drawLabelValue(ctx, 'Compagnie:', moe.insurance_company);
    drawLabelValue(ctx, 'N° Police:', moe.insurance_policy_number);
    ctx.y += 4;
  }

  // Clauses
  const clauses = (moe || com)?.clauses || {};
  const clauseEntries = Object.entries(clauses);

  if (clauseEntries.length > 0) {
    checkPageBreak(ctx, 20);
    drawSectionTitle(ctx, 'Clauses contractuelles');

    for (const [key, value] of clauseEntries) {
      checkPageBreak(ctx, 18);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      pdf.text(formatClauseTitle(key), margin, ctx.y);
      ctx.y += 4;
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const clauseLines = pdf.splitTextToSize(String(value || ''), contentWidth);
      
      for (const line of clauseLines) {
        checkPageBreak(ctx, 4);
        pdf.text(line, margin, ctx.y);
        ctx.y += 3.5;
      }
      ctx.y += 3;
    }
  }

  // Signature
  checkPageBreak(ctx, 45);
  ctx.y += 8;
  drawSectionTitle(ctx, 'Signatures');

  const colW = (contentWidth - 10) / 2;
  
  // Client
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(130, 130, 130);
  pdf.text('Le Client', margin, ctx.y);
  pdf.text('Date et mention "Bon pour accord"', margin, ctx.y + 4);
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, ctx.y + 7, colW - 5, 25);

  // Agency
  const agX = margin + colW + 5;
  pdf.text('L\'Agence', agX, ctx.y);
  
  if (signatureBase64) {
    try {
      pdf.addImage(signatureBase64, 'AUTO', agX, ctx.y + 7, 45, 22, undefined, 'FAST');
    } catch {}
  }

  // Footers
  addFooters(pdf, agencyInfo, 2);

  return pdf.output('blob');
}

// Main export function for quotes
export async function generateCleanQuotePDF(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo?: AgencyPDFInfo | null
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  let logoBase64: string | null = null;
  let signatureBase64: string | null = null;

  if (agencyInfo?.logo_url) {
    try { logoBase64 = await loadImageAsBase64(agencyInfo.logo_url); } catch {}
  }
  if (agencyInfo?.signature_url) {
    try { signatureBase64 = await loadImageAsBase64(agencyInfo.signature_url); } catch {}
  }

  const ctx: PDFContext = { pdf, margin, pageWidth, pageHeight, contentWidth, y: margin };

  const projectName = document.title || 'Devis';
  const clientName = document.client_company?.name || document.client_contact?.name || 'Client';
  const docNumber = document.document_number || 'BROUILLON';
  const docDate = formatDatePDF(document.created_at);

  // Cover page
  drawCoverPage(ctx, logoBase64, agencyInfo, 'quote', docNumber, docDate, projectName, clientName);

  // Content
  addNewPage(ctx);

  // Client info
  if (document.client_company || document.client_contact) {
    drawSectionTitle(ctx, 'Client');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(document.client_company?.name || document.client_contact?.name || '', margin, ctx.y);
    ctx.y += 4;
    
    if (document.client_contact?.name && document.client_company?.name) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(document.client_contact.name, margin, ctx.y);
      ctx.y += 4;
    }
    ctx.y += 4;
  }

  // Project
  drawSectionTitle(ctx, 'Projet');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40, 40, 40);
  pdf.text(projectName, margin, ctx.y);
  ctx.y += 5;

  if (document.description) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const descLines = pdf.splitTextToSize(document.description, contentWidth);
    descLines.slice(0, 3).forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 3.5;
    });
    ctx.y += 2;
  }

  if (document.project_address) drawLabelValue(ctx, 'Adresse:', document.project_address);
  if (document.project_surface) drawLabelValue(ctx, 'Surface:', `${document.project_surface} m²`);
  if (document.construction_budget) drawLabelValue(ctx, 'Budget:', formatCurrency(document.construction_budget));
  
  ctx.y += 6;

  // Lines table
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');

  const tableData = includedLines.map(line => [
    line.phase_code || '-',
    line.phase_name || 'Prestation',
    String(line.quantity || 1),
    formatCurrency(line.unit_price || 0),
    formatCurrency(line.amount || 0)
  ]);

  discountLines.forEach(line => {
    tableData.push(['', `Remise: ${line.phase_name || ''}`, '', '', `-${formatCurrency(Math.abs(line.amount || 0))}`]);
  });

  drawSectionTitle(ctx, 'Prestations');

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Réf', 'Désignation', 'Qté', 'P.U.', 'Montant HT']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [60, 60, 60] },
    headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 6 },
    columnStyles: { 
      0: { cellWidth: 18 }, 
      2: { cellWidth: 15, halign: 'center' }, 
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' }
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 8;

  // Totals
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const tvaRate = (document.vat_rate || 20) / 100;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;

  drawTotals(ctx, totalHT, tvaRate, tvaAmount, totalTTC);

  // Payment terms
  if (document.payment_terms) {
    checkPageBreak(ctx, 20);
    drawSectionTitle(ctx, 'Conditions');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const paymentLines = pdf.splitTextToSize(document.payment_terms, contentWidth);
    paymentLines.slice(0, 4).forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 3.5;
    });
    ctx.y += 4;
  }

  // Validity
  pdf.setFontSize(7);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`Devis valable ${document.validity_days || 30} jours`, margin, ctx.y);
  ctx.y += 10;

  // Signature
  checkPageBreak(ctx, 40);
  drawSectionTitle(ctx, 'Accord');

  pdf.setFontSize(7);
  pdf.setTextColor(130, 130, 130);
  pdf.text('Date et signature du client', margin, ctx.y);
  pdf.text('Mention "Bon pour accord"', margin, ctx.y + 4);
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, ctx.y + 7, 60, 22);

  if (signatureBase64) {
    try {
      pdf.addImage(signatureBase64, 'AUTO', pageWidth - margin - 50, ctx.y + 5, 45, 22, undefined, 'FAST');
    } catch {}
  }

  // Footers
  addFooters(pdf, agencyInfo, 2);

  return pdf.output('blob');
}
