import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  PROJECT_TYPE_LABELS
} from './commercialTypes';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  formatLegalInfo 
} from './pdfUtils';

/**
 * Génère une proposition commerciale (A4 paysage, style slide/présentation)
 */
export async function generateProposalPDF(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number,
  agencyInfo?: AgencyPDFInfo
): Promise<Blob> {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

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

  const addSlideHeader = (title: string, subtitle?: string) => {
    pdf.setFillColor(35, 35, 40);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo in header
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', margin, 8, 20, 20);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
      }
    }
    
    const textStartX = logoBase64 ? margin + 25 : margin;
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    pdf.text(title.toUpperCase(), textStartX, 24);
    
    if (subtitle) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180);
      pdf.text(subtitle, pageWidth - margin, 24, { align: 'right' });
    }
  };

  const addSlideFooter = (pageNum: number, totalPages: number) => {
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text(document.document_number || '', margin, pageHeight - 10);
    
    // Legal info
    if (agencyInfo) {
      const legalInfo = formatLegalInfo(agencyInfo);
      if (legalInfo) {
        pdf.text(legalInfo, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    }
  };

  // === SLIDE 1: COVER ===
  pdf.setFillColor(35, 35, 40);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Logo on cover
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, 30, 30, 30);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120);
  pdf.text('PROPOSITION COMMERCIALE', margin, 75);
  
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255);
  pdf.text(document.title || 'Projet', margin, 95);
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(180);
  const location = [document.project_address, document.project_city].filter(Boolean).join(', ');
  if (location) pdf.text(location, margin, 108);
  
  // Project info cards
  const cardY = 130;
  const cardWidth = 60;
  const cardGap = 15;
  
  const cards = [
    { label: 'TYPE', value: PROJECT_TYPE_LABELS[document.project_type || 'interior'] },
    { label: 'SURFACE', value: document.project_surface ? `${document.project_surface} m²` : '-' },
    { label: 'BUDGET TRAVAUX', value: document.construction_budget ? formatCurrency(document.construction_budget) : '-' },
    { label: 'HONORAIRES', value: formatCurrency(total) }
  ];
  
  cards.forEach((card, i) => {
    const x = margin + (cardWidth + cardGap) * i;
    
    pdf.setFillColor(50, 50, 55);
    pdf.roundedRect(x, cardY, cardWidth, 40, 3, 3, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(card.label, x + 8, cardY + 12);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    pdf.text(card.value, x + 8, cardY + 28);
    pdf.setFont('helvetica', 'normal');
  });
  
  // Client
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('POUR', margin, pageHeight - 40);
  pdf.setFontSize(14);
  pdf.setTextColor(255);
  pdf.text(document.client_company?.name || 'Client', margin, pageHeight - 30);
  
  // Date and agency name
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(format(new Date(), 'dd MMMM yyyy', { locale: fr }), pageWidth - margin, pageHeight - 35, { align: 'right' });
  if (agencyInfo?.name) {
    pdf.setFontSize(12);
    pdf.setTextColor(180);
    pdf.text(agencyInfo.name, pageWidth - margin, pageHeight - 25, { align: 'right' });
  }
  
  // === SLIDE 2: PHASES OVERVIEW ===
  pdf.addPage();
  addSlideHeader('Notre Mission', `${phases.filter(p => p.is_included).length} phases`);
  
  const includedPhases = phases.filter(p => p.is_included);
  const totalPercentage = includedPhases.reduce((sum, p) => sum + p.percentage_fee, 0);
  
  let y = 50;
  const phaseHeight = 22;
  const maxPhasesPerPage = 6;
  const phasesSlide1 = includedPhases.slice(0, maxPhasesPerPage);
  
  phasesSlide1.forEach((phase, i) => {
    const phaseAmount = totalPercentage > 0 ? total * (phase.percentage_fee / totalPercentage) : 0;
    const barWidth = contentWidth * 0.7;
    const progressWidth = (phase.percentage_fee / 100) * barWidth;
    
    // Phase code badge
    pdf.setFillColor(80, 80, 90);
    pdf.roundedRect(margin, y, 35, 18, 2, 2, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    pdf.text(phase.phase_code || `P${i + 1}`, margin + 17.5, y + 12, { align: 'center' });
    
    // Phase name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30);
    pdf.text(phase.phase_name, margin + 42, y + 8);
    
    // Progress bar
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(margin + 42, y + 12, barWidth, 4, 1, 1, 'F');
    pdf.setFillColor(60, 130, 200);
    pdf.roundedRect(margin + 42, y + 12, progressWidth, 4, 1, 1, 'F');
    
    // Percentage & Amount
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 130, 200);
    pdf.text(`${phase.percentage_fee}%`, pageWidth - margin - 50, y + 8);
    pdf.setTextColor(30);
    pdf.text(formatCurrency(phaseAmount), pageWidth - margin, y + 8, { align: 'right' });
    
    y += phaseHeight;
  });
  
  addSlideFooter(2, 3);
  
  // === SLIDE 3: MORE PHASES OR SUMMARY ===
  if (includedPhases.length > maxPhasesPerPage) {
    pdf.addPage();
    addSlideHeader('Notre Mission (suite)', '');
    
    y = 50;
    const phasesSlide2 = includedPhases.slice(maxPhasesPerPage);
    
    phasesSlide2.forEach((phase, i) => {
      const phaseAmount = totalPercentage > 0 ? total * (phase.percentage_fee / totalPercentage) : 0;
      const barWidth = contentWidth * 0.7;
      const progressWidth = (phase.percentage_fee / 100) * barWidth;
      
      pdf.setFillColor(80, 80, 90);
      pdf.roundedRect(margin, y, 35, 18, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255);
      pdf.text(phase.phase_code || `P${maxPhasesPerPage + i + 1}`, margin + 17.5, y + 12, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30);
      pdf.text(phase.phase_name, margin + 42, y + 8);
      
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(margin + 42, y + 12, barWidth, 4, 1, 1, 'F');
      pdf.setFillColor(60, 130, 200);
      pdf.roundedRect(margin + 42, y + 12, progressWidth, 4, 1, 1, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 130, 200);
      pdf.text(`${phase.percentage_fee}%`, pageWidth - margin - 50, y + 8);
      pdf.setTextColor(30);
      pdf.text(formatCurrency(phaseAmount), pageWidth - margin, y + 8, { align: 'right' });
      
      y += phaseHeight;
    });
    
    addSlideFooter(3, 4);
  }
  
  // === FINAL SLIDE: SUMMARY ===
  pdf.addPage();
  addSlideHeader('Récapitulatif', '');
  
  const TVA = total * 0.2;
  const TTC = total + TVA;
  
  // Summary cards
  const summaryY = 60;
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
    pdf.roundedRect(x, summaryY, summaryCardWidth, 50, 4, 4, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(180);
    pdf.text(card.label, x + summaryCardWidth / 2, summaryY + 18, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    pdf.text(card.value, x + summaryCardWidth / 2, summaryY + 36, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
  });
  
  // Validity
  y = summaryY + 70;
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Proposition valable ${document.validity_days || 30} jours`, pageWidth / 2, y, { align: 'center' });
  
  // Signature section
  y += 20;
  pdf.setFontSize(11);
  pdf.setTextColor(60);
  pdf.text('Pour accord :', margin + 30, y);
  pdf.text('L\'architecte :', pageWidth - margin - 100, y);
  
  pdf.setDrawColor(180);
  pdf.rect(margin + 30, y + 5, 100, 35);
  
  // Right box with signature if available
  if (signatureBase64) {
    try {
      pdf.addImage(signatureBase64, 'PNG', pageWidth - margin - 95, y + 10, 60, 24);
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
      pdf.rect(pageWidth - margin - 100, y + 5, 100, 35);
    }
  } else {
    pdf.rect(pageWidth - margin - 100, y + 5, 100, 35);
  }
  
  addSlideFooter(includedPhases.length > maxPhasesPerPage ? 4 : 3, includedPhases.length > maxPhasesPerPage ? 4 : 3);
  
  return pdf.output('blob');
}
