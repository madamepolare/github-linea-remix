import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AgencyPDFInfo, loadImageAsBase64, formatFullAddress, formatLegalInfo } from './pdfUtils';

interface FeeDistributionMember {
  name: string;
  role: 'mandataire' | 'cotraitant';
  specialty?: string;
  percentage: number;
  amount: number;
}

interface FeeDistributionData {
  tenderName: string;
  tenderReference?: string;
  estimatedBudget: number;
  feePercentage: number;
  feeAmount: number;
  members: FeeDistributionMember[];
  agency?: AgencyPDFInfo;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export async function generateFeeDistributionPDF(data: FeeDistributionData): Promise<Blob> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Load logo if available
  let logoBase64: string | null = null;
  if (data.agency?.logo_url) {
    logoBase64 = await loadImageAsBase64(data.agency.logo_url);
  }

  // ========== HEADER ==========
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y - 5, 25, 25);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  const textStartX = logoBase64 ? margin + 30 : margin;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(data.agency?.name || 'Agence', textStartX, y + 3);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  
  if (data.agency) {
    const contactParts = [];
    if (data.agency.address) contactParts.push(formatFullAddress(data.agency));
    if (data.agency.phone) contactParts.push(data.agency.phone);
    if (data.agency.email) contactParts.push(data.agency.email);
    
    if (contactParts.length > 0) {
      doc.text(contactParts.join(' • '), textStartX, y + 9);
    }
  }

  // Date on the right
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(format(new Date(), 'dd MMMM yyyy', { locale: fr }), pageWidth - margin, y + 3, { align: 'right' });

  y += 35;

  // ========== TITLE ==========
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 98, 255); // Primary blue
  doc.text('Répartition des honoraires', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Groupement de maîtrise d\'œuvre', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // ========== TENDER INFO BOX ==========
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Projet', margin + 8, y + 8);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(data.tenderName, margin + 8, y + 15);
  
  if (data.tenderReference) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Réf: ${data.tenderReference}`, margin + 8, y + 22);
  }
  
  y += 36;

  // ========== FINANCIAL SUMMARY ==========
  const summaryBoxWidth = (contentWidth - 10) / 3;
  
  // Budget travaux
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin, y, summaryBoxWidth, 30, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Budget travaux', margin + summaryBoxWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(formatCurrency(data.estimatedBudget), margin + summaryBoxWidth / 2, y + 20, { align: 'center' });
  
  // Taux honoraires
  doc.roundedRect(margin + summaryBoxWidth + 5, y, summaryBoxWidth, 30, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Taux honoraires', margin + summaryBoxWidth + 5 + summaryBoxWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`${data.feePercentage.toFixed(2)} %`, margin + summaryBoxWidth + 5 + summaryBoxWidth / 2, y + 20, { align: 'center' });
  
  // Montant honoraires
  doc.setFillColor(41, 98, 255);
  doc.roundedRect(margin + 2 * (summaryBoxWidth + 5), y, summaryBoxWidth, 30, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255);
  doc.text('Total honoraires MOE', margin + 2 * (summaryBoxWidth + 5) + summaryBoxWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.feeAmount), margin + 2 * (summaryBoxWidth + 5) + summaryBoxWidth / 2, y + 20, { align: 'center' });
  
  y += 40;

  // ========== DISTRIBUTION TABLE ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Répartition entre membres du groupement', margin, y);
  y += 8;

  // Table header
  const colWidths = [contentWidth * 0.35, contentWidth * 0.25, contentWidth * 0.15, contentWidth * 0.25];
  const colStarts = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  doc.setFillColor(41, 98, 255);
  doc.rect(margin, y, contentWidth, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);
  doc.text('Membre', colStarts[0] + 4, y + 7);
  doc.text('Spécialité', colStarts[1] + 4, y + 7);
  doc.text('Part (%)', colStarts[2] + 4, y + 7);
  doc.text('Montant HT', colStarts[3] + 4, y + 7);
  
  y += 10;

  // Sort members: mandataire first
  const sortedMembers = [...data.members].sort((a, b) => {
    if (a.role === 'mandataire') return -1;
    if (b.role === 'mandataire') return 1;
    return 0;
  });

  // Table rows
  sortedMembers.forEach((member, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 12;
    
    if (isEven) {
      doc.setFillColor(250, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    
    doc.setFontSize(9);
    doc.setTextColor(0);
    
    // Member name with role badge
    const isMandataire = member.role === 'mandataire';
    if (isMandataire) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const displayName = isMandataire ? `${member.name} (Mandataire)` : member.name;
    doc.text(displayName, colStarts[0] + 4, y + 8);
    
    // Specialty
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(member.specialty || '-', colStarts[1] + 4, y + 8);
    
    // Percentage
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`${member.percentage.toFixed(1)} %`, colStarts[2] + 4, y + 8);
    
    // Amount
    doc.setTextColor(41, 98, 255);
    doc.text(formatCurrency(member.amount), colStarts[3] + 4, y + 8);
    
    y += rowHeight;
  });

  // Total row
  doc.setFillColor(240, 240, 245);
  doc.rect(margin, y, contentWidth, 12, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('TOTAL', colStarts[0] + 4, y + 8);
  
  const totalPercentage = data.members.reduce((sum, m) => sum + m.percentage, 0);
  doc.text(`${totalPercentage.toFixed(1)} %`, colStarts[2] + 4, y + 8);
  
  doc.setTextColor(41, 98, 255);
  doc.text(formatCurrency(data.feeAmount), colStarts[3] + 4, y + 8);
  
  y += 20;

  // ========== VISUAL BAR ==========
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Représentation graphique', margin, y);
  y += 6;

  const barHeight = 16;
  const barColors = [
    [41, 98, 255],   // Primary (mandataire)
    [59, 130, 246],  // Blue
    [16, 185, 129],  // Emerald
    [245, 158, 11],  // Amber
    [139, 92, 246],  // Purple
    [236, 72, 153],  // Pink
  ];

  let barX = margin;
  sortedMembers.forEach((member, index) => {
    const barWidth = (member.percentage / 100) * contentWidth;
    const color = barColors[index % barColors.length];
    
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, y, barWidth, barHeight, 'F');
    
    // Add text inside bar if wide enough
    if (barWidth > 25) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      doc.text(`${member.percentage.toFixed(0)}%`, barX + barWidth / 2, y + barHeight / 2 + 2, { align: 'center' });
    }
    
    barX += barWidth;
  });

  y += barHeight + 8;

  // Legend
  let legendX = margin;
  const legendY = y;
  sortedMembers.forEach((member, index) => {
    const color = barColors[index % barColors.length];
    
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(legendX, legendY - 3, 4, 4, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    const text = `${member.name} (${member.percentage.toFixed(1)}%)`;
    doc.text(text, legendX + 6, legendY);
    
    legendX += doc.getTextWidth(text) + 14;
    
    // Wrap to next line if needed
    if (legendX > pageWidth - margin - 20) {
      legendX = margin;
    }
  });

  y += 20;

  // ========== SIGNATURES SECTION ==========
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Signatures des membres du groupement', margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Les soussignés acceptent la répartition des honoraires telle que définie ci-dessus.', margin, y);
  y += 10;

  // Signature boxes
  const sigBoxWidth = (contentWidth - 10) / 2;
  const sigBoxHeight = 35;
  
  sortedMembers.forEach((member, index) => {
    const boxX = margin + (index % 2) * (sigBoxWidth + 10);
    
    if (index % 2 === 0 && index > 0) {
      y += sigBoxHeight + 8;
    }
    
    if (y + sigBoxHeight > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(252, 252, 254);
    doc.roundedRect(boxX, y, sigBoxWidth, sigBoxHeight, 2, 2, 'FD');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(member.name, boxX + 4, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const roleLabel = member.role === 'mandataire' ? 'Mandataire' : `Cotraitant - ${member.specialty || 'Spécialité'}`;
    doc.text(roleLabel, boxX + 4, y + 14);
    
    doc.setTextColor(150);
    doc.text('Date et signature :', boxX + 4, y + sigBoxHeight - 6);
  });

  // ========== FOOTER ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setFontSize(7);
    doc.setTextColor(120);
    
    // Legal info
    if (data.agency) {
      const legalInfo = formatLegalInfo(data.agency);
      if (legalInfo) {
        doc.text(legalInfo, pageWidth / 2, pageHeight - 12, { align: 'center' });
      }
    }
    
    // Date and page
    doc.text(
      `Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} - Page ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}
