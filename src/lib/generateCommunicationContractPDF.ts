// Générateur PDF pour Contrat de Communication
// Design professionnel avec typographie système et marges uniformes

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CommunicationPhase,
  DEFAULT_COMMUNICATION_CLAUSES,
  DEFAULT_COMMUNICATION_PHASES,
  DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE
} from './communicationContractDefaults';
import { MOEPaymentSchedule } from './moeContractConfig';
import { AgencyPDFInfo, loadImageAsBase64 } from './pdfUtils';
import { formatCurrencyPDF } from './pdfFonts';

// ============= Types =============

export interface CommunicationContractData {
  reference: string;
  date: string;
  client: {
    name: string;
    company_name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  };
  agency: {
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    siret?: string;
    vat_number?: string;
  };
  project: {
    name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
  };
  phases: CommunicationPhase[];
  prestations: Array<{
    name: string;
    quantity: number;
    amount_ht: number;
    tva_rate: number;
    is_optional?: boolean;
  }>;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  payment_schedule: MOEPaymentSchedule[];
  clauses: Record<string, string>;
  daily_rate?: number;
}

interface PDFContext {
  pdf: jsPDF;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  y: number;
  logoBase64: string | null;
  signatureBase64: string | null;
  pageCount: number;
}

// ============= Main Generator =============

export async function generateCommunicationContractPDF(
  data: CommunicationContractData,
  agencyInfo?: AgencyPDFInfo
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Load images
  const logoBase64 = agencyInfo?.logo_url 
    ? await loadImageAsBase64(agencyInfo.logo_url) 
    : null;
  const signatureBase64 = agencyInfo?.signature_url 
    ? await loadImageAsBase64(agencyInfo.signature_url) 
    : null;

  // Consistent 20mm margins
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  const ctx: PDFContext = {
    pdf,
    margin,
    pageWidth,
    pageHeight,
    contentWidth,
    y: margin,
    logoBase64,
    signatureBase64,
    pageCount: 1
  };

  // === PAGE 1: Couverture ===
  renderCoverPage(ctx, data, agencyInfo);
  
  // === PAGE 2: Contractants ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderContractantsSection(ctx, data);
  renderObjetSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGE 3: Prestations et tarifs ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderPrestationsSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGE 4: Phases de projet ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderPhasesSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGE 5: Échéancier ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderEchelonnementSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGES 6+: Clauses ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderClausesSection(ctx, data);
  addPageFooter(ctx, data);

  // === Dernière page: Signatures ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderSignaturesSection(ctx, data, agencyInfo);
  addPageFooter(ctx, data);

  // Update total page count
  const totalPages = ctx.pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    ctx.pdf.setPage(i);
    ctx.pdf.setFontSize(8);
    ctx.pdf.setTextColor(150);
    ctx.pdf.text(
      `Page ${i} sur ${totalPages}`,
      ctx.pageWidth - ctx.margin,
      ctx.pageHeight - 10,
      { align: 'right' }
    );
  }

  return pdf.output('blob');
}

// ============= Section Renderers =============

function renderCoverPage(ctx: PDFContext, data: CommunicationContractData, agencyInfo?: AgencyPDFInfo) {
  const { pdf, margin, pageWidth, pageHeight, logoBase64 } = ctx;

  // Logo - preserve aspect ratio, max 50x35mm
  if (logoBase64) {
    try {
      const maxLogoWidth = 50;
      const maxLogoHeight = 35;
      pdf.addImage(logoBase64, 'AUTO', margin, margin, maxLogoWidth, maxLogoHeight, undefined, 'FAST');
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  // Agency name
  let y = margin + 45;
  if (agencyInfo?.name) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100);
    pdf.text(agencyInfo.name.toUpperCase(), margin, y);
    y += 12;
  }

  // Main title
  y = 100;
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('CONTRAT DE PRESTATIONS', margin, y);
  y += 10;
  pdf.setFontSize(18);
  pdf.setTextColor(80);
  pdf.text('EN COMMUNICATION', margin, y);

  // Reference
  y += 18;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Référence : ${data.reference}`, margin, y);

  // Project info
  y += 25;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  const projectTitle = data.project.name || 'Projet';
  const projectTitleLines = pdf.splitTextToSize(`Projet : ${projectTitle}`, ctx.contentWidth);
  projectTitleLines.forEach((line: string) => {
    pdf.text(line, margin, y);
    y += 8;
  });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  pdf.text(`Client : ${data.client.company_name || data.client.name}`, margin, y);

  // Agency info at bottom
  if (agencyInfo) {
    const bottomY = pageHeight - 50;
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    
    const agencyAddress = [agencyInfo.address, agencyInfo.postal_code, agencyInfo.city].filter(Boolean).join(', ');
    pdf.text(agencyAddress || '', margin, bottomY);
    
    if (agencyInfo.phone || agencyInfo.email) {
      const contactLine = [agencyInfo.phone, agencyInfo.email].filter(Boolean).join(' • ');
      pdf.text(contactLine, margin, bottomY + 5);
    }
  }
}

function renderContractantsSection(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin } = ctx;

  ctx.y = renderSectionTitle(ctx, '1. LES PARTIES');

  // Client
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('Le Client', margin, ctx.y);
  ctx.y += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  
  const clientInfo = [
    data.client.company_name ? `Société : ${data.client.company_name}` : null,
    `Représenté par : ${data.client.name}`,
    data.client.address ? `Adresse : ${[data.client.address, data.client.postal_code, data.client.city].filter(Boolean).join(', ')}` : null,
    data.client.phone ? `Téléphone : ${data.client.phone}` : null,
    data.client.email ? `Email : ${data.client.email}` : null
  ].filter(Boolean);

  clientInfo.forEach(line => {
    pdf.text(line as string, margin, ctx.y);
    ctx.y += 5;
  });

  ctx.y += 10;

  // Agency
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('L\'Agence', margin, ctx.y);
  ctx.y += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  
  const agencyInfoLines = [
    `Société : ${data.agency.name}`,
    data.agency.address ? `Adresse : ${[data.agency.address, data.agency.postal_code, data.agency.city].filter(Boolean).join(', ')}` : null,
    data.agency.phone ? `Téléphone : ${data.agency.phone}` : null,
    data.agency.email ? `Email : ${data.agency.email}` : null,
    data.agency.siret ? `SIRET : ${data.agency.siret}` : null
  ].filter(Boolean);

  agencyInfoLines.forEach(line => {
    pdf.text(line as string, margin, ctx.y);
    ctx.y += 5;
  });

  ctx.y += 12;
}

function renderObjetSection(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '2. OBJET DU CONTRAT');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);

  const objetText = data.clauses.objet || DEFAULT_COMMUNICATION_CLAUSES.objet;
  const objetLines = pdf.splitTextToSize(objetText, contentWidth);
  objetLines.forEach((line: string) => {
    pdf.text(line, margin, ctx.y);
    ctx.y += 5;
  });

  ctx.y += 8;

  // Project details
  const projectDetails = [
    { label: 'Projet', value: data.project.name },
    data.project.description ? { label: 'Description', value: data.project.description } : null,
    data.project.budget ? { label: 'Budget', value: formatCurrency(data.project.budget) } : null,
    data.project.start_date ? { label: 'Début prévu', value: format(new Date(data.project.start_date), 'd MMMM yyyy', { locale: fr }) } : null
  ].filter(Boolean);

  projectDetails.forEach(item => {
    if (item) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60);
      pdf.text(item.label, margin, ctx.y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30);
      pdf.text(item.value, margin + 35, ctx.y);
      ctx.y += 6;
    }
  });

  ctx.y += 10;
}

function renderPrestationsSection(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin } = ctx;

  ctx.y = renderSectionTitle(ctx, '3. PRESTATIONS ET TARIFS');

  // Table
  const tableData = data.prestations.map(item => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.amount_ht),
    formatCurrency(item.amount_ht * item.tva_rate),
    formatCurrency(item.amount_ht * (1 + item.tva_rate))
  ]);

  // Total row
  tableData.push([
    'TOTAL',
    '',
    formatCurrency(data.total_ht),
    formatCurrency(data.tva_amount),
    formatCurrency(data.total_ttc)
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Prestations', 'Qté', 'Montant HT', 'TVA (20%)', 'Total TTC']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 30,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (cellData) => {
      if (cellData.row.index === tableData.length - 1) {
        cellData.cell.styles.fontStyle = 'bold';
        cellData.cell.styles.fillColor = [245, 245, 245];
      }
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 10;

  // Daily rate note
  if (data.daily_rate) {
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(`Taux journalier de référence : ${formatCurrency(data.daily_rate)} HT`, margin, ctx.y);
    ctx.y += 5;
  }
}

function renderPhasesSection(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '4. DÉROULEMENT DU PROJET');

  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text('Les phases suivantes peuvent être adaptées en fonction du projet.', margin, ctx.y);
  ctx.y += 10;

  const phases = data.phases.length > 0 ? data.phases : DEFAULT_COMMUNICATION_PHASES;
  const includedPhases = phases.filter(p => p.is_included);

  includedPhases.forEach((phase) => {
    // Check for page break
    if (ctx.y > ctx.pageHeight - 50) {
      addPageFooter(ctx, data);
      ctx.pdf.addPage();
      ctx.y = 20;
      ctx.pageCount++;
    }

    // Phase title
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30);
    pdf.text(`${phase.code} - ${phase.name}`, margin, ctx.y);
    ctx.y += 5;

    // Description
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60);
    const descLines = pdf.splitTextToSize(phase.description, contentWidth);
    descLines.forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 4;
    });

    // Deliverables
    if (phase.deliverables && phase.deliverables.length > 0) {
      ctx.y += 2;
      pdf.setFontSize(8);
      pdf.setTextColor(80);
      phase.deliverables.forEach(deliverable => {
        pdf.text(`• ${deliverable}`, margin + 5, ctx.y);
        ctx.y += 4;
      });
    }

    ctx.y += 8;
  });
}

function renderEchelonnementSection(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '5. ÉCHÉANCIER DE PAIEMENT');

  pdf.setFontSize(10);
  pdf.setTextColor(60);
  const introText = 'Le règlement des prestations s\'effectue selon l\'échéancier suivant :';
  const introLines = pdf.splitTextToSize(introText, contentWidth);
  introLines.forEach((line: string) => {
    pdf.text(line, margin, ctx.y);
    ctx.y += 5;
  });
  ctx.y += 5;

  const schedule = data.payment_schedule.length > 0 
    ? data.payment_schedule 
    : DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE;

  const scheduleData = schedule.map(item => [
    item.description ? `${item.stage} - ${item.description}` : item.stage,
    `${item.percentage}%`,
    formatCurrency(data.total_ht * item.percentage / 100)
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Étape', '%', 'Montant HT']],
    body: scheduleData,
    theme: 'striped',
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 30,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 10;

  // Payment terms note
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  const paymentNote = 'Les factures sont payables à 30 jours date de facture sauf accord particulier.';
  pdf.text(paymentNote, margin, ctx.y);
}

function renderClausesSection(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '6. CONDITIONS GÉNÉRALES');

  const defaultClauses = DEFAULT_COMMUNICATION_CLAUSES;
  const clauses = [
    { title: 'Propriété intellectuelle', content: data.clauses.propriete_intellectuelle || defaultClauses.propriete_intellectuelle },
    { title: 'Cession de droits', content: data.clauses.cession_droits || defaultClauses.cession_droits },
    { title: 'Confidentialité', content: data.clauses.confidentialite || defaultClauses.confidentialite },
    { title: 'Validation', content: data.clauses.validation || defaultClauses.validation },
    { title: 'Modifications', content: data.clauses.modifications || defaultClauses.modifications },
    { title: 'Délais', content: data.clauses.delais || defaultClauses.delais },
    { title: 'Responsabilité', content: data.clauses.responsabilite || defaultClauses.responsabilite },
    { title: 'Sous-traitance', content: data.clauses.sous_traitance || defaultClauses.sous_traitance },
    { title: 'Résiliation', content: data.clauses.resiliation || defaultClauses.resiliation },
    { title: 'Litiges', content: data.clauses.litiges || defaultClauses.litiges }
  ];

  clauses.forEach(clause => {
    // Check for page break
    if (ctx.y > ctx.pageHeight - 50) {
      addPageFooter(ctx, data);
      ctx.pdf.addPage();
      ctx.y = 20;
      ctx.pageCount++;
    }

    // Title
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30);
    pdf.text(clause.title, margin, ctx.y);
    ctx.y += 5;

    // Content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(60);
    const contentLines = pdf.splitTextToSize(clause.content, contentWidth);
    contentLines.forEach((line: string) => {
      if (ctx.y > ctx.pageHeight - 25) {
        addPageFooter(ctx, data);
        ctx.pdf.addPage();
        ctx.y = 20;
        ctx.pageCount++;
      }
      pdf.text(line, margin, ctx.y);
      ctx.y += 4;
    });
    ctx.y += 6;
  });
}

function renderSignaturesSection(ctx: PDFContext, data: CommunicationContractData, agencyInfo?: AgencyPDFInfo) {
  const { pdf, margin, contentWidth, signatureBase64 } = ctx;

  ctx.y = renderSectionTitle(ctx, '7. SIGNATURES');

  pdf.setFontSize(10);
  pdf.setTextColor(60);
  pdf.text(`Fait en deux exemplaires à ${data.agency.city || 'Paris'}, le ${format(new Date(data.date), 'd MMMM yyyy', { locale: fr })}`, margin, ctx.y);
  ctx.y += 15;

  const colWidth = contentWidth / 2 - 10;

  // Client Signature
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('Le Client', margin, ctx.y);
  ctx.y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.client.company_name || data.client.name, margin, ctx.y);
  ctx.y += 8;
  
  pdf.setFontSize(8);
  pdf.setTextColor(80);
  pdf.text('Signature (précédée de "Lu et approuvé") :', margin, ctx.y);
  ctx.y += 5;
  
  // Signature box for client
  pdf.setDrawColor(180);
  pdf.rect(margin, ctx.y, 70, 30);

  // Agency Signature (on the right)
  const rightX = margin + colWidth + 20;
  const rightY = ctx.y - 19;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('L\'Agence', rightX, rightY);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.agency.name, rightX, rightY + 6);

  pdf.setFontSize(8);
  pdf.setTextColor(80);
  pdf.text('Signature (précédée de "Lu et approuvé") :', rightX, rightY + 18);
  
  // Signature box or image for agency
  if (signatureBase64) {
    try {
      pdf.addImage(signatureBase64, 'PNG', rightX, rightY + 23, 50, 25);
    } catch (e) {
      pdf.setDrawColor(180);
      pdf.rect(rightX, rightY + 23, 70, 30);
    }
  } else {
    pdf.setDrawColor(180);
    pdf.rect(rightX, rightY + 23, 70, 30);
  }

  ctx.y += 45;
}

// ============= Helpers =============

function renderSectionTitle(ctx: PDFContext, title: string): number {
  const { pdf, margin } = ctx;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text(title, margin, ctx.y);
  
  return ctx.y + 12;
}

function addPageFooter(ctx: PDFContext, data: CommunicationContractData) {
  const { pdf, margin, pageWidth, pageHeight } = ctx;
  
  // Paraphes
  pdf.setFontSize(7);
  pdf.setTextColor(150);
  pdf.text('Paraphe Client :', pageWidth - margin - 40, pageHeight - 20);
  pdf.text('Paraphe Agence :', pageWidth - margin - 40, pageHeight - 15);
  
  // Draw boxes
  pdf.setDrawColor(200);
  pdf.rect(pageWidth - margin - 15, pageHeight - 22, 10, 6);
  pdf.rect(pageWidth - margin - 15, pageHeight - 17, 10, 6);
}

function formatCurrency(amount: number): string {
  return formatCurrencyPDF(amount);
}
