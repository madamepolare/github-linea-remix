import jsPDF from 'jspdf';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  DOCUMENT_TYPE_LABELS,
  PROJECT_TYPE_LABELS
} from './commercialTypes';

export async function generateCommercialPDF(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(DOCUMENT_TYPE_LABELS[document.document_type || 'quote'].toUpperCase(), margin, y);
  
  y += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(document.document_number || '', margin, y);
  
  y += 15;
  pdf.setTextColor(0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(document.title || 'Sans titre', margin, y);

  // Client info
  y += 15;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENT', margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  if (document.client_company) {
    pdf.text(document.client_company.name, margin, y);
    y += 5;
  }

  // Project info
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROJET', margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.text(PROJECT_TYPE_LABELS[document.project_type || 'interior'], margin, y);
  y += 5;
  if (document.project_address) {
    pdf.text(document.project_address, margin, y);
    y += 5;
  }
  if (document.project_city) {
    pdf.text(document.project_city, margin, y);
    y += 5;
  }

  // Phases
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('MISSION', margin, y);
  y += 7;

  const includedPhases = phases.filter(p => p.is_included);
  pdf.setFont('helvetica', 'normal');
  
  includedPhases.forEach((phase) => {
    if (y > 260) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${phase.phase_code} - ${phase.phase_name}`, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${phase.percentage_fee}%`, pageWidth - margin - 20, y);
    y += 5;
    
    phase.deliverables.forEach((d) => {
      pdf.text(`• ${d}`, margin + 5, y);
      y += 4;
    });
    y += 3;
  });

  // Total
  y += 10;
  pdf.setDrawColor(200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Total HT', margin, y);
  pdf.text(
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total),
    pageWidth - margin - 30, y
  );
  
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('TVA (20%)', margin, y);
  pdf.text(
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total * 0.2),
    pageWidth - margin - 30, y
  );
  
  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('Total TTC', margin, y);
  pdf.text(
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total * 1.2),
    pageWidth - margin - 30, y
  );

  // Validity
  y += 15;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100);
  pdf.text(`Offre valable ${document.validity_days || 30} jours`, margin, y);

  return pdf.output('blob');
}
