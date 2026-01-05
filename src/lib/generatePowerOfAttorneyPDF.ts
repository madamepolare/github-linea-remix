import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  addPDFHeader, 
  addPDFFooter 
} from './pdfUtils';

interface PowerOfAttorneyData {
  document_number: string;
  title: string;
  delegator_name: string;
  delegator_role: string;
  delegate_name: string;
  delegate_role: string;
  scope: string;
  specific_powers: string[];
  start_date: string;
  end_date: string;
  agency_name?: string;
  agency_address?: string;
  agencyInfo?: AgencyPDFInfo;
}

export async function generatePowerOfAttorneyPDF(data: PowerOfAttorneyData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Load images
  let logoBase64: string | null = null;
  let signatureBase64: string | null = null;
  
  if (data.agencyInfo?.logo_url) {
    logoBase64 = await loadImageAsBase64(data.agencyInfo.logo_url);
  }
  if (data.agencyInfo?.signature_url) {
    signatureBase64 = await loadImageAsBase64(data.agencyInfo.signature_url);
  }

  // Header with logo
  let y = await addPDFHeader(
    doc,
    data.agencyInfo,
    data.document_number,
    'POUVOIR / DÉLÉGATION',
    logoBase64
  );

  y += 10;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('POUVOIR / DÉLÉGATION', pageWidth / 2, y, { align: 'center' });

  y += 20;

  // Delegator section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Le soussigné :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`${data.delegator_name}`, margin, y);
  y += 6;
  doc.text(`Agissant en qualité de : ${data.delegator_role}`, margin, y);
  y += 15;

  // Delegate section
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Donne pouvoir à :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(`${data.delegate_name}`, margin, y);
  y += 6;
  doc.text(`Agissant en qualité de : ${data.delegate_role}`, margin, y);
  y += 15;

  // Scope
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Pour :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const scopeLines = doc.splitTextToSize(data.scope || 'Représenter le délégant dans le cadre de ses fonctions.', pageWidth - 2 * margin);
  doc.text(scopeLines, margin, y);
  y += scopeLines.length * 6 + 10;

  // Specific powers
  if (data.specific_powers && data.specific_powers.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('Pouvoirs spécifiques :', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    data.specific_powers.forEach((power) => {
      doc.text(`• ${power}`, margin + 5, y);
      y += 6;
    });
    y += 10;
  }

  // Validity period
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Période de validité :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const startDate = data.start_date ? format(new Date(data.start_date), 'dd MMMM yyyy', { locale: fr }) : 'Non défini';
  const endDate = data.end_date ? format(new Date(data.end_date), 'dd MMMM yyyy', { locale: fr }) : 'Durée indéterminée';
  doc.text(`Du ${startDate} au ${endDate}`, margin, y);
  y += 20;

  // Legal notice
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'italic');
  const legalText = 'Le présent pouvoir est établi pour servir et valoir ce que de droit. Il peut être révoqué à tout moment par le délégant.';
  const legalLines = doc.splitTextToSize(legalText, pageWidth - 2 * margin);
  doc.text(legalLines, margin, y);
  y += legalLines.length * 5 + 20;

  // Signatures
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const col1 = margin;
  const col2 = pageWidth / 2 + 10;
  
  doc.text('Le délégant', col1, y);
  doc.text('Le délégataire', col2, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Signature :', col1, y);
  doc.text('Signature :', col2, y);
  y += 5;

  // Add agency signature if available (for delegator side)
  if (signatureBase64) {
    try {
      doc.addImage(signatureBase64, 'PNG', col1, y, 50, 20);
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
    }
  }
  
  y += 25;

  // Signature lines
  doc.line(col1, y, col1 + 60, y);
  doc.line(col2, y, col2 + 60, y);

  // Footer
  addPDFFooter(doc, data.agencyInfo);

  return doc.output('blob');
}
