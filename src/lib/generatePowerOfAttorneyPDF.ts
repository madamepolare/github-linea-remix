import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
}

export async function generatePowerOfAttorneyPDF(data: PowerOfAttorneyData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(data.agency_name || 'Agence', margin, y);
  doc.text(data.document_number, pageWidth - margin, y, { align: 'right' });
  
  y += 30;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('POUVOIR / DÉLÉGATION', pageWidth / 2, y, { align: 'center' });

  y += 20;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fait le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth - margin, y, { align: 'right' });

  y += 20;

  // Delegator section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Le soussigné :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`${data.delegator_name}`, margin, y);
  y += 6;
  doc.text(`Agissant en qualité de : ${data.delegator_role}`, margin, y);
  y += 15;

  // Delegate section
  doc.setFont('helvetica', 'bold');
  doc.text('Donne pouvoir à :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`${data.delegate_name}`, margin, y);
  y += 6;
  doc.text(`Agissant en qualité de : ${data.delegate_role}`, margin, y);
  y += 15;

  // Scope
  doc.setFont('helvetica', 'bold');
  doc.text('Pour :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const scopeLines = doc.splitTextToSize(data.scope || 'Représenter le délégant dans le cadre de ses fonctions.', pageWidth - 2 * margin);
  doc.text(scopeLines, margin, y);
  y += scopeLines.length * 6 + 10;

  // Specific powers
  if (data.specific_powers && data.specific_powers.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Pouvoirs spécifiques :', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    data.specific_powers.forEach((power, index) => {
      doc.text(`• ${power}`, margin + 5, y);
      y += 6;
    });
    y += 10;
  }

  // Validity period
  doc.setFont('helvetica', 'bold');
  doc.text('Période de validité :', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const startDate = data.start_date ? format(new Date(data.start_date), 'dd MMMM yyyy', { locale: fr }) : 'Non défini';
  const endDate = data.end_date ? format(new Date(data.end_date), 'dd MMMM yyyy', { locale: fr }) : 'Durée indéterminée';
  doc.text(`Du ${startDate} au ${endDate}`, margin, y);
  y += 20;

  // Legal notice
  doc.setFontSize(10);
  doc.setTextColor(100);
  const legalText = 'Le présent pouvoir est établi pour servir et valoir ce que de droit. Il peut être révoqué à tout moment par le délégant.';
  const legalLines = doc.splitTextToSize(legalText, pageWidth - 2 * margin);
  doc.text(legalLines, margin, y);
  y += legalLines.length * 5 + 20;

  // Signatures
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  const col1 = margin;
  const col2 = pageWidth / 2 + 10;
  
  doc.text('Le délégant', col1, y);
  doc.text('Le délégataire', col2, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Signature :', col1, y);
  doc.text('Signature :', col2, y);
  y += 30;

  // Signature lines
  doc.line(col1, y, col1 + 60, y);
  doc.line(col2, y, col2 + 60, y);

  return doc.output('blob');
}
