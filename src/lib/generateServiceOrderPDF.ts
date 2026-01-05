import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  addPDFHeader, 
  addPDFFooter 
} from './pdfUtils';

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
  agencyInfo?: AgencyPDFInfo;
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
    ORDER_TYPE_LABELS[data.order_type],
    logoBase64
  );

  y += 10;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(ORDER_TYPE_LABELS[data.order_type], pageWidth / 2, y, { align: 'center' });

  y += 10;

  // Subtitle with number
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`N° ${data.document_number}`, pageWidth / 2, y, { align: 'center' });

  y += 15;

  // Project info box
  doc.setDrawColor(200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 2, 2, 'FD');
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('PROJET :', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(data.project_name || '-', margin + 28, y);
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('ADRESSE :', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(data.project_address || '-', margin + 32, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('MAÎTRE D\'OUVRAGE :', margin + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(data.client_name || '-', margin + 52, y);

  y += 20;

  // Order content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  
  const orderText = `Le maître d'œuvre ${ORDER_TYPE_DESCRIPTIONS[data.order_type]} pour l'opération susvisée.`;
  const orderLines = doc.splitTextToSize(orderText, pageWidth - 2 * margin);
  doc.text(orderLines, margin, y);
  y += orderLines.length * 6 + 10;

  // Effective date
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Date d\'effet :', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const effectiveDate = data.effective_date 
    ? format(new Date(data.effective_date), 'dd MMMM yyyy', { locale: fr })
    : 'À réception du présent ordre de service';
  doc.text(effectiveDate, margin + 32, y);
  y += 10;

  // Phase
  if (data.phase_name) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('Phase concernée :', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(data.phase_name, margin + 42, y);
    y += 10;
  }

  y += 10;

  // Instructions
  if (data.instructions) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('Instructions / Observations :', margin, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const instructionLines = doc.splitTextToSize(data.instructions, pageWidth - 2 * margin);
    doc.text(instructionLines, margin, y);
    y += instructionLines.length * 5 + 15;
  }

  y += 10;

  // Legal notice
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'italic');
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
  doc.setTextColor(80);
  doc.text('(Émetteur)', col1, y);
  doc.text('(Visa)', col2, y);
  y += 8;

  // Add signature if available
  if (signatureBase64) {
    try {
      doc.addImage(signatureBase64, 'PNG', col1, y, 50, 20);
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
    }
  }
  
  y += 22;

  // Signature lines
  doc.line(col1, y, col1 + 60, y);
  doc.line(col2, y, col2 + 60, y);

  // Footer
  addPDFFooter(doc, data.agencyInfo);

  return doc.output('blob');
}
