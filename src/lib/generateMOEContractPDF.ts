// Générateur PDF pour Contrat de Maîtrise d'Œuvre (MOE) Architecture
// Design professionnel avec typographie système

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MOEContractData, 
  MOEMissionPhase,
  MOEPaymentSchedule,
  DEFAULT_MOE_CLAUSES 
} from './moeContractConfig';
import { AgencyPDFInfo, loadImageAsBase64, addPDFFooter } from './pdfUtils';

// ============= Types =============

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

export async function generateMOEContractPDF(
  data: MOEContractData,
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

  const ctx: PDFContext = {
    pdf,
    margin: 20,
    pageWidth: pdf.internal.pageSize.getWidth(),
    pageHeight: pdf.internal.pageSize.getHeight(),
    contentWidth: pdf.internal.pageSize.getWidth() - 40,
    y: 20,
    logoBase64,
    signatureBase64,
    pageCount: 1
  };

  // === PAGE 1: Couverture ===
  renderCoverPage(ctx, data, agencyInfo);
  
  // === PAGE 2: Contractants + Objet + Programme ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderContractantsSection(ctx, data);
  renderObjetSection(ctx, data);
  renderProgrammeSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGE 3: Honoraires ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderHonorairesSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGE 4: Déroulement de la mission ===
  ctx.pdf.addPage();
  ctx.y = 20;
  ctx.pageCount++;
  renderDeroulementSection(ctx, data);
  addPageFooter(ctx, data);

  // === PAGE 5: Échelonnement ===
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

function renderCoverPage(ctx: PDFContext, data: MOEContractData, agencyInfo?: AgencyPDFInfo) {
  const { pdf, margin, pageWidth, pageHeight, logoBase64 } = ctx;

  // Logo en haut à gauche
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, 20, 35, 35);
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }

  // Nom de l'agence
  let y = 70;
  if (agencyInfo?.name) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80);
    pdf.text(agencyInfo.name.toUpperCase(), margin, y);
    y += 10;
  }

  // Titre principal
  y = 100;
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('PROPOSITION DE MISSION', margin, y);

  // Référence
  y += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Référence : ${data.reference}`, margin, y);

  // Informations projet
  y += 25;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text(`Projet : ${data.project.name}`, margin, y);

  y += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  const address = [data.project.address, data.project.postal_code, data.project.city].filter(Boolean).join(', ');
  pdf.text(`Lieu : ${address}`, margin, y);

  y += 10;
  pdf.text(`MOA : ${data.moa.name}`, margin, y);

  // Coordonnées agence en bas
  if (agencyInfo) {
    const bottomY = pageHeight - 50;
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    
    const agencyAddress = [agencyInfo.address, agencyInfo.postal_code, agencyInfo.city].filter(Boolean).join(', ');
    pdf.text(agencyAddress || '', margin, bottomY);
    
    // Note: ordre_number should be stored in agency settings if needed
    pdf.text('Société d\'architecture inscrite à l\'Ordre des Architectes', margin, bottomY + 6);
  }
}

function renderContractantsSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, contentWidth } = ctx;

  // Titre section
  ctx.y = renderSectionTitle(ctx, '1.1 CONTRACTANTS');

  // MOA
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('Le maître d\'ouvrage', margin, ctx.y);
  ctx.y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  
  const moaInfo = [
    `Représenté par : ${data.moa.name}`,
    data.moa.company_name ? `Société : ${data.moa.company_name}${data.moa.legal_form ? ` (${data.moa.legal_form})` : ''}` : null,
    `Adresse : ${[data.moa.address, data.moa.postal_code, data.moa.city].filter(Boolean).join(', ')}`,
    data.moa.phone ? `Téléphone : ${data.moa.phone}` : null,
    data.moa.email ? `Mail : ${data.moa.email}` : null
  ].filter(Boolean);

  moaInfo.forEach(line => {
    pdf.setFontSize(9);
    pdf.text(line as string, margin, ctx.y);
    ctx.y += 5;
  });

  ctx.y += 8;

  // MOE
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('L\'architecte', margin, ctx.y);
  ctx.y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  
  const moeInfo = [
    `La société : ${data.moe.company_name || data.moe.name}`,
    data.moe.representative_name ? `Représentée par : ${data.moe.representative_name}${data.moe.representative_title ? ` (${data.moe.representative_title})` : ''}` : null,
    `Adresse : ${[data.moe.address, data.moe.postal_code, data.moe.city].filter(Boolean).join(', ')}`,
    data.moe.phone ? `Téléphone : ${data.moe.phone}` : null,
    data.moe.email ? `Mail : ${data.moe.email}` : null
  ].filter(Boolean);

  moeInfo.forEach(line => {
    pdf.setFontSize(9);
    pdf.text(line as string, margin, ctx.y);
    ctx.y += 5;
  });

  ctx.y += 10;
}

function renderObjetSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.2 OBJET DE LA MISSION');

  const projectInfo = [
    { label: 'Projet', value: data.project.name },
    { label: 'Adresse', value: [data.project.address, data.project.postal_code, data.project.city].filter(Boolean).join(', ') },
    { label: 'Surface existante', value: data.project.existing_surface ? `${data.project.existing_surface} m²` : '-' },
    { label: 'Surface projet', value: data.project.project_surface ? `${data.project.project_surface} m²` : '-' }
  ];

  projectInfo.forEach(item => {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text(item.label, margin, ctx.y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30);
    pdf.text(item.value, margin + 40, ctx.y);
    ctx.y += 6;
  });

  ctx.y += 10;
}

function renderProgrammeSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.3 PROGRAMME');

  // Contraintes
  if (data.project.constraints) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text('Contraintes', margin, ctx.y);
    ctx.y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30);
    const constraintLines = pdf.splitTextToSize(data.project.constraints, contentWidth);
    constraintLines.forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 4;
    });
    ctx.y += 3;
  }

  // Exigences
  if (data.project.requirements) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text('Exigences', margin, ctx.y);
    ctx.y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30);
    const requirementLines = pdf.splitTextToSize(data.project.requirements, contentWidth);
    requirementLines.forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 4;
    });
    ctx.y += 3;
  }

  // Budget
  if (data.project.budget_travaux) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text('Budget global de l\'opération', margin, ctx.y);
    ctx.y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30);
    const budgetText = `Le maître d'ouvrage informe l'architecte que son enveloppe financière pour l'opération décrite ci-dessus est de ${formatCurrency(data.project.budget_travaux)} HT hors honoraires de l'Architecte.`;
    const budgetLines = pdf.splitTextToSize(budgetText, contentWidth);
    budgetLines.forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 4;
    });
  }

  // Notes
  if (data.project.additional_notes) {
    ctx.y += 5;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60);
    pdf.text('Autres détails', margin, ctx.y);
    ctx.y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30);
    const noteLines = pdf.splitTextToSize(data.project.additional_notes, contentWidth);
    noteLines.forEach((line: string) => {
      pdf.text(line, margin, ctx.y);
      ctx.y += 4;
    });
  }
}

function renderHonorairesSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, pageWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.4 HONORAIRES');

  // Table des honoraires
  const tableData = data.honoraires.map(item => [
    item.name,
    item.quantity.toString(),
    item.is_offered ? 'Offert' : formatCurrency(item.amount_ht),
    item.is_offered ? '' : formatCurrency(item.amount_ht * item.tva_rate),
    item.is_offered ? (item.is_optional ? '(en option)' : 'Offert') : formatCurrency(item.amount_ht * (1 + item.tva_rate))
  ]);

  // Ligne de total
  tableData.push([
    'Total',
    '',
    formatCurrency(data.total_ht),
    formatCurrency(data.tva_amount),
    formatCurrency(data.total_ttc)
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    head: [['Prestations', 'Quant.', 'Montant HT (€)', 'TVA (20%) (€)', 'Total TTC (€)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
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
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    foot: [],
    didParseCell: (data) => {
      // Style the total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 245, 245];
      }
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 10;

  // Méthode de calcul
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60);
  pdf.text('Méthode de calcul des honoraires', margin, ctx.y);
  ctx.y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30);
  
  const methodLabels: Record<string, string> = {
    forfait: 'Au forfait',
    percentage: 'Au pourcentage du montant des travaux',
    hourly: 'En régie (taux horaire)'
  };
  pdf.text(methodLabels[data.fee_calculation_method] || 'Au forfait', margin, ctx.y);
  ctx.y += 8;

  // Note
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  const nota = data.clauses.honoraires_nota || DEFAULT_MOE_CLAUSES.honoraires_nota;
  const notaLines = pdf.splitTextToSize(`NOTA : ${nota}`, ctx.contentWidth);
  notaLines.forEach((line: string) => {
    pdf.text(line, margin, ctx.y);
    ctx.y += 4;
  });
}

function renderDeroulementSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.5 DÉROULEMENT DE LA MISSION COMPLÈTE');

  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text('NOTA : Les phases suivantes peuvent être adaptées en fonction du projet et de sa complexité.', margin, ctx.y);
  ctx.y += 10;

  // Phases de mission
  const includedPhases = data.mission_phases.filter(p => p.is_included);
  
  includedPhases.forEach((phase, index) => {
    // Check for page break
    if (ctx.y > ctx.pageHeight - 50) {
      ctx.pdf.addPage();
      ctx.y = 20;
      ctx.pageCount++;
    }

    // Phase title
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30);
    pdf.text(`${phase.code} (${phase.name})`, margin, ctx.y);
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

    // Add "RÉUNION" between phases
    if (index < includedPhases.length - 1 && !phase.is_optional) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text('RÉUNION', margin, ctx.y);
      ctx.y += 8;
    }
  });

  // Délais validation
  ctx.y += 5;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60);
  pdf.text('Délais de validation', margin, ctx.y);
  ctx.y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(80);
  const delaisText = data.clauses.delais_validation || DEFAULT_MOE_CLAUSES.delais_validation;
  const delaisLines = pdf.splitTextToSize(delaisText, contentWidth);
  delaisLines.forEach((line: string) => {
    pdf.text(line, margin, ctx.y);
    ctx.y += 4;
  });
}

function renderEchelonnementSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.6 ÉCHELONNEMENT');

  pdf.setFontSize(9);
  pdf.setTextColor(60);
  const introText = 'Dans le déroulement normal de la mission, le règlement des honoraires s\'effectuera de façon échelonnée, sur situation d\'avancement.';
  const introLines = pdf.splitTextToSize(introText, contentWidth);
  introLines.forEach((line: string) => {
    pdf.text(line, margin, ctx.y);
    ctx.y += 5;
  });
  ctx.y += 5;

  // Payment schedule table
  const scheduleData = data.payment_schedule.map(item => [
    item.description ? `${item.stage} (${item.description})` : item.stage,
    `${item.percentage}%`
  ]);

  autoTable(pdf, {
    startY: ctx.y,
    body: scheduleData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 9,
      textColor: 30,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });

  ctx.y = (pdf as any).lastAutoTable.finalY + 10;
}

function renderClausesSection(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, contentWidth } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.7 CLAUSES ANNEXES');

  const clauses = [
    { title: 'Responsabilité de l\'Architecte', content: data.clauses.responsabilite || DEFAULT_MOE_CLAUSES.responsabilite },
    { title: 'Références aux règlements et tiers spécialisés', content: data.clauses.references_tiers || DEFAULT_MOE_CLAUSES.references_tiers },
    { title: 'Limitation de responsabilité', content: data.clauses.limitation_responsabilite || DEFAULT_MOE_CLAUSES.limitation_responsabilite },
    { title: 'Modification de la mission et avenants', content: data.clauses.modification_avenant || DEFAULT_MOE_CLAUSES.modification_avenant },
    { title: 'Obligations du Maître d\'œuvre', content: data.clauses.obligations_moe || DEFAULT_MOE_CLAUSES.obligations_moe },
    { title: 'Obligations du Maître d\'ouvrage', content: data.clauses.obligations_moa || DEFAULT_MOE_CLAUSES.obligations_moa },
    { title: 'Imprévus', content: data.clauses.imprevus || DEFAULT_MOE_CLAUSES.imprevus },
    { title: 'Suspension des prestations', content: data.clauses.suspension || DEFAULT_MOE_CLAUSES.suspension },
    { title: 'Résiliation du contrat', content: data.clauses.resiliation || DEFAULT_MOE_CLAUSES.resiliation },
    { title: 'Litiges et conciliation préalable', content: data.clauses.litiges || DEFAULT_MOE_CLAUSES.litiges }
  ];

  clauses.forEach(clause => {
    // Check for page break
    if (ctx.y > ctx.pageHeight - 60) {
      addPageFooter(ctx, data);
      ctx.pdf.addPage();
      ctx.y = 20;
      ctx.pageCount++;
    }

    // Title
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30);
    pdf.text(clause.title + ' :', margin, ctx.y);
    ctx.y += 5;

    // Content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(60);
    const contentLines = pdf.splitTextToSize(clause.content, contentWidth);
    contentLines.forEach((line: string) => {
      if (ctx.y > ctx.pageHeight - 30) {
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

function renderSignaturesSection(ctx: PDFContext, data: MOEContractData, agencyInfo?: AgencyPDFInfo) {
  const { pdf, margin, pageWidth, contentWidth, signatureBase64 } = ctx;

  ctx.y = renderSectionTitle(ctx, '1.8 SIGNATURE DES PARTIES');

  pdf.setFontSize(10);
  pdf.setTextColor(60);
  pdf.text(`Fait en deux exemplaires à ${data.moe.city || 'Paris'}, le ${format(new Date(data.date), 'd MMMM yyyy', { locale: fr })}`, margin, ctx.y);
  ctx.y += 15;

  const colWidth = contentWidth / 2 - 10;

  // MOA Signature
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('Le Maître de l\'ouvrage', margin, ctx.y);
  ctx.y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.moa.name, margin, ctx.y);
  ctx.y += 8;
  
  pdf.setFontSize(8);
  pdf.setTextColor(80);
  pdf.text('Signature (faire précéder de la mention "lu et approuvé") :', margin, ctx.y);
  ctx.y += 5;
  
  // Signature box for MOA
  pdf.setDrawColor(180);
  pdf.rect(margin, ctx.y, 70, 30);

  // MOE Signature (on the right)
  const rightX = margin + colWidth + 20;
  const rightY = ctx.y - 19;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text('L\'architecte', rightX, rightY);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.moe.representative_name || data.moe.name, rightX, rightY + 6);
  
  if (data.moe.company_name) {
    pdf.setFontSize(8);
    pdf.setTextColor(60);
    pdf.text(`Représentant légal de la société ${data.moe.company_name}`, rightX, rightY + 11);
  }
  
  // Insurance info
  if (data.insurance_company && data.insurance_policy_number) {
    pdf.setFontSize(8);
    pdf.setTextColor(80);
    pdf.text('Déclare être assuré en responsabilité civile et décennale.', rightX, rightY + 18);
  }

  pdf.setFontSize(8);
  pdf.setTextColor(80);
  pdf.text('Signature (faire précéder de la mention "lu et approuvé") :', rightX, rightY + 24);
  
  // Signature box or image for MOE
  if (signatureBase64) {
    try {
      pdf.addImage(signatureBase64, 'PNG', rightX, rightY + 29, 50, 25);
    } catch (e) {
      pdf.setDrawColor(180);
      pdf.rect(rightX, rightY + 29, 70, 30);
    }
  } else {
    pdf.setDrawColor(180);
    pdf.rect(rightX, rightY + 29, 70, 30);
  }

  ctx.y += 45;
}

// ============= Helpers =============

function renderSectionTitle(ctx: PDFContext, title: string): number {
  const { pdf, margin } = ctx;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  pdf.text(title, margin, ctx.y);
  
  return ctx.y + 10;
}

function addPageFooter(ctx: PDFContext, data: MOEContractData) {
  const { pdf, margin, pageWidth, pageHeight } = ctx;
  
  pdf.setFontSize(7);
  pdf.setTextColor(150);
  
  // Paraphe note
  pdf.text('Paraphe MOE ____________', margin, pageHeight - 15);
  pdf.text('Paraphe MOA ____________', pageWidth - margin - 40, pageHeight - 15);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
}

// ============= Export Helper =============

export function createDefaultMOEContractData(
  agencyInfo?: AgencyPDFInfo,
  clientName?: string,
  projectName?: string
): Partial<MOEContractData> {
  return {
    reference: formatMOEReference(new Date(), clientName || 'Client'),
    date: new Date().toISOString(),
    moa: {
      type: 'moa',
      name: clientName || '',
      address: ''
    },
    moe: {
      type: 'moe',
      name: agencyInfo?.name || '',
      company_name: agencyInfo?.name,
      address: agencyInfo?.address || '',
      postal_code: agencyInfo?.postal_code,
      city: agencyInfo?.city,
      phone: agencyInfo?.phone,
      email: agencyInfo?.email
    },
    project: {
      name: projectName || '',
      address: '',
      project_type: 'renovation'
    },
    mission_phases: [],
    honoraires: [],
    total_ht: 0,
    tva_rate: 0.2,
    tva_amount: 0,
    total_ttc: 0,
    fee_calculation_method: 'forfait',
    payment_schedule: [],
    clauses: DEFAULT_MOE_CLAUSES
  };
}

function formatMOEReference(date: Date, clientName: string): string {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const initials = clientName
    .split(' ')
    .map(word => word[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 3);
  
  return `${year}${month}${day}_${initials}`;
}
