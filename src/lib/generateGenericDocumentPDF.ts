import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from './documentTypes';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  addPDFHeader, 
  addPDFSignature, 
  addPDFFooter 
} from './pdfUtils';

interface GenericDocumentData {
  document_number: string;
  document_type: DocumentType;
  title: string;
  content: Record<string, unknown>;
  agency_name?: string;
  agency_address?: string;
  created_at: string;
  agencyInfo?: AgencyPDFInfo;
}

export async function generateGenericDocumentPDF(data: GenericDocumentData): Promise<Blob> {
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
    DOCUMENT_TYPE_LABELS[data.document_type] || 'DOCUMENT',
    logoBase64
  );

  y += 10;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.title, pageWidth - 2 * margin);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });

  y += titleLines.length * 7 + 15;

  // Content fields
  doc.setFontSize(10);
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
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text(`${label} :`, margin, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    
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
      value.forEach((item) => {
        doc.text(`• ${item}`, margin + 5, y);
        y += 5;
      });
      y += 5;
    } else {
      doc.text(String(value), margin, y);
      y += 10;
    }
  });

  y += 15;

  // Legal notice
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text('Fait pour servir et valoir ce que de droit.', margin, y);
  y += 15;

  // Signature area
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  
  y = await addPDFSignature(doc, signatureBase64, y, 'Signature');

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, data.agencyInfo);
  }

  return doc.output('blob');
}
