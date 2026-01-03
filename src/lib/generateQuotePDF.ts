import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  DOCUMENT_TYPE_LABELS,
  PROJECT_TYPE_LABELS
} from './commercialTypes';

/**
 * Génère un devis compact (A4 portrait, 1 page max)
 */
export async function generateQuotePDF(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  // === HEADER ===
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('DEVIS', margin, y + 8);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`N° ${document.document_number || 'N/A'}`, pageWidth - margin, y + 8, { align: 'right' });
  pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, y + 14, { align: 'right' });
  
  y += 20;
  
  // === CLIENT & PROJECT INFO ===
  pdf.setDrawColor(220);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  // Two columns
  const colWidth = contentWidth / 2 - 5;
  
  // Left - Client
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  pdf.text('CLIENT', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);
  pdf.setFontSize(10);
  pdf.text(document.client_company?.name || 'Non défini', margin, y + 5);
  if (document.client_contact?.name) {
    pdf.setFontSize(9);
    pdf.text(document.client_contact.name, margin, y + 10);
  }
  
  // Right - Project
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  pdf.text('PROJET', margin + colWidth + 10, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);
  pdf.setFontSize(10);
  pdf.text(document.title || 'Sans titre', margin + colWidth + 10, y + 5);
  pdf.setFontSize(9);
  const location = [document.project_address, document.project_city].filter(Boolean).join(', ');
  if (location) pdf.text(location, margin + colWidth + 10, y + 10);
  
  y += 18;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  // === PHASES TABLE ===
  const includedPhases = phases.filter(p => p.is_included);
  const totalPercentage = includedPhases.reduce((sum, p) => sum + p.percentage_fee, 0);
  
  const tableData = includedPhases.map(phase => {
    const phaseAmount = totalPercentage > 0 ? total * (phase.percentage_fee / totalPercentage) : 0;
    return [
      phase.phase_code || '',
      phase.phase_name,
      `${phase.percentage_fee}%`,
      formatCurrency(phaseAmount)
    ];
  });
  
  autoTable(pdf, {
    startY: y,
    head: [['Code', 'Désignation', '%', 'Montant HT']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: [245, 245, 245], 
      textColor: 60,
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
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.1
  });
  
  y = (pdf as any).lastAutoTable.finalY + 4;
  
  // === TOTALS ===
  const TVA = total * 0.2;
  const TTC = total + TVA;
  
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
  
  // === VALIDITY & SIGNATURE ===
  y += 15;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text(`Devis valable ${document.validity_days || 30} jours. Conditions de paiement : ${document.payment_terms || 'selon contrat'}`, margin, y);
  
  y += 12;
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text('Bon pour accord, date et signature :', margin, y);
  
  // Signature box
  pdf.setDrawColor(180);
  pdf.rect(margin, y + 3, 70, 25);
  
  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(150);
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.text('Paraphe MOE ______    Paraphe MOA ______', pageWidth / 2, pageHeight - 8, { align: 'center' });
  
  return pdf.output('blob');
}
