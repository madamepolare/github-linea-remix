import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from './documentTypes';

interface GenericDocumentData {
  document_number: string;
  document_type: DocumentType;
  title: string;
  content: Record<string, unknown>;
  agency_name?: string;
  agency_address?: string;
  created_at: string;
}

export async function generateGenericDocumentPDF(data: GenericDocumentData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(data.agency_name || 'Agence d\'Architecture', margin, y);
  doc.text(data.document_number, pageWidth - margin, y, { align: 'right' });
  
  y += 25;

  // Document type label
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(DOCUMENT_TYPE_LABELS[data.document_type]?.toUpperCase() || 'DOCUMENT', pageWidth / 2, y, { align: 'center' });

  y += 10;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.title, pageWidth - 2 * margin);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });

  y += titleLines.length * 8 + 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${format(new Date(data.created_at), 'dd MMMM yyyy', { locale: fr })}`, pageWidth - margin, y, { align: 'right' });

  y += 20;

  // Content fields
  doc.setFontSize(11);
  const content = data.content || {};
  
  Object.entries(content).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    // Skip internal fields
    if (key.endsWith('_id')) return;
    
    // Format key as label
    const label = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`${label} :`, margin, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    
    if (typeof value === 'string' && value.length > 50) {
      // Long text - multiline
      const lines = doc.splitTextToSize(value, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;
    } else if (typeof value === 'number') {
      // Number - format if currency-like
      const formatted = key.includes('amount') || key.includes('total') || key.includes('budget')
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
        : value.toString();
      doc.text(formatted, margin, y);
      y += 10;
    } else if (Array.isArray(value)) {
      // Array - bullet list
      value.forEach((item, index) => {
        doc.text(`• ${item}`, margin + 5, y);
        y += 5;
      });
      y += 5;
    } else {
      doc.text(String(value), margin, y);
      y += 10;
    }
  });

  y += 20;

  // Signature area
  if (y < 230) {
    y = Math.max(y, 220);
  } else {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fait pour servir et valoir ce que de droit.', margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.text('Signature :', margin, y);
  y += 25;
  
  doc.line(margin, y, margin + 60, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, footerY, { align: 'center' });

  return doc.output('blob');
}
