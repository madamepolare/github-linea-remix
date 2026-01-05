import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, differenceInDays, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Intervention } from "@/hooks/useInterventions";
import { ProjectLot } from "@/hooks/useChantier";

interface GeneratePlanningPDFOptions {
  projectName: string;
  lots: ProjectLot[];
  interventions: Intervention[];
  companies: Array<{ id: string; name: string }>;
  format?: "A4" | "A3" | "A1";
}

export async function generatePlanningPDF({
  projectName,
  lots,
  interventions,
  companies,
  format: paperFormat = "A4",
}: GeneratePlanningPDFOptions): Promise<jsPDF> {
  // Paper dimensions
  const dimensions = {
    A4: { width: 297, height: 210 },
    A3: { width: 420, height: 297 },
    A1: { width: 841, height: 594 },
  };

  const { width, height } = dimensions[paperFormat];
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [width, height] });

  const margin = 15;
  const headerHeight = 35;
  const lotColumnWidth = 60;
  const companyColumnWidth = 50;

  // Header
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, width, headerHeight, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(paperFormat === "A1" ? 24 : 16);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Planning Chantier - ${projectName}`, margin, 20);
  pdf.setFontSize(paperFormat === "A1" ? 12 : 9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Généré le ${format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}`, margin, 28);

  // Stats in header
  const statsX = width - margin - 100;
  const completedCount = interventions.filter((i) => i.status === "completed").length;
  const delayedCount = interventions.filter((i) => i.status === "delayed").length;
  pdf.text(`${lots.length} lots | ${interventions.length} interventions | ${completedCount} terminées`, statsX, 20);
  if (delayedCount > 0) {
    pdf.setTextColor(239, 68, 68);
    pdf.text(`${delayedCount} en retard`, statsX, 28);
  }

  // Determine date range
  let minDate = new Date();
  let maxDate = new Date();

  interventions.forEach((intervention) => {
    const start = parseISO(intervention.start_date);
    const end = parseISO(intervention.end_date);
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  });

  lots.forEach((lot) => {
    if (lot.start_date) {
      const start = parseISO(lot.start_date);
      if (start < minDate) minDate = start;
    }
    if (lot.end_date) {
      const end = parseISO(lot.end_date);
      if (end > maxDate) maxDate = end;
    }
  });

  // Extend range for padding
  minDate = startOfMonth(subMonths(minDate, 1));
  maxDate = endOfMonth(addMonths(maxDate, 1));

  const days = eachDayOfInterval({ start: minDate, end: maxDate });
  const totalDays = days.length;
  const ganttWidth = width - margin * 2 - lotColumnWidth - companyColumnWidth;
  const dayWidth = ganttWidth / totalDays;

  // Content area
  const contentY = headerHeight + 10;
  const rowHeight = paperFormat === "A1" ? 12 : 8;
  const monthHeaderHeight = paperFormat === "A1" ? 15 : 10;
  const dayHeaderHeight = paperFormat === "A1" ? 12 : 8;

  // Month headers
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin + lotColumnWidth + companyColumnWidth, contentY, ganttWidth, monthHeaderHeight, "F");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(paperFormat === "A1" ? 10 : 7);

  let currentMonth = "";
  let monthStartX = margin + lotColumnWidth + companyColumnWidth;
  days.forEach((day, idx) => {
    const monthLabel = format(day, "MMMM yyyy", { locale: fr });
    if (monthLabel !== currentMonth) {
      if (currentMonth) {
        // Draw previous month text
        const monthWidth = idx * dayWidth - (monthStartX - margin - lotColumnWidth - companyColumnWidth);
        pdf.text(currentMonth, monthStartX + monthWidth / 2, contentY + monthHeaderHeight - 3, { align: "center" });
      }
      currentMonth = monthLabel;
      monthStartX = margin + lotColumnWidth + companyColumnWidth + idx * dayWidth;
    }
  });
  // Draw last month
  const lastMonthWidth = ganttWidth - (monthStartX - margin - lotColumnWidth - companyColumnWidth);
  pdf.text(currentMonth, monthStartX + lastMonthWidth / 2, contentY + monthHeaderHeight - 3, { align: "center" });

  // Column headers
  const tableY = contentY + monthHeaderHeight + dayHeaderHeight + 5;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, tableY - 6, lotColumnWidth, rowHeight, "F");
  pdf.rect(margin + lotColumnWidth, tableY - 6, companyColumnWidth, rowHeight, "F");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(paperFormat === "A1" ? 9 : 6);
  pdf.setFont("helvetica", "bold");
  pdf.text("Lot", margin + 3, tableY);
  pdf.text("Entreprise", margin + lotColumnWidth + 3, tableY);

  // Lots and interventions
  pdf.setFont("helvetica", "normal");
  let currentY = tableY + rowHeight;

  lots.forEach((lot, lotIndex) => {
    const company = companies.find((c) => c.id === lot.crm_company_id);
    const lotInterventions = interventions.filter((i) => i.lot_id === lot.id);

    // Alternate row background
    if (lotIndex % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, currentY - rowHeight + 2, width - margin * 2, rowHeight, "F");
    }

    // Lot name
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(paperFormat === "A1" ? 9 : 6);
    const lotName = lot.name.length > 25 ? lot.name.substring(0, 22) + "..." : lot.name;
    pdf.text(lotName, margin + 3, currentY);

    // Company name
    pdf.setTextColor(100, 116, 139);
    const companyName = company?.name || "-";
    const truncatedCompany = companyName.length > 20 ? companyName.substring(0, 17) + "..." : companyName;
    pdf.text(truncatedCompany, margin + lotColumnWidth + 3, currentY);

    // Draw interventions as bars
    lotInterventions.forEach((intervention) => {
      const start = parseISO(intervention.start_date);
      const end = parseISO(intervention.end_date);
      const startDayIndex = differenceInDays(start, minDate);
      const duration = differenceInDays(end, start) + 1;

      const barX = margin + lotColumnWidth + companyColumnWidth + startDayIndex * dayWidth;
      const barWidth = duration * dayWidth;
      const barY = currentY - rowHeight + 3;
      const barHeight = rowHeight - 4;

      // Color from intervention or lot
      const color = intervention.color || lot.color || "#3b82f6";
      const rgb = hexToRgb(color);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.roundedRect(barX, barY, Math.max(barWidth, 3), barHeight, 1, 1, "F");

      // Intervention title (if bar is wide enough)
      if (barWidth > 20) {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(paperFormat === "A1" ? 7 : 5);
        const maxChars = Math.floor(barWidth / 3);
        const title = intervention.title.length > maxChars 
          ? intervention.title.substring(0, maxChars - 2) + ".." 
          : intervention.title;
        pdf.text(title, barX + 2, barY + barHeight - 2);
      }
    });

    currentY += rowHeight;

    // Add page break if needed
    if (currentY > height - margin) {
      pdf.addPage([width, height], "landscape");
      currentY = margin + 10;
    }
  });

  // Footer
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(paperFormat === "A1" ? 9 : 7);
  pdf.text(
    `Document généré automatiquement - ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    margin,
    height - 8
  );

  return pdf;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 59, g: 130, b: 246 }; // Default blue
}
