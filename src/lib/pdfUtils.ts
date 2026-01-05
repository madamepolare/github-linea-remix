import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Agency information for PDF generation
 */
export interface AgencyPDFInfo {
  name: string;
  logo_url?: string | null;
  signature_url?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  capital_social?: number | null;
  forme_juridique?: string | null;
  rcs_city?: string | null;
  footer_text?: string | null;
}

/**
 * Load an image from URL and convert to base64 for jsPDF
 */
export async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image for PDF:', error);
    return null;
  }
}

/**
 * Format the full address from agency info
 */
export function formatFullAddress(agency: AgencyPDFInfo): string {
  const parts = [
    agency.address,
    [agency.postal_code, agency.city].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Format legal info for footer
 */
export function formatLegalInfo(agency: AgencyPDFInfo): string {
  const parts: string[] = [];
  
  if (agency.forme_juridique) {
    parts.push(agency.forme_juridique);
  }
  if (agency.capital_social) {
    parts.push(`Capital ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(agency.capital_social)}`);
  }
  if (agency.siret) {
    parts.push(`SIRET ${agency.siret}`);
  }
  if (agency.rcs_city) {
    parts.push(`RCS ${agency.rcs_city}`);
  }
  if (agency.vat_number) {
    parts.push(`TVA ${agency.vat_number}`);
  }
  
  return parts.join(' • ');
}

/**
 * Add a standardized header to PDF with agency logo and info
 */
export async function addPDFHeader(
  doc: jsPDF,
  agency: AgencyPDFInfo | undefined,
  documentNumber: string,
  documentTypeLabel: string,
  logoBase64: string | null = null
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 15;

  // Logo (if available)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y - 5, 25, 25);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  // Agency name and contact info
  const textStartX = logoBase64 ? margin + 30 : margin;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(agency?.name || 'Agence', textStartX, y + 3);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  
  const contactParts = [];
  if (agency?.address) contactParts.push(formatFullAddress(agency));
  if (agency?.phone) contactParts.push(agency.phone);
  if (agency?.email) contactParts.push(agency.email);
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' • '), textStartX, y + 9);
  }

  // Document type and number on the right
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(documentTypeLabel.toUpperCase(), pageWidth - margin, y + 3, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(documentNumber || '', pageWidth - margin, y + 10, { align: 'right' });

  // Current date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(format(new Date(), 'dd MMMM yyyy', { locale: fr }), pageWidth - margin, y + 16, { align: 'right' });

  return y + 25;
}

/**
 * Add signature area with optional signature image
 */
export async function addPDFSignature(
  doc: jsPDF,
  signatureBase64: string | null,
  y: number,
  label: string = 'Signature'
): Promise<number> {
  const margin = 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`${label} :`, margin, y);
  
  y += 5;

  if (signatureBase64) {
    try {
      // Add signature image
      doc.addImage(signatureBase64, 'PNG', margin, y, 50, 20);
      y += 22;
    } catch (e) {
      console.error('Error adding signature to PDF:', e);
      // Fallback to line
      y += 20;
      doc.line(margin, y, margin + 60, y);
      y += 5;
    }
  } else {
    // Just a signature line
    y += 20;
    doc.line(margin, y, margin + 60, y);
    y += 5;
  }

  return y;
}

/**
 * Add legal footer to PDF
 */
export function addPDFFooter(
  doc: jsPDF,
  agency: AgencyPDFInfo | undefined
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let footerY = pageHeight - 12;

  doc.setFontSize(7);
  doc.setTextColor(120);

  // Legal info
  if (agency) {
    const legalInfo = formatLegalInfo(agency);
    if (legalInfo) {
      doc.text(legalInfo, pageWidth / 2, footerY - 4, { align: 'center' });
    }
  }

  // Custom footer text or default
  const footerText = agency?.footer_text || `Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`;
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
}

/**
 * Helper to add footer on all pages
 */
export function addPDFFooterToAllPages(
  doc: jsPDF,
  agency: AgencyPDFInfo | undefined
): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, agency);
  }
}
