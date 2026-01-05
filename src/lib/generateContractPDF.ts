import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  PROJECT_TYPE_LABELS,
  FEE_MODE_LABELS
} from './commercialTypes';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  formatFullAddress,
  formatLegalInfo 
} from './pdfUtils';

/**
 * Génère un contrat complet (A4 portrait, multi-pages)
 */
export async function generateContractPDF(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number,
  agencyInfo?: AgencyPDFInfo
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  // Load images
  let logoBase64: string | null = null;
  let signatureBase64: string | null = null;
  
  if (agencyInfo?.logo_url) {
    logoBase64 = await loadImageAsBase64(agencyInfo.logo_url);
  }
  if (agencyInfo?.signature_url) {
    signatureBase64 = await loadImageAsBase64(agencyInfo.signature_url);
  }

  const addPageIfNeeded = (requiredSpace: number = 30) => {
    if (y + requiredSpace > pageHeight - 30) {
      addFooter();
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addFooter = () => {
    const pageNumber = pdf.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('Paraphe MOE ______    Paraphe MOA ______', pageWidth - margin, pageHeight - 10, { align: 'right' });
    
    // Legal info
    if (agencyInfo) {
      const legalInfo = formatLegalInfo(agencyInfo);
      if (legalInfo) {
        pdf.setFontSize(6);
        pdf.text(legalInfo, margin, pageHeight - 10);
      }
    }
  };

  const addSectionTitle = (title: string, level: number = 1) => {
    addPageIfNeeded(20);
    pdf.setTextColor(0);
    if (level === 1) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      y += 8;
    } else {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      y += 5;
    }
    pdf.text(title, margin, y);
    y += level === 1 ? 8 : 5;
  };

  const addParagraph = (text: string, options: { indent?: number, color?: number[] } = {}) => {
    const indent = options.indent || 0;
    const maxWidth = contentWidth - indent;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (options.color) {
      pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      pdf.setTextColor(60);
    }
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      addPageIfNeeded(6);
      pdf.text(line, margin + indent, y);
      y += 5;
    });
    y += 2;
  };

  // ==========================================
  // PAGE 1 - COVER with Logo
  // ==========================================
  
  // Logo
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, y, 30, 30);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  // Agency info next to logo
  const textStartX = logoBase64 ? margin + 35 : margin;
  if (agencyInfo) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text(agencyInfo.name, textStartX, y + 8);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80);
    const address = formatFullAddress(agencyInfo);
    if (address) pdf.text(address, textStartX, y + 14);
    if (agencyInfo.phone) pdf.text(agencyInfo.phone, textStartX, y + 19);
    if (agencyInfo.email) pdf.text(agencyInfo.email, textStartX, y + 24);
  }
  
  y = logoBase64 ? margin + 40 : margin + 10;
  
  // Header with document type
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('CONTRAT DE MAÎTRISE D\'ŒUVRE', margin, y);
  
  y += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`RÉFÉRENCE : ${document.document_number || 'N/A'}`, margin, y);
  
  y += 15;
  
  // Project info box
  pdf.setDrawColor(200);
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(margin, y, contentWidth, 55, 3, 3, 'FD');
  
  y += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('PROJET', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(document.title || 'Sans titre', margin + 35, y);
  
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('LIEU', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  const location = [document.project_address, document.project_city].filter(Boolean).join(', ') || 'Non défini';
  pdf.text(location, margin + 35, y);
  
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('TYPE', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(PROJECT_TYPE_LABELS[document.project_type || 'interior'], margin + 35, y);
  
  if (document.project_surface) {
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('SURFACE', margin + 5, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${document.project_surface} m²`, margin + 35, y);
  }
  
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('BUDGET TRAVAUX', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  const budgetText = document.construction_budget_disclosed === false
    ? 'Non communiqué'
    : document.construction_budget 
      ? formatCurrency(document.construction_budget)
      : 'Non défini';
  pdf.text(budgetText, margin + 50, y);
  
  y += 20;
  
  // Client info
  pdf.setFont('helvetica', 'bold');
  pdf.text('MOA', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(document.client_company?.name || 'Client non défini', margin + 35, y);
  
  // ==========================================
  // PAGE 2 - CONTRACTANTS
  // ==========================================
  pdf.addPage();
  y = margin;
  
  addSectionTitle('ARTICLE 1 - LES PARTIES');
  
  addSectionTitle('1.1 Le maître d\'ouvrage', 2);
  addParagraph(`Ci-après dénommé "le Client" ou "MOA"`);
  addParagraph(`Représenté par : ${document.client_company?.name || 'À définir'}`);
  if (document.client_contact?.name) {
    addParagraph(`Contact : ${document.client_contact.name}`);
  }
  if (document.client_contact?.email) {
    addParagraph(`Email : ${document.client_contact.email}`);
  }
  
  y += 5;
  addSectionTitle('1.2 L\'architecte / Maître d\'œuvre', 2);
  addParagraph('Ci-après dénommé "l\'Architecte" ou "MOE"');
  if (agencyInfo) {
    addParagraph(`Représenté par : ${agencyInfo.name}`);
    const address = formatFullAddress(agencyInfo);
    if (address) addParagraph(`Adresse : ${address}`);
    if (agencyInfo.siret) addParagraph(`SIRET : ${agencyInfo.siret}`);
  } else {
    addParagraph('La société représentée assure la mission de maîtrise d\'œuvre selon les termes du présent contrat.');
  }
  
  // ==========================================
  // ARTICLE 2 - OBJET DU CONTRAT
  // ==========================================
  y += 5;
  addSectionTitle('ARTICLE 2 - OBJET DU CONTRAT');
  
  addParagraph('Le présent contrat a pour objet de définir les conditions dans lesquelles le Maître d\'œuvre s\'engage à réaliser la mission de maîtrise d\'œuvre pour le compte du Maître d\'ouvrage.');
  
  addSectionTitle('2.1 Description du projet', 2);
  addParagraph(document.title || 'Mission de maîtrise d\'œuvre');
  
  if (document.description) {
    addParagraph(document.description);
  }
  
  addSectionTitle('2.2 Localisation', 2);
  addParagraph(location);
  
  if (document.project_surface) {
    addSectionTitle('2.3 Surface', 2);
    addParagraph(`Surface approximative : ${document.project_surface} m²`);
  }
  
  // ==========================================
  // ARTICLE 3 - PROGRAMME
  // ==========================================
  if (document.special_conditions) {
    y += 5;
    addSectionTitle('ARTICLE 3 - PROGRAMME');
    addParagraph(document.special_conditions);
  }
  
  // ==========================================
  // ARTICLE 4 - HONORAIRES
  // ==========================================
  addPageIfNeeded(80);
  addSectionTitle('ARTICLE 4 - HONORAIRES');
  
  addSectionTitle('4.1 Montant des honoraires', 2);
  
  const includedPhases = phases.filter(p => p.is_included);
  const totalPercentage = includedPhases.reduce((sum, p) => sum + p.percentage_fee, 0);
  
  const tableData = includedPhases.map(phase => {
    const phaseAmount = totalPercentage > 0 ? total * (phase.percentage_fee / totalPercentage) : 0;
    const phaseTVA = phaseAmount * 0.2;
    return [
      `${phase.phase_code} - ${phase.phase_name}`,
      `${phase.percentage_fee}%`,
      formatCurrency(phaseAmount),
      formatCurrency(phaseTVA),
      formatCurrency(phaseAmount + phaseTVA)
    ];
  });
  
  tableData.push([
    'TOTAL',
    `${totalPercentage}%`,
    formatCurrency(total),
    formatCurrency(total * 0.2),
    formatCurrency(total * 1.2)
  ]);
  
  autoTable(pdf, {
    startY: y,
    head: [['Prestations', '%', 'Montant HT', 'TVA (20%)', 'Total TTC']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [60, 60, 60], 
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: 50
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });
  
  y = (pdf as any).lastAutoTable.finalY + 10;
  
  addSectionTitle('4.2 Mode de calcul', 2);
  addParagraph(`Mode de rémunération : ${FEE_MODE_LABELS[document.fee_mode || 'fixed']}`);
  
  if (document.fee_mode === 'percentage' && document.construction_budget) {
    addParagraph(`Base de calcul : ${document.fee_percentage}% du budget travaux estimé à ${formatCurrency(document.construction_budget)}`);
  }
  
  // ==========================================
  // ARTICLE 5 - CONTENU DE LA MISSION
  // ==========================================
  addPageIfNeeded(100);
  addSectionTitle('ARTICLE 5 - CONTENU DE LA MISSION');
  
  addParagraph('La mission du Maître d\'œuvre comprend les phases suivantes :');
  y += 3;
  
  includedPhases.forEach((phase, index) => {
    addPageIfNeeded(40);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text(`5.${index + 1} ${phase.phase_code} - ${phase.phase_name}`, margin, y);
    y += 6;
    
    if (phase.phase_description) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(80);
      const descLines = pdf.splitTextToSize(phase.phase_description, contentWidth);
      descLines.forEach((line: string) => {
        pdf.text(line, margin, y);
        y += 4;
      });
      y += 2;
    }
    
    if (phase.deliverables && phase.deliverables.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      pdf.text('Livrables :', margin, y);
      y += 4;
      phase.deliverables.forEach(deliverable => {
        addPageIfNeeded(6);
        pdf.text(`• ${deliverable}`, margin + 5, y);
        y += 4;
      });
    }
    
    y += 5;
  });
  
  // ==========================================
  // ARTICLE 6 - ECHELONNEMENT DES PAIEMENTS
  // ==========================================
  addPageIfNeeded(80);
  addSectionTitle('ARTICLE 6 - ÉCHELONNEMENT DES PAIEMENTS');
  
  addParagraph('Le règlement des honoraires s\'effectuera de façon échelonnée, selon le calendrier suivant :');
  y += 3;
  
  const paymentData = [
    ['Acompte à la signature', '30%', formatCurrency(total * 0.3)],
    ['Validation phase conception', '20%', formatCurrency(total * 0.2)],
    ['Validation phase projet', '20%', formatCurrency(total * 0.2)],
    ['Pendant les travaux', '25%', formatCurrency(total * 0.25)],
    ['À la réception', '5%', formatCurrency(total * 0.05)]
  ];
  
  autoTable(pdf, {
    startY: y,
    head: [['Échéance', '%', 'Montant HT']],
    body: paymentData,
    theme: 'striped',
    headStyles: { 
      fillColor: [60, 60, 60], 
      textColor: 255,
      fontSize: 9
    },
    bodyStyles: { 
      fontSize: 9 
    },
    margin: { left: margin, right: margin },
    tableWidth: 120
  });
  
  y = (pdf as any).lastAutoTable.finalY + 10;
  
  // ==========================================
  // ARTICLE 7 - CONDITIONS GÉNÉRALES
  // ==========================================
  if (document.general_conditions) {
    addPageIfNeeded(50);
    addSectionTitle('ARTICLE 7 - CONDITIONS GÉNÉRALES');
    
    const conditions = document.general_conditions.split('\n');
    conditions.forEach(condition => {
      if (condition.trim()) {
        addParagraph(condition.trim());
      }
    });
  }
  
  if (document.payment_terms) {
    addPageIfNeeded(30);
    addSectionTitle('7.1 Conditions de paiement', 2);
    addParagraph(document.payment_terms);
  }
  
  // ==========================================
  // ARTICLE 8 - SIGNATURES
  // ==========================================
  addPageIfNeeded(120);
  addSectionTitle('ARTICLE 8 - SIGNATURE DES PARTIES');
  
  y += 5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  pdf.text(`Fait en deux exemplaires originaux, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, margin, y);
  
  y += 15;
  
  const boxWidth = (contentWidth - 10) / 2;
  const boxHeight = 70;
  
  // Left box - Client
  pdf.setDrawColor(180);
  pdf.rect(margin, y, boxWidth, boxHeight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('Le Maître de l\'ouvrage', margin + 5, y + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  pdf.text(document.client_company?.name || 'Client', margin + 5, y + 18);
  pdf.setFontSize(8);
  pdf.text('Signature précédée de la mention', margin + 5, y + 35);
  pdf.text('"Lu et approuvé, bon pour accord" :', margin + 5, y + 40);
  
  // Right box - Architect with signature
  pdf.rect(margin + boxWidth + 10, y, boxWidth, boxHeight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('L\'architecte / Maître d\'œuvre', margin + boxWidth + 15, y + 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  if (agencyInfo?.name) {
    pdf.text(agencyInfo.name, margin + boxWidth + 15, y + 18);
  }
  
  // Add signature if available
  if (signatureBase64) {
    try {
      pdf.addImage(signatureBase64, 'PNG', margin + boxWidth + 15, y + 30, 60, 24);
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
      pdf.setFontSize(8);
      pdf.text('Signature précédée de la mention', margin + boxWidth + 15, y + 35);
      pdf.text('"Lu et approuvé, bon pour accord" :', margin + boxWidth + 15, y + 40);
    }
  } else {
    pdf.setFontSize(8);
    pdf.text('Signature précédée de la mention', margin + boxWidth + 15, y + 35);
    pdf.text('"Lu et approuvé, bon pour accord" :', margin + boxWidth + 15, y + 40);
  }
  
  y += boxHeight + 10;
  
  // Validity notice
  y += 10;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100);
  const validityText = `Cette offre est valable ${document.validity_days || 30} jours à compter de sa date d'émission.`;
  pdf.text(validityText, margin, y);
  
  // Add footer to all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter();
  }
  
  return pdf.output('blob');
}
