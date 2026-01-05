import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ServiceOrderData {
  document_number: string;
  order_type: 'start' | 'suspend' | 'resume' | 'stop';
  project_name: string;
  project_address: string;
  client_name: string;
  effective_date: string;
  phase_name: string;
  instructions: string;
  agency_name?: string;
  agency_address?: string;
}

const ORDER_TYPE_LABELS = {
  start: 'ORDRE DE SERVICE DE DÉMARRAGE',
  suspend: 'ORDRE DE SERVICE DE SUSPENSION',
  resume: 'ORDRE DE SERVICE DE REPRISE',
  stop: 'ORDRE DE SERVICE D\'ARRÊT DÉFINITIF',
};

const ORDER_TYPE_DESCRIPTIONS = {
  start: 'ordonne le démarrage des travaux / prestations',
  suspend: 'ordonne la suspension des travaux / prestations',
  resume: 'ordonne la reprise des travaux / prestations',
  stop: 'ordonne l\'arrêt définitif des travaux / prestations',
};

export async function generateServiceOrderPDF(data: ServiceOrderData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(data.agency_name || 'Maîtrise d\'œuvre', margin, y);
  doc.text(data.document_number, pageWidth - margin, y, { align: 'right' });
  
  y += 30;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(ORDER_TYPE_LABELS[data.order_type], pageWidth / 2, y, { align: 'center' });

  y += 15;

  // Subtitle with number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.document_number}`, pageWidth / 2, y, { align: 'center' });

  y += 20;

  // Date
  doc.setFontSize(10);
  doc.text(`Émis le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth - margin, y, { align: 'right' });

  y += 20;

  // Project info box
  doc.setDrawColor(200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 3, 3, 'FD');
  
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJET :', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.project_name || '-', margin + 30, y);
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('ADRESSE :', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.project_address || '-', margin + 35, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('MAÎTRE D\'OUVRAGE :', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_name || '-', margin + 55, y);

  y += 25;

  // Order content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const orderText = `Le maître d'œuvre ${ORDER_TYPE_DESCRIPTIONS[data.order_type]} pour l'opération susvisée.`;
  const orderLines = doc.splitTextToSize(orderText, pageWidth - 2 * margin);
  doc.text(orderLines, margin, y);
  y += orderLines.length * 7 + 10;

  // Effective date
  doc.setFont('helvetica', 'bold');
  doc.text('Date d\'effet :', margin, y);
  doc.setFont('helvetica', 'normal');
  const effectiveDate = data.effective_date 
    ? format(new Date(data.effective_date), 'dd MMMM yyyy', { locale: fr })
    : 'À réception du présent ordre de service';
  doc.text(effectiveDate, margin + 35, y);
  y += 10;

  // Phase
  if (data.phase_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phase concernée :', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.phase_name, margin + 45, y);
    y += 10;
  }

  y += 10;

  // Instructions
  if (data.instructions) {
    doc.setFont('helvetica', 'bold');
    doc.text('Instructions / Observations :', margin, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    const instructionLines = doc.splitTextToSize(data.instructions, pageWidth - 2 * margin);
    doc.text(instructionLines, margin, y);
    y += instructionLines.length * 6 + 15;
  }

  y += 20;

  // Legal notice
  doc.setFontSize(9);
  doc.setTextColor(100);
  const legalText = 'Le présent ordre de service est établi conformément aux dispositions du contrat de maîtrise d\'œuvre. L\'entreprise titulaire du marché est tenue de s\'y conformer.';
  const legalLines = doc.splitTextToSize(legalText, pageWidth - 2 * margin);
  doc.text(legalLines, margin, y);
  y += legalLines.length * 5 + 20;

  // Signatures
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const col1 = margin;
  const col2 = pageWidth / 2 + 10;
  
  doc.text('Le Maître d\'œuvre', col1, y);
  doc.text('Le Maître d\'ouvrage', col2, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('(Émetteur)', col1, y);
  doc.text('(Visa)', col2, y);
  y += 25;

  // Signature lines
  doc.line(col1, y, col1 + 60, y);
  doc.line(col2, y, col2 + 60, y);

  return doc.output('blob');
}
