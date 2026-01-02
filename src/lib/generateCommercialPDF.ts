import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  DOCUMENT_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  FEE_MODE_LABELS
} from './commercialTypes';

interface PDFOptions {
  includeConditions?: boolean;
  includeSignature?: boolean;
}

export async function generateCommercialPDF(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number,
  options: PDFOptions = { includeConditions: true, includeSignature: true }
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

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
  // PAGE 1 - COVER
  // ==========================================
  
  // Header with document type
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(DOCUMENT_TYPE_LABELS[document.document_type || 'quote'].toUpperCase(), margin, y + 15);
  
  y += 25;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`RÉFÉRENCE : ${document.document_number || 'N/A'}`, margin, y);
  
  y += 20;
  
  // Project info box
  pdf.setDrawColor(200);
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(margin, y, contentWidth, 50, 3, 3, 'FD');
  
  y += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('PROJET', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(document.title || 'Sans titre', margin + 30, y);
  
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('LIEU', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  const location = [document.project_address, document.project_city].filter(Boolean).join(', ') || 'Non défini';
  pdf.text(location, margin + 30, y);
  
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('TYPE', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(PROJECT_TYPE_LABELS[document.project_type || 'interior'], margin + 30, y);
  
  if (document.project_surface) {
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('SURFACE', margin + 5, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${document.project_surface} m²`, margin + 30, y);
  }
  
  y += 25;
  
  // Client info
  pdf.setFont('helvetica', 'bold');
  pdf.text('MOA', margin + 5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(document.client_company?.name || 'Client non défini', margin + 30, y);
  
  // ==========================================
  // PAGE 2 - CONTRACTANTS
  // ==========================================
  pdf.addPage();
  y = margin;
  
  addSectionTitle('1.1 CONTRACTANTS');
  
  addSectionTitle('Le maître d\'ouvrage', 2);
  addParagraph(`Représenté par : ${document.client_company?.name || 'À définir'}`);
  if (document.client_contact?.name) {
    addParagraph(`Contact : ${document.client_contact.name}`);
  }
  if (document.client_contact?.email) {
    addParagraph(`Email : ${document.client_contact.email}`);
  }
  
  y += 5;
  addSectionTitle('L\'architecte / Maître d\'œuvre', 2);
  addParagraph('La société représentée assure la mission de maîtrise d\'œuvre selon les termes du présent document.');
  
  // ==========================================
  // 1.2 OBJET DE LA MISSION
  // ==========================================
  y += 5;
  addSectionTitle('1.2 OBJET DE LA MISSION');
  
  addSectionTitle('PROJET', 2);
  addParagraph(document.title || 'Mission de maîtrise d\'œuvre');
  
  if (document.description) {
    addParagraph(document.description);
  }
  
  addSectionTitle('ADRESSE', 2);
  addParagraph(location);
  
  if (document.project_surface) {
    addSectionTitle('SURFACE', 2);
    addParagraph(`${document.project_surface} m²`);
  }
  
  // ==========================================
  // 1.3 PROGRAMME (si description)
  // ==========================================
  if (document.special_conditions) {
    y += 5;
    addSectionTitle('1.3 PROGRAMME');
    addParagraph(document.special_conditions);
  }
  
  // ==========================================
  // PAGE - HONORAIRES
  // ==========================================
  addPageIfNeeded(80);
  addSectionTitle('1.4 HONORAIRES');
  
  // Fee table
  const includedPhases = phases.filter(p => p.is_included);
  const tableData = includedPhases.map(phase => {
    const phaseAmount = total * (phase.percentage_fee / 100);
    const phaseTVA = phaseAmount * 0.2;
    return [
      `${phase.phase_code} - ${phase.phase_name}`,
      `${phase.percentage_fee}%`,
      formatCurrency(phaseAmount),
      formatCurrency(phaseTVA),
      formatCurrency(phaseAmount + phaseTVA)
    ];
  });
  
  // Add totals row
  tableData.push([
    'Total',
    '100%',
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
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold'
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
  
  // Method of calculation
  addSectionTitle('MÉTHODE DE CALCUL DES HONORAIRES', 2);
  addParagraph(`Mode de rémunération : ${FEE_MODE_LABELS[document.fee_mode || 'fixed']}`);
  
  if (document.fee_mode === 'percentage' && document.project_budget) {
    addParagraph(`Base de calcul : ${document.fee_percentage}% du budget travaux estimé à ${formatCurrency(document.project_budget)}`);
  }
  
  // ==========================================
  // PAGE - DÉROULEMENT DE LA MISSION
  // ==========================================
  addPageIfNeeded(100);
  addSectionTitle('1.5 DÉROULEMENT DE LA MISSION');
  
  addParagraph('Les phases suivantes peuvent être adaptées en fonction du projet et de sa complexité.');
  y += 3;
  
  includedPhases.forEach((phase, index) => {
    addPageIfNeeded(40);
    
    // Phase header
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text(`${phase.phase_code} - ${phase.phase_name}`, margin, y);
    y += 6;
    
    // Phase description
    if (phase.phase_description) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(80);
      pdf.text(phase.phase_description, margin, y);
      y += 5;
    }
    
    // Deliverables
    if (phase.deliverables && phase.deliverables.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      phase.deliverables.forEach(deliverable => {
        addPageIfNeeded(6);
        pdf.text(`• ${deliverable}`, margin + 5, y);
        y += 4;
      });
    }
    
    y += 5;
  });
  
  // ==========================================
  // PAGE - ÉCHELONNEMENT
  // ==========================================
  addPageIfNeeded(80);
  addSectionTitle('1.6 ÉCHELONNEMENT DES PAIEMENTS');
  
  addParagraph('Dans le déroulement normal de la mission, le règlement des honoraires s\'effectuera de façon échelonnée, sur situation d\'avancement.');
  y += 3;
  
  // Payment schedule table
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
  // CONDITIONS GÉNÉRALES
  // ==========================================
  if (options.includeConditions && document.general_conditions) {
    addPageIfNeeded(50);
    addSectionTitle('1.7 CONDITIONS GÉNÉRALES');
    
    const conditions = document.general_conditions.split('\n');
    conditions.forEach(condition => {
      if (condition.trim()) {
        addParagraph(condition.trim());
      }
    });
  }
  
  // Payment terms
  if (document.payment_terms) {
    addPageIfNeeded(30);
    addSectionTitle('CONDITIONS DE PAIEMENT', 2);
    addParagraph(document.payment_terms);
  }
  
  // ==========================================
  // PAGE - SIGNATURES
  // ==========================================
  if (options.includeSignature) {
    addPageIfNeeded(100);
    addSectionTitle('1.8 SIGNATURE DES PARTIES');
    
    y += 5;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60);
    pdf.text(`Fait en deux exemplaires, le ${new Date().toLocaleDateString('fr-FR')}`, margin, y);
    
    y += 15;
    
    // Two column signature boxes
    const boxWidth = (contentWidth - 10) / 2;
    const boxHeight = 60;
    
    // Left box - Client
    pdf.setDrawColor(180);
    pdf.rect(margin, y, boxWidth, boxHeight);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text('Le Maître de l\'ouvrage', margin + 5, y + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60);
    pdf.text(document.client_company?.name || 'Client', margin + 5, y + 16);
    pdf.setFontSize(8);
    pdf.text('Signature précédée de la mention "lu et approuvé" :', margin + 5, y + 30);
    
    // Right box - Architect
    pdf.rect(margin + boxWidth + 10, y, boxWidth, boxHeight);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text('L\'architecte / Maître d\'œuvre', margin + boxWidth + 15, y + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60);
    pdf.setFontSize(8);
    pdf.text('Signature précédée de la mention "lu et approuvé" :', margin + boxWidth + 15, y + 30);
    
    y += boxHeight + 10;
  }
  
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
