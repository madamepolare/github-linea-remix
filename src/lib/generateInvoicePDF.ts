import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AgencyPDFInfo, 
  loadImageAsBase64, 
  formatFullAddress,
  formatLegalInfo,
  addPDFFooter 
} from './pdfUtils';

interface InvoicePhase {
  code: string;
  name: string;
  amount: number;
  percentage_invoiced: number;
}

interface InvoiceData {
  document_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_address: string;
  project_name: string;
  phases: InvoicePhase[];
  subtotal: number;
  tva_rate: number;
  tva_amount: number;
  total: number;
  payment_terms: string;
  bank_iban: string;
  bank_bic: string;
  bank_name: string;
  agency_name?: string;
  agency_address?: string;
  agency_siret?: string;
  agency_vat?: string;
  agencyInfo?: AgencyPDFInfo;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Load images
  let logoBase64: string | null = null;
  let signatureBase64: string | null = null;
  
  if (data.agencyInfo?.logo_url) {
    logoBase64 = await loadImageAsBase64(data.agencyInfo.logo_url);
  }
  if (data.agencyInfo?.signature_url) {
    signatureBase64 = await loadImageAsBase64(data.agencyInfo.signature_url);
  }

  // Header - Logo and agency info
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y - 5, 25, 25);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  const textStartX = logoBase64 ? margin + 30 : margin;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(data.agencyInfo?.name || data.agency_name || 'AGENCE D\'ARCHITECTURE', textStartX, y + 3);
  y += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  
  if (data.agencyInfo) {
    const address = formatFullAddress(data.agencyInfo);
    if (address) doc.text(address, textStartX, y + 3);
    y += 5;
    if (data.agencyInfo.siret) doc.text(`SIRET: ${data.agencyInfo.siret}`, textStartX, y + 3);
    y += 5;
    if (data.agencyInfo.vat_number) doc.text(`TVA: ${data.agencyInfo.vat_number}`, textStartX, y + 3);
  } else {
    if (data.agency_address) doc.text(data.agency_address, textStartX, y + 3);
    y += 5;
    if (data.agency_siret) doc.text(`SIRET: ${data.agency_siret}`, textStartX, y + 3);
    y += 5;
    if (data.agency_vat) doc.text(`TVA: ${data.agency_vat}`, textStartX, y + 3);
  }

  // Invoice title and number
  y = 20;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('NOTE D\'HONORAIRES', pageWidth - margin, y, { align: 'right' });
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(`N° ${data.document_number}`, pageWidth - margin, y, { align: 'right' });

  y = 55;

  // Client info box
  doc.setDrawColor(220);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pageWidth - margin - 80, y, 80, 35, 2, 2, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('FACTURÉ À :', pageWidth - margin - 75, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(data.client_name || '-', pageWidth - margin - 75, y + 16);
  
  const addressLines = doc.splitTextToSize(data.client_address || '', 70);
  doc.text(addressLines, pageWidth - margin - 75, y + 22);

  // Invoice details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(`Date : ${data.invoice_date ? format(new Date(data.invoice_date), 'dd/MM/yyyy') : '-'}`, margin, y + 10);
  doc.text(`Échéance : ${data.due_date ? format(new Date(data.due_date), 'dd/MM/yyyy') : '-'}`, margin, y + 18);
  
  y += 45;

  // Project reference
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Projet :', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(data.project_name || '-', margin + 20, y);

  y += 15;

  // Phases table
  const tableData = (data.phases || []).map(phase => [
    phase.code,
    phase.name,
    formatCurrency(phase.amount),
    `${phase.percentage_invoiced}%`,
    formatCurrency(phase.amount * phase.percentage_invoiced / 100),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Désignation', 'Montant HT', '% facturé', 'Montant']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 30,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Totals
  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text('Total HT :', totalsX, y);
  doc.setTextColor(0);
  doc.text(formatCurrency(data.subtotal || 0), pageWidth - margin, y, { align: 'right' });
  y += 7;
  
  doc.setTextColor(60);
  doc.text(`TVA (${data.tva_rate || 20}%) :`, totalsX, y);
  doc.setTextColor(0);
  doc.text(formatCurrency(data.tva_amount || 0), pageWidth - margin, y, { align: 'right' });
  y += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total TTC :', totalsX, y);
  doc.text(formatCurrency(data.total || 0), pageWidth - margin, y, { align: 'right' });

  y += 20;

  // Payment terms
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Conditions de paiement :', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const termsLines = doc.splitTextToSize(data.payment_terms || 'Paiement à 30 jours.', pageWidth - 2 * margin);
  doc.text(termsLines, margin, y);
  y += termsLines.length * 4 + 10;

  // Bank details
  if (data.bank_iban || data.bank_bic) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('Coordonnées bancaires :', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    if (data.bank_name) doc.text(`Banque : ${data.bank_name}`, margin, y);
    y += 5;
    if (data.bank_iban) doc.text(`IBAN : ${data.bank_iban}`, margin, y);
    y += 5;
    if (data.bank_bic) doc.text(`BIC : ${data.bank_bic}`, margin, y);
  }

  // Signature area (if available)
  if (signatureBase64) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.setFontSize(9);
    doc.text('Cachet et signature :', pageWidth - margin - 60, y);
    y += 5;
    try {
      doc.addImage(signatureBase64, 'PNG', pageWidth - margin - 60, y, 50, 20);
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
    }
  }

  // Footer
  addPDFFooter(doc, data.agencyInfo);

  return doc.output('blob');
}
