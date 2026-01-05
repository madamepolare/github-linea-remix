import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
} from './commercialTypes';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  formatFullAddress,
  addPDFFooter 
} from './pdfUtils';

/**
 * Génère un devis compact (A4 portrait, 1 page max)
 */
export async function generateQuotePDF(
  document: Partial<CommercialDocument>,
  phases: CommercialDocumentPhase[],
  total: number,
  agencyInfo?: AgencyPDFInfo
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
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

  // === HEADER with Logo ===
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', margin, y - 2, 20, 20);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
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

  // Document info on right
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('DEVIS', pageWidth - margin, y + 5, { align: 'right' });
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  pdf.text(`N° ${document.document_number || 'N/A'}`, pageWidth - margin, y + 12, { align: 'right' });
  pdf.text(format(new Date(), 'dd MMMM yyyy', { locale: fr }), pageWidth - margin, y + 17, { align: 'right' });
  
  y += 25;
  
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
  
  y += 10;
  pdf.setFontSize(9);
  pdf.setTextColor(0);
  pdf.text('Bon pour accord, date et signature :', margin, y);
  
  // Signature box
  pdf.setDrawColor(180);
  pdf.rect(margin, y + 3, 70, 25);

  // Agency signature (on the right)
  if (signatureBase64) {
    pdf.setFontSize(9);
    pdf.setTextColor(60);
    pdf.text('L\'architecte :', pageWidth - margin - 60, y);
    y += 3;
    try {
      pdf.addImage(signatureBase64, 'PNG', pageWidth - margin - 60, y, 50, 20);
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
    }
  }
  
  // Footer
  addPDFFooter(pdf, agencyInfo);
  
  return pdf.output('blob');
}
