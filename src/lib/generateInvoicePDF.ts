import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Header - Agency info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.agency_name || 'AGENCE D\'ARCHITECTURE', margin, y);
  y += 6;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  if (data.agency_address) doc.text(data.agency_address, margin, y);
  y += 5;
  if (data.agency_siret) doc.text(`SIRET: ${data.agency_siret}`, margin, y);
  y += 5;
  if (data.agency_vat) doc.text(`TVA: ${data.agency_vat}`, margin, y);

  // Invoice title and number
  y = 20;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('NOTE D\'HONORAIRES', pageWidth - margin, y, { align: 'right' });
  y += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.document_number}`, pageWidth - margin, y, { align: 'right' });

  y = 55;

  // Client info box
  doc.setDrawColor(220);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pageWidth - margin - 80, y, 80, 35, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À :', pageWidth - margin - 75, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_name || '-', pageWidth - margin - 75, y + 16);
  
  const addressLines = doc.splitTextToSize(data.client_address || '', 70);
  doc.text(addressLines, pageWidth - margin - 75, y + 22);

  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${data.invoice_date ? format(new Date(data.invoice_date), 'dd/MM/yyyy') : '-'}`, margin, y + 10);
  doc.text(`Échéance : ${data.due_date ? format(new Date(data.due_date), 'dd/MM/yyyy') : '-'}`, margin, y + 18);
  
  y += 45;

  // Project reference
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Projet :', margin, y);
  doc.setFont('helvetica', 'normal');
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
    theme: 'striped',
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
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
  doc.text('Total HT :', totalsX, y);
  doc.text(formatCurrency(data.subtotal || 0), pageWidth - margin, y, { align: 'right' });
  y += 7;
  
  doc.text(`TVA (${data.tva_rate || 20}%) :`, totalsX, y);
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
  doc.text('Conditions de paiement :', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const termsLines = doc.splitTextToSize(data.payment_terms || 'Paiement à 30 jours.', pageWidth - 2 * margin);
  doc.text(termsLines, margin, y);
  y += termsLines.length * 4 + 10;

  // Bank details
  if (data.bank_iban || data.bank_bic) {
    doc.setFont('helvetica', 'bold');
    doc.text('Coordonnées bancaires :', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    if (data.bank_name) doc.text(`Banque : ${data.bank_name}`, margin, y);
    y += 5;
    if (data.bank_iban) doc.text(`IBAN : ${data.bank_iban}`, margin, y);
    y += 5;
    if (data.bank_bic) doc.text(`BIC : ${data.bank_bic}`, margin, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('En cas de retard de paiement, des pénalités de retard seront appliquées au taux légal en vigueur.', pageWidth / 2, footerY, { align: 'center' });

  return doc.output('blob');
}
